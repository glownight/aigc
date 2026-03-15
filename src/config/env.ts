/**
 * 环境变量配置
 *
 * 当前项目固定使用 codex-for-me 同源代理，只需要一个 API Key。
 */

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

export const ENV = {
  REMOTE_API_BASE_URL: DEFAULT_PROXY_ENDPOINT,
  REMOTE_API_MODEL: DEFAULT_MODEL,
  REMOTE_API_PROVIDER_NAME: DEFAULT_PROVIDER_NAME,
  REMOTE_API_UPSTREAM_BASE_URL: DEFAULT_UPSTREAM_BASE_URL,
  DEFAULT_ENGINE: "remote",
} as const;

let cachedConfig: RemoteApiConfigType | null = null;

export function getRemoteApiConfig(): RemoteApiConfigType {
  if (cachedConfig) {
    return cachedConfig;
  }

  const config: RemoteApiConfigType = {
    baseURL: ENV.REMOTE_API_BASE_URL,
    apiKey: "",
    model: ENV.REMOTE_API_MODEL,
    providerName: ENV.REMOTE_API_PROVIDER_NAME,
    upstreamBaseURL: ENV.REMOTE_API_UPSTREAM_BASE_URL,
  };

  cachedConfig = config;
  return config;
}
