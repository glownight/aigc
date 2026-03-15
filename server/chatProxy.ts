const DEFAULT_PROVIDER_NAME = "codex-for-me";
const DEFAULT_UPSTREAM_BASE_URL = "https://api-vip.codex-for.me/v1";
const DEFAULT_PROXY_ENDPOINT = "/api/chat";
const DEFAULT_MODEL = "gpt-5.3-codex";

type HeaderValue = string | string[] | undefined;
type HeaderBag = Headers | Record<string, HeaderValue>;

type RemoteMessage = {
  role: string;
  content: string;
};

type ProxyFailure = {
  ok: false;
  status: number;
  body: { error: string };
};

type ProxySuccess = {
  ok: true;
  stream: boolean;
  upstream: Response;
};

type ProxyResult = ProxyFailure | ProxySuccess;
type ChatProxyEnv = Record<string, string | undefined>;

type NodeLikeResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
  end(chunk?: string): void;
};

function pickFirstValue(...values: Array<string | undefined>): string {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() || "";
}

function getHeaderValue(headers: HeaderBag, name: string): string {
  if (headers instanceof Headers) {
    return headers.get(name) || "";
  }

  const raw = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  if (Array.isArray(raw)) {
    return raw[0] || "";
  }

  return raw || "";
}

function getBearerToken(headers: HeaderBag): string {
  const authorization = getHeaderValue(headers, "authorization");
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

function normalizeUpstreamUrl(rawValue: string): string {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return `${DEFAULT_UPSTREAM_BASE_URL}/responses`;
  }

  return /\/responses\/?$/i.test(trimmed)
    ? trimmed
    : `${trimmed.replace(/\/+$/, "")}/responses`;
}

function normalizeMessages(messages: unknown): RemoteMessage[] | null {
  if (!Array.isArray(messages)) {
    return null;
  }

  const normalized = messages
    .filter((message): message is RemoteMessage => {
      return (
        typeof message === "object" &&
        message !== null &&
        typeof (message as RemoteMessage).role === "string" &&
        typeof (message as RemoteMessage).content === "string"
      );
    })
    .map(({ role, content }) => ({
      role,
      content: content.trim(),
    }))
    .filter(({ content }) => content.length > 0);

  return normalized;
}

export function getChatProxyDefaults() {
  return {
    providerName: DEFAULT_PROVIDER_NAME,
    upstreamBaseURL: DEFAULT_UPSTREAM_BASE_URL,
    proxyEndpoint: DEFAULT_PROXY_ENDPOINT,
    model: DEFAULT_MODEL,
  };
}

export async function createUpstreamChatRequest(
  body: unknown,
  headers: HeaderBag,
  env: ChatProxyEnv,
): Promise<ProxyResult> {
  const bearerToken = getBearerToken(headers);
  const apiKey = pickFirstValue(
    env.OPENAI_API_KEY,
    env.CODEX_FOR_ME_API_KEY,
    env.UPSTREAM_API_KEY,
    env.SUANLI_API_KEY,
    bearerToken,
  );

  if (!apiKey) {
    console.error("[chatProxy] missing API key at runtime", {
      hasOpenAIApiKey: Boolean(env.OPENAI_API_KEY?.trim()),
      hasCodexForMeApiKey: Boolean(env.CODEX_FOR_ME_API_KEY?.trim()),
      hasUpstreamApiKey: Boolean(env.UPSTREAM_API_KEY?.trim()),
      hasSuanliApiKey: Boolean(env.SUANLI_API_KEY?.trim()),
      hasBearerToken: Boolean(bearerToken),
    });

    return {
      ok: false,
      status: 500,
      body: {
        error:
          "Missing API key. Set OPENAI_API_KEY in server env (.env.local / Vercel Project Settings) or enter a key in Settings.",
      },
    };
  }

  const requestBody = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const normalizedMessages = normalizeMessages(requestBody.messages);

  if (!normalizedMessages) {
    return {
      ok: false,
      status: 400,
      body: { error: "Invalid body: messages must be an array" },
    };
  }

  const defaults = getChatProxyDefaults();
  const upstreamUrl = normalizeUpstreamUrl(
    pickFirstValue(
      env.OPENAI_API_BASE_URL,
      env.CODEX_FOR_ME_BASE_URL,
      env.UPSTREAM_URL,
      defaults.upstreamBaseURL,
    ),
  );

  const model = pickFirstValue(
    typeof requestBody.model === "string" ? requestBody.model : undefined,
    env.OPENAI_DEFAULT_MODEL,
    env.CODEX_DEFAULT_MODEL,
    env.UPSTREAM_MODEL,
    defaults.model,
  );

  const stream = requestBody.stream !== false;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: normalizedMessages,
        stream,
      }),
    });

    return {
      ok: true,
      stream,
      upstream,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      body: {
        error: error instanceof Error ? error.message : "Upstream request failed",
      },
    };
  }
}

export async function writeProxyResultToNodeResponse(
  res: NodeLikeResponse,
  result: ProxyResult,
): Promise<void> {
  if (result.ok === false) {
    const failure = result;
    res.statusCode = failure.status;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(failure.body));
    return;
  }

  const { stream, upstream } = result;

  if (!upstream.ok) {
    const text = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "application/json; charset=utf-8",
    );
    res.end(text);
    return;
  }

  if (stream && upstream.body) {
    res.statusCode = upstream.status;
    res.setHeader(
      "Content-Type",
      upstream.headers.get("content-type") || "text/event-stream; charset=utf-8",
    );
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        res.write(decoder.decode(value, { stream: true }));
      }
    } finally {
      res.end();
    }

    return;
  }

  const text = await upstream.text();
  res.statusCode = upstream.status;
  res.setHeader(
    "Content-Type",
    upstream.headers.get("content-type") || "application/json; charset=utf-8",
  );
  res.end(text);
}
