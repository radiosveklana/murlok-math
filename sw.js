/* офлайн-кэш: сначала сеть, при отсутствии интернета — кэш */
const CACHE = 'murlok-v15';
const FILES = ['./', 'index.html', 'style.css?v=15', 'engine.js?v=15', 'lines.js?v=15', 'cat.js?v=15', 'sounds.js?v=15', 'app.js?v=15', 'house.js?v=15', 'chat.js?v=15', 'studio.js?v=15', 'chibi.js?v=15', 'games.js?v=15', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, /\.(mp3)$/.test(new URL(e.request.url).pathname) ? {} : { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
