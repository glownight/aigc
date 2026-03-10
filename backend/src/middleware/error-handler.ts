import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      requestId: req.requestId,
    },
  });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) {
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        requestId: req.requestId,
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        requestId: req.requestId,
        details: !env.isProd ? err.details : undefined,
      },
    });
    return;
  }

  const isAbort = err instanceof Error && err.name === "AbortError";

  res.status(isAbort ? 504 : 500).json({
    error: {
      code: isAbort ? "UPSTREAM_TIMEOUT" : "INTERNAL_SERVER_ERROR",
      message: isAbort ? "Upstream request timeout" : "Internal server error",
      requestId: req.requestId,
    },
  });
}
