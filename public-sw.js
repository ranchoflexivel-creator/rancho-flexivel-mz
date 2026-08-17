const CACHE = 'rf-public-v4';
const CORE = [
  './', './index.html', './app.js', './data.js',
  './public-enhancements.js', './public-product-images.js',
  './public-combo-cart-restore.js', './public-performance-fix.js',
  './public-cart-ui-fix.js', './public-checkout-fix.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(CORE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // HTML and JavaScript must prefer the network so GitHub Pages updates are
  // visible immediately. Fall back to cache only when the network is down.
  const isCode = /\.(html|js|css)$/i.test(new URL(req.url).pathname) || req.mode === 'navigate';
  if (isCode) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Other same-origin assets: cache first, then network.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
      return res;
    }))
  );
});
