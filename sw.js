// فایل: sw.js
// کل محتوای این فایل را با کد زیر جایگزین کنید

const CACHE_NAME = 'nikhr-cache-v3'; // bump to force new SW and fresh assets
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './js/main.js',
  './js/auth.js',
  './logo.png',
  './manifest.json'
];

// ۱. هنگام نصب: فایل‌های اصلی را در کش جدید ذخیره کن
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
  self.skipWaiting(); // سرویس ورکر جدید را بلافاصله فعال کن
});

// ۲. هنگام فعال‌سازی: تمام کش‌های قدیمی را پاک کن
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // کنترل کامل صفحه را به دست بگیر
});

// ۳. هنگام دریافت درخواست: استراتژی Cache-First
self.addEventListener('fetch', event => {
  const req = event.request;
  // Network-first for JS to avoid stale cached app code
  if (req.destination === 'script') {
    event.respondWith(
      fetch(req)
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
          return resp;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
