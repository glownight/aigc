/**
 * 环境变量配置
 * 
 * 优先使用环境变量，如果没有则使用内置默认值
 */

// 判断是否为开发环境
const isDev = import.meta.env.DEV;

export const ENV = {
    // 远程API配置
    // 生产环境：使用环境变量或内置默认值
    // 开发环境：优先使用环境变量，否则使用 DEV_DEFAULTS
    REMOTE_API_BASE_URL: import.meta.env.VITE_REMOTE_API_BASE_URL
        || "https://tbnx.plus7.plus/",

    REMOTE_API_KEY: import.meta.env.VITE_REMOTE_API_KEY
        || "sk-wOAmGmUMNFVsosjkCm68Fg2wJE7ctTPZMx8q3EozUiT49zFi",

    REMOTE_API_MODEL: import.meta.env.VITE_REMOTE_API_MODEL
        || "deepseek-chat", // 默认使用 chat 模型（更快）

    // 默认引擎模式
    DEFAULT_ENGINE: (import.meta.env.VITE_DEFAULT_ENGINE as "browser" | "remote")
        || (isDev ? "remote" : "remote"),

    // 是否为开发环境
    IS_DEV: isDev,
} as const;

// 🔍 环境配置调试日志（开发和生产环境都打印）
console.log("=".repeat(60));
console.log("[Config] 🔧 环境信息:");
console.log("  • isDev:", isDev);
console.log("  • MODE:", import.meta.env.MODE);
console.log("  • DEV:", import.meta.env.DEV);
console.log("  • PROD:", import.meta.env.PROD);
console.log("=".repeat(60));

console.log("[Config] 📝 环境变量原始值:");
console.log("  • VITE_REMOTE_API_KEY:", import.meta.env.VITE_REMOTE_API_KEY ?
    `${String(import.meta.env.VITE_REMOTE_API_KEY).substring(0, 10)}...${String(import.meta.env.VITE_REMOTE_API_KEY).slice(-4)}` :
    "❌ 未配置");
console.log("  • VITE_REMOTE_API_BASE_URL:", import.meta.env.VITE_REMOTE_API_BASE_URL || "❌ 未配置");
console.log("  • VITE_REMOTE_API_MODEL:", import.meta.env.VITE_REMOTE_API_MODEL || "❌ 未配置");
console.log("  • VITE_DEFAULT_ENGINE:", import.meta.env.VITE_DEFAULT_ENGINE || "❌ 未配置");

console.log("[Config] ✅ 最终配置值:");
console.log("  • baseURL:", ENV.REMOTE_API_BASE_URL);
console.log("  • model:", ENV.REMOTE_API_MODEL);
console.log("  • engine:", ENV.DEFAULT_ENGINE);
console.log("  • hasKey:", ENV.REMOTE_API_KEY.length > 0);
console.log("  • keyPreview:", ENV.REMOTE_API_KEY ?
    `${ENV.REMOTE_API_KEY.substring(0, 10)}...${ENV.REMOTE_API_KEY.slice(-4)} (长度: ${ENV.REMOTE_API_KEY.length})` :
    "❌ 未配置");
console.log("=".repeat(60));

/**
 * 获取远程API配置
 */
// 缓存配置对象，避免频繁打印日志
let cachedConfig: ReturnType<typeof getRemoteApiConfig> | null = null;
let configLogged = false;

export function getRemoteApiConfig() {
    // 如果已缓存，直接返回
    if (cachedConfig) {
        return cachedConfig;
    }

    const config = {
        baseURL: ENV.REMOTE_API_BASE_URL,
        apiKey: ENV.REMOTE_API_KEY,
        model: ENV.REMOTE_API_MODEL,
    };

    // 开发环境提示（只打印一次）
    if (ENV.IS_DEV && !configLogged) {
        console.log("[Config] 🔧 开发环境配置:", {
            baseURL: config.baseURL,
            model: config.model,
            hasKey: config.apiKey.length > 0,
            keyPreview: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : "未配置"
        });
        configLogged = true;
    }

    cachedConfig = config;
    return config;
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



