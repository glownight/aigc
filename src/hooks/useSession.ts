/**
 * useSession Hook - 管理会话状态
 */

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Session, SessionManager, Message } from "../types";
import { uid } from "../utils/uid";

export function useSession(
    sessionManager: SessionManager,
    setSessionManager: (value: SessionManager | ((prev: SessionManager) => SessionManager)) => void
) {
    const { sessionId } = useParams<{ sessionId?: string }>();
    const navigate = useNavigate();

    // 初始化默认会话并处理URL路由
    useEffect(() => {
        if (sessionManager.sessions.length === 0) {
            const defaultSession: Session = {
                id: uid(),
                title: "新对话",
                messages: [
                    { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
                    {
                        id: uid(),
                        role: "assistant",
                        content: "你好，我可以为你提供智能问答服务～",
                    },
                ],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setSessionManager({
                sessions: [defaultSession],
                currentSessionId: defaultSession.id,
            });
            if (!sessionId) {
                navigate(`/chat/${defaultSession.id}`, { replace: true });
            }
        } else {
            if (sessionId) {
                const existingSession = sessionManager.sessions.find(
                    (s) => s.id === sessionId
                );
                if (existingSession) {
                    if (sessionManager.currentSessionId !== sessionId) {
                        setSessionManager((prev) => ({
                            ...prev,
                            currentSessionId: sessionId,
                        }));
                    }
                } else {
                    navigate(`/chat/${sessionManager.sessions[0].id}`, { replace: true });
                }
            } else {
                // 访问根路径时，不自动跳转，只设置当前会话
                const targetId = sessionManager.currentSessionId || sessionManager.sessions[0].id;
                if (sessionManager.currentSessionId !== targetId) {
                    setSessionManager((prev) => ({
                        ...prev,
                        currentSessionId: targetId,
                    }));
                }
            }
        }
    }, [sessionId, sessionManager.sessions.length]);

    // 获取当前会话
    const currentSession = sessionManager.sessions.find(
        (s) => s.id === (sessionId || sessionManager.currentSessionId)
    );

    // 会话操作函数
    const createNewSession = (onClose?: () => void) => {
        const newSession: Session = {
            id: uid(),
            title: "新对话",
            messages: [
                { id: uid(), role: "system", content: "你是一个有帮助的智能助手。" },
                {
                    id: uid(),
                    role: "assistant",
                    content: "你好，我可以为你提供智能问答服务～",
                },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setSessionManager((prev) => ({
            sessions: [newSession, ...prev.sessions],
            currentSessionId: newSession.id,
        }));
        onClose?.();
        navigate(`/chat/${newSession.id}`);
    };

    const switchSession = (id: string, onClose?: () => void) => {
        setSessionManager((prev) => ({
            ...prev,
            currentSessionId: id,
        }));
        onClose?.();
        navigate(`/chat/${id}`);
    };

    const deleteSession = (id: string) => {
        setSessionManager((prev) => {
            const newSessions = prev.sessions.filter((s) => s.id !== id);
            let newCurrentId = prev.currentSessionId;

            if (id === prev.currentSessionId && newSessions.length > 0) {
                newCurrentId = newSessions[0].id;
                navigate(`/chat/${newCurrentId}`);
            }

            return {
                sessions: newSessions,
                currentSessionId: newCurrentId,
            };
        });
    };

    const updateCurrentSession = (messages: Message[]) => {
        if (!currentSession) return;

        let newTitle = currentSession.title;
        const userMessages = messages.filter((m) => m.role === "user");
        if (userMessages.length === 1 && currentSession.title === "新对话") {
            const firstUserMessage = userMessages[0].content;
            newTitle = firstUserMessage.replace(/\n/g, " ").slice(0, 20);
            if (firstUserMessage.length > 20) {
                newTitle += "...";
            }
        }

        setSessionManager((prev) => ({
            ...prev,
            sessions: prev.sessions.map((s) =>
                s.id === currentSession.id
                    ? { ...s, messages, updatedAt: Date.now(), title: newTitle }
                    : s
            ),
        }));
    };

    return {
        currentSession,
        sessionId,
        createNewSession,
        switchSession,
        deleteSession,
        updateCurrentSession,
    };
}

