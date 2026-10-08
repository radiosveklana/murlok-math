/* офлайн-кэш: сначала сеть, при отсутствии интернета — кэш */
const CACHE = 'murlok-v14';
const FILES = ['./', 'index.html', 'style.css?v=14', 'engine.js?v=14', 'lines.js?v=14', 'cat.js?v=14', 'sounds.js?v=14', 'app.js?v=14', 'house.js?v=14', 'chat.js?v=14', 'studio.js?v=14', 'chibi.js?v=14', 'games.js?v=14', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, /\.(mp3)$/.test(new URL(e.request.url).pathname) ? {} : { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
