import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import {
  createUpstreamChatRequest,
  writeProxyResultToNodeResponse,
} from "../server/chatProxy";

type ApiRequest = IncomingMessage & {
  body?: unknown;
  method?: string;
  headers: IncomingHttpHeaders;
};

class RequestBodyParseError extends Error {}

function writeJson(res: ServerResponse, statusCode: number, body: { error: string }) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseJsonText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) {
    return {};
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new RequestBodyParseError("Invalid JSON body");
  }
}

function normalizeRequestBody(body: unknown): unknown {
  if (body == null) {
    return {};
  }

  if (typeof body === "string") {
    return parseJsonText(body);
  }

  if (body instanceof Uint8Array) {
    return parseJsonText(Buffer.from(body).toString("utf8"));
  }

  return body;
}

async function readRawRequestBody(req: IncomingMessage): Promise<string> {
  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function getRequestBody(req: ApiRequest): Promise<unknown> {
  if (typeof req.body !== "undefined") {
    return normalizeRequestBody(req.body);
  }

  return parseJsonText(await readRawRequestBody(req));
}

export default async function handler(req: ApiRequest, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "POST") {
    writeJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  try {
    const body = await getRequestBody(req);
    const result = await createUpstreamChatRequest(body, req.headers ?? {});
    await writeProxyResultToNodeResponse(res, result);
  } catch (error) {
    if (res.headersSent || res.writableEnded) {
      res.end();
      return;
    }

    if (error instanceof RequestBodyParseError) {
      writeJson(res, 400, { error: error.message });
      return;
    }

    console.error("[api/chat] unexpected proxy failure:", error);
    writeJson(res, 500, { error: "Internal Server Error" });
  }
}
