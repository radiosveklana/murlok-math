const puppeteer = require('puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 820, height: 1180 });
  await p.goto('http://localhost:8765/'); await p.waitForSelector('#kid');
  await p.evaluate(() => { const y = new Date(); y.setDate(y.getDate() - 1); localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Света', seenVersion: '10', login: { last: dkey(y), day: 2 }, houseV: 2, st: { mul: { done: 5, perfect: 0 }, eq: { done: 0, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } }, care: { food: 90, water: 90, fun: 90, energy: 90, clean: 90, t: Date.now() } }))); });
  await p.goto('http://localhost:8765/'); await sleep(1600);
  console.log('first modal news?', !!(await p.$('.modal .howto')));
  await p.click('.modal #newsOk, .modal [data-close]'); await sleep(1500);
  console.log('login modal after news?', !!(await p.$('.modal #claim')));
  await b.close();
})();
