/**
 * WebLLM 模块懒加载工具
 */

// 懒加载 web-llm 模块 - 只在真正需要时加载
let webllmModulePromise: Promise<any> | null = null;

export const loadWebLLMModule = async () => {
    if (!webllmModulePromise) {
        console.log("开始按需加载 WebLLM 模块...");
        webllmModulePromise = import("@mlc-ai/web-llm");
    }
    return webllmModulePromise;
};

// 在全局保存一个引擎单例，避免在 HMR/路由切换/二次进入页面时重复初始化
const __g: any = globalThis as any;
if (!__g.__mlc_singleton) {
    __g.__mlc_singleton = {
        engine: null as any,
        model: "",
        creating: null as Promise<any> | null,
    };
}

export const getEngineSingleton = () => __g.__mlc_singleton;

