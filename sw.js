const CACHE_NAME = 'estagio-pwa-v1';
const ASSETS_TO_CACHE = [
    './',
    './app.html',
    './prof.html',
    './css/style.css',
    './js/config.js',
    './js/db.js',
    './js/app.js',
    './js/prof.js',
    './manifest.json'
];

// Instalação do SW e cache dos arquivos estáticos
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
});

// Interceptação das requisições (Cache First, Network Fallback)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request);
        })
    );
});