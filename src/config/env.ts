/**
 * 环境变量配置
 * 优先读取环境变量，否则使用默认值
 */

export const ENV = {
    // 远程API配置
    REMOTE_API_BASE_URL: import.meta.env.VITE_REMOTE_API_BASE_URL || "https://tbnx.plus7.plus/",
    REMOTE_API_KEY: import.meta.env.VITE_REMOTE_API_KEY || "",
    REMOTE_API_MODEL: import.meta.env.VITE_REMOTE_API_MODEL || "deepseek-chat",

    // 默认引擎模式
    DEFAULT_ENGINE: (import.meta.env.VITE_DEFAULT_ENGINE as "browser" | "remote") || "remote",
} as const;

/**
 * 获取远程API配置
 */
export function getRemoteApiConfig() {
    return {
        baseURL: ENV.REMOTE_API_BASE_URL,
        apiKey: ENV.REMOTE_API_KEY,
        model: ENV.REMOTE_API_MODEL,
    };
}

/**
 * 检查是否配置了远程API密钥
 */
export function hasRemoteApiKey(): boolean {
    return ENV.REMOTE_API_KEY.length > 0;
}

/**
 * 获取默认引擎模式
 * 如果没有配置API Key，强制使用浏览器模式
 */
export function getDefaultEngine(): "browser" | "remote" {
    if (ENV.DEFAULT_ENGINE === "remote" && !hasRemoteApiKey()) {
        console.warn("[Config] 未配置API Key，回退到浏览器模式");
        return "browser";
    }
    return ENV.DEFAULT_ENGINE;
}

