/**
 * 性能监控工具
 * 用于监测和上报应用性能指标
 */

// Web Vitals 指标接口
interface WebVitalsMetric {
    name: 'FCP' | 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'INP';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
}

// 性能数据接口
interface PerformanceData {
    metric: string;
    value: number;
    rating: string;
    timestamp: number;
    url: string;
    userAgent: string;
}

/**
 * 性能指标阈值配置
 */
const THRESHOLDS = {
    FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
    LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
    FID: { good: 100, poor: 300 },        // First Input Delay
    CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
    TTFB: { good: 800, poor: 1800 },      // Time to First Byte
    INP: { good: 200, poor: 500 },        // Interaction to Next Paint
};

/**
 * 获取性能评级
 */
function getRating(
    metric: keyof typeof THRESHOLDS,
    value: number
): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[metric];
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
}

/**
 * 上报性能数据
 */
function reportMetric(data: PerformanceData) {
    // 在开发环境中打印到控制台
    if (import.meta.env.DEV) {
        console.log(`[性能监控] ${data.metric}:`, {
            value: `${data.value.toFixed(2)}ms`,
            rating: data.rating,
        });
    }

    // 在生产环境中可以上报到分析服务
    if (import.meta.env.PROD) {
        // 使用 sendBeacon API 发送数据（不阻塞页面卸载）
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });

        // 替换为你的分析服务端点
        // navigator.sendBeacon('/api/analytics', blob);

        // 或者使用第三方分析服务
        // 例如: Google Analytics, Sentry, DataDog 等
    }
}

/**
 * 监控 Web Vitals 核心指标
 */
export async function monitorWebVitals() {
    try {
        // 动态导入 web-vitals 库（如果安装）
        // const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');

        // 手动收集基础性能指标
        if (typeof window !== 'undefined' && window.performance) {
            // Navigation Timing
            const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

            if (navigationTiming) {
                // TTFB (Time to First Byte)
                const ttfb = navigationTiming.responseStart - navigationTiming.requestStart;
                reportMetric({
                    metric: 'TTFB',
                    value: ttfb,
                    rating: getRating('TTFB', ttfb),
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                });

                // DOM 加载完成时间
                const domContentLoaded = navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart;
                reportMetric({
                    metric: 'DOM Content Loaded',
                    value: domContentLoaded,
                    rating: 'good',
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                });

                // 页面完全加载时间
                const loadComplete = navigationTiming.loadEventEnd - navigationTiming.fetchStart;
                reportMetric({
                    metric: 'Load Complete',
                    value: loadComplete,
                    rating: 'good',
                    timestamp: Date.now(),
                    url: window.location.href,
                    userAgent: navigator.userAgent,
                });
            }

            // Paint Timing
            const paintEntries = performance.getEntriesByType('paint');
            paintEntries.forEach((entry) => {
                if (entry.name === 'first-contentful-paint') {
                    reportMetric({
                        metric: 'FCP',
                        value: entry.startTime,
                        rating: getRating('FCP', entry.startTime),
                        timestamp: Date.now(),
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                    });
                }
            });

            // LCP (Largest Contentful Paint) - 使用 PerformanceObserver
            if ('PerformanceObserver' in window) {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    reportMetric({
                        metric: 'LCP',
                        value: lastEntry.startTime,
                        rating: getRating('LCP', lastEntry.startTime),
                        timestamp: Date.now(),
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                    });
                });

                lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
            }
        }
    } catch (error) {
        console.error('性能监控初始化失败:', error);
    }
}

/**
 * 监控长任务
 */
export function monitorLongTasks() {
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    reportMetric({
                        metric: 'Long Task',
                        value: entry.duration,
                        rating: entry.duration > 50 ? 'poor' : 'good',
                        timestamp: Date.now(),
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                    });
                }
            });

            observer.observe({ type: 'longtask', buffered: true });
        } catch (e) {
            // longtask 可能不被所有浏览器支持
            console.log('Long task monitoring not supported');
        }
    }
}

/**
 * 监控资源加载性能
 */
export function monitorResourceLoading() {
    if (typeof window !== 'undefined' && window.performance) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        // 找出加载慢的资源
        const slowResources = resources.filter((resource) => resource.duration > 1000);

        slowResources.forEach((resource) => {
            reportMetric({
                metric: `Slow Resource: ${resource.name}`,
                value: resource.duration,
                rating: 'poor',
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
            });
        });
    }
}

/**
 * 获取性能摘要
 */
export function getPerformanceSummary() {
    if (typeof window === 'undefined' || !window.performance) {
        return null;
    }

    const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    return {
        navigation: navigationTiming ? {
            ttfb: navigationTiming.responseStart - navigationTiming.requestStart,
            domContentLoaded: navigationTiming.domContentLoadedEventEnd - navigationTiming.fetchStart,
            loadComplete: navigationTiming.loadEventEnd - navigationTiming.fetchStart,
        } : null,
        paint: paintEntries.reduce((acc, entry) => {
            if (entry.name === 'first-paint') acc.fp = entry.startTime;
            if (entry.name === 'first-contentful-paint') acc.fcp = entry.startTime;
            return acc;
        }, {} as Record<string, number>),
        memory: (performance as any).memory ? {
            usedJSHeapSize: ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
            totalJSHeapSize: ((performance as any).memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        } : null,
    };
}

/**
 * 启动性能监控
 */
export function startPerformanceMonitoring() {
    if (typeof window === 'undefined') return;

    // 页面加载完成后开始监控
    window.addEventListener('load', () => {
        // 延迟执行，避免影响页面加载
        setTimeout(() => {
            monitorWebVitals();
            monitorLongTasks();
            monitorResourceLoading();
        }, 0);
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            // 页面即将隐藏时上报最终数据
            const summary = getPerformanceSummary();
            if (summary) {
                console.log('[性能摘要]', summary);
            }
        }
    });
}

// 在开发环境提供性能调试工具
if (import.meta.env.DEV) {
    (window as any).getPerformanceSummary = getPerformanceSummary;
    (window as any).monitorWebVitals = monitorWebVitals;
}

