const CACHE_NAME = 'mihrab-cache-v4'; // غيّري الرقم (v2, v3...) مع كل تحديث مستقبلي للتطبيق

const STATIC_ASSETS = [
    './manifest.json',
    'https://alnaafi3iya-glitch.github.io/Mihrab/icon.png'
];

const CDN_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://i.postimg.cc/DJ7jsLg2/mihrab.png',
    'https://i.postimg.cc/dkJHdrBK/title.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            const staticPromise = cache.addAll(STATIC_ASSETS);
            const cdnPromises = CDN_ASSETS.map(url => {
                const req = new Request(url, { mode: 'no-cors' });
                return fetch(req).then(res => cache.put(req, res));
            });
            return Promise.all([staticPromise, ...cdnPromises]);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    const url = event.request.url;

    // لا تتدخلي أبداً في طلبات العداد الإحصائي - يجب أن تبقى حيّة من الشبكة دائماً
    if (url.includes('counterapi') || url.includes('allorigins')) {
        return;
    }
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(() => cachedResponse);
        })
    );
});
