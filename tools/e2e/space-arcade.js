// Космическая аркада: билеты, хаб, полёт (касание + стрелки), сбор, пауза, фон-пауза, прилёт с фактом, гейм-овер,
// чекпоинт, приз за все планеты, наклейки, вход из карты звёзд / игр, без переполнения на 320/390, reduced-motion.
// URL=http://localhost:8775/ node tools/e2e/space-arcade.js
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'SPACE OK ' : 'SPACE FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  const setState = extra => p.evaluate(x => { const s = Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 } }); s.st.mul.done = x; localStorage.setItem('murlok-detective-v1', JSON.stringify(s)); }, extra);
  const boot = async () => { await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.SpaceTrip === 'object' && typeof go === 'function').catch(() => false)); t++) { await p.reload(); await sleep(800); } await sleep(1200); };
  const E = (f, ...a) => p.evaluate(f, ...a);
  const go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(600); };
  const click = async s => { await p.waitForSelector(s, { timeout: 8000 }); await E(() => document.querySelectorAll('.toast,.modal').forEach(t => t.remove())); await E(s => document.querySelector(s).click(), s); await sleep(300); };
  const G = f => E(f);
  const noOverflow = () => E(() => document.documentElement.scrollWidth <= innerWidth + 1);

  /* ---------- закрыто до NEED задач ---------- */
  await setState(50); await boot();
  await go('spacetrip'); ok('locked before 120 tasks', /Ракета ещё строится/.test(await E(() => document.body.innerText)) && !(await p.$('#stFly')));
  await go('starmap'); await sleep(400); ok('star map shows arcade button (locked)', !!(await p.$('.trip-btn')) && /120/.test(await E(() => document.querySelector('.trip-btn').innerText)));

  /* ---------- открыто: билеты ---------- */
  await setState(200); await boot();
  await go('starmap'); await sleep(400); ok('star map arcade button (open, tickets)', /билетов: 1/.test(await E(() => document.querySelector('.trip-btn').innerText)));
  await click('.trip-btn'); await sleep(400);
  ok('hub: 8 planets Mercury..Neptune', await E(() => { const t = [...document.querySelectorAll('.tp')]; return t.length === 8 && t[0].dataset.p === 'mercury' && t[7].dataset.p === 'neptune'; }));
  ok('hub: ticket + progress to next', await E(() => SpaceTrip.tickets() === 1 && /До следующего билета: ещё 30/.test(document.body.innerText)));
  ok('hub: only first planet available', await E(() => document.querySelectorAll('.tp.lock').length === 7));
  await E(() => { S.st.mul.done += 31; save(); }); await go('spacetrip'); ok('ticket earned every 30 tasks', await E(() => SpaceTrip.tickets() === 2 && /ещё 29/.test(document.body.innerText)));
  ok('hub 390: no overflow', await noOverflow());
  await p.setViewport({ width: 320, height: 640, isMobile: true, hasTouch: true }); await go('spacetrip'); ok('hub 320: no overflow', await noOverflow());
  await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  /* ---------- полёт ---------- */
  await go('spacetrip'); await click('#stFly'); await sleep(500);
  ok('flight screen + ticket spent', await E(() => curScreen === 'spacefly' && SpaceTrip.tickets() === 1 && !!document.querySelector('#sacv')));
  ok('intro card with planet', /Курс на Меркурий/.test(await E(() => document.querySelector('#sao').innerText)));
  await click('#saGo'); await sleep(300); ok('playing', await G(() => window.__spaceArcade.state === 'play'));
  // касание: тянем ракету влево
  const x0 = await G(() => window.__spaceArcade.x), y0 = await G(() => window.__spaceArcade.y);
  await p.mouse.move(x0, y0); await p.mouse.down(); for (let k = 1; k <= 8; k++) { await p.mouse.move(x0 - k * 15, y0 - k * 5); await G(() => window.__spaceArcade.step(0.04)); } await G(() => window.__spaceArcade.step(0.3)); await p.mouse.up();
  const x1 = await G(() => window.__spaceArcade.x); ok('touch-drag moves rocket', x1 < x0 - 60, `${Math.round(x0)}→${Math.round(x1)}`);
  // клавиатура
  await p.keyboard.down('ArrowRight'); await G(() => window.__spaceArcade.step(0.45)); await p.keyboard.up('ArrowRight');
  const x2 = await G(() => window.__spaceArcade.x); ok('arrow keys move rocket', x2 > x1 + 40, `${Math.round(x1)}→${Math.round(x2)}`);
  await G(() => { window.__spaceArcade.inv = 99; }); // неуязвимость, чтобы спокойно полетать
  await sleep(500); await G(() => window.__spaceArcade.step(2.6));
  ok('time runs, objects spawn, fuel drains', await G(() => { const g = window.__spaceArcade; return g.t > 2.5 && g.objs.length > 0 && g.fuel < 100; }));
  // сбор: подкладываем звезду, конфету и топливо прямо к ракете
  await G(() => { const g = window.__spaceArcade; g.fuel = 30; ['star', 'candy', 'fuel'].forEach(t => g.objs.push({ type: t, x: g.x, y: g.y, r: 14, vy: 0, vx: 0, rot: 0, vr: 0, ph: 0 })); });
  await G(() => window.__spaceArcade.step(0.1)); ok('collect star/candy/fuel', await G(() => { const g = window.__spaceArcade; return g.stars >= 1 && g.candies >= 1 && g.fuel > 55; }));
  ok('HUD shows counts', await E(() => +document.querySelector('#sast').textContent >= 1 && +document.querySelector('#sacn').textContent >= 1 && /❤️/.test(document.querySelector('#sah').textContent)));
  ok('flight 390: no overflow', await noOverflow());
  // пауза
  await click('#sap'); const tP = await G(() => window.__spaceArcade.t); await sleep(600);
  ok('pause stops time', await G(() => window.__spaceArcade.state === 'paused') && Math.abs((await G(() => window.__spaceArcade.t)) - tP) < 0.001 && !!(await p.$('#saRes')));
  await click('#saRes'); await sleep(300); ok('resume', await G(() => window.__spaceArcade.state === 'play'));
  // ушли с вкладки — пауза
  await E(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok('auto-pause on visibilitychange', await G(() => window.__spaceArcade.state === 'paused'));
  await E(() => { delete document.hidden; }); await click('#saRes');
  // столкновение
  await G(() => { const g = window.__spaceArcade; g.inv = 0; g.objs.push({ type: 'rock', x: g.x, y: g.y, r: 20, vy: 0, vx: 0, rot: 0, vr: 0, k: 0 }); });
  await G(() => window.__spaceArcade.step(0.1)); ok('asteroid hit costs a heart', await G(() => window.__spaceArcade.hearts === 2));
  // прилёт
  const candies0 = await E(() => S.candies);
  await G(() => { const g = window.__spaceArcade; g.inv = 99; g.t = g.dur - 0.1; g.step(2.3); }); await sleep(300);
  ok('arrival: fact «Знаешь ли ты?»', /Знаешь ли ты\?/.test(await E(() => document.querySelector('#sao').innerText)) && /88 земных суток/.test(await E(() => document.querySelector('#sao').innerText)));
  ok('arrival rewards: candies + sticker + checkpoint', await E(c0 => S.candies > c0 && S.trip.ar.done.mercury === 1 && /Наклейка/.test(document.querySelector('#sao').innerText), candies0));
  ok('arrival card 390: no overflow', await noOverflow());
  // следующая планета и гейм-овер
  await click('#saNext'); await sleep(300); ok('next planet intro (Venus)', /Курс на Венера/.test(await E(() => document.querySelector('#sao').innerText)));
  await click('#saGo'); await sleep(300);
  await G(() => { const g = window.__spaceArcade; g.hearts = 1; g.inv = 0; g.objs.push({ type: 'rock', x: g.x, y: g.y, r: 20, vy: 0, vx: 0, rot: 0, vr: 0, k: 0 }); g.step(0.1); }); await sleep(1300);
  ok('game over screen + checkpoint + spare rocket', await E(() => /Ракете нужен ремонт/.test(document.querySelector('#sao').innerText) && /Чекпоинт: планета Венера/.test(document.querySelector('#sao').innerText)) && !!(await p.$('#saAgain')));
  await click('#saAgain'); await sleep(300); ok('spare rocket restarts planet', /Курс на Венера/.test(await E(() => document.querySelector('#sao').innerText)));
  await click('#saQuit'); await sleep(500); ok('«Выйти» returns to hub', await E(() => curScreen === 'spacetrip'));
  ok('hub: checkpoint at Venus, sticker shown', await E(() => document.querySelector('.tp.sel').dataset.p === 'venus' && document.querySelectorAll('.sa-stk .sa-sticker.on').length === 1));

  /* ---------- приз за все планеты ---------- */
  await E(() => { const A = SpaceTrip.state(); SpaceTrip.PL.slice(0, 7).forEach(p => { A.done[p.id] = 1; }); S.st.mul.done += 30; save(); });
  await go('spacetrip'); ok('hub: Neptune selected', await E(() => document.querySelector('.tp.sel').dataset.p === 'neptune'));
  const gems0 = await E(() => S.gems || 0);
  await click('#stFly'); await sleep(400); await click('#saGo'); await sleep(200);
  await G(() => { const g = window.__spaceArcade; g.inv = 99; g.t = g.dur - 0.05; g.step(2.3); }); await sleep(1600);
  ok('all planets: outfit + gems', await E(g0 => S.owned.includes(SpaceTrip.OUTFIT) && (S.gems || 0) >= g0 + 3 && /Звёздный плащ/.test(document.querySelector('#sao').innerText), gems0));
  ok('last planet: no «next» button', !(await p.$('#saNext')));
  await go('shop'); ok('outfit in wardrobe', await E(() => !!document.querySelector('#si .item[data-id="cosmocape"].own')));
  await E(() => document.querySelector('#si .item[data-id="cosmocape"]').click()); await sleep(300); ok('outfit can be worn', await E(() => S.wear.neck === 'cosmocape'));
  await go('diplomas', 'collection'); /* v31: наклейки — во вкладке «Коллекция» */ ok('awards: space stickers 8/8', /Космические наклейки \(8\/8\)/.test(await E(() => document.body.innerText)));
  await go('games'); ok('games list has the arcade', /Полёт в космос|аркад/i.test(await E(() => document.body.innerText)));

  /* ---------- 320 px и reduced motion ---------- */
  await p.setViewport({ width: 320, height: 568, isMobile: true, hasTouch: true }); await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await E(() => { S.st.mul.done += 30; save(); }); await go('spacetrip'); await click('#stFly'); await sleep(300);
  ok('intro 320: no overflow', await noOverflow()); await click('#saGo'); await sleep(1500);
  ok('reduced motion: plays, no shake on hit', await G(() => { const g = window.__spaceArcade; g.inv = 0; g.objs.push({ type: 'rock', x: g.x, y: g.y, r: 20, vy: 0, vx: 0, rot: 0, vr: 0, k: 0 }); g.step(0.1); return true; }) && (await G(() => window.__spaceArcade.shake === 0 && window.__spaceArcade.hearts === 2)));
  ok('flight 320: no overflow', await noOverflow());
  await click('#sap'); await click('#saQuit'); await sleep(400);
  /* ---------- «←» из хаба — на карту звёзд ---------- */
  await go('starmap'); await go('spacetrip'); await E(() => document.querySelectorAll('.modal,.toast').forEach(m => m.remove())); await p.click('.top .back'); await sleep(500);
  ok('back: hub -> starmap', await E(() => curScreen === 'starmap'));
  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('SPACE DONE', n, fails ? `FAILS ${fails}` : 'all ok'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('SPACE FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
