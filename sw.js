// نام کش (حافظه پنهان) و لیستی از فایل‌های اصلی برنامه
const CACHE_NAME = 'nikhr-cache-v1';
// در فایل sw.js
// محتوای این آرایه را با لیست جدید جایگزین کنید

const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'js/main.js',
  'js/auth.js',
  'logo.png',
  'manifest.json'
  // تمام لینک‌های http حذف شدند
];

// 1. هنگام نصب Service Worker، فایل‌های اصلی را در کش ذخیره کن
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 2. هنگام دریافت درخواست (fetch)، ابتدا کش را چک کن
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر فایل در کش بود، همان را برگردان
        if (response) {
          return response;
        }
        // اگر نبود، از اینترنت بگیر
        return fetch(event.request);
      })
  );
});
