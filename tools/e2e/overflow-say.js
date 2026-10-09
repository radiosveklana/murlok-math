// Ищет горизонтальную прокрутку на телефоне в момент, когда котик говорит (всплывающие реплики, подсказки, тосты)
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const screens = ['home', 'school', 'newcase', 'games', 'bugs', 'blitz', 'shop', 'house', 'book', 'academy', 'subject:space', 'subject:math4', 'fitting', 'photo', 'friends', 'earn', 'diplomas', 'studio', 'chat', 'parents', 'colwork:div'];
  let bad = 0;
  for (const w of [320, 375, 390]) {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: w, height: 760, isMobile: true, hasTouch: true });
    await p.goto(URL); await p.waitForSelector('#kid');
    await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, login: { last: today(), day: 1 } }))); });
    await p.goto(URL); await sleep(1200);
    for (const sc of screens) {
      const [n, ...a] = sc.split(':');
      await p.evaluate((n, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(n, a || undefined); }, n, a.join(':')); await sleep(700);
      await p.evaluate(() => { say('Мур! Это очень длинная фраза котика, чтобы проверить, помещается ли пузырь на узком экране телефона, {n}!', 6000); toast('<span class="tb">🎉</span><div><b>Проверка всплывающего сообщения</b><br>Длинный текст уведомления для узкого экрана телефона</div>'); floatText('+10 🍬 и ещё немного текста'); hearts(document.querySelector('.mini-cat, .hero-cat, .shop-cat, .room-cat') || document.body, 3); }); await sleep(600);
      const r = await p.evaluate(() => { const W = innerWidth, out = []; if (document.documentElement.scrollWidth > W + 1) document.querySelectorAll('body *').forEach(el => { const rc = el.getBoundingClientRect(); if (rc.width && rc.right > W + 1 && getComputedStyle(el).position !== 'fixed') out.push(`<${el.tagName.toLowerCase()} class="${el.className && el.className.baseVal === undefined ? el.className : ''}" id="${el.id}"> right=${Math.round(rc.right)} ${(el.innerText || '').slice(0, 30).replace(/\n/g, ' ')}`); }); return { sw: document.documentElement.scrollWidth, out: [...new Set(out)].slice(0, 5) }; });
      if (r.out.length || r.sw > w + 1) { bad++; console.log(`${w}px ${sc}: ширина ${r.sw} | ${r.out.join(' | ')}`); }
    }
    await ctx.close();
  }
  console.log(bad ? 'SAYFLOW ' + bad : 'SAYFLOW OK'); await b.close();
})();
