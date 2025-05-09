// Cache name with version
const CACHE_NAME = 'frasevotes-cache-v2';

// Files to cache - expanded list with more assets
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/lovable-uploads/e1d5445a-0979-44b4-87be-0540995d11bf.png', // Logo
  '/lovable-uploads/5435862e-b127-467a-acf3-887926a8e0d5.png', // Onboarding image
  '/lovable-uploads/2e28b657-77e3-45d8-be18-df2303e29f26.png', // Onboarding image
  '/lovable-uploads/82fd17d5-71fa-4488-a841-1fcf61e61713.png', // Onboarding image
  '/lovable-uploads/bb86d0d5-b24e-45ac-a9c4-a6206fb11482.png', // Onboarding image
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Cache and return requests with improved strategy
self.addEventListener('fetch', event => {
  // Check if this is a request for an image
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return cached image first (if available)
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise fetch image and cache it
          return fetch(event.request)
            .then(response => {
              // Don't cache if not successful
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response
              var responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  } else {
    // For non-image requests, use network first, fallback to cache strategy
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});

// Update service worker and clean old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old cache versions
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tell the active service worker to take control of the page immediately
      return self.clients.claim();
    })
  );
});
