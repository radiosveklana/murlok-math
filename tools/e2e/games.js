const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/'); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Света', seenVersion: '16', login: { last: today(), day: 1 }, houseV: 2, care: { food: 90, water: 90, fun: 90, energy: 90, clean: 90, t: Date.now() } }))); });
  await p.goto('http://localhost:8765/'); await sleep(1200);
  await p.evaluate(() => go('games')); await sleep(500); await p.screenshot({ path: __dirname + '/shots/G-hub.png' });
  const ev = s => Function('return (' + s.replace(/×/g, '*').replace(/·/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();
  const key = async k => { await p.keyboard.press(k); await sleep(30); };
  // весы: проходим 5 раундов
  await p.evaluate(() => go('game', 'scales')); await sleep(500); await p.screenshot({ path: __dirname + '/shots/G-scales.png' });
  for (let i = 0; i < 40; i++) {
    if (await p.$('.g-result')) break;
    if (await p.$('#gn')) { await p.click('#gn'); await sleep(400); continue; }
    if (await p.$('#sin')) { const r = await p.evaluate(() => { const t = document.querySelector('.eqline').innerText; return t; }); const m = r.match(/(?:(\d+) · )?x(?: \+ (\d+))? = (\d+)/); const a = +(m[1] || 1), bb = +(m[2] || 0), c = +m[3]; for (const ch of String((c - bb) / a)) await key(ch); await key('Enter'); await sleep(500); continue; }
    const opts = await p.$$('#sq .opt'); for (const o of opts) { const t = await o.evaluate(e => e.innerText); if (/обеих|Разделить/.test(t)) { await o.click(); break; } } await sleep(800);
  }
  await p.screenshot({ path: __dirname + '/shots/G-scales-end.png' });
  for (const id of ['interro', 'safe', 'estimate', 'memo', 'chase', 'logic', 'pattern']) {
    await p.evaluate(id => go('game', id), id); await sleep(700); await p.screenshot({ path: __dirname + `/shots/G-${id}.png` });
    if (id === 'interro') { await p.click('.wit .lie'); await sleep(500); await p.screenshot({ path: __dirname + '/shots/G-interro2.png' }); }
    if (id === 'estimate' || id === 'pattern') { await p.click('.opt'); await sleep(400); }
    if (id === 'memo') { const cs = await p.$$('.mc'); await cs[0].click(); await cs[1].click(); await sleep(1100); }
    if (id === 'logic') { const cs = await p.$$('.lc'); await cs[0].click(); await p.click('#lchk'); await sleep(400); }
    if (id === 'safe') { const t = await p.$eval('.ask-eq', e => e.innerText); const v = ev(t.split('=')[0]); for (const ch of String(v)) await key(ch); await key('Enter'); await sleep(1000); await p.screenshot({ path: __dirname + '/shots/G-safe2.png' }); }
  }
  // возмущение подозреваемых: на 3-м вопросе сердится, на 5-м молчит
  await p.evaluate(() => { startCase('mix', 1); }); await sleep(800);
  await p.click('.ask-b'); await sleep(300); for (let i = 0; i < 4; i++) { await p.click('#ask'); await sleep(250); }
  const st = await p.evaluate(() => ({ angry: !!document.querySelector('.modal .interro-say.angry'), mute: document.querySelector('#ask').disabled }));
  console.log(st.angry && st.mute ? 'INTERRO OK' : 'INTERRO FAIL ' + JSON.stringify(st));
  console.log('errs:', errs.join(' | ') || 'none'); await b.close();
})();
