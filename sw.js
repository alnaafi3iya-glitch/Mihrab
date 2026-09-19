const CACHE_PREFIX = 'mihrab-cache-';
const CACHE_NAME = `${CACHE_PREFIX}v122`;

// أسماء مؤكدة من ملفي التثبيت وصفحة الإدارة المرفقة.
// يُحفظ كل ملف بصورة مستقلة حتى لا يمنع ملف مفقود حفظ بقية التطبيق.
const APP_FILES = [
    './',
    './mihrab_final.html',
    './admin.html',
    './manifest.json',
    './admin-manifest.webmanifest',
    './icon.png',
    './icon2.png',
    './admin-app-icon-192.png',
    './admin-app-icon-512.png',
    './narjis.ttf'
];

function isCacheableResponse(response) {
    return !!response && (response.ok || response.type === 'opaque');
}

async function cacheOne(cache, url) {
    try {
        const response = await fetch(url, { cache: 'reload' });
        if (isCacheableResponse(response)) await cache.put(url, response.clone());
    } catch (error) {
        console.warn('تعذر حفظ ملف للعمل دون إنترنت:', url, error);
    }
}

self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        await Promise.all(APP_FILES.map(url => cacheOne(cache, url)));
    })());
});

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(
            keys
                .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
                .map(key => caches.delete(key))
        );
        await self.clients.claim();
    })());
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (isCacheableResponse(response)) await cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cached = await cache.match(request, { ignoreSearch: true });
        if (cached) return cached;
        const home = await cache.match('./');
        if (home) return home;
        return new Response('تعذر فتح الصفحة دون اتصال بالإنترنت.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
    }
}

async function staleWhileRevalidate(request, event) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: true });
    const update = fetch(request)
        .then(async response => {
            if (isCacheableResponse(response)) await cache.put(request, response.clone());
            return response;
        })
        .catch(() => null);

    if (cached) {
        event.waitUntil(update);
        return cached;
    }

    const response = await update;
    return response || new Response('', { status: 504 });
}

self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    if (url.origin !== self.location.origin) return;

    const isPageRequest = request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
    event.respondWith(
        isPageRequest
            ? networkFirst(request)
            : staleWhileRevalidate(request, event)
    );
});
