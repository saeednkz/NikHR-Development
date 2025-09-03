// فایل: sw.js
// کل محتوای این فایل را با کد زیر جایگزین کنید

const CACHE_NAME = 'nikhr-cache-v5'; // bump to force new SW and fresh assets
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
  // Bypass service worker for JS/ESM entirely to prevent HTML fallbacks
  const url = new URL(req.url);
  if (req.destination === 'script' || url.pathname.endsWith('.js')) {
    event.respondWith(fetch(req));
    return;
  }
  // Network-first for JS to avoid stale cached app code
  // (handled above)

  // Cache-first for other assets
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
