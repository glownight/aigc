import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function internalTokenMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!env.INTERNAL_API_TOKEN) {
    next();
    return;
  }

  const providedToken = req.header("x-internal-token");

  if (!providedToken || providedToken !== env.INTERNAL_API_TOKEN) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid x-internal-token",
        requestId: req.requestId,
      },
    });
    return;
  }

  next();
}
