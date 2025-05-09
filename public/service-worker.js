
// Cache name with version
const CACHE_NAME = 'frasevotes-cache-v3';

// Files to cache - expanded list with more essential assets
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
  console.log('Service Worker installing...');
  // Skip waiting to make new service worker activate immediately
  self.skipWaiting();
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests with network-first strategy for HTML and CSS
// and cache-first strategy for images and other assets
self.addEventListener('fetch', event => {
  // Parse the URL to determine the appropriate caching strategy
  const url = new URL(event.request.url);
  const isHTMLRequest = event.request.destination === 'document' || url.pathname.endsWith('.html');
  const isCSSRequest = event.request.destination === 'style' || url.pathname.endsWith('.css');
  const isJSRequest = event.request.destination === 'script' || url.pathname.endsWith('.js');

  // For HTML, CSS, and JS files, use a network-first approach
  if (isHTMLRequest || isCSSRequest || isJSRequest) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Update cache with fresh content
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
  } 
  // For images and other assets, use a cache-first approach
  else if (event.request.destination === 'image' || event.request.destination === 'font') {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          // Return cached asset first if available
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Otherwise fetch image and cache it
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Clone the response
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            });
        })
    );
  }
  // For all other requests, simply fetch from network and fall back to cache
  else {
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
  console.log('Service Worker activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete old cache versions
            console.log('Deleting outdated cache:', cacheName);
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
