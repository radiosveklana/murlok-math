// Проверка анимаций лендинга (site-anim.js/css): скриншоты 390×844 и 1440×900, без JS, reduced-motion, редиректы.
// node tools/e2e/site-anim.js [порт] [папка для png]   (нужен node tools/e2e/serve.js <порт>)
const puppeteer = require('puppeteer-core'), path = require('path'), fs = require('fs');
const PORT = process.argv[2] || 8765, OUT = process.argv[3] || path.join(require('os').tmpdir(), 'site-anim'), BASE = `http://localhost:${PORT}/`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
let bad = 0; const ok = (name, cond) => { console.log((cond ? 'ok   ' : 'FAIL ') + name); if (!cond) bad++; };
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const errs = [];
  for (const [name, vp] of [['m', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['d', { width: 1440, height: 900 }]]) {
    const p = await b.newPage(); await p.setBypassServiceWorker(true); await p.setViewport(vp);
    p.on('pageerror', e => errs.push(name + ': ' + e.message)); p.on('console', m => m.type() === 'error' && !/404/.test(m.text()) && errs.push(name + ' console: ' + m.text()));
    await p.goto(BASE + '?site=1'); await sleep(2800);
    await p.screenshot({ path: path.join(OUT, name + '-hero.png') });
    const info = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, cat: !!document.querySelector('.stage .mk-cat svg .mk-pupil'), fcat: !!document.querySelector('.final .mk-cat'), fx: document.querySelectorAll('.mk-p').length, video: document.getElementById('video').hidden }));
    console.log(name, JSON.stringify(info));
    ok(name + ': живой котик в hero', info.cat); ok(name + ': котик в финале', info.fcat); ok(name + ': без горизонтального скролла', info.sw <= info.iw);
    ok(name + ': частиц на телефоне меньше', name === 'm' ? info.fx <= 5 : info.fx >= 8);
    ok(name + ': видео без файла скрыто', info.video === !fs.existsSync(path.join(__dirname, '../../video/overview.mp4')));
    await p.click('.stage .mk-cat'); await sleep(350); await p.screenshot({ path: path.join(OUT, name + '-tap.png') });
    const sels = ['#kids .feat:nth-child(2)', '#kids .feat:nth-child(3)', '.stats', '#parents .mk-rep', '.report .mk-col', '#start', '.final'];
    for (const [k, s] of sels.entries()) {
      await p.evaluate(s => { const n = document.querySelector(s); if (n) { const r = n.getBoundingClientRect(); scrollTo({ top: scrollY + r.top - 90, behavior: 'instant' }); } }, s);
      await sleep(s === '.report .mk-col' ? 5000 : 3200);
      await p.screenshot({ path: path.join(OUT, `${name}-${k + 1}.png`) });
    }
    const after = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, stats: [...document.querySelectorAll('.stat b')].map(b => b.textContent).join(' '), acc: (document.querySelector('.mk-acc b') || {}).textContent }));
    ok(name + ': числа досчитались до реальных', after.stats === '13 175 3900+ 750+'); ok(name + ': точность 87%', after.acc === '87%');
    ok(name + ': без горизонтального скролла после прокрутки', after.sw <= after.iw);
    await p.close();
  }
  // без JS контент виден сразу
  const p = await b.newPage(); await p.setJavaScriptEnabled(false); await p.setViewport({ width: 390, height: 844 });
  await p.goto(BASE + '?site=1'); await sleep(600);
  ok('без JS: всё видно', await p.evaluate(() => [...document.querySelectorAll('.hero h1, .hero .lead, .rv, .stat')].every(n => getComputedStyle(n).opacity === '1')));
  await p.screenshot({ path: path.join(OUT, 'nojs-hero.png') });
  // reduced motion
  const q = await b.newPage(); await q.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await q.setViewport({ width: 390, height: 844 });
  q.on('pageerror', e => errs.push('rm: ' + e.message));
  await q.goto(BASE + '?site=1'); await sleep(1200);
  const rm = await q.evaluate(() => ({ fx: document.querySelectorAll('.mk-p').length, h1: getComputedStyle(document.querySelector('.hero h1')).opacity, w: document.querySelectorAll('.mk-w').length, stats: [...document.querySelectorAll('.stat b')].map(b => b.textContent).join(' ') }));
  ok('reduced-motion: без частиц и разбивки, числа сразу', rm.fx === 0 && rm.h1 === '1' && rm.w === 0 && rm.stats === '13 175 3900+ 750+');
  // редирект вернувшегося игрока и ?site=1
  const r = await b.newPage(); await r.goto(BASE + '?site=1'); await r.evaluate(() => localStorage.setItem('murlok-detective-v1', '{}'));
  await r.goto(BASE); await sleep(800); ok('вернувшийся игрок → app/', /\/app\/$/.test(r.url()));
  await r.goto(BASE + '?site=1'); await sleep(400); ok('?site=1 показывает сайт', /\?site=1$/.test(r.url()));
  ok('нет ошибок JS', !errs.length); if (errs.length) console.log(errs.join('\n'));
  await b.close(); console.log(bad ? `FAILED ${bad}` : 'ALL OK', '→', OUT); process.exit(bad ? 1 : 0);
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
