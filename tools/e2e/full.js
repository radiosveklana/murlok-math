const puppeteer = require('puppeteer-core');
const ROOT = require('path').resolve(__dirname, '../..');
const Eng = require(ROOT + '/engine.js');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; const misses = new Set();
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage();
  await p.setViewport({ width: +process.argv[2] || 820, height: +process.argv[3] || 1180, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message));
  p.on('response', r => { if (r.status() === 404) errors.push('404 ' + r.url().replace(URL, '')); });
  p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); if (m.text().startsWith('VOICE-MISS')) misses.add(m.text()); });
  await p.evaluateOnNewDocument(() => { window.MURLOK_DEBUG = true; });
  const tag = process.argv[4] || 'p';
  const shot = async n => { await sleep(350); await p.screenshot({ path: __dirname + `/shots/${tag}-${n}.png`, fullPage: false }); };
  const dismiss = async () => { for (let i = 0; i < 4; i++) { if (await p.$('.modal #chest')) { await p.click('.modal #chest'); await sleep(500); const c = await p.$('.modal [data-close]'); if (c) { await c.click(); await sleep(200); } continue; } if (await p.$('.modal #claim')) { await p.click('.modal #claim'); await sleep(500); await shot('zz-login'); const c = await p.$('.modal [data-close]'); if (c) { await c.click(); await sleep(200); } continue; } if (await p.$('.modal #gohouse')) { await shot('zz-room'); await p.click('.modal [data-close]'); await sleep(200); continue; } break; } };
  const click = async sel => { if (!sel.includes('.modal') && !sel.startsWith('#buy') && !sel.startsWith('#claim')) await dismiss(); await p.waitForSelector(sel, { timeout: 5000 }); await p.click(sel); await sleep(120); };
  const txt = sel => p.$eval(sel, e => e.innerText).catch(() => '');
  const key = async k => { await p.keyboard.press(k); await sleep(40); };
  const typeNum = async n => { for (const c of String(n)) await key(c); };
  const passCheck = async () => { for (let i = 0; i < 4; i++) { await sleep(300); if (!(await p.$('.cp .opt'))) break; await p.click('.cp .opt'); await sleep(250); await p.click('#cpn'); } await sleep(300); };
  const ev = s => Function('return (' + s.replace(/×/g, '*').replace(/·/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();

  await p.goto(URL); await sleep(800);
  await shot('01-hello');
  await p.type('#kid', 'Василиса'); await p.type('#nm', 'Мурзик'); await click('.fur[data-f="calico"]'); await click('#start'); await sleep(600);
  await shot('02-welcome'); await click('.modal [data-close]'); await shot('03-home');
  await click('#cfg'); await sleep(300); await click('#mus'); await sleep(400); await shot('03b-music'); await click('.mcard[data-m="mystic"]'); await sleep(1500);
  console.log('music-on:', await p.evaluate(() => document.body.classList.contains('music-on')), await p.$eval('#nowp', e => e.innerText));
  await click('.mcard[data-m="focus"]'); await sleep(800); await click('#mnext'); await sleep(800); await shot('03c-music2'); await click('.modal [data-close]');
  await click('.hero-cat'); await sleep(300);

  await sleep(1500); await dismiss(); await shot('03d-home2');
  await click('[data-go="school"]'); await shot('04-school');
  await click('[data-go="lesson"][data-arg="mul"]');
  for (let i = 0; i < 6; i++) { if (i === 2) { await click('#stp'); await click('#stp'); } await shot('05-slide' + i); if (i < 5) await click('#next'); }
  await click('#next'); await sleep(300); await passCheck();
  async function solveGuidedMul(name) {
    for (let g = 0; g < 80; g++) {
      if (await p.$('#more')) break;
      const t = await txt('.ask');
      const sm = t.match(/Нажми на клетку в строке (\d)/);
      if (sm) { const r = +sm[1] - 1; await click(`.cell.tap[data-c="${r}"]`); continue; }
      const m = t.match(/^(.*)=\s*/); if (!m) { await sleep(200); continue; }
      await typeNum(ev(m[1])); await key('Enter');
      if (g === 3 && name) await shot(name);
    }
  }
  await shot('06-guided-start');
  await solveGuidedMul('07-guided-mid');
  await shot('08-guided-done');
  await click('.lv button[data-v="4"]'); await sleep(200);
  await typeNum(1); await key('Enter'); await shot('09-guided-mistake');
  await solveGuidedMul(); await shot('10-guided-3x3');

  async function solveIndMul(scr) {
    const title = await txt('.task-title'); const [a, bb] = title.split('×').map(s => +s.trim());
    const P = Eng.mulPlan(a, bb); const ds = [];
    P.steps.forEach(s => { if (s.t === 'shift') { ds.push(s); return; } if (!s.last) ds.push({ d: s.v % 10 }); else String(s.v).split('').reverse().forEach(d => ds.push({ d: +d })); });
    let n = 0;
    for (const s of ds) { if (s.t === 'shift') await click(`.cell.tap[data-c="${s.row}"]`); else await key(String(s.d)); if (++n === 7 && scr) await shot(scr); }
  }
  await click('.mode button[data-m="0"]'); await sleep(200);
  await key('0'); await shot('11-ind-mistake');
  await solveIndMul('12-ind-mid'); await sleep(300); await shot('13-ind-done');

  await click('[data-go="school"]'); await click('[data-go="lesson"][data-arg="eq"]');
  for (let i = 0; i < 5; i++) { if (i === 2) { for (let k = 0; k < 3; k++) await click('#stp'); } await shot('14-eqslide' + i); if (i < 4) await click('#next'); }
  await click('#next'); await sleep(300); await passCheck();
  async function solveGuidedEq(scr) {
    for (let g = 0; g < 60; g++) {
      if (await p.$('#more')) return;
      if (await p.$('.op.tap:not(.right)')) { const ops = await p.$$('.op.tap'); for (const o of ops) { if (await p.$('.opt')) break; await o.click().catch(() => {}); await sleep(600); } if (scr && g < 2) await shot(scr + '-op'); continue; }
      if (await p.$('.opt')) { const os = await p.$$('.opt'); for (const o of os) { await o.click().catch(() => {}); await sleep(600); if (!(await p.$('.opt')) || (await p.$('.opt.right'))) break; } await sleep(500); if (scr) await shot(scr + '-opt' + g); continue; }
      const t = await txt('.ask'); const m = t.match(/^([\s\S]*)=\s*\?/);
      if (m) { await typeNum(ev(m[1].replace(/\n/g, ''))); await key('Enter'); await sleep(200); continue; }
      await sleep(200);
    }
  }
  await shot('15-eq-start');
  await solveGuidedEq('16-eq'); await shot('17-eq-done');

  await click('.back'); await click('.back'); await click('[data-go="newcase"]'); await shot('18-newcase');
  await click('.choice[data-t="mix"]'); await click('#go'); await shot('19-intro'); await click('#go');
  async function solveIndEq() {
    const first = await p.$eval('.eql.first', e => e.innerText); const [lhs, rhs] = first.split('=');
    let X = -1; for (let x = 0; x < 20000; x++) { try { if (Math.abs(ev(lhs.replace(/x/g, '(' + x + ')')) - +rhs) < 1e-9) { X = x; break; } } catch (e) { } }
    for (let g = 0; g < 6; g++) { if (await p.$('#clue')) return; const t = await txt('.ask'); const m = t.match(/^([\s\S]*)=\s*\?/); if (!m) break; await typeNum(ev(m[1].replace(/\n/g, '').replace(/x/g, '(' + X + ')'))); await key('Enter'); await sleep(250); }
  }
  for (let k = 0; k < 4; k++) {
    await sleep(300); await shot('20-task' + k);
    if (await p.$('.wit .lie')) { const ls = await p.$$('.wit .lie'); for (const l of ls) { if (await p.$('#clue')) break; await l.click(); await sleep(300); } await shot('20b-interro' + k); }
    else if (await p.$('.pickrow')) { const rows = await p.$$('.pickrow'); for (const r of rows) { if (await p.$('#clue')) break; await r.click(); await sleep(250); } }
    else if (await p.$('.mgrid')) await solveIndMul();
    else await solveIndEq();
    await sleep(400); await shot('21-taskdone' + k);
    await click('#clue'); await sleep(400); await shot('22-clue' + k);
    const sus = await p.$$('.modal .sus'); for (const s of sus) { await s.click(); await sleep(80); }
    await shot('23-crossed' + k);
    await click('#nx'); await sleep(300);
  }
  await shot('24-accuse');
  for (let t = 0; t < 5; t++) { if (await p.$('.win-page')) break; if (await p.$('.modal')) await click('.modal [data-close]'); const s2 = await p.$$('.sus:not(.crossed)'); await s2[0].click(); await click('#arrest'); await sleep(900); }
  await shot('25-result'); await sleep(1500); await shot('25b-result-say');
  await click('[data-go="home"]'); await shot('26-home');
  await click('[data-go="blitz"]'); await shot('27-blitz'); await click('#go');
  for (let i = 0; i < 6; i++) { const t = await txt('#q'); await typeNum(ev(t.split('=')[0])); await sleep(100); }
  await typeNum(1); await sleep(200); await shot('28-blitz-run');
  await click('.back');
  await click('[data-go="bugs"]'); await sleep(300); await shot('29-bugs');
  await click('.back'); await click('[data-go="shop"]'); await shot('30-shop');
  await p.evaluate(() => { S.candies = 200; save(); }); await click('.back'); await click('[data-go="shop"]');
  for (const id of ['crown', 'glasses', 'scarf']) { await click(`.item[data-id="${id}"]`); await click('#buy'); await sleep(300); }
  await shot('31-shop-bought');
  await click('.back'); await click('[data-go="book"]'); await shot('32-book'); await click('.tabs [data-t="table"]'); await shot('33-table'); await click('.tabs [data-t="awards"]'); await shot('34-awards');
  await click('.back'); await click('[data-go="parents"]'); await shot('35-parents');
  await p.screenshot({ path: __dirname + `/shots/${tag}-36-parents-full.png`, fullPage: true });
  await click('.back'); await click('[data-go="house"]'); await sleep(600); await dismiss(); if (await p.$('.modal [data-close]')) await click('.modal [data-close]'); await shot('37-house');
  await p.evaluate(() => { S.candies = 400; S.gems = 30; S.st.mul.done += 60; S.st.eq.done += 12; S.care.food = 20; S.care.fun = 20; save(); });
  await click('.back'); for (let i = 0; i < 4; i++) { await sleep(1200); await dismiss(); } await shot('37b-home-care'); await click('.care-alert'); await sleep(700); await shot('37c-kitchen');
  await click('.fx[data-id="fx_bowl"]'); await sleep(300); await click('[data-food="f_fish"]'); await sleep(2200); await shot('38-fed');
  await click('.fx[data-id="fx_water"]'); await sleep(1500);
  await click('#hshop'); await sleep(400); await shot('39-shop-home'); await click('.item[data-f="unicorn"]'); await click('#buyg'); await sleep(300); await click('.item[data-f="teddy"]'); await click('#buy'); await sleep(300);
  await click('.back'); for (let i = 0; i < 4; i++) { await sleep(1300); await dismiss(); } await click('[data-go="house"]'); await sleep(500); await click('.rtab[data-r="play"]'); await sleep(300); await click('#invb'); await sleep(300); await shot('40-tray'); await click('[data-put="unicorn"]'); await sleep(900);
  { const R = await (await p.$('#room')).boundingBox(); await p.mouse.move(R.x + R.width * 0.6, R.y + R.height * 0.8); await p.mouse.down(); await p.mouse.up(); } await sleep(500); await shot('40b-placed');
  await click('#invb'); await click('[data-put="teddy"]'); await sleep(900); { const R = await (await p.$('#room')).boundingBox(); console.log('DBG ghost', !!(await p.$('#ghost')), JSON.stringify(R)); await p.mouse.click(R.x + R.width * 0.15, R.y + R.height * 0.85); console.log('DBG placed', await p.evaluate(() => JSON.stringify(S.place.play))); } await sleep(400);
  await click('.fx[data-id="fx_yarn"]'); await sleep(2000); await click('.fx[data-id="unicorn"]'); await sleep(1200); await shot('41-play'); await sleep(2500);
  { const el = await p.$('.fx[data-id="teddy"]'); const bb = await el.boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(bb.x + 250, bb.y - 40, { steps: 10 }); await p.mouse.up(); } await sleep(400); await shot('42-dragged');
  await click('.rtab[data-r="bedroom"]'); await sleep(300); await click('.fx[data-id="fx_bed"]'); await sleep(2200); await shot('43-sleep'); await sleep(4000);
  await click('.rtab[data-r="bath"]'); await sleep(300); await p.evaluate(() => { S.care.clean = 10; save(); }); await click('.fx[data-id="fx_tub"]'); await sleep(1800); await shot('44-bath'); await sleep(4500);
  await click('.back'); await sleep(1500); await dismiss(); await click('[data-go="chat"]'); await sleep(500); await p.type('#cin', 'Привет! Какое твоё любимое лакомство?'); await click('#csend'); await sleep(9000); await shot('45-chat');
  console.log('CHAT:', await p.$eval('#csay', e => e.innerText));
  console.log('MISSES:', [...misses].join(' | ') || 'none');
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none');
  await b.close();
})().catch(e => { console.error('FAIL', e); console.log(errors.join('\n')); process.exit(1); });
