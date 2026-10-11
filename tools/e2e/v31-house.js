// v31: живой домик — телескоп → космическая аркада, бассейн (котик плавает), микрофон (песенки), действия у всех вещей,
// плита убрана с кухни (миграция сохранений), мелкие встроенные украшения убираются в сундук
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || process.argv[2] || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let fails = 0;
const ok = (name, c, x = '') => { if (!c) fails++; console.log((c ? 'V31 OK ' : 'V31 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => {
    const st = { mul: { done: 800, perfect: 40 }, eq: { done: 260, perfect: 10 }, bug: { done: 0, perfect: 0 }, blitz: { games: 1, best: 12 } };
    localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, cases: 7, houseV: 2, st,
      roomsSeen: ['kitchen', 'living', 'bedroom', 'play', 'bath', 'office', 'garden', 'attic', 'pool', 'music', 'library', 'station', 'rink', 'factory', 'observ', 'throne', 'fame'],
      login: { last: today(), day: 1 }, care: { food: 80, water: 80, fun: 40, energy: 80, clean: 40, t: Date.now() },
      trip: { done: {}, ar: { done: {}, best: {}, used: 999, base: 0, flights: 0 } },
      place: { kitchen: [{ id: 'fx_bowl', x: 22, y: 3 }, { id: 'fx_water', x: 40, y: 3 }, { id: 'fx_stove', x: 10, y: 40 }, { id: 'teddy', x: 12, y: 44, on: 'fx_stove' }] }, furn: ['teddy'] })));
  });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.HouseFun === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1000);
  const E = (f, ...a) => p.evaluate(f, ...a);
  const go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(700); };
  const tap = async id => { const el = await p.$(`.room .fx[data-id="${id}"]`); if (!el) return false; const bb = await el.boundingBox(); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); return true; };
  const closeModals = () => E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));

  /* ---------- плита ---------- */
  ok('stove removed from kitchen fixtures', await E(() => !Lines.ROOMS.find(r => r.id === 'kitchen').fixed.some(f => f[0] === 'fx_stove')));
  await go('house', 'kitchen');
  ok('stove migrated out of save', await E(() => !document.querySelector('.fx[data-id="fx_stove"]') && !S.place.kitchen.some(q => q.id === 'fx_stove')));
  ok('item that stood on stove falls to floor', await E(() => { const t = S.place.kitchen.find(q => q.id === 'teddy'); return t && !t.on && t.y < 30; }));
  await go('house', 'kitchen');
  ok('stove does not come back', await E(() => !S.place.kitchen.some(q => q.id === 'fx_stove')));

  /* ---------- телескоп: нет билета → подсказка и карта звёзд ---------- */
  await go('house', 'observ'); await tap('fx_tscope'); await sleep(3400);
  ok('telescope (no ticket): stays in house + offers star map', await E(() => curScreen === 'house' && !!document.querySelector('.modal #hfSky') && /билет/.test(document.body.innerText)));
  await E(() => document.querySelector('#hfSky').click()); await sleep(800);
  ok('telescope offer → star map', await E(() => curScreen === 'starmap'));
  /* аркада ещё не открыта */
  await go('house', 'attic'); await E(() => { window.__open = SpaceTrip.open; SpaceTrip.open = () => false; }); await tap('fx_scope'); await sleep(3400);
  ok('attic telescope (arcade locked): explains tasks left', await E(() => curScreen === 'house' && /Ракета ещё строится/.test(document.body.innerText)));
  await E(() => { SpaceTrip.open = window.__open; }); await closeModals();
  /* билет есть → летим */
  await E(() => { S.trip.ar.used = 0; save(); }); ok('has tickets now', await E(() => SpaceTrip.tickets() > 0));
  await go('house', 'observ'); await tap('fx_tscope'); await sleep(3800);
  ok('telescope with ticket → space arcade', await E(() => curScreen === 'spacetrip'));
  await E(() => { S.trip.ar.used = 999; save(); });
  await go('house', 'observ'); await tap('fx_starmap'); await sleep(2300);
  ok('star map item → sky', await E(() => curScreen === 'starmap'));

  /* ---------- бассейн ---------- */
  await go('house', 'pool'); const c0 = await E(() => careNow().clean); await tap('fx_pool'); await sleep(1500);
  ok('pool: cat swims in water', await E(() => !!document.querySelector('.hf-water') && document.querySelector('#rcat').classList.contains('swimming')));
  await p.screenshot({ path: __dirname + '/shots/V31-pool.png' });
  await sleep(4200);
  ok('pool: climbs out, water gone, cleaner + happier', await E(c0 => !document.querySelector('.hf-water') && !document.querySelector('#rcat').classList.contains('swimming') && careNow().clean > c0, c0));

  /* ---------- микрофон ---------- */
  ok('≥15 songs', await E(() => HouseFun.SONGS.length >= 15));
  await go('house', 'music'); const s0 = await E(() => S.houseSong || 0); await tap('fx_mic'); await sleep(1500);
  ok('mic: cat sings with lyrics', await E(() => document.querySelector('#rcat').classList.contains('singing') && /🎤|🎵/.test(document.body.innerText)));
  await p.screenshot({ path: __dirname + '/shots/V31-sing.png' });
  await sleep(3500);
  ok('mic: next song queued', await E(s0 => (S.houseSong || 0) === s0 + 1 && !document.querySelector('#rcat').classList.contains('singing'), s0));

  /* ---------- конкретные комнаты ---------- */
  await go('house', 'rink'); await tap('fx_skates'); await sleep(1200);
  ok('rink: cat skates', await E(() => document.querySelector('#rcat').classList.contains('skating'))); await sleep(2600);
  await go('house', 'factory'); const k0 = await E(() => S.candies); await tap('fx_belt'); await sleep(3600);
  ok('factory belt: +1 candy', await E(k0 => S.candies === k0 + 1 && S.factory.n === 1, k0));
  await E(() => { S.factory.n = 5; save(); }); const k1 = await E(() => S.candies); await tap('fx_belt'); await sleep(3600);
  ok('factory belt: daily cap', await E(k1 => S.candies === k1, k1));
  await go('house', 'throne'); await tap('fx_throne'); await sleep(1600);
  ok('throne: crown sparkle', await E(() => !!document.querySelector('#rcat .hf-crown'))); await sleep(2200);
  await go('house', 'fame'); await tap('fx_cup'); await sleep(2600);
  ok('fame cup: achievements', await E(() => !!document.querySelector('.modal .hf-fame') && /Решено задач/.test(document.querySelector('.modal').innerText))); await closeModals(); await sleep(800);
  await go('house', 'library'); await tap('fx_shelf'); await sleep(2600);
  ok('library shelf: academy fact', await E(() => !!document.querySelector('.modal #hfMore'))); await closeModals(); await sleep(800);
  await go('house', 'station'); await tap('fx_window'); await sleep(2600);
  ok('station window: ISS fact + star map', await E(() => !!document.querySelector('.modal #hfSky'))); await closeModals(); await sleep(800);

  /* ---------- у всех встроенных вещей есть действие ---------- */
  ok('every room fixture has an interaction', await E(() => Lines.ROOMS.every(r => r.fixed.every(f => f[5] && f[5] !== 'wash' || HouseFun.has(f[0]) || ['fx_tub'].includes(f[0])))), await E(() => Lines.ROOMS.flatMap(r => r.fixed).filter(f => !(f[5] && f[5] !== 'wash') && !HouseFun.has(f[0]) && f[0] !== 'fx_tub').map(f => f[0]).join(',')));
  const sweep = await E(() => Lines.ROOMS.map(r => [r.id, r.fixed.map(f => f[0]).filter(id => !/^(fx_bowl|fx_water|fx_bed|fx_tub|fx_sofa|fx_scope|fx_tscope|fx_starmap|fx_panel)$/.test(id))]));
  let swept = 0;
  for (const [rid, ids] of sweep) { await go('house', rid); for (const id of ids) { if (await tap(id)) swept++; await sleep(3300); await closeModals(); if (await E(() => curScreen !== 'house')) await go('house', rid); } }
  ok('tapped every fixture without errors', swept > 15 && !errors.length, `(${swept})`);

  /* ---------- украшение → в сундук и обратно ---------- */
  await E(() => { S.place.bath = (S.place.bath || []).filter(q => q.id !== 'fx_duck'); S.fxStash = ['fx_duck']; save(); });
  await go('house', 'bath');
  ok('stashed duck not re-added', await E(() => !document.querySelector('.fx[data-id="fx_duck"]') && !S.place.bath.some(q => q.id === 'fx_duck')));
  await E(() => document.querySelector('#invb').click()); await sleep(300);
  ok('stashed duck in chest tray', !!(await p.$('[data-put="fx_duck"]')));
  await E(() => document.querySelector('[data-put="fx_duck"]').click()); await sleep(500);
  { const r = await (await p.$('#room')).boundingBox(); await p.touchscreen.tap(r.x + r.width * 0.6, r.y + r.height * 0.85); await sleep(600); }
  ok('duck placed back from chest', await E(() => S.place.bath.some(q => q.id === 'fx_duck') && !S.fxStash.includes('fx_duck') && !!document.querySelector('.fx[data-id="fx_duck"]:not(.fixed)')));
  ok('main fixtures stay fixed', await E(() => document.querySelector('.fx[data-id="fx_tub"]').classList.contains('fixed')));

  /* ---------- (V31_ALL=1) все вещи из магазина с «живыми» действиями: касание без ошибок ---------- */
  if (process.env.V31_ALL) {
    const ids = await E(() => Lines.CATALOG.map(c => c[0]).filter(id => HouseFun.has(id) && !/^(telescope2|galaxy)$/.test(id)));
    let n = 0;
    for (let i = 0; i < ids.length; i += 6) {
      const part = ids.slice(i, i + 6);
      await E(part => { part.forEach(id => { if (!S.furn.includes(id)) S.furn.push(id); }); S.place.living = [{ id: 'fx_sofa', x: 28, y: 3 }].concat(part.map((id, k) => ({ id, x: 12 + k * 15, y: 8 }))); save(); }, part);
      await go('house', 'living');
      for (const id of part) { if (await tap(id)) n++; await sleep(2900); await closeModals(); if (await E(() => curScreen !== 'house')) await go('house', 'living'); }
    }
    ok('all catalog interactions tapped without errors', n === ids.length && !errors.length, `(${n}/${ids.length})`);
  }

  console.log('errors:', errors.join(' | ') || 'none');
  console.log(fails ? `V31 FAILED: ${fails}` : 'V31 ALL OK');
  await b.close(); process.exit(fails || errors.length ? 1 : 0);
})();
