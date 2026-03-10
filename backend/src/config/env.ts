import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.string().default("info"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  UPSTREAM_URL: z.string().url().default("https://api.suanli.cn/v1/chat/completions"),
  UPSTREAM_API_KEY: z.string().min(1, "UPSTREAM_API_KEY is required"),
  DEFAULT_MODEL: z.string().min(1).default("free:Qwen3-30B-A3B"),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
  MAX_MESSAGES: z.coerce.number().int().positive().default(50),
  MAX_CONTENT_CHARS: z.coerce.number().int().positive().default(12_000),
  INTERNAL_API_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid backend environment variables:\n${details}`);
}

const raw = parsed.data;

const corsOrigins = raw.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const env = {
  ...raw,
  corsOrigins,
  allowAllOrigins: corsOrigins.includes("*"),
  isProd: raw.NODE_ENV === "production",
  isDev: raw.NODE_ENV === "development",
};

export type Env = typeof env;
