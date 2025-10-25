const CACHE_VERSION = 'v1';
const CACHE_NAME = servicepro-cache-${CACHE_VERSION};
const OFFLINE_URL = '/offline.html';
const ASSETS = [
'/',
'/index.html',
'/offline.html',
'/manifest.json',
'/icons/icon-192.png',
'/icons/icon-512.png'
// add '/styles.css', '/app.js' if you have them
];

self.addEventListener('install', event => {
self.skipWaiting();
event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
event.waitUntil(
caches.keys().then(keys =>
Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null))
).then(() => self.clients.claim())
);
});

self.addEventListener('fetch', event => {
const req = event.request;
if (req.mode === 'navigate') {
event.respondWith(
fetch(req).then(res => {
const copy = res.clone();
caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
return res;
}).catch(() => caches.match(req).then(r => r || caches.match(OFFLINE_URL)))
);
return;
}
event.respondWith(
caches.match(req).then(cached => {
if (cached) return cached;
return fetch(req).then(networkResponse => {
if (networkResponse && networkResponse.status === 200 && req.url.startsWith(self.location.origin)) {
const respClone = networkResponse.clone();
caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
}
return networkResponse;
}).catch(() => {
if (req.destination === 'image') return caches.match('/icons/icon-192.png');
});
})
);
});

self.addEventListener('message', event => {
if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
