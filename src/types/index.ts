/**
 * 通用类型定义
 */

export type Role = "user" | "assistant" | "system";

export type Message = {
    id: string;
    role: Role;
    content: string;
};

export type EngineMode = "browser" | "remote";

export type Session = {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
    updatedAt: number;
};

export type SessionManager = {
    sessions: Session[];
    currentSessionId: string;
};

export type Theme = "blue" | "pink" | "green" | "yellow" | "black";

/**
 * 引擎初始化进度报告
 */
export interface EngineProgressReport {
    text?: string;
    progress?: number;
}

/**
 * 流式处理配置
 */
export interface StreamConfig {
    maxLength: number;
    duplicateThreshold: number;
    qualityCheckInterval: number;
    minChunkLength: number;
}

/**
 * 内容质量检查结果
 */
export interface QualityCheckResult {
    isValid: boolean;
    reason?: string;
}

/**
 * 远程API配置
 */
export interface RemoteApiConfig {
    baseURL: string;
    apiKey: string;
    model: string;
}

