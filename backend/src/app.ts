import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { internalTokenMiddleware } from "./middleware/auth.js";
import { errorHandler, notFoundMiddleware } from "./middleware/error-handler.js";
import healthRouter from "./routes/health.js";
import chatRouter from "./routes/chat.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", true);

  app.use(requestIdMiddleware);

  app.use(
    pinoHttp({
      logger,
      genReqId: (req: express.Request) => req.requestId,
      customLogLevel: (
        _req: express.Request,
        res: express.Response,
        err?: Error,
      ) => {
        if (err || res.statusCode >= 500) {
          return "error";
        }
        if (res.statusCode >= 400) {
          return "warn";
        }
        return "info";
      },
    }),
  );

  app.use(
    helmet({
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Non-browser clients may not send Origin.
        if (!origin) {
          callback(null, true);
          return;
        }

        const isConfiguredOrigin = env.allowAllOrigins || env.corsOrigins.includes(origin);
        const isDevLocalhostOrigin =
          env.isDev &&
          (/^http:\/\/localhost:\d+$/.test(origin) ||
            /^http:\/\/127\.0\.0\.1:\d+$/.test(origin));

        if (isConfiguredOrigin || isDevLocalhostOrigin) {
          callback(null, true);
          return;
        }

        // Return no CORS header for denied origins instead of throwing 500.
        callback(null, false);
      },
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-internal-token", "x-request-id"],
    }),
  );

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use(express.json({ limit: "1mb" }));

  app.use("/health", healthRouter);
  app.use("/api", internalTokenMiddleware, chatRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
