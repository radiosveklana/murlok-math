const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('PAGEERR ' + e.message)); p.on('console', m => console.log('CONSOLE', m.type(), m.text().slice(0, 200)));
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('murlok-tour-e2e', '1'); } catch (e) { } });
  await p.goto('http://localhost:8782/'); await p.waitForSelector('#kid');
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, tourDone: 1, tourInit: 1, tours: {}, login: { last: today(), day: 1 } }))));
  await p.goto('http://localhost:8782/'); await sleep(1500);
  const rate = () => p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else r(n + ' fps, hidden=' + document.hidden + ' vis=' + document.visibilityState); }; requestAnimationFrame(f); setTimeout(() => r('timeout n=' + n), 3000); }));
  console.log('home', await rate()); await p.evaluate(() => go('school')); await sleep(300); console.log('school', await rate()); await p.evaluate(() => go('home')); await p.evaluate(() => go('newcase')); await sleep(300); console.log('newcase', await rate());
  for (let k = 0; k < 20; k++) { await sleep(400); console.log(await p.evaluate(() => { const b = document.querySelector('.tour-bub'), c = document.querySelector('.tour-cat'); return [curScreen, Tour.step, b && b.className, c && c.style.transform, document.querySelector('.tb-title') && document.querySelector('.tb-title').textContent, scrollY].join(' | '); })); }
  await b.close();
})();
