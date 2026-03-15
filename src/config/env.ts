/**
 * 环境变量配置
 *
 * 当前项目固定使用 codex-for-me 同源代理，只需要一个 API Key。
 */

const isDev = import.meta.env.DEV;

type RemoteApiConfigType = {
  baseURL: string;
  apiKey: string;
  model: string;
  providerName: string;
  upstreamBaseURL: string;
};

const DEFAULT_PROXY_ENDPOINT = "/api/chat";
const DEFAULT_PROVIDER_NAME = "codex-for-me";
const DEFAULT_UPSTREAM_BASE_URL = "https://api-vip.codex-for.me/v1";
const DEFAULT_MODEL = "gpt-5.3-codex";

function pickEnvValue(...values: Array<string | undefined>): string {
  return values.find((value) => typeof value === "string" && value.trim().length > 0)?.trim() || "";
}

function maskSecret(secret: string): string {
  if (!secret) {
    return "not set";
  }

  if (secret.length <= 8) {
    return `${secret.slice(0, 2)}***${secret.slice(-2)}`;
  }

  return `${secret.slice(0, 6)}...${secret.slice(-4)} (len: ${secret.length})`;
}

export const ENV = {
  REMOTE_API_BASE_URL: DEFAULT_PROXY_ENDPOINT,
  REMOTE_API_KEY: pickEnvValue(import.meta.env.VITE_REMOTE_API_KEY),
  REMOTE_API_MODEL: DEFAULT_MODEL,
  REMOTE_API_PROVIDER_NAME: DEFAULT_PROVIDER_NAME,
  REMOTE_API_UPSTREAM_BASE_URL: DEFAULT_UPSTREAM_BASE_URL,
  DEFAULT_ENGINE: "remote",
  IS_DEV: isDev,
} as const;

console.log("=".repeat(60));
console.log("[Config] provider:", ENV.REMOTE_API_PROVIDER_NAME);
console.log("[Config] proxyEndpoint:", ENV.REMOTE_API_BASE_URL);
console.log("[Config] upstreamBaseURL:", ENV.REMOTE_API_UPSTREAM_BASE_URL);
console.log("[Config] model:", ENV.REMOTE_API_MODEL);
console.log("[Config] hasClientKey:", ENV.REMOTE_API_KEY.length > 0);
console.log("[Config] clientKeyPreview:", maskSecret(ENV.REMOTE_API_KEY));
console.log("=".repeat(60));

let cachedConfig: RemoteApiConfigType | null = null;
let configLogged = false;

export function getRemoteApiConfig(): RemoteApiConfigType {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config: RemoteApiConfigType = {
    baseURL: ENV.REMOTE_API_BASE_URL,
    apiKey: ENV.REMOTE_API_KEY,
    model: ENV.REMOTE_API_MODEL,
    providerName: ENV.REMOTE_API_PROVIDER_NAME,
    upstreamBaseURL: ENV.REMOTE_API_UPSTREAM_BASE_URL,
  };

  if (ENV.IS_DEV && !configLogged) {
    console.log("[Config] resolved remote config:", {
      baseURL: config.baseURL,
      model: config.model,
      providerName: config.providerName,
      upstreamBaseURL: config.upstreamBaseURL,
      hasClientKey: config.apiKey.length > 0,
      keyPreview: maskSecret(config.apiKey),
    });
    configLogged = true;
  }

  cachedConfig = config;
  return config;
}
