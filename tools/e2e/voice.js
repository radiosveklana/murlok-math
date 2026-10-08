const puppeteer = require('puppeteer-core');
(async () => {
  const URL = process.env.URL || 'http://localhost:8765/';
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + require('path').resolve('q.wav'), '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Света', seenVersion: '15', login: { last: today(), day: 1 }, houseV: 2, care: { food: 90, water: 90, fun: 90, energy: 90, clean: 90, t: Date.now() } }))); });
  await p.goto(URL); await new Promise(r => setTimeout(r, 1200));
  await p.evaluate(() => go('chat')); await new Promise(r => setTimeout(r, 600));
  const t0 = Date.now(); await p.click('#mic');
  for (let i = 0; i < 60; i++) { await new Promise(r => setTimeout(r, 500)); const n = await p.$$eval('.msg.cat', x => x.length); if (n) break; }
  let talked = false; for (let i = 0; i < 40; i++) { if (await p.evaluate(() => document.body.classList.contains('cat-talking'))) { talked = true; break; } await new Promise(r => setTimeout(r, 500)); }
  // текстовый вопрос тоже должен быть озвучен
  await new Promise(r => setTimeout(r, 6000)); await p.type('#cin', 'Какой твой любимый цвет?'); await p.click('#csend');
  let talked2 = false; for (let i = 0; i < 50; i++) { if (await p.evaluate(() => document.body.classList.contains('cat-talking'))) { talked2 = true; break; } await new Promise(r => setTimeout(r, 500)); }
  console.log(talked && talked2 ? 'VOICE OK' : 'VOICE FAIL', 'voice-question-spoken:', talked, 'text-question-spoken:', talked2);
  console.log('sec', (Date.now() - t0) / 1000, 'log:', JSON.stringify(await p.$$eval('.msg', x => x.map(e => e.className.split(' ')[1] + ': ' + e.innerText))), 'errs', errs.join('|'));
  await p.screenshot({ path: __dirname + '/shots/voice.png' }); await b.close();
})();
