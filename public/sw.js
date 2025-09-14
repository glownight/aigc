// 高级 Service Worker - 智能缓存策略
const CACHE_NAME = 'aigc-v1.2';
const STATIC_CACHE = 'aigc-static-v1.2';
const DYNAMIC_CACHE = 'aigc-dynamic-v1.2';

// 关键资源 - 立即缓存
const CRITICAL_RESOURCES = [
  '/',
  '/index.html'
];

// 大型资源模式 - 按需缓存
const LARGE_RESOURCES = [
  /webllm.*\.js$/,
  /markdown.*\.js$/,
  /highlight.*\.js$/
];

// 安装事件 - 缓存关键资源
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] 缓存关键资源');
      return cache.addAll(CRITICAL_RESOURCES.map(url => {
        return new Request(url, { cache: 'reload' });
      }));
    }).then(() => {
      console.log('[SW] 安装完成');
      return self.skipWaiting();
    })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('[SW] 删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] 激活完成');
      return self.clients.claim();
    })
  );
});

// 获取事件 - 智能缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非GET请求和外部资源
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    handleRequest(request)
  );
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // 1. HTML文件 - 网络优先，缓存备用
    if (pathname.endsWith('.html') || pathname === '/') {
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
    console.error('[SW] 请求处理失败:', error);
    
    // 返回缓存的资源或离线页面
    if (pathname.endsWith('.html') || pathname === '/') {
      return caches.match('/index.html');
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
      console.log('[SW] 网络失败，使用缓存:', request.url);
      return cached;
    }
    throw error;
  }
}

// 判断是否为关键资源
function isCriticalResource(pathname) {
  return pathname.includes('react-core') || 
         pathname.includes('router') || 
         pathname.endsWith('.css') ||
         pathname.includes('main');
}

// 判断是否为大型资源
function isLargeResource(pathname) {
  return LARGE_RESOURCES.some(pattern => pattern.test(pathname));
}