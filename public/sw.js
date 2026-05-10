// Service Worker - Forced Update for A&E Chat
const CACHE_NAME = 'ae-chat-cache-v3'; // Changed version to v3
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/css/style.css',
    '/js/app.js',
    '/js/socket.js',
    '/js/auth.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Force the waiting service worker to become the active one
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // Strategy: Network first, then fallback to cache
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});

self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
