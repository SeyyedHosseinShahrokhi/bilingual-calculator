const CACHE_NAME = 'calculator-app-v1.6';
const OFFLINE_URL = '/views/offline.html';

const STATIC_FILES = [
    '/',
    '/index.html',
    '/sw.js',
    OFFLINE_URL,
    '/assets/css/fonts.css',
    '/assets/css/main.css',
    '/assets/css/styles-offline.css',
    '/assets/js/app.js',
    '/assets/js/main.js',
    '/assets/js/shared/sharedDom.js',
    '/assets/js/calculator/dom.js',
    '/assets/js/calculator/state.js',
    '/assets/js/calculator/utils.js',
    '/assets/js/calculator/math.js',
    '/assets/js/calculator/i18n.js',
    '/assets/js/calculator/controller.js',
    '/assets/js/script-offline.js',
    '/assets/js/theme.js',
    '/assets/icons/favicon.png',
    '/assets/i18n/lang-api.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_FILES);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // اگر پاسخ 404 از سرور آمد، همان را برگردان
                if (networkResponse.status === 404) {
                    return networkResponse;
                }
                // در غیر این صورت، پاسخ را کش کن و برگردان
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone()).catch(() => {
                    });
                    return networkResponse;
                });
            })
            .catch(() => {
                // فقط وقتی fetch شکست خورد (یعنی آفلاین بودیم)، صفحه آفلاین را بده
                return caches.match(OFFLINE_URL);
            })
    );
});

// جلوگیری از نمایش خودکار prompt نصب PWA
self.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    self.deferredPrompt = event;
});
