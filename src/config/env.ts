/**
 * 前端环境变量配置
 * 远程模式下仅调用后端网关，不再在浏览器持有上游 API Key
 */

const isDev = import.meta.env.DEV;

// 开发环境默认指向本地 Node 后端；生产环境默认同域（留空）
const defaultBackendBaseURL = isDev ? "http://localhost:3001" : "";

export const ENV = {
  REMOTE_API_BASE_URL:
    import.meta.env.VITE_REMOTE_API_BASE_URL || defaultBackendBaseURL,

  REMOTE_API_MODEL:
    import.meta.env.VITE_REMOTE_API_MODEL || "deepseek-chat",

  DEFAULT_ENGINE:
    (import.meta.env.VITE_DEFAULT_ENGINE as "browser" | "remote") || "remote",

  IS_DEV: isDev,
} as const;

console.log("=".repeat(60));
console.log("[Config] Frontend runtime config");
console.log("  mode:", import.meta.env.MODE);
console.log("  engine:", ENV.DEFAULT_ENGINE);
console.log("  backendBaseURL:", ENV.REMOTE_API_BASE_URL || "(same-origin)");
console.log("  remoteModel:", ENV.REMOTE_API_MODEL);
console.log("=".repeat(60));

type RemoteApiConfigType = {
  baseURL: string;
  model: string;
};

let cachedConfig: RemoteApiConfigType | null = null;

export function getRemoteApiConfig(): RemoteApiConfigType {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    baseURL: ENV.REMOTE_API_BASE_URL.trim(),
    model: ENV.REMOTE_API_MODEL,
  };

  return cachedConfig;
}

export function getDefaultEngine(): "browser" | "remote" {
  return ENV.DEFAULT_ENGINE;
}
