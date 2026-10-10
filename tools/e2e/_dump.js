const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => console.log('PAGEERR ' + e.message));
  await p.goto('http://localhost:8782/'); await p.waitForSelector('#kid');
  await p.evaluate(() => localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Саша', seenVersion: APP_VERSION, tourDone: 1, login: { last: today(), day: 1 }, xp: 300 }))));
  await p.goto('http://localhost:8782/'); await sleep(1500);
  for (const s of process.argv.slice(2)) {
    await p.evaluate(s => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s); }, s); await sleep(1200);
    const out = await p.evaluate(() => { const walk = (el, d) => d > 3 ? '' : [...el.children].map(c => '  '.repeat(d) + c.tagName.toLowerCase() + (c.id ? '#' + c.id : '') + (c.className && typeof c.className === 'string' ? '.' + c.className.trim().split(/\s+/).join('.') : '') + (c.dataset.go ? '[go=' + c.dataset.go + ']' : '') + ' ' + (c.children.length ? '' : (c.textContent || '').trim().slice(0, 30)) + '\n' + walk(c, d + 1)).join(''); return curScreen + '\n' + walk(document.getElementById('app'), 0); });
    console.log(out.slice(0, 3000));
  }
  await b.close();
})();
