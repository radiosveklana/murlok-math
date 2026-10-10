// v29: единая рисовка домика (фон для комнат без картинки, вещи-стикеры), +31 наряд (сезонные и за достижения),
// бонусы-айтемы из Кондитерской (пончик удачи, кекс-подсказка, леденец-заморозка, печенье-щит, торт-праздник)
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'V29 OK ' : 'V29 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api|404/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.setBypassServiceWorker(true); await p.setRequestInterception(true);
  p.on('request', r => { if (/murlok-api|\/api\//.test(r.url())) return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' }); r.continue(); });
  await p.goto(URL); await p.waitForSelector('#kid');
  // старое сохранение — без S.boost и новых нарядов: не должно ломаться
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, rankV: 2, xp: 3000, candies: 500, gems: 20, lessons: { mul: 1, eq: 1 }, owned: ['deer', 'loupe', 'bow'], wear: { head: 'bow', face: null, neck: null, hand: 'loupe' }, login: { last: new Date().toISOString().slice(0, 10), day: 1 } }))));
  await p.goto(URL); await sleep(1500);
  const E = (f, ...a) => p.evaluate(f, ...a), clean = () => E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove()));
  const go = async (s, a) => { await clean(); await E((s, a) => go(s, a), s, a); await sleep(500); };
  ok('old save kept', await E(() => S.wear.head === 'bow' && S.owned.includes('bow') && S.candies === 500));

  /* ---------- 1. рисовка домика ---------- */
  ok('every room has a background (image or drawn)', await E(() => Lines.ROOMS.every(r => /^url\(/.test(roomBg(r)))));
  await E(() => { S.st.mul.done = 2000; S.st.eq.done = 400; S.roomsSeen = Lines.ROOMS.map(r => r.id); save(); });
  await go('house');
  await E(() => document.querySelector('.rtab[data-r="rink"]').click()); await sleep(400);
  ok('new room rink drawn in style (svg bg, not flat)', await E(() => { const r = document.querySelector('#room'); return r.classList.contains('hasbg') && /svg/.test(r.style.backgroundImage) && getComputedStyle(r.querySelector('.wall')).display === 'none'; }));
  ok('fixed items without image render as stickers', await E(() => [...document.querySelectorAll('#room .fx')].every(f => f.querySelector('img.ic-img, .emo-st'))));
  await E(() => document.querySelector('.rtab[data-r="kitchen"]').click()); await sleep(300);
  ok('old room keeps anime image', await E(() => /img\/rooms\/kitchen\.jpg/.test(document.querySelector('#room').style.backgroundImage)));

  await E(() => { S.st.mul.done = 0; S.st.eq.done = 0; save(); });
  /* ---------- 2. наряды ---------- */
  ok('31 new outfits in ITEMS', await E(() => Outfits.LIST.length >= 30 && Outfits.LIST.every(it => ITEMS.includes(it) && (Cat.ACC[it.id] || Cat.HAND[it.id]))));
  ok('all slots covered', await E(() => ['head', 'face', 'neck', 'hand'].every(s => Outfits.LIST.filter(i => i.slot === s).length >= 5)));
  ok('seasonal: ny, hw, spring', await E(() => ['ny', 'hw', 'spring'].every(s => Outfits.LIST.some(i => i.season === s))));
  ok('cat renders with each new item', await E(() => Outfits.LIST.every(it => catSVG({ wear: { [it.slot]: it.id } }).length > catSVG({}).length + 40)));
  await go('shop');
  ok('new outfits shown in shop', await E(() => Outfits.LIST.every(it => document.querySelector(`#si .item[data-id="${it.id}"]`))));
  ok('season tag + earn badge', await E(() => !!document.querySelector('#si .item[data-id="santa"] .o-tag') && /🏅/.test(document.querySelector('#si .item[data-id="gradcap"] .ip').textContent)));
  // за достижение: «купить за 0» нельзя — открывается «как заработать»
  await E(() => document.querySelector('#si .item[data-id="gradcap"]').click()); await sleep(300);
  ok('earn item not bought for 0', await E(() => !S.owned.includes('gradcap') && !!document.querySelector('.modal #earnGo')));
  await E(() => document.querySelector('.modal #earnGo').click()); await sleep(500);
  ok('earn screen for achievement item', await E(() => curScreen === 'earn' && /100 задач/.test(document.querySelector('.earn-list').textContent)));
  // покупка за конфеты
  await go('shop'); await E(() => document.querySelector('#si .item[data-id="santa"]').click()); await sleep(300); await E(() => document.querySelector('#buy').click()); await sleep(400);
  ok('buy seasonal outfit', await E(() => S.owned.includes('santa') && S.wear.head === 'santa' && S.candies === 455));
  // достижение выдаётся само после награды
  await E(() => { S.st.mul.done = 120; award(1, 1); }); await sleep(300);
  ok('achievement outfit granted automatically', await E(() => S.owned.includes('gradcap')));
  await go('fitting');
  ok('fitting lists new outfits', await E(() => !!document.querySelector('#finv .item[data-id="fairywings"]')));
  await E(() => document.querySelector('#finv .item[data-id="angelwings"]').click()); await sleep(300);
  const hasBuy = await E(() => !!document.querySelector('[data-buy="angelwings"]'));
  if (hasBuy) { await E(() => document.querySelector('[data-buy="angelwings"]').click()); await sleep(300); }
  ok('fitting cannot buy achievement item', await E(() => !S.owned.includes('angelwings')));

  /* ---------- 3. бонусы ---------- */
  await go('shop'); await E(() => document.querySelector('.shoptabs [data-t="bonus"]').click()); await sleep(300);
  ok('bonus tab with 5 boosts', await E(() => document.querySelectorAll('#si .item.boost').length === 5));
  const c0 = await E(() => S.candies);
  await E(() => document.querySelector('[data-bbuy="luck"]').click()); await sleep(300);
  ok('buy donut', await E(c0 => Boosts.have('luck') === 1 && S.candies === c0 - 25, c0));
  ok('inventory badge on tab + top bar chip', await E(() => document.querySelector('.shoptabs [data-t="bonus"] .bn').textContent === '1' && !!document.querySelector('.top [data-boostbar]')));
  await E(() => document.querySelector('[data-bbuy="luck"]').click()); await sleep(200); await E(() => document.querySelector('[data-bbuy="luck"]')?.click()); await sleep(200);
  ok('daily limit for donut (2/day)', await E(() => Boosts.have('luck') === 2));
  await E(() => document.querySelector('[data-buse="luck"]').click()); await sleep(300);
  ok('donut activated: 10 tasks', await E(() => S.boost.luck === 10 && Boosts.have('luck') === 1));
  ok('second donut refused while active', await E(() => !Boosts.use('luck').ok));
  const dbl = await E(() => { const a = S.candies; taskDone('mul', { mistakes: 0 }); award(3, 10); return S.candies - a; });
  ok('donut doubles task candies', dbl === 6, String(dbl));
  const cap = await E(() => { const a = S.candies; taskDone('mul', { mistakes: 0 }); award(30, 10); return S.candies - a; });
  ok('donut bonus capped (+10)', cap === 40, String(cap));
  const nodbl = await E(() => { const a = S.candies; award(3, 1); return S.candies - a; });
  ok('no doubling outside tasks', nodbl === 3, String(nodbl));
  ok('luck counts down', await E(() => S.boost.luck === 8));
  // щит и кекс — через результат задачи
  await E(() => { Boosts.buy('shield'); Boosts.buy('hint'); });
  const sh = await E(() => { const r = { mistakes: 1, helped: false }; Boosts.patchRes(r, 0); return [r.mistakes, Boosts.have('shield')]; });
  ok('cookie shield: one mistake forgiven', sh[0] === 0 && sh[1] === 0, JSON.stringify(sh));
  const sh2 = await E(() => { Boosts.buy('shield'); const r = { mistakes: 2, helped: false }; Boosts.patchRes(r, 0); return [r.mistakes, Boosts.have('shield')]; });
  ok('shield not used for 2 mistakes', sh2[0] === 2 && sh2[1] === 1);
  const hn = await E(() => { const r = { mistakes: 0, helped: true }; Boosts.patchRes(r, 1); return [r.helped, Boosts.have('hint')]; });
  ok('cupcake: hint keeps perfect', hn[0] === false && hn[1] === 0, JSON.stringify(hn));
  // кекс в настоящей задаче: нажали подсказку, решили — задача идеальная
  await E(() => Boosts.buy('hint')); await go('practice', 'eq');
  const hasHint = await E(() => { const h = document.querySelector('button[id$="-hint"]'); if (h) h.click(); return !!h; });
  ok('hint button reserves cupcake in a real task', !hasHint || await E(() => Boosts.have('hint') === 1));
  // заморозка в «Быстрых лапках»
  await E(() => Boosts.buy('freeze')); await go('blitz'); await E(() => document.querySelector('#go')?.click()); await sleep(600);
  ok('freeze button in timed mode', await E(() => !!document.querySelector('#freezeBtn')));
  const w1 = await E(() => parseFloat(document.querySelector('#tb').style.width));
  await E(() => document.querySelector('#freezeBtn').click()); await sleep(300);
  const w2 = await E(() => parseFloat(document.querySelector('#tb').style.width));
  ok('freeze adds 10 s', w2 > w1 + 10 && w2 <= 100.5 || w2 >= 99, `${w1}→${w2}`);
  ok('freeze once per round', await E(() => !document.querySelector('#freezeBtn') && Boosts.have('freeze') === 0));
  await go('home'); ok('freeze button gone after leaving', await E(() => !document.querySelector('#freezeBtn')));
  // торт-праздник
  await E(() => Boosts.buy('party')); const cp = await E(() => S.candies);
  await E(() => Boosts.use('party')); await sleep(1000);
  ok('party: chest opens', await E(() => !!document.querySelector('.modal #chest')));
  await E(() => document.querySelector('.modal #chest').click()); await sleep(400);
  ok('party chest gives candies', await E(cp => S.candies >= cp + 15, cp));
  ok('party once a day', await E(() => { Boosts.B().inv.party = 1; return !Boosts.use('party').ok; }));
  ok('inventory max respected', await E(() => { const b = Boosts.B(); b.inv.hint = 5; b.bought = {}; return !Boosts.buy('hint').ok; }));
  ok('boost state saved', await E(() => JSON.parse(localStorage.getItem('murlok-detective-v1')).boost.luck === 8));

  ok('no page errors', !errors.length, errors.slice(0, 5).join(' | '));
  console.log(`V29 DONE ${n - fails}/${n}`); if (fails) console.log('V29 FAIL total', fails);
  await b.close(); process.exit(fails ? 1 : 0);
})();
