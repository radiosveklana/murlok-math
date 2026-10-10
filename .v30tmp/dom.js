// node dom.js W H screens [depth] — dump class tree with rects
const puppeteer = require('C:/Users/izzye/projects/murlok-math/tools/e2e/node_modules/puppeteer-core');
const W = +process.argv[2], H = +process.argv[3], LIST = process.argv[4].split(','), DEPTH = +(process.argv[5] || 6);
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8779/'); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, candies: 1234, gems: 12, cases: 14, login: { last: today(), day: 1 }, houseV: 2, st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } } }))); });
  for (const sc of LIST) {
    await p.goto('http://localhost:8779/'); await sleep(600);
    await p.evaluate(sc => {
      document.querySelectorAll('.modal,.toast').forEach(m => m.remove());
      if (sc.startsWith('casetask-')) { const k = sc.slice(9); startCase('mix', 2); CASE.tasks[0] = makeTask(k === 'bug' ? 'bugmul' : k, k === 'interro' ? 'mul' : 3); return go('casetask'); }
      if (sc === 'casetask') { startCase('mix', 2); return go('casetask'); }
      if (sc === 'caseintro') return startCase('mix', 2);
      if (sc === 'blitzrun') { go('blitz'); return document.getElementById('go').click(); }
      const [n, ...a] = sc.split(':'); go(n, a.length ? a.join(':') : undefined);
    }, sc);
    await sleep(1500);
    const t = await p.evaluate((D) => {
      const out = [];
      const walk = (e, d) => {
        if (d > D) return; const r = e.getBoundingClientRect(); const c = typeof e.className === 'string' ? e.className : ''; const pos = getComputedStyle(e).position;
        out.push('  '.repeat(d) + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (c ? '.' + c.trim().split(/\s+/).join('.') : '') + ` ${Math.round(r.top)}..${Math.round(r.bottom)} w${Math.round(r.width)} ${pos !== 'static' ? pos : ''}`);
        if (e.tagName === 'svg' || e.tagName === 'BUTTON' || e.tagName === 'IMG') return; [...e.children].slice(0, 14).forEach(k => walk(k, d + 1));
      };
      walk(document.getElementById('app'), 0); return out.join('\n');
    }, DEPTH);
    console.log('##### ' + sc + '\n' + t);
  }
  await b.close();
})();
