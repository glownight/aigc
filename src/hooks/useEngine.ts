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
    const engineRef = useRef<any | null>(null);

    useEffect(() => {
        if (engine !== "browser") {
            engineRef.current = null;
            setEngineReady(false);
            setProgressText("");
            return;
        }

        // 如果下载被暂停，不启动初始化
        if (downloadPaused) {
            return;
        }

        let cancelled = false;
        setEngineReady(false);
        setProgressText(
            "首次下载会要约234MB数据，请耐心等待。后续使用将会非常快速！"
        );

        (async () => {
            try {
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
                    setProgressText(`初始化失败：${e?.message || e}`);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [engine, browserModel, downloadPaused]);

    return {
        engineRef,
        engineReady,
        progressText,
        setProgressText,
    };
}

