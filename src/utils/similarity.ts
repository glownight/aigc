/**
 * 相似度计算工具函数
 */

/**
 * 计算 Levenshtein 距离
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1)
        .fill(null)
        .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }

    return matrix[str2.length][str1.length];
};

/**
 * 计算两个字符串的相似度
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
    if (!str1 || !str2) return 0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
};

/**
 * 检测重复内容
 */
export const detectDuplicate = (
    text: string,
    newChunk: string,
    threshold: number = 0.8
): boolean => {
    if (!text || !newChunk || newChunk.length < 3) return false;

    // 检查最后50个字符中是否包含重复内容
    const recentText = text.slice(-50);
    const similarity = calculateSimilarity(recentText, newChunk);

    return similarity > threshold;
};

