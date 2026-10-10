// node probe.js W H screen "js expression returning value"
const puppeteer = require('C:/Users/izzye/projects/murlok-math/tools/e2e/node_modules/puppeteer-core');
const [W, H, sc, expr, shot] = [+process.argv[2], +process.argv[3], process.argv[4], process.argv[5], process.argv[6]];
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: W, height: H, isMobile: !process.env.NOMOB, hasTouch: true, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.log('PAGEERROR', e.message)); p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto('http://localhost:8779/'); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, candies: 1234, gems: 12, cases: 14, login: { last: today(), day: 1 }, houseV: 2, badges: ['first', 'case5'], st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } }, roomsSeen: ['kitchen', 'living', 'bedroom', 'play', 'bath'], care: { food: 90, water: 90, fun: 90, energy: 90, clean: 90, t: Date.now() } }))); });
  await p.goto('http://localhost:8779/'); await sleep(600);
  await p.evaluate(sc => {
    document.querySelectorAll('.modal,.toast').forEach(m => m.remove());
    if (sc.startsWith('casetask-')) { const k = sc.slice(9); startCase('mix', 2); CASE.tasks[0] = makeTask(k === 'bug' ? 'bugmul' : k, k === 'interro' ? 'mul' : 3); return go('casetask'); }
    if (sc === 'casetask') { startCase('mix', 2); return go('casetask'); }
    if (sc === 'caseintro') return startCase('mix', 2);
    if (sc === 'blitzrun') { go('blitz'); return document.getElementById('go').click(); }
    const [n, ...a] = sc.split(':'); go(n, a.length ? a.join(':') : undefined);
  }, sc);
  await sleep(2600);
  await p.evaluate(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  if (expr) console.log(JSON.stringify(await p.evaluate(new Function('return (async()=>{' + expr + '})()')), null, 1));
  if (shot) await p.screenshot({ path: shot, fullPage: shot.includes('full') });
  await b.close();
})();
