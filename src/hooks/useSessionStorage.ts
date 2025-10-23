/**
 * useSessionStorage Hook - 会话级存储管理
 * 数据只在当前浏览器会话中有效，关闭标签页后自动清除
 */

import { useEffect, useState } from "react";

export function useSessionStorage<T>(key: string, initial: T) {
    const [val, setVal] = useState<T>(() => {
        try {
            const raw = sessionStorage.getItem(key);
            return raw ? (JSON.parse(raw) as T) : initial;
        } catch (error) {
            console.error(`[useSessionStorage] 读取失败 (${key}):`, error);
            return initial;
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem(key, JSON.stringify(val));
        } catch (error) {
            console.error(`[useSessionStorage] 保存失败 (${key}):`, error);
        }
    }, [key, val]);

    return [val, setVal] as const;
}

