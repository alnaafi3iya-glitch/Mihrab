const CACHE_NAME = 'mihrab-cache-v4';
const urlsToCache = [
    './',
    './mihrab_final.html',
    './manifest.json',
    './icon.png',
    './narjis.ttf'
];

// حدث التثبيت: حفظ الملفات الأساسية في الكاش
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                // نستخدم catch لتجنب توقف التثبيت إذا فشل تحميل أحد الملفات
                return cache.addAll(urlsToCache).catch(err => console.warn('Cache addAll error:', err));
            })
    );
    self.skipWaiting();
});

// حدث التفعيل: مسح الكاش القديم (v1, v2, v3) عند التحديث إلى v4
self.addEventListener('activate', event => {
    const cacheAllowlist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheAllowlist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// حدث الجلب (Fetch): اعتراض الطلبات ومعالجتها
self.addEventListener('fetch', e => {
    // تجاهل Firebase وChrome extensions تماماً حتى لا يعترضها الـ Service Worker
    if (e.request.url.includes('firebaseio.com') || 
        e.request.url.includes('firebase') ||
        e.request.url.startsWith('chrome-extension')) {
        return; // ترك الطلب يمر بشكل طبيعي للإنترنت
    }

    // للملفات الأساسية (HTML): محاولة جلب النسخة الأحدث من الإنترنت أولاً (Network First)
    if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
        e.respondWith(
            fetch(e.request).catch(() => caches.match(e.request))
        );
    } else {
        // لباقي الملفات (صور، خطوط، سكريبتات): جلبها من الكاش أولاً إن وجدت (Cache First)
        e.respondWith(
            caches.match(e.request).then(r => r || fetch(e.request))
        );
    }
});
