import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/error-handler.js";
import { callUpstreamChat } from "../services/upstream-chat.service.js";

const router = Router();

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().trim().min(1).max(env.MAX_CONTENT_CHARS),
});

const requestSchema = z.object({
  model: z.string().trim().min(1).max(160).optional(),
  stream: z.boolean().optional().default(true),
  messages: z.array(messageSchema).min(1).max(env.MAX_MESSAGES),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().max(8192).optional(),
});

router.post("/chat", async (req, res, next) => {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    next(parsed.error);
    return;
  }

  const body = parsed.data;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);

  const disconnectHandler = () => {
    // Only abort upstream when the client disconnects before response completion.
    if (!res.writableEnded) {
      controller.abort();
    }
  };

  req.on("aborted", disconnectHandler);
  res.on("close", disconnectHandler);

  try {
    const upstream = await callUpstreamChat(
      {
        model: body.model || env.DEFAULT_MODEL,
        messages: body.messages,
        stream: body.stream,
        temperature: body.temperature,
        top_p: body.top_p,
        max_tokens: body.max_tokens,
      },
      controller.signal,
    );

    const status = upstream.status;

    if (!upstream.ok) {
      const text = await upstream.text();
      let details: unknown = text;

      try {
        details = JSON.parse(text);
      } catch {
        // keep plain text
      }

      throw new HttpError(status, "UPSTREAM_ERROR", "Upstream API request failed", details);
    }

    if (body.stream && upstream.body) {
      res.status(status);
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        res.write(decoder.decode(value, { stream: true }));
      }

      res.end();
      return;
    }

    const text = await upstream.text();
    try {
      const json = JSON.parse(text);
      res.status(status).json(json);
    } catch {
      res.status(status).send(text);
    }
  } catch (error) {
    next(error);
  } finally {
    clearTimeout(timeout);
    req.off("aborted", disconnectHandler);
    res.off("close", disconnectHandler);
  }
});

export default router;
