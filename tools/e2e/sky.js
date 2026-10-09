// sky: настоящая звёздная карта (starmap.js + content/extra/sky-data.js) — астрономия, отрисовка, касания, переполнение.
// node tools/e2e/sky.js   (сервер: node tools/e2e/serve.js 8765)
const puppeteer = require('puppeteer-core'), path = require('path');
const URL = process.env.URL || 'http://localhost:8765/', SHOTS = path.join(__dirname, 'shots');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0, fails = 0;
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'SKY OK ' : 'SKY FAIL ') + name + (x !== '' ? ' ' + x : '')); };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof go === 'function' && !!window.StarMap).catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  await sleep(1000);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(700); };
  const shot = async f => p.screenshot({ path: path.join(SHOTS, f) });
  const overflow = () => E(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  /* ---------- астрономия (Челябинск 55.16° с. ш., 61.40° в. д.; местное время UTC+5) ---------- */
  const A = (ra, dec, iso) => E((ra, dec, iso) => StarMap.altAz(ra, dec, Date.parse(iso), 55.16, 61.40), ra, dec, iso);
  for (const iso of ['2026-10-09T15:00:00Z', '2027-01-15T02:00:00Z', '2027-04-20T19:00:00Z']) { const [alt] = await A(37.95, 89.26, iso); ok(`Polaris altitude ≈ latitude (${iso.slice(0, 10)})`, Math.abs(alt - 55.16) < 1.2, alt.toFixed(2)); }
  const bet = await A(88.79, 7.41, '2027-01-15T16:00:00Z'); ok('Orion (Betelgeuse) high in SE-S on a January evening', bet[0] > 20 && bet[1] > 100 && bet[1] < 200, bet.map(v => v.toFixed(0)).join('/'));
  const betS = await A(88.79, 7.41, '2026-07-15T18:00:00Z'); ok('Orion below horizon on a July evening', betS[0] < 0, betS[0].toFixed(0));
  const tri = await Promise.all([[279.23, 38.78], [310.36, 45.28], [297.70, 8.87]].map(([r, d]) => A(r, d, '2026-07-15T18:00:00Z')));
  ok('Summer Triangle up on a July evening (Vega, Deneb, Altair)', tri.every(t => t[0] > 20), tri.map(t => t[0].toFixed(0)).join('/'));
  const gmst = await E(() => StarMap.lst(Date.parse('2000-01-01T12:00:00Z'), 0)); ok('GMST at J2000 = 280.46°', Math.abs(gmst - 280.46) < 0.01, gmst.toFixed(3));

  /* ---------- экран «Над головой» ---------- */
  await E(() => { S.starsSeen = []; save(); });
  await go('starmap'); await p.waitForSelector('#skyc', { timeout: 8000 }); await sleep(500);
  ok('sky data loaded: 88 constellations', await E(() => !!window.SKY && Object.keys(SKY.cons).length === 88 && Object.keys(SKY.lines).length === 88 && SKY.stars.length / 4 > 2500));
  const d1 = await E(() => StarMap.debug()); ok('overhead map renders labels', d1.mode === 'sky' && d1.labels > 12, d1.labels);
  ok('overhead: no overlapping labels', d1.boxes.every((a, i) => d1.boxes.every((o, j) => j <= i || !(a[0] < o[2] && a[2] > o[0] && a[1] < o[3] && a[3] > o[1]))), d1.boxes.length);
  ok('canvas has stars drawn', await E(() => { const c = document.querySelector('#skyc'), x = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let br = 0; for (let i = 0; i < x.length; i += 4) if (x[i] > 200 && x[i + 1] > 200) br++; return br > 300; }));
  ok('16 famous chips kept', (await p.$$('.cst')).length === 16);
  ok('spacetrip button still injected', !!(await p.$('.page.starmap .trip-btn')));
  ok('credit shown', /d3-celestial/.test(await E(() => document.body.innerText)) && /Йельского/.test(await E(() => document.body.innerText)));
  await shot('sky-overhead-390.png');
  ok('no overflow @390', (await overflow()) <= 0);
  const t0 = await E(() => document.querySelector('#sktime').innerText);
  await E(() => { const r = document.querySelector('#skr'); r.value = 180; r.dispatchEvent(new Event('input')); }); await sleep(300);
  ok('time slider moves time', (await E(() => document.querySelector('#sktime').innerText)) !== t0 && !(await E(() => document.querySelector('#sknow').classList.contains('on'))));
  await p.click('#sknow'); await sleep(200);
  /* касание созвездия на карте */
  const tgt = await E(() => { const d = StarMap.debug(); const ids = ['UMa', 'Cas', 'Cyg', 'Lyr', 'Per', 'And', 'Peg', 'Aur', 'Dra', 'Cep', 'Her', 'Boo', 'Leo', 'Ori']; for (const id of ids) { const w = StarMap.where(id); if (w) return { id, ...w }; } return null; });
  ok('a famous constellation is above the horizon', !!tgt, tgt && tgt.id);
  if (tgt) { await p.touchscreen.tap(tgt.x, tgt.y); await sleep(900); }
  ok('tap opens constellation card', tgt && await E(id => { const c = document.querySelector('#cinfo .cinfo'); return !!c && c.innerText.includes(SKY.cons[id].ru) && StarMap.debug().act === id; }, tgt.id));
  ok('tap reward uses old id', tgt && await E(id => S.starsSeen.includes(StarMap.OLD ? (Object.entries(StarMap.OLD).find(([o, i]) => i === id) || [id])[0] : id), tgt.id));
  await shot('sky-card-390.png');
  /* чип знаменитого созвездия */
  await E(() => document.querySelector('.cst-chips .chip[data-c="ursa_major"]').click()); await sleep(900);
  ok('chip: Big Dipper card + progress', await E(() => /Большая Медведица/.test(document.querySelector('#cinfo').innerText) && S.starsSeen.includes('ursa_major') && document.querySelector('.chip[data-c="ursa_major"]').classList.contains('on')));
  ok('chip zooms map', (await E(() => StarMap.debug().z)) > 1.5);
  await E(() => document.querySelector('#skyc').scrollIntoView()); await sleep(300); await shot('sky-dipper-390.png');
  /* южное созвездие с карточкой из таблицы фактов */
  await E(() => StarMap._open('Cru', true)); await sleep(700);
  ok('southern constellation: never visible + full mode', await E(() => /Южный Крест/.test(document.querySelector('#cinfo').innerText) && /никогда/.test(document.querySelector('#cinfo .now').innerText) && StarMap.debug().mode === 'full'));

  /* ---------- «Всё небо» ---------- */
  await E(() => { document.querySelector('#zreset').click(); }); await sleep(300);
  const d2 = await E(() => StarMap.view(1, 0, 0)); ok('full sky: labels shown without clutter', d2.mode === 'full' && d2.labels >= 20, d2.labels);
  const noOverlap = bx => bx.every((a, i) => bx.every((o, j) => j <= i || !(a[0] < o[2] && a[2] > o[0] && a[1] < o[3] && a[3] > o[1])));
  ok('full sky: no overlapping labels', noOverlap(d2.boxes), d2.boxes.length);
  const union = await E(() => { const seen = new Set(), d = StarMap.debug(); const ids = () => (StarMap.where ? Object.keys(SKY.cons).filter(id => StarMap.where(id)) : []); for (const z of [1, 2, 3, 4.5]) for (let fx = -1; fx <= 1.001; fx += 0.25) for (let fy = -1; fy <= 1.001; fy += 0.5) { StarMap.view(z, fx * (d.W / 2 * (z - 1) + 20), fy * (d.W / 4 * (z - 1) + 20)); ids().forEach(i => seen.add(i)); } StarMap.view(1, 0, 0); return seen.size; });
  ok('full sky: zooming in reveals ≥80 of 88 constellation labels', union >= 80, union);
  const zb = await E(() => StarMap.view(3, 0, 0)); ok('zoomed x3: labels readable, no overlaps', zb.labels >= 8 && noOverlap(zb.boxes), zb.labels); await E(() => StarMap.view(1, 0, 0));
  await E(() => document.querySelector('#skyc').scrollIntoView()); await sleep(200); await shot('sky-full-390.png');
  ok('no overflow @390 full', (await overflow()) <= 0);
  /* переключатели */
  await p.click('#tgl'); await p.click('#tgn'); await sleep(200); ok('toggles off', (await E(() => StarMap.debug().labels)) === 0);
  await p.click('#tgl'); await p.click('#tgn'); await sleep(200);

  /* ---------- 320 px ---------- */
  await p.setViewport({ width: 320, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await sleep(400);
  ok('no overflow @320 full', (await overflow()) <= 0, await overflow());
  await E(() => document.querySelector('.sky-modes button[data-m="sky"]').click()); await sleep(500);
  ok('no overflow @320 overhead', (await overflow()) <= 0, await overflow());
  await shot('sky-overhead-320.png');

  /* ---------- компьютер: колесо мыши ---------- */
  await p.setViewport({ width: 1200, height: 900 }); await go('starmap'); await sleep(400);
  await E(() => document.querySelector('.sky-modes button[data-m="full"]').click()); await sleep(500);
  const bb = await (await p.$('#skyc')).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.wheel({ deltaY: -300 }); await sleep(300);
  ok('wheel zooms', (await E(() => StarMap.debug().z)) > 1);
  await E(() => document.querySelector('#zreset').click()); await sleep(200);
  await E(() => document.querySelector('#skyc').scrollIntoView()); await sleep(200); await shot('sky-full-1200.png');
  await E(() => document.querySelector('.sky-modes button[data-m="sky"]').click()); await sleep(400);
  /* назад */
  await go('subject', 'space'); await go('starmap'); await sleep(300); await p.click('.top .back'); await sleep(500);
  ok('back from starmap -> subject', (await E(() => curScreen)) === 'subject');

  ok('no page errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log(`SKY DONE ${n} checks, ${fails} failed`); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('SKY FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
