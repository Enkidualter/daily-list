// 每日清单 Service Worker
const CACHE = 'daily-list-v1';
const ASSETS = [
  './',
  './index.html',
];

// 安装：缓存核心文件
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 请求拦截：网络优先，失败走缓存（离线可用）
self.addEventListener('fetch', e => {
  // GitHub API 请求不走缓存，直接走网络
  if (e.request.url.includes('api.github.com')) return;
  // 字体等外部资源网络优先
  if (!e.request.url.startsWith(self.location.origin)) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }
  // 本地资源：网络优先，离线降级缓存
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
