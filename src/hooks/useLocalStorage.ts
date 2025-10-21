/**
 * useLocalStorage Hook - 持久化状态管理
 */

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T) {
    const [val, setVal] = useState<T>(() => {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : initial;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(val));
    }, [key, val]);

    return [val, setVal] as const;
}

