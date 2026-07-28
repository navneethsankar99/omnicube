/**
 * OmniCube Service Worker (sw.js)
 * Enables 100% offline capabilities by caching app shell files and resources.
 */

const CACHE_NAME = 'omnicube-v2';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/solver.js',
    './js/cube-state.js',
    './js/cube.js',
    './js/scramble.js',
    './js/stats.js',
    './js/timer.js',
    './js/algorithms.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon.svg'
];

// Install Event — Cache App Shell
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

// Activate Event — Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event — Cache-First with Stale-While-Revalidate Fallback
self.addEventListener('fetch', (e) => {
    // Only handle GET requests
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Update in background
                fetch(e.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(e.request, networkResponse);
                        });
                    }
                }).catch(() => { /* Offline fallback */ });

                return cachedResponse;
            }

            return fetch(e.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });

                return networkResponse;
            });
        })
    );
});
