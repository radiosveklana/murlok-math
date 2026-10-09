// Скриншоты всех экранов на телефоне — для визуальной проверки вёрстки: node shots-all.js [ширина]
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const W = +process.argv[2] || 375;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: W, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 38000, candies: 1234, gems: 25, cases: 14, login: { last: today(), day: 1 }, owned: ['deer', 'loupe', 'crown', 'cape'], furs: ['galaxy'], fur: 'galaxy', st: { mul: { done: 400, perfect: 300 }, eq: { done: 120, perfect: 90 }, bug: { done: 30, perfect: 20 }, blitz: { games: 5, best: 22 } } }))); });
  await p.goto(URL); await sleep(1500);
  await p.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); for (let i = 0; i < 12; i++) Coach.track('mul2', 1); for (let i = 0; i < 5; i++) Coach.track('eq2', 0.3); S.coach.date = ''; save(); });
  const list = (process.argv[3] || 'home,school,newcase,games,bugs,blitz,shop,house,book,parents,academy,subject:math4,aquiz:math4:motion,colwork:div,colwork:add:-,fitting,photo,friends,earn,diplomas,ideas,subject:read,rtext,practice2,solar').split(',');
  for (const sc of list) {
    const [n, ...a] = sc.split(':'); await p.evaluate((n, a) => { document.querySelectorAll('.modal,.toast').forEach(m => m.remove()); go(n, a || undefined); }, n, a.join(':')); await sleep(1100);
    await p.evaluate(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
    await p.screenshot({ path: `${__dirname}/shots/m-${W}-${sc.replace(/[:]/g, '_')}.png`, fullPage: true });
  }
  await b.close(); console.log('done', list.length);
})();
