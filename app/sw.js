const CACHE_NAME = 'mint-app-v1';
const APP_SHELL = [
  '/app/',
  '/app/index.html',
  '/app/manifest.json',
  '/app/icon-192.png',
  '/app/icon-512.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.hostname === 'api.bayouwebstudio.com') {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ reply: "You appear to be offline. Please check your connection and try again." }),
          { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Cache-first for app shell
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(res => {
        if (res.ok && APP_SHELL.includes(url.pathname)) {
          caches.open(CACHE_NAME).then(c => c.put(event.request, res.clone()));
        }
        return res;
      });
    })
  );
});
