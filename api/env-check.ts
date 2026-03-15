import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import {
  getChatProxyDiagnostics,
  getChatProxyRuntimeEnv,
} from "../server/chatProxy.js";

type ApiRequest = IncomingMessage & {
  method?: string;
  headers: IncomingHttpHeaders;
};

function writeJson(
  res: ServerResponse,
  statusCode: number,
  body: Record<string, boolean | object | string | null>,
) {
  res.statusCode = statusCode;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export default function handler(req: ApiRequest, res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method && !["GET", "HEAD"].includes(req.method)) {
    writeJson(res, 405, { error: "Method Not Allowed" });
    return;
  }

  const env = getChatProxyRuntimeEnv();

  writeJson(res, 200, {
    ok: true,
    diagnostics: getChatProxyDiagnostics(env, req.headers ?? {}),
    vercelEnv: env.VERCEL_ENV || null,
    vercelRegion: env.VERCEL_REGION || null,
    hasVercelUrl: Boolean(env.VERCEL_URL?.trim()),
    nodeEnv: env.NODE_ENV || null,
  });
}
