// node follow.js — column multiplication: after mount and after the target moves down, is the target visible between topbar and the sticky panel?
const puppeteer = require('C:/Users/izzye/projects/murlok-math/tools/e2e/node_modules/puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [W, H] of [[320, 568], [360, 740], [412, 915], [768, 1024], [1024, 768]]) for (const sc of ['practice:mul', 'casetask-mul']) {
    const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: W < 900, hasTouch: true });
    p.on('console', m => { if (m.type() === 'warning' && !/vibrate/.test(m.text())) console.log('  WARN', m.text().slice(0, 200)); }); p.on('pageerror', e => console.log('  ERR', e.message));
    await p.goto('http://localhost:8779/'); await p.waitForFunction(() => typeof fresh === 'function');
    await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'М', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, cases: 14, login: { last: today(), day: 1 }, prefs: Object.assign(fresh().prefs || {}, { mulLv: 4 }), st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } } }))); });
    await p.goto('http://localhost:8779/'); await sleep(700); await p.addStyleTag({ content: '#app > * { animation: none !important; }' });
    await p.evaluate(sc => { document.querySelectorAll('.modal').forEach(m => m.remove()); if (sc === 'casetask-mul') { startCase('mul', 2); CASE.tasks[0] = makeTask('mul', 3); return go('casetask'); } const [n, a] = sc.split(':'); go(n, a); }, sc);
    await sleep(1800);
    const vis = () => p.evaluate(() => {
      const t = document.querySelector('.cell.target'), cc = document.querySelector('.ctrl-col'), top = document.querySelector('#app > .top');
      const tr = t.getBoundingClientRect(), cr = cc.getBoundingClientRect(), hr = top.getBoundingClientRect();
      const overlapX = cr.left < tr.right && cr.right > tr.left;
      const lim = overlapX && cr.bottom >= innerHeight - 20 ? cr.top : innerHeight;
      const keys = [...cc.querySelectorAll('.pad .k')]; const kb = keys.length ? Math.max(...keys.map(k => k.getBoundingClientRect().bottom)) : 0;
      return { ok: tr.top >= hr.bottom - 2 && tr.bottom <= lim + 2 && kb <= innerHeight + 16, t: [Math.round(tr.top), Math.round(tr.bottom)], panelTop: Math.round(lim), keysBottom: Math.round(kb), sy: Math.round(scrollY) };
    });
    const a = await vis();
    // move the target to the lowest row (as happens when the child reaches the sum row)
    await p.evaluate(() => { const cells = [...document.querySelectorAll('.mgrid .cell')]; const t = document.querySelector('.cell.target'); t.classList.remove('target'); const last = cells[cells.length - 2]; const n = last.cloneNode(true); n.classList.add('target'); last.replaceWith(n); });
    await sleep(900);
    const c = await vis();
    await p.screenshot({ path: `shots/follow-${W}x${H}-${sc.replace(':', '_')}.png` });
    console.log(`${W}x${H} ${sc.padEnd(13)} mount:${a.ok ? 'OK ' : 'BAD'} ${JSON.stringify(a)}  lastRow:${c.ok ? 'OK ' : 'BAD'} ${JSON.stringify(c)}`);
    await p.close();
  }
  await b.close();
})();
