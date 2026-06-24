const CACHE_NAME = 'mihrab-cache-v1';
const FILES_TO_CACHE = [
    './',
    './mihrab_final.html',
    './manifest.json',
    './narjis.ttf',
    'https://alnaafi3iya-glitch.github.io/Mihrab/icon.png',
    'https://cdn.tailwindcss.com'
];

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(r => r || fetch(e.request))
    );
});
