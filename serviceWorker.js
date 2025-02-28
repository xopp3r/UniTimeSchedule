const CACHE_NAME = 'cache-v1';
const urlsToCache = [
  '/',
  '/assets/icon192.png',
  '/assets/icon512.png',
  '/serviceWorker.js',
  '/scripts.js',
  '/index.html',
  '/manifest.json',
  '/msu_105_1.json',
  '/style.css'
];



self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});
