/**
 * 环境变量配置
 * 
 * 开发环境：使用下面的默认配置（方便调试）
 * 生产环境：使用环境变量（安全）
 */

// ⚠️ 开发环境默认配置 - 仅用于开发调试
// 生产环境请通过环境变量配置，不要在这里写真实密钥
const DEV_DEFAULTS = {
    BASE_URL: "https://api.deepseek.com",  // DeepSeek API 地址
    API_KEY: "your-api-key-here",          // 🔑 在这里填写你的开发环境 API Key
    MODEL: "deepseek-chat",                // 默认模型
};

// 判断是否为开发环境
const isDev = import.meta.env.DEV;

export const ENV = {
    // 远程API配置
    // 生产环境：使用环境变量或内置默认值
    // 开发环境：优先使用环境变量，否则使用 DEV_DEFAULTS
    REMOTE_API_BASE_URL: import.meta.env.VITE_REMOTE_API_BASE_URL
        || (isDev ? DEV_DEFAULTS.BASE_URL : "https://tbnx.plus7.plus/"),

    REMOTE_API_KEY: import.meta.env.VITE_REMOTE_API_KEY
        || (isDev ? DEV_DEFAULTS.API_KEY : ""),

    REMOTE_API_MODEL: import.meta.env.VITE_REMOTE_API_MODEL
        || (isDev ? DEV_DEFAULTS.MODEL : "deepseek-reasoner"),

    // 默认引擎模式
    DEFAULT_ENGINE: (import.meta.env.VITE_DEFAULT_ENGINE as "browser" | "remote")
        || (isDev ? "remote" : "remote"),

    // 是否为开发环境
    IS_DEV: isDev,
} as const;

/**
 * 获取远程API配置
 */
export function getRemoteApiConfig() {
    const config = {
        baseURL: ENV.REMOTE_API_BASE_URL,
        apiKey: ENV.REMOTE_API_KEY,
        model: ENV.REMOTE_API_MODEL,
    };

    // 开发环境提示
    if (ENV.IS_DEV) {
        console.log("[Config] 🔧 开发环境配置:", {
            baseURL: config.baseURL,
            model: config.model,
            hasKey: config.apiKey.length > 0,
            keyPreview: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : "未配置"
        });
    }

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



