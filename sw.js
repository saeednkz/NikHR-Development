// نام کش (حافظه پنهان) و لیستی از فایل‌های اصلی برنامه
const CACHE_NAME = 'nikhr-cache-v1';
const ASSETS_TO_CACHE = [
  './', // فایل HTML اصلی شما
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js',
  'https://cdn.jsdelivr.net/npm/jalaali-js/dist/jalaali.js',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://unpkg.com/persian-date@1.1.0/dist/persian-date.min.js',
  'https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/css/persian-datepicker.min.css',
  'https://cdn.jsdelivr.net/npm/persian-datepicker@1.2.0/dist/js/persian-datepicker.min.js',
  'https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css'
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
