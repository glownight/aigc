/**
 * 文本质量检查工具函数
 */

import type { QualityCheckResult } from "../types";

/**
 * 检查内容质量
 */
export const checkContentQuality = (
    content: string
): QualityCheckResult => {
    // 检查内容质量
    if (!content || content.trim().length === 0) {
        return { isValid: false, reason: "内容为空" };
    }

    // 检查是否包含太多重复字符
    const repeatPattern = /(.)\1{5,}/g;
    if (repeatPattern.test(content)) {
        return { isValid: false, reason: "内容包含过多重复字符" };
    }

    // 检查是否包含异常字符
    const invalidChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
    if (invalidChars.test(content)) {
        return { isValid: false, reason: "内容包含异常字符" };
    }

    return { isValid: true };
};

/**
 * 在句子边界截断文本
 */
export const truncateAtSentence = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;

    // 在句子边界截断
    const truncated = text.substring(0, maxLength);
    const sentenceEnd = /[\u3002\uff01\uff1f\.\!\?]\s*/g;
    let lastSentenceEnd = -1;
    let match;

    while ((match = sentenceEnd.exec(truncated)) !== null) {
        lastSentenceEnd = match.index + match[0].length;
    }

    if (lastSentenceEnd > maxLength * 0.7) {
        return truncated.substring(0, lastSentenceEnd);
    }

    // 如果没有合适的句子边界，在词边界截断
    const wordEnd = /\s+/g;
    let lastWordEnd = -1;

    while ((match = wordEnd.exec(truncated)) !== null) {
        lastWordEnd = match.index;
    }

    if (lastWordEnd > maxLength * 0.8) {
        return truncated.substring(0, lastWordEnd) + "...";
    }

    return truncated + "...";
};

