const puppeteer = require('C:/Users/izzye/projects/murlok-math/tools/e2e/node_modules/puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  for (const [W, H] of [[360, 740], [412, 915]]) for (const sc of ['practice:mul', 'casetask-mul']) {
    const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: true, hasTouch: true });
    await p.goto('http://localhost:8779/'); await p.waitForFunction(() => typeof fresh === 'function');
    await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'М', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, cases: 14, login: { last: today(), day: 1 }, st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } } }))); });
    await p.goto('http://localhost:8779/'); await sleep(700);
    await p.evaluate(sc => { document.querySelectorAll('.modal').forEach(m => m.remove()); if (sc === 'casetask-mul') { startCase('mul', 2); CASE.tasks[0] = makeTask('mul', 3); return go('casetask'); } const [n, a] = sc.split(':'); go(n, a); }, sc);
    await sleep(3500);
    await p.evaluate(() => document.querySelectorAll('.modal,.cheer').forEach(m => m.remove()));
    const res = await p.evaluate(async () => {
      const t = document.querySelector('.cell.target') || document.querySelector('.eql.last') || document.querySelector('.bug-row, .brow, .eql');
      const cc = document.querySelector('.ctrl-col'); const top = document.querySelector('.top');
      const max = document.scrollingElement.scrollHeight - innerHeight; const ok = [];
      for (let y = 0; y <= max; y += 10) { scrollTo(0, y); await new Promise(r => requestAnimationFrame(r)); const tr = t.getBoundingClientRect(), cr = cc.getBoundingClientRect(), hr = top.getBoundingClientRect(); const keys = [...cc.querySelectorAll('.pad .k, .opts button')]; const kb = keys.length ? Math.max(...keys.map(k => k.getBoundingClientRect().bottom)) : cr.bottom; if (tr.top >= hr.bottom - 2 && tr.bottom <= cr.top + 2 && kb <= innerHeight + 1) ok.push(y); }
      scrollTo(0, 0); await new Promise(r => requestAnimationFrame(r));
      const tr = t.getBoundingClientRect(), cr = cc.getBoundingClientRect();
      return { target: t.className, at0: [Math.round(tr.top), Math.round(tr.bottom)], ccTop: Math.round(cr.top), ccH: Math.round(cr.height), max, okScroll: ok.length ? ok[0] + '..' + ok[ok.length - 1] : 'НИКОГДА' };
    });
    console.log(W + 'x' + H, sc.padEnd(14), JSON.stringify(res));
    await p.close();
  }
  await b.close();
})();
