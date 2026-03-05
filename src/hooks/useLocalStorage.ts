/**
 * useLocalStorage Hook - 持久化状态管理
 * ⚠️ 注意：项目主要使用 sessionStorage，此 hook 仅保留用于特殊场景
 */

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
    const [val, setVal] = useState<T>(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : initial;
        } catch (error) {
            console.error(`[useLocalStorage] 读取失败 (${key}):`, error);
            return initial;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch (error) {
            console.error(`[useLocalStorage] 保存失败 (${key}):`, error);
        }
    }, [key, val]);

    return [val, setVal] as const;
}

