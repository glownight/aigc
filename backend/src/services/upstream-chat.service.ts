import { env } from "../config/env.js";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatRequestPayload = {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
};

export async function callUpstreamChat(
  payload: ChatRequestPayload,
  signal: AbortSignal,
): Promise<Response> {
  return fetch(env.UPSTREAM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.UPSTREAM_API_KEY}`,
    },
    body: JSON.stringify(payload),
    signal,
  });
}
