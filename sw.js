/* Macros service worker — app-shell cache.
   Bump CACHE version whenever files change so users get the update. */
const CACHE = 'macros-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never cache the Open Food Facts API — always go to network for fresh data.
  if (url.hostname.includes('openfoodfacts.org')) {
    e.respondWith(fetch(e.request).catch(()=>new Response('{"status":0}',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  // App shell + everything else: cache-first, fall back to network, then cache the result.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => { try{ c.put(e.request, copy); }catch{} });
      return res;
    }).catch(()=>hit))
  );
});
