const CACHE_NAME = 'open-quacks-v19';

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
    './lang/pt.json'
];

// Install Event: Pre-cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache, adding assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker
    );
});

// Activate Event: Clean up old caches if the version name changes
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});


// Fetch Event: Serve from cache first, fall back to network, and dynamically cache new things (like other languages)
self.addEventListener('fetch', event => {
    // Only intercept requests for our own origin
    if (!event.request.url.startsWith(self.location.origin)) return;

    // Handle range requests for Safari video playback (explosion.mov / bubbling.mp4)
    if (event.request.headers.has('range')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // 1. Return the cached file if we have it (Offline support)
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Otherwise, fetch it from the network
            return fetch(event.request).then(networkResponse => {
                // Ensure the response is valid before caching it
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // 3. Clone the response and dynamically add it to the cache (e.g., if they pick Spanish, cache es.json)
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(error => {
                console.warn('Fetch failed, and asset is not in cache:', event.request.url, error);
                // Graceful fallback could go here if needed
            });
        })
    );
});

