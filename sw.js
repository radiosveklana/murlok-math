/* офлайн-кэш: сначала сеть, при отсутствии интернета — кэш */
const CACHE = 'murlok-v18';
const FILES = ['./', 'index.html', 'style.css?v=18', 'engine.js?v=18', 'lines.js?v=18', 'cat.js?v=18', 'sounds.js?v=18', 'app.js?v=18', 'house.js?v=18', 'chat.js?v=18', 'studio.js?v=18', 'chibi.js?v=18', 'games.js?v=18', 'academy.js?v=18', 'content/space.js?v=18', 'content/safety.js?v=18', 'content/teen.js?v=18', 'content/think.js?v=18', 'content/read.js?v=18', 'salon.js?v=18', 'fitting.js?v=18', 'photo.js?v=18', 'coach.js?v=18', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, /\.(mp3)$/.test(new URL(e.request.url).pathname) ? {} : { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
