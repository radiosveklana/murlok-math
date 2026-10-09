const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const URL = process.argv[2] || 'http://localhost:8765/';
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180, isMobile: true, hasTouch: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Света', fur: 'ginger', seenVersion: '17', login: { last: today(), day: 1 }, houseV: 2, roomsSeen: ['kitchen', 'living', 'bedroom'], st: { mul: { done: 20, perfect: 0 }, eq: { done: 3, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } }, care: { food: 30, water: 30, fun: 90, energy: 20, clean: 90, t: Date.now() } }))); });
  await p.goto(URL); await sleep(1500); await p.screenshot({ path: __dirname + '/shots/T-home.png' });
  await p.evaluate(() => go('house', 'bedroom')); await sleep(900);
  await p.tap('.fx[data-id="fx_bed"]'); await sleep(2200); await p.screenshot({ path: __dirname + '/shots/T-bed.png' });
  const sleeping = await p.$eval('#rcat', e => e.className); console.log('cat class after tap:', sleeping);
  await sleep(4500); await p.evaluate(() => go('house', 'kitchen')); await sleep(900);
  await p.tap('.fx[data-id="fx_water"]'); await sleep(1200); console.log('water:', await p.$eval('#rcat', e => e.className));
  // физика: бросаем мишку в воздухе — он должен упасть на пол
  await p.evaluate(() => { S.furn.push('teddy'); S.place.kitchen.push({ id: 'teddy', x: 60, y: 70 }); save(); go('house', 'kitchen'); }); await sleep(900);
  const y = await p.$eval('.fx[data-id="teddy"]', e => parseFloat(e.style.bottom)); console.log(y < 30 ? 'PHYSICS OK' : 'PHYSICS FAIL ' + y);
  // столкновения: тащим мишку прямо на миску — он должен отъехать
  { const bowl = await p.$('.fx[data-id="fx_bowl"]'), bb = await bowl.boundingBox(), ted = await p.$('.fx[data-id="teddy"]'), tb = await ted.boundingBox();
    await p.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 8 }); await p.mouse.up(); await sleep(1200);
    const ov = await p.evaluate(() => { const a = document.querySelector('.fx[data-id="teddy"]').getBoundingClientRect(), b = document.querySelector('.fx[data-id="fx_bowl"]').getBoundingClientRect(); return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) / Math.min(a.width, b.width); });
    console.log(ov < 0.4 ? 'COLLIDE OK' : 'COLLIDE FAIL ' + ov.toFixed(2)); }
  console.log('errs:', errs.join(' | ') || 'none'); await b.close();
})();
