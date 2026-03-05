// 高级 Service Worker - 智能缓存策略
const VERSION = "1.3.0";
const CACHE_NAME = `aigc-v${VERSION}`;
const STATIC_CACHE = `aigc-static-v${VERSION}`;
const DYNAMIC_CACHE = `aigc-dynamic-v${VERSION}`;
const IMAGE_CACHE = `aigc-images-v${VERSION}`;

// 缓存配置
const CACHE_CONFIG = {
  // 静态资源缓存时间（7天）
  STATIC_MAX_AGE: 7 * 24 * 60 * 60 * 1000,
  // 动态资源缓存时间（24小时）
  DYNAMIC_MAX_AGE: 24 * 60 * 60 * 1000,
  // 图片缓存时间（30天）
  IMAGE_MAX_AGE: 30 * 24 * 60 * 60 * 1000,
  // 最大缓存条目数
  MAX_CACHE_ITEMS: 50,
};

// 关键资源 - 立即缓存
const CRITICAL_RESOURCES = ["/", "/index.html"];

// 大型资源模式 - 按需缓存
const LARGE_RESOURCES = [
  /webllm.*\.js$/,
  /markdown.*\.js$/,
  /highlight.*\.js$/,
];

// 安装事件 - 缓存关键资源
self.addEventListener("install", (event) => {
  console.log("[SW] 安装中...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] 缓存关键资源");
        return cache.addAll(
          CRITICAL_RESOURCES.map((url) => {
            return new Request(url, { cache: "reload" });
          })
        );
      })
      .then(() => {
        console.log("[SW] 安装完成");
        return self.skipWaiting();
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener("activate", (event) => {
  console.log("[SW] 激活中...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] 删除旧缓存:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] 激活完成");
        return self.clients.claim();
      })
  );
});

// 获取事件 - 智能缓存策略
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳过非GET请求和外部资源
  if (request.method !== "GET" || !url.origin.includes(self.location.origin)) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // 1. HTML文件 - 网络优先，缓存备用
    if (pathname.endsWith(".html") || pathname === "/") {
      return await networkFirstStrategy(request, STATIC_CACHE);
    }

    // 2. 关键JS/CSS - 缓存优先
    if (isCriticalResource(pathname)) {
      return await cacheFirstStrategy(request, STATIC_CACHE);
    }

    // 3. 大型JS库 - 缓存优先，长期存储
    if (isLargeResource(pathname)) {
      return await cacheFirstStrategy(request, DYNAMIC_CACHE);
    }

    // 4. 图片和字体 - 缓存优先
    if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
      return await cacheFirstStrategy(request, STATIC_CACHE);
    }

    // 5. 其他资源 - 网络优先
    return await networkFirstStrategy(request, DYNAMIC_CACHE);
  } catch (error) {
    console.error("[SW] 请求处理失败:", error);

    // 返回缓存的资源或离线页面
    if (pathname.endsWith(".html") || pathname === "/") {
      return caches.match("/index.html");
    }

    throw error;
  }
}

// 缓存优先策略
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

// 网络优先策略
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      console.log("[SW] 网络失败，使用缓存:", request.url);
      return cached;
    }
    throw error;
  }
}

// 判断是否为关键资源
function isCriticalResource(pathname) {
  return (
    pathname.includes("react-core") ||
    pathname.includes("router") ||
    pathname.endsWith(".css") ||
    pathname.includes("main")
  );
}

// 判断是否为大型资源
function isLargeResource(pathname) {
  return LARGE_RESOURCES.some((pattern) => pattern.test(pathname));
}

// 清理过期缓存
async function cleanupExpiredCache(cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const now = Date.now();

  for (const request of requests) {
    const response = await cache.match(request);
    if (!response) continue;

    const cachedTime = response.headers.get("sw-cache-time");
    if (cachedTime && now - parseInt(cachedTime) > maxAge) {
      await cache.delete(request);
      console.log("[SW] 删除过期缓存:", request.url);
    }
  }
}

// 限制缓存大小
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxItems) {
    const itemsToDelete = keys.length - maxItems;
    for (let i = 0; i < itemsToDelete; i++) {
      await cache.delete(keys[i]);
      console.log("[SW] 删除最旧缓存:", keys[i].url);
    }
  }
}

// 增强的缓存优先策略（添加时间戳）
async function enhancedCacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    const cachedTime = cached.headers.get("sw-cache-time");
    const now = Date.now();

    // 检查缓存是否过期
    if (cachedTime && now - parseInt(cachedTime) <= maxAge) {
      return cached;
    }
  }

  const response = await fetch(request);
  if (response.ok) {
    const clonedResponse = response.clone();
    const headers = new Headers(clonedResponse.headers);
    headers.append("sw-cache-time", Date.now().toString());

    const modifiedResponse = new Response(clonedResponse.body, {
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers: headers,
    });

    cache.put(request, modifiedResponse);
  }

  return response;
}

// 预加载关键资源
async function preloadCriticalResources() {
  const cache = await caches.open(STATIC_CACHE);

  // 可以添加更多需要预加载的资源
  const resourcesToPreload = ["/js/react-core.js", "/css/index.css"];

  for (const url of resourcesToPreload) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log("[SW] 预加载资源:", url);
      }
    } catch (error) {
      console.log("[SW] 预加载失败:", url, error);
    }
  }
}

// 后台同步（如果支持）
if ("sync" in self.registration) {
  self.addEventListener("sync", (event) => {
    if (event.tag === "sync-data") {
      event.waitUntil(syncData());
    }
  });
}

async function syncData() {
  console.log("[SW] 后台同步数据");
  // 在这里可以实现数据同步逻辑
}

// 推送通知（如果需要）
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "新消息",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
  };

  event.waitUntil(self.registration.showNotification("AIGC 应用", options));
});

// 消息通信
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAN_CACHE") {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
});

// 定期清理缓存
setInterval(() => {
  cleanupExpiredCache(STATIC_CACHE, CACHE_CONFIG.STATIC_MAX_AGE);
  cleanupExpiredCache(DYNAMIC_CACHE, CACHE_CONFIG.DYNAMIC_MAX_AGE);
  cleanupExpiredCache(IMAGE_CACHE, CACHE_CONFIG.IMAGE_MAX_AGE);

  trimCache(DYNAMIC_CACHE, CACHE_CONFIG.MAX_CACHE_ITEMS);
  trimCache(IMAGE_CACHE, CACHE_CONFIG.MAX_CACHE_ITEMS);
}, 60 * 60 * 1000); // 每小时清理一次
