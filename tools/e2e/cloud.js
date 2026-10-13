// облачная копия на НАСТОЯЩЕМ локальном сервере (не на проде): ребёнок из семьи сохраняет прогресс со своим токеном,
// «новое устройство» восстанавливает его только с токеном; устройство без семьи — по коду, как раньше.
// Запуск: node tools/e2e/cloud.js   (URL — статика, по умолчанию http://localhost:8765/app/; CLOUD_API_PORT — порт сервера API, по умолчанию 3931)
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const URL = process.env.URL || 'http://localhost:8765/app/', ORIGIN = new (require('url').URL)(URL).origin, PORT = +process.env.CLOUD_API_PORT || 3931, API = 'http://127.0.0.1:' + PORT;
  const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'mcloud-')), MAIL = path.join(DATA, 'mail.log');
  const srv = spawn(process.execPath, [path.resolve(__dirname, '../../server/server.mjs')], { env: { ...process.env, PORT: String(PORT), DATA_DIR: DATA, MAIL_LOG: MAIL, ALLOW_ORIGINS: ORIGIN, TG_TOKEN: '', ANTHROPIC_API_KEY: '', SMTP_HOST: '' }, stdio: 'ignore' });
  const done = () => { try { srv.kill(); } catch (e) { } try { fs.rmSync(DATA, { recursive: true, force: true }); } catch (e) { } };
  process.on('exit', done);
  for (let i = 0; i < 40; i++) { try { await fetch(API + '/health'); break; } catch (e) { await sleep(250); } }
  const J = async (p, body, tok) => { const r = await fetch(API + p, { method: body ? 'POST' : 'GET', headers: { origin: ORIGIN, 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
  // семья и ребёнок (через API)
  await J('/acc/start', { email: 'cloud@test.ru' }); const code = JSON.parse(fs.readFileSync(MAIL, 'utf8').trim().split('\n').pop()).text.match(/(\d{6})/)[1];
  const v = await J('/acc/verify', { email: 'cloud@test.ru', code, consent: true }), ptok = v.body.token;
  const ch = await J('/acc/child', { name: 'ТестРобот', pin: [1, 2, 3], cloudCode: 'CLOUDK01' }, ptok), ctok = ch.body.token;
  // устройство без семьи: старое сохранение по коду
  await J('/save', { code: 'FREEK001', data: { v: 1, kid: 'Свободный', name: 'Мурлок', xp: 11, candies: 2 } });

  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const errs = [];
  const p = await b.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.evaluateOnNewDocument((api, tok) => { try { localStorage.setItem('murlok-api-base', api); localStorage.setItem('murlok-acc:murlok-detective-v1', JSON.stringify({ token: tok, childId: 'x', familyCode: 'TEST01', name: 'ТестРобот' })); } catch (e) { } }, API, ctok);
  const AV = (fs.readFileSync(path.resolve(__dirname, '../../app.js'), 'utf8').match(/APP_VERSION = '(\d+)'/) || [])[1] || '1', dk = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  await p.evaluateOnNewDocument(sv => { try { if (!localStorage.getItem('murlok-detective-v1')) localStorage.setItem('murlok-detective-v1', JSON.stringify(sv)); } catch (e) { } }, { v: 1, name: 'Мурзик', kid: 'ТестРобот', xp: 4321, candies: 77, cloudCode: 'CLOUDK01', seenVersion: AV, rankV: 2, login: { last: dk(new Date()), day: 1 } });
  await p.goto(URL); await sleep(1500);
  const dbg = await p.evaluate(async () => { cloudDirty = true; const pr = cloudPush(); await new Promise(r => setTimeout(r, 2500)); return JSON.stringify({ pr: !!pr, linked: Accounts.linked(), off: cloudOff(), kid: S.kid, code: S.cloudCode, hdr: cloudHdr() }); }); if (process.env.DBG) console.log(dbg);
  const sv = JSON.parse(fs.readFileSync(path.join(DATA, 'saves', 'CLOUDK01.json'), 'utf8'));
  const saved = sv.xp === 4321 && sv.kid === 'ТестРобот';
  // новое устройство со своим токеном ребёнка — восстановление работает
  const ctx = await b.createBrowserContext(); const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.evaluateOnNewDocument((api, tok) => { try { localStorage.setItem('murlok-api-base', api); localStorage.setItem('murlok-acc:murlok-detective-v1', JSON.stringify({ token: tok, childId: 'x', familyCode: 'TEST01', name: 'ТестРобот' })); } catch (e) { } }, API, ctok);
  await q.goto(URL); await q.waitForSelector('#kid'); await q.evaluate(() => { cloudRestore('CLOUDK01').catch(() => { }); }).catch(() => { }); await sleep(2500);
  const st = await q.evaluate(() => ({ kid: S.kid, xp: S.xp, candies: S.candies }));
  // чужое устройство без токена — код семьи не открывается; код устройства без семьи — открывается
  const ctx2 = await b.createBrowserContext(); const w = await ctx2.newPage(); w.on('pageerror', e => errs.push(e.message));
  await w.evaluateOnNewDocument(api => { try { localStorage.setItem('murlok-api-base', api); } catch (e) { } }, API);
  await w.goto(URL); await w.waitForSelector('#restore'); await w.click('#restore'); await w.waitForSelector('#rcode'); await w.type('#rcode', 'CLOUDK01'); await w.click('#rgo'); await sleep(1500);
  const refused = await w.evaluate(() => /не найден/.test((document.querySelector('#rerr') || {}).textContent || '') && !S.kid);
  await w.evaluate(() => { document.querySelector('#rcode').value = ''; }); await w.type('#rcode', 'FREEK001'); await w.click('#rgo'); await sleep(2500);
  const free = await w.evaluate(() => ({ kid: S.kid, xp: S.xp }));
  const good = saved && st.kid === 'ТестРобот' && st.xp === 4321 && st.candies === 77 && refused && free.kid === 'Свободный' && free.xp === 11;
  console.log(good ? 'CLOUD OK' : 'CLOUD FAIL ' + JSON.stringify({ saved, st, refused, free }), 'errs:', errs.join(' | ') || 'none');
  await b.close(); done(); process.exit(good ? 0 : 1);
})();
