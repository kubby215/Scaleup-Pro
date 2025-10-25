sw.js
const CACHE_VERSION = 'v1';
const STATIC_CACHE = static-${CACHE_VERSION};
const RUNTIME_CACHE = runtime-${CACHE_VERSION};

const PRECACHE_URLS = [
'./servepro1_5.html',
'./offline.html',
'./manifest.json',
'./',
'./icons/icon-192.png',
'./icons/icon-512.png',
'./icons/apple-touch-icon.png',
'./icons/icon-48.png'
];

// Install: cache the app shell
self.addEventListener('install', event => {
event.waitUntil(
caches.open(STATIC_CACHE)
.then(cache => cache.addAll(PRECACHE_URLS))
.then(() => self.skipWaiting())
);
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
const currentCaches = [STATIC_CACHE, RUNTIME_CACHE];
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.map(key => {
if (!currentCaches.includes(key)) {
return caches.delete(key);
}
}))
).then(() => self.clients.claim())
);
});

// Fetch handler
self.addEventListener('fetch', event => {
const request = event.request;

// Only handle GET
if (request.method !== 'GET') return;

const acceptHeader = request.headers.get('Accept') || '';
const isNavigation = request.mode === 'navigate' || acceptHeader.includes('text/html');

if (isNavigation) {
// Network-first for navigations, fallback to cache/offline page
event.respondWith(
fetch(request)
.then(response => {
const copy = response.clone();
caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy));
return response;
})
.catch(() => caches.match(request).then(cached => cached || caches.match('./offline.html')))
);
return;
}

// Cache-first for other requests (assets)
event.respondWith(
caches.match(request).then(cachedResponse => {
if (cachedResponse) return cachedResponse;
return fetch(request).then(networkResponse => {
// Only cache valid responses
if (!networkResponse || networkResponse.status !== 200) return networkResponse;
const responseCopy = networkResponse.clone();
caches.open(RUNTIME_CACHE).then(cache => cache.put(request, responseCopy));
return networkResponse;
}).catch(() => {
// If request is for an image, optionally return a cached placeholder
if (request.destination === 'image') {
return caches.match('./icons/icon-192.png');
}
});
})
);
});