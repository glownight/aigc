/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_REMOTE_API_BASE_URL?: string;
    readonly VITE_REMOTE_API_KEY?: string;
    readonly VITE_REMOTE_API_MODEL?: string;
    readonly VITE_DEFAULT_ENGINE?: "browser" | "remote";
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

// WebGPU 类型声明
interface Navigator {
    readonly gpu?: {
        requestAdapter(): Promise<any>;
    };
}
