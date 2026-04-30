const CACHE_NAME = 'open-quacks-v13';

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
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

// Activate Event: Clean up old caches if the version name changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});

// Fetch Event: Serve from cache if available, otherwise go to the network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return the cached response if we have it
                if (response) {
                    return response;
                }
                
                // Otherwise, make the network request
                return fetch(event.request).catch((error) => {
                    console.log('Network request failed and no cache available', error);
                });
            })
    );
});
