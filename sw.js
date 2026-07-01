const CACHE_NAME = 'mihrab-cache-v15';
const urlsToCache = [
    './',
    './mihrab_final.html',
    './manifest.json',
    './icon.png',
    './narjis.ttf'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache).catch(err => console.warn('Cache addAll error:', err)))
    );
    // لا skipWaiting هنا — ننتظر إذن الصفحة عبر زر التحديث
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// استقبال رسالة SKIP_WAITING من الصفحة
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('firebaseio.com') ||
        e.request.url.includes('firebase') ||
        e.request.url.startsWith('chrome-extension')) {
        return;
    }
    if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    } else {
        e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
    }
});
