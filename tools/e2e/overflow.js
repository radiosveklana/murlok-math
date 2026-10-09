// Ищет на телефонах элементы, которые вылезают за экран или обрезают текст
const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const URL = process.env.URL || 'http://localhost:8765/';
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const screens = ['home', 'school', 'newcase', 'practice:mul', 'practice:eq', 'games', 'game:scales', 'game:interro', 'game:color', 'game:safe', 'game:logic', 'game:memo', 'game:chase', 'game:pattern', 'game:estimate', 'bugs', 'blitz', 'shop', 'house:bedroom', 'book', 'parents', 'chat', 'studio', 'lesson:mul', 'lesson:eq'];
  let bad = 0;
  for (const w of [320, 375, 390, 414]) {
    const ctx = await b.createBrowserContext(); const p = await ctx.newPage(); await p.setViewport({ width: w, height: 760, isMobile: true, hasTouch: true });
    await p.goto(URL); await p.waitForSelector('#kid');
    await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик-Пушистик', kid: 'Александра', seenVersion: APP_VERSION, rankV: 2, xp: 2500, candies: 1234, gems: 12, login: { last: today(), day: 1 }, houseV: 2, st: { mul: { done: 40, perfect: 0 }, eq: { done: 12, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } }, roomsSeen: ['kitchen', 'living', 'bedroom', 'play', 'bath'], care: { food: 90, water: 90, fun: 90, energy: 90, clean: 90, t: Date.now() } }))); });
    for (const sc of screens) {
      await p.goto(URL); await sleep(700);
      const [n, a] = sc.split(':'); await p.evaluate((n, a) => go(n, a), n, a); await sleep(700);
      const r = await p.evaluate(() => {
        const W = innerWidth, out = [];
        document.querySelectorAll('#app *').forEach(el => {
          const st = getComputedStyle(el); if (st.display === 'none' || st.visibility === 'hidden' || st.position === 'fixed') return;
          if (el.closest('.mgrid, .room, .scene, .track, .cgrid, svg, .chat-log, .room-tabs, .sc-tape')) return;
          const rc = el.getBoundingClientRect(); if (!rc.width) return;
          const txt = (el.innerText || '').trim().slice(0, 40);
          if (rc.right > W + 1 || rc.left < -1) out.push(`за экраном: <${el.tagName.toLowerCase()} class="${el.className}"> ${txt}`);
          else if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && st.overflow !== 'visible' && txt) out.push(`обрезан: <${el.tagName.toLowerCase()} class="${el.className}"> ${txt}`);
        });
        return [...new Set(out)].slice(0, 6);
      });
      if (r.length) { bad++; console.log(`${w}px ${sc}:`, r.join(' | ')); }
    }
    // всплывающие окна
    const MODALS = { settings: () => openSettings(), music: () => openMusic(), login: () => { S.login = { last: '', day: 6 }; checkLogin(); }, chest: () => openChest('👑', 'Королевский сундук', 'Александра, сегодня решено 20 задач!', 15, true, null), news: () => { S.seenVersion = '1'; S.cases = 1; checkNews(); }, interro: () => { startCase('mix', 1); setTimeout(() => interrogate(0), 300); }, music2: () => openMusic() };
    for (const [n, f] of Object.entries(MODALS)) {
      await p.goto(URL); await sleep(900); await p.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
      await p.evaluate(f); await sleep(900);
      const r = await p.evaluate(() => { const W = innerWidth, out = []; document.querySelectorAll('.modal *').forEach(el => { const rc = el.getBoundingClientRect(); if (rc.width && (rc.right > W + 1 || rc.left < -1)) out.push(`<${el.tagName.toLowerCase()} class="${el.className}"> ${(el.innerText || '').trim().slice(0, 30)}`); }); return [...new Set(out)].slice(0, 5); });
      if (r.length) { bad++; console.log(`${w}px окно ${n}:`, r.join(' | ')); }
    }
    await ctx.close();
  }
  console.log(bad ? `OVERFLOW ${bad}` : 'OVERFLOW OK');
  await b.close();
})();
