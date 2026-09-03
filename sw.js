const CACHE_NAME = 'open-quacks-v22';

// List of all files necessary to run the game offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './assets/icon.png',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/achievements.png',
    './assets/cauldron_board.png',
    './assets/tokens.png',
    './assets/utils.png',
    './assets/characters.png',
    './assets/utils_exp.png',
    './assets/explosion.mov',
    './assets/cauldron_bubble2.mp4',
    './assets/spiral_demo.png',
    './lang/en.json',
    './lang/es.json',
    './lang/he.json',
    './lang/ar.json',
    './lang/fa.json',
    './lang/pl.json',
    './lang/de.json',
    './lang/uk.json',
    './lang/el.json',
    './lang/ga.json',
    './lang/ja.json',
    './lang/pt.json',
    './lang/zh.json',
    './lang/hi.json',
    './lang/am.json',
    './lang/tr.json'
];

// Helper to handle Range Requests for cached audio/video on iOS Safari and Chromium
async function handleRangeRequest(request, cachedResponse) {
    const rangeHeader = request.headers.get('range');
    if (!rangeHeader) {
        return cachedResponse;
    }

    const arrayBuffer = await cachedResponse.arrayBuffer();
    const totalLength = arrayBuffer.byteLength;

    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

    if (isNaN(start) || start >= totalLength || (parts[1] && end >= totalLength)) {
        return new Response(null, {
            status: 416,
            statusText: 'Range Not Satisfiable',
            headers: { 'Content-Range': `bytes */${totalLength}` }
        });
    }

    const slicedBuffer = arrayBuffer.slice(start, end + 1);
    const headers = new Headers(cachedResponse.headers);
    headers.set('Content-Range', `bytes ${start}-${end}/${totalLength}`);
    headers.set('Content-Length', `${slicedBuffer.byteLength}`);
    headers.set('Accept-Ranges', 'bytes');

    return new Response(slicedBuffer, {
        status: 206,
        statusText: 'Partial Content',
        headers: headers
    });
}

// Install Event: Pre-cache all assets resiliently
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('[SW] Caching assets for offline use...');
            // Fetch assets individually so one failure does not abort the entire install
            const cachePromises = ASSETS_TO_CACHE.map(async (url) => {
                try {
                    const response = await fetch(url, { cache: 'reload' });
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                } catch (err) {
                    console.warn(`[SW] Failed to cache asset during install: ${url}`, err);
                }
            });
            await Promise.allSettled(cachePromises);
            console.log('[SW] Asset caching finished.');
        })
    );
    self.skipWaiting();
});

// Activate Event: Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: Offline-first with Range request & query param support
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const isRangeRequest = request.headers.has('range');

    // Handle HTML Navigation requests (support ?source=pwa, ?lang=..., ?help=1 offline)
    if (request.mode === 'navigate') {
        event.respondWith(
            caches.match(request, { ignoreSearch: true }).then((cached) => {
                if (cached) return cached;
                return caches.match('./index.html').then((fallback) => {
                    if (fallback) return fallback;
                    return fetch(request);
                });
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(request, { ignoreSearch: true }).then(async (cachedResponse) => {
            if (cachedResponse) {
                // Synthesize HTTP 206 Partial Content response if Range header is present
                if (isRangeRequest) {
                    return handleRangeRequest(request, cachedResponse);
                }
                return cachedResponse;
            }

            // Otherwise, make network request
            try {
                const networkResponse = await fetch(request);
                return networkResponse;
            } catch (error) {
                // If it's an image or media that failed offline, we return undefined
                console.log('[SW] Network request failed:', request.url);
                throw error;
            }
        })
    );
});

