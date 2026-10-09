/* офлайн-кэш: сначала сеть, при отсутствии интернета — кэш */
const CACHE = 'murlok-v19';
const FILES = ['./', 'index.html', 'style.css?v=19', 'engine.js?v=19', 'lines.js?v=19', 'cat.js?v=19', 'sounds.js?v=19', 'app.js?v=19', 'house.js?v=19', 'chat.js?v=19', 'studio.js?v=19', 'chibi.js?v=19', 'games.js?v=19', 'academy.js?v=19', 'content/space.js?v=19', 'content/safety.js?v=19', 'content/teen.js?v=19', 'content/think.js?v=19', 'content/extra/read-texts.js?v=19', 'content/read.js?v=19', 'content/talk.js?v=19', 'content/world.js?v=19', 'content/body.js?v=19', 'content/health.js?v=19', 'acad-games.js?v=19', 'column.js?v=19', 'salon.js?v=19', 'fitting.js?v=19', 'photo.js?v=19', 'friends.js?v=19', 'extras.js?v=19', 'wardrobe.js?v=19', 'diplomas.js?v=19', 'coach.js?v=19', 'icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request, /\.(mp3)$/.test(new URL(e.request.url).pathname) ? {} : { cache: 'no-cache' }).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {}); return r; }).catch(() => caches.match(e.request, { ignoreSearch: false }).then(r => r || caches.match('index.html'))));
});
