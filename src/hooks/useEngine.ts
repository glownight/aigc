/**
 * useEngine Hook - 管理 WebLLM 引擎
 */

import { useEffect, useRef, useState } from "react";
import { loadWebLLMModule, getEngineSingleton } from "../utils/webllm";
import type { EngineMode } from "../types";

export function useEngine(
    engine: EngineMode,
    browserModel: string,
    downloadPaused: boolean
) {
    const [engineReady, setEngineReady] = useState(false);
    const [progressText, setProgressText] = useState("");
    const [initError, setInitError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const engineRef = useRef<any | null>(null);

    useEffect(() => {
        if (engine !== "browser") {
            engineRef.current = null;
            setEngineReady(false);
            setProgressText("");
            setInitError(null);
            return;
        }

        // 如果下载被暂停，不启动初始化
        if (downloadPaused) {
            return;
        }

        let cancelled = false;
        setEngineReady(false);
        setInitError(null); // 清除之前的错误
        setProgressText(
            "首次下载会要约234MB数据，请耐心等待。后续使用将会非常快速！"
        );

        (async () => {
            try {
                // 🔍 检查浏览器兼容性
                if (!navigator.gpu) {
                    const errorMsg = "浏览器不支持 WebGPU，无法运行本地模型。请使用 Chrome/Edge 119+ 版本，或切换到远程 API 模式。";
                    setProgressText(`初始化失败：${errorMsg}`);
                    setInitError(errorMsg);
                    return;
                }

                const singleton = getEngineSingleton();

                // 若已有单例且模型一致，直接复用
                if (singleton.engine && singleton.model === browserModel) {
                    engineRef.current = singleton.engine;
                    setEngineReady(true);
                    setProgressText("模型已就绪（复用缓存实例）");
                    return;
                }

                // 如果正在创建，等待同一个 Promise
                if (singleton.creating) {
                    setProgressText("模型正在准备（共享创建过程）…");
                    const eng = await singleton.creating;
                    if (!cancelled) {
                        engineRef.current = eng;
                        setEngineReady(true);
                        setProgressText("模型已就绪。");
                    }
                    return;
                }

                // 加载 WebLLM 模块
                setProgressText("正在加载 AI 模块...");
                const mod = await loadWebLLMModule();
                const { CreateMLCEngine } = mod as any;

                // 构建引擎配置
                const engineConfig: any = {
                    initProgressCallback: (report: any) => {
                        if (cancelled) return;

                        let displayText = report?.text || JSON.stringify(report);

                        // 优化进度显示
                        if (displayText.includes("Fetching param cached")) {
                            const match = displayText.match(/(\d+)MB.*?(\d+)%.*?(\d+) sec/);
                            if (match) {
                                const [, mb, percent, seconds] = match;
                                displayText = `首次下载模型数据: ${mb}MB (${percent}%) - 已用时${seconds}秒`;

                                if (parseInt(percent) > 50) {
                                    displayText += " - 即将完成！";
                                } else if (parseInt(percent) > 20) {
                                    displayText += " - 进展顺利";
                                }
                            }
                        } else if (displayText.includes("Loading model")) {
                            displayText = "正在加载模型文件...";
                        } else if (displayText.includes("Compiling")) {
                            displayText = "正在编译模型，马上就好...";
                        }

                        setProgressText(displayText);
                    },
                };

                const creating = CreateMLCEngine(browserModel, engineConfig);
                singleton.creating = creating;
                const eng = await creating;

                if (!cancelled) {
                    singleton.engine = eng;
                    singleton.model = browserModel;
                    singleton.creating = null;
                    engineRef.current = eng;
                    setEngineReady(true);
                    setProgressText("模型已就绪，可以开始对话。");
                }
            } catch (e: any) {
                const singleton = getEngineSingleton();
                singleton.creating = null;
                if (!cancelled) {
                    let errorMsg = e?.message || String(e);

                    // 🔍 提供更友好的错误提示
                    if (errorMsg.includes("Failed to fetch")) {
                        errorMsg = "网络连接失败，无法下载模型文件。\n\n可能原因：\n1. WebLLM 的 CDN 在国内访问受限\n2. 网络连接不稳定\n3. 防火墙阻止了下载\n\n建议：切换到远程 API 模式";
                    } else if (errorMsg.includes("WebGPU")) {
                        errorMsg = `WebGPU 错误：${errorMsg}\n\n请确保使用 Chrome/Edge 119+ 版本`;
                    } else if (errorMsg.includes("quota")) {
                        errorMsg = "浏览器存储空间不足，请清理缓存后重试";
                    }

                    console.error("[useEngine] 初始化错误:", e);
                    setProgressText(`初始化失败：${errorMsg}`);
                    setInitError(errorMsg); // 设置错误状态
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [engine, browserModel, downloadPaused, retryCount]); // 添加retryCount依赖

    // 重试函数
    const retry = () => {
        setRetryCount((prev) => prev + 1);
    };

    return {
        engineRef,
        engineReady,
        progressText,
        setProgressText,
        initError,
        retry,
    };
}

