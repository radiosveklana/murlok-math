// облачная копия: сохраняем прогресс, «новое устройство» восстанавливает по коду
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const URL = process.env.URL || 'http://localhost:8765/';
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const errs = [];
  const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тестик', xp: 4321, candies: 77, seenVersion: APP_VERSION, rankV: 2, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); await sleep(1500);
  const code = await p.evaluate(async () => { cloudDirty = true; cloudPush(); await new Promise(r => setTimeout(r, 2500)); return cloudCode(); });
  const ctx = await b.createBrowserContext(); const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.goto(URL); await q.waitForSelector('#restore'); await q.click('#restore'); await q.waitForSelector('#rcode'); await q.type('#rcode', code); await q.click('#rgo');
  await sleep(3000); const st = await q.evaluate(() => ({ kid: S.kid, xp: S.xp, candies: S.candies }));
  console.log(st.kid === 'Тестик' && st.xp === 4321 && st.candies === 77 ? 'CLOUD OK' : 'CLOUD FAIL ' + JSON.stringify(st), 'errs:', errs.join(' | ') || 'none');
  await b.close();
})();
