// Скриншоты обновлённого интерфейса для сайта about/: node tools/e2e/site-shots.js  → about/shots/*.webp, cat.svg, og.jpg
const puppeteer = require('puppeteer-core'), fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://localhost:8765/', OUT = path.join(__dirname, '../../about/shots');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setBypassServiceWorker(true);
  const phone = () => p.setViewport({ width: 390, height: 820, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const wide = () => p.setViewport({ width: 1100, height: 700, deviceScaleFactor: 1.5 });
  await phone(); await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => {
    const s = Object.assign(fresh(), { name: 'Мурлок', kid: 'Кэтика', seenVersion: APP_VERSION, rankV: 2, xp: 6400, candies: 860, gems: 14, cases: 23, fur: 'ginger', wear: { head: 'deer', hand: 'loupe', neck: 'scarf' }, lessons: { mul: 1, eq: 1 }, login: { last: new Date().toISOString().slice(0, 10), day: 1 } });
    const d = new Date(); s.days = {}; for (let i = 0; i < 9; i++) { const k = new Date(d - i * 864e5).toISOString().slice(0, 10); s.days[k] = 6 + (i * 3) % 9; s.time = s.time || {}; s.time[k] = { school: 600 + i * 90, academy: 420 + (i % 3) * 200, game: 300 }; }
    localStorage.setItem('murlok-detective-v1', JSON.stringify(s));
  });
  await p.goto(URL); await sleep(1800);
  const E = (f, ...a) => p.evaluate(f, ...a);
  await E(() => { for (let i = 0; i < 14; i++) Coach.track('mul3', 1); for (let i = 0; i < 6; i++) Coach.track('eq2', 0.4); for (let i = 0; i < 8; i++) Coach.track('div', 0.9); S.coach.date = ''; save(); });
  const clean = () => E(() => { const ms = document.getElementById('mascot'); if (ms) ms.style.display = 'none'; document.querySelectorAll('.modal,.toast,.confetti,.ms-bubble,.hero-say').forEach(m => m.remove ? (m.classList.contains('ms-bubble') || m.classList.contains('hero-say') ? (m.hidden = true) : m.remove()) : 0); window.scrollTo(0, 0); });
  const shot = async (name, el) => { await clean(); await sleep(300); await clean(); const o = { path: path.join(OUT, name + '.webp'), type: 'webp', quality: 82 }; if (el) await (await p.$(el)).screenshot(o); else await p.screenshot(o); console.log('ok', name); };
  const go = async (s, a, wait = 1600) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(wait); };

  await go('home', undefined, 2200); await shot('home');
  await go('alesson', 'world:amazing_animals', 2200); await shot('lesson');
  await go('subject', 'space'); await shot('subject');
  await go('parents', undefined, 1800); await shot('parents');
  await wide();
  await E(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); startCase('mix', 2); }); await sleep(2200);
  await E(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); if (curScreen === 'caseintro') { const g = document.querySelector('#app .btn.pink'); if (g) g.click(); } }); await sleep(1800); await shot('case');
  await go('house', undefined, 2200); await shot('house');
  await go('starmap', undefined, 3500); await shot('sky', '.page.starmap canvas') .catch(async () => shot('sky'));
  fs.writeFileSync(path.join(OUT, 'cat.svg'), await E(() => catSVG({ fur: 'ginger', wear: { head: 'deer', hand: 'loupe', neck: 'scarf' }, smile: true }).replace('<svg ', '<svg width="420" height="496" ')));
  // карточка для соцсетей — первый экран сайта
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 }); await p.goto(URL.replace(/\/?$/, '/') + 'about/'); await sleep(2500);
  await p.screenshot({ path: path.join(OUT, 'og.jpg'), type: 'jpeg', quality: 82 }); console.log('ok og');
  await b.close();
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
