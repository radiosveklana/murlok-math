// Пользовательский путь «от сайта до дуэлей» на НАСТОЯЩЕМ локальном сервере (server/server.mjs) — без моков.
// Несколько браузеров сразу: мама, папа, планшет ребёнка, телефон ребёнка, другая семья.
// Запуск: node tools/e2e/journey.js   (сам поднимает сервер API на :3916 с временной папкой данных и статику на :8766)
// Письма с кодами пишутся в файл (MAIL_LOG), клиент ходит в локальный API через localStorage 'murlok-api-base' (работает только на localhost).
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '../..'), API_PORT = 3916, WEB_PORT = 8766;
const API = `http://127.0.0.1:${API_PORT}`, WEB = `http://localhost:${WEB_PORT}`, APP = WEB + '/app/';
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'mjourney-')), MAIL = path.join(DATA, 'mail.log');
const ONLY = process.argv[2] || ''; // можно запустить часть: node journey.js duels
const sleep = ms => new Promise(r => setTimeout(r, ms));
let n = 0, fails = 0; const errors = [];
const ok = (name, c, x = '') => { n++; if (!c) fails++; console.log((c ? 'JOURNEY OK ' : 'JOURNEY FAIL ') + name + (x ? ' ' + x : '')); return c; };

/* ---------- сервер и статика ---------- */
const salt = crypto.randomBytes(8).toString('hex');
const env = { ...process.env, PORT: String(API_PORT), DATA_DIR: DATA, MAIL_LOG: MAIL, ALLOW_ORIGINS: WEB, GOD_EMAILS: 'god@test.ru', ADMIN_USER: 'adm', ADMIN_HASH: salt + ':' + crypto.scryptSync('secret', salt, 32).toString('hex'), TG_TOKEN: '', ANTHROPIC_API_KEY: '', SMTP_HOST: '' };
const procs = [];
const startProc = (args, opts) => { const p = spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], ...opts }); procs.push(p); p.stderr.on('data', d => { const t = String(d); if (!/ExperimentalWarning/.test(t)) process.stderr.write('[srv] ' + t); }); return p; };
const cleanup = () => { procs.forEach(p => { try { p.kill(); } catch (e) { } }); try { fs.rmSync(DATA, { recursive: true, force: true }); } catch (e) { } };
process.on('exit', cleanup); process.on('SIGINT', () => process.exit(1));
async function waitUrl(u) { for (let i = 0; i < 60; i++) { try { const r = await fetch(u); if (r.status < 500) return true; } catch (e) { } await sleep(250); } throw new Error('не поднялся ' + u); }
const mails = () => fs.existsSync(MAIL) ? fs.readFileSync(MAIL, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : [];
const lastCode = email => { const m = mails().filter(x => x.to === email && /Код входа/.test(x.subject)).pop(); return m && m.text.match(/(\d{6})/)[1]; };
const apiJ = async (p, body, tok) => { const r = await fetch(API + p, { method: body ? 'POST' : 'GET', headers: { origin: WEB, 'content-type': 'application/json', ...(tok ? { authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const accounts = () => JSON.parse(fs.readFileSync(path.join(DATA, 'accounts.json'), 'utf8'));
const until = async (fn, t = 5000) => { const end = Date.now() + t; while (Date.now() < end) { try { if (await fn()) return true; } catch (e) { } await sleep(250); } return false; }; // accounts.json пишется раз в 2 с
const saveOf = code => { try { return JSON.parse(fs.readFileSync(path.join(DATA, 'saves', code + '.json'), 'utf8')); } catch (e) { return null; } };

/* ---------- браузеры ---------- */
let browser;
async function person(name, vp = { width: 390, height: 844 }) {
  const ctx = await browser.createBrowserContext(), p = await ctx.newPage();
  await p.setViewport({ ...vp, isMobile: vp.width < 700, hasTouch: true });
  await p.setBypassServiceWorker(true);
  await p.evaluateOnNewDocument(api => { try { if (location.hostname === 'localhost') { localStorage.setItem('murlok-api-base', api); localStorage.setItem('murlok-strict-gate', '1'); } } catch (e) { } }, API);
  p.on('pageerror', e => errors.push(name + ' PAGEERR ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/favicon|vibrate|Failed to load resource|tts|404|401|400|net::ERR/.test(m.text())) errors.push(name + ' CONSOLE ' + m.text()); });
  p.on('dialog', d => d.accept());
  const E = (f, ...a) => p.evaluate(f, ...a);
  const H = {
    p, name, E,
    close: () => E(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); document.querySelectorAll('.toast').forEach(t => t.remove()); }),
    go: async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(700); },
    click: async (sel, t = 8000) => { await p.waitForSelector(sel, { visible: true, timeout: t }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); try { await p.click(sel); } catch (e) { await E(s => document.querySelector(s).click(), sel); } await sleep(350); },
    clickText: async (sel, re, t = 8000) => { const end = Date.now() + t; while (Date.now() < end) { const hit = await E((sel, src) => { const r = new RegExp(src); const b = [...document.querySelectorAll(sel)].find(x => r.test(x.innerText) && x.offsetParent !== null); if (b) { b.click(); return true; } return false; }, sel, re.source); if (hit) { await sleep(350); return true; } await sleep(200); } throw new Error(`нет кнопки ${sel} /${re.source}/`); },
    type: async (sel, v) => { await p.waitForSelector(sel, { visible: true, timeout: 8000 }); await E(s => { const i = document.querySelector(s); i.value = ''; }, sel); await p.type(sel, v); },
    text: () => E(() => document.body.innerText),
    has: async re => re.test(await E(() => document.body.innerText)),
    waitText: async (re, t = 8000) => { const end = Date.now() + t; while (Date.now() < end) { if (re.test(await E(() => document.body.innerText).catch(() => ''))) return true; await sleep(250); } return false; },
    screen: () => E(() => typeof curScreen !== 'undefined' ? curScreen : ''),
    waitScreen: async (s, t = 8000) => { const end = Date.now() + t; while (Date.now() < end) { if (await E(() => typeof curScreen !== 'undefined' ? curScreen : '').catch(() => '') === s) return true; await sleep(200); } return false; },
    S: k => E(k => (k ? S[k] : S), k),
    push: async () => { await E(() => { cloudDirty = true; cloudPush(); }); await sleep(600); },
    reload: async () => { await p.reload(); await sleep(1800); },
    overflow: () => E(() => { const w = document.documentElement.clientWidth; const bad = [...document.querySelectorAll('#app *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > w + 1 || r.left < -1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.room,.tabs,.seg,.room-tabs,.hs-row,.scroll-x,[style*="overflow"]'); }); return { sw: document.documentElement.scrollWidth, w, bad: bad.slice(0, 3).map(b => b.tagName + '.' + b.className + ' ' + Math.round(b.getBoundingClientRect().right)) }; }),
  };
  return H;
}
// ввод почты и кода: регистрация / вход взрослого (на текущем экране pauth)
async function adultLogin(U, email, { consent = true, invited = false } = {}) {
  await U.waitScreen('pauth'); await U.type('#aem', email); await U.click('#asend');
  await U.p.waitForSelector('#acode', { visible: true, timeout: 8000 }); await sleep(300);
  const code = lastCode(email); if (!code) throw new Error('нет письма для ' + email);
  if (invited) ok(U.name + ': invitation text on login', await U.has(/Вас пригласил/));
  await U.type('#acode', code);
  if (await U.E(() => !document.querySelector('#acons').hidden)) { if (consent) { await U.E(() => { document.querySelector('#ac1').checked = true; document.querySelector('#ac2') && (document.querySelector('#ac2').checked = true); }); } }
  await U.click('#averify'); await sleep(1500);
}
async function setPin(U, pin = '2580') { if (await U.screen() !== 'pinset') return false; await U.type('#pin1', pin); await U.type('#pin2', pin); await U.click('#pinok'); await sleep(800); return true; }
async function passGate(U, pin = '2580') { if (await U.screen() !== 'agate') return; await U.type('#pinin', pin); await U.click('#pingo'); await sleep(800); }
async function newPlayer(U, kid, cat) { await U.p.goto(APP); await U.p.waitForSelector('#kid', { visible: true }); await U.type('#kid', kid); await U.type('#nm', cat); await U.click('#start'); await U.waitScreen('home'); await sleep(800); await U.close(); }
// «Быстрые лапки» на время: отвечаем count примеров и «перематываем» минуту
async function playPaws(U, count, wrong = 0) {
  for (let i = 0; i < count + wrong; i++) {
    const t = await U.E(() => (document.querySelector('#q') || {}).textContent || ''); const m = t.match(/(\d+)\s*×\s*(\d+)/); if (!m) break;
    const ans = i < count ? String(+m[1] * +m[2]) : String(+m[1] * +m[2] + 1).padStart(String(+m[1] * +m[2]).length, '9');
    for (const ch of ans) await U.p.keyboard.press(ch); await sleep(i < count ? 90 : 1300);
  }
  await U.E(() => { const d0 = Date.now.bind(Date); window.__d0 = d0; Date.now = () => d0() + 61000; }); await sleep(900); await U.E(() => { if (window.__d0) Date.now = window.__d0; });
}
async function playSchulte(U) { const N = await U.E(() => document.querySelectorAll('.schulte .sc').length); for (let v = 1; v <= N; v++) await U.E(v => document.querySelector(`.schulte .sc[data-v="${v}"]`).click(), v); await sleep(900); }
async function playTopic(U) { for (let k = 0; k < 80; k++) { if (await U.E(() => !document.querySelector('#dq'))) break; await U.E(() => { const dq = document.querySelector('#dq'); const okk = dq.querySelector('.k[data-k="ok"]'); if (okk) { dq.querySelector('.k[data-k="1"]').click(); okk.click(); return; } const o = dq.querySelector('.opt:not(.right):not(.wrong)'); if (o) { o.click(); return; } const ords = [...dq.querySelectorAll('.ord:not([disabled])')]; if (ords.length) { ords.forEach(x => x.click()); return; } const any = [...dq.querySelectorAll('button')].find(x => !x.disabled && !x.classList.contains('on')); if (any) any.click(); }); await sleep(700); } await sleep(1500); }

async function journey() {
  const ctx = {}; // кто есть кто
  /* ===== 1. Сайт → «Играть» → три дороги ===== */
  const K = await person('kid-tablet', { width: 800, height: 1180 }); ctx.K = K;
  await K.p.goto(WEB + '/'); await sleep(800);
  ok('site: landing opens (no auto-redirect for a new visitor)', /\/$/.test(K.p.url()) && await K.has(/Мурлок/));
  await K.clickText('a.btn', /Играть/); await sleep(1500);
  ok('site «Играть» → app hello', /\/app\/$/.test(K.p.url()) && await K.screen() === 'hello', K.p.url());
  await K.p.goto(APP + '?choose=1'); await sleep(1200);
  ok('hello: three roads (adult, family code, just play)', await K.E(() => [...document.querySelectorAll('.hl-roads .road')].map(b => b.id).join() === 'aparent,achild,atry'));
  /* ===== 2. «Просто поиграть» → играет → зовёт взрослого ===== */
  await K.click('#atry'); await K.type('#kid', 'Василиса'); await K.type('#nm', 'Мурка'); await K.click('#start'); await K.waitScreen('home'); await sleep(800); await K.close();
  ok('just play: home without registration', await K.S('kid') === 'Василиса' && !(await K.E(() => Accounts.linked())));
  await K.go('blitz'); await K.click('#go'); await sleep(400); await playPaws(K, 6); await sleep(500);
  ok('kid plays «Быстрые лапки» locally', (await K.S('xp')) >= 6 && /верных ответов: 6/.test(await K.text()), String(await K.S('xp')));
  await K.go('home'); await sleep(600);
  ok('unlinked kid: nudge «Позвать взрослого»', await K.has(/Позвать взрослого/));
  await K.go('board'); ok('unlinked kid: board explains the family way', await K.has(/Вместе со взрослым/));
  await K.go('friends'); ok('unlinked kid: friends explains the family way', await K.has(/вместе со взрослым/i));
  await K.go('home'); await sleep(500); await K.click('#nudgeGo');
  ok('nudge → adult login', await K.screen() === 'pauth');
  /* ===== 3. Мама регистрируется прямо на планшете ребёнка: игра привязывается сама ===== */
  await adultLogin(K, 'mama@test.ru');
  ok('mama registered (consent) on kid tablet → PIN for adult section', await setPin(K, '2580'), await K.screen());
  await sleep(1500);
  ok('kid game auto-linked to the new family', await K.E(() => Accounts.linked()) && /Василиса/.test(JSON.stringify(accounts().children)));
  ok('cabinet opens after PIN', await K.waitScreen('pcab') && await K.waitText(/Семейный код/));
  ctx.famCode = await K.E(() => (document.querySelector('.ccode') || {}).textContent);
  ok('family code shown', /^[A-Z0-9]{6}$/.test(ctx.famCode || ''), ctx.famCode);
  await K.push(); await sleep(500);
  const vas = Object.values(accounts().children).find(c => c.name === 'Василиса'); ctx.vas = vas;
  ok('kid progress is in the cloud after linking', (saveOf(vas.cloudCode) || {}).xp >= 6);
  /* ===== 4. Телефон ребёнка: вход по семейному коду, прогресс не теряется ===== */
  const K2 = await person('kid-phone', { width: 360, height: 740 }); ctx.K2 = K2;
  await K2.p.goto(APP + '?choose=1'); await sleep(1000); await K2.click('#achild');
  await K2.type('#fcode', ctx.famCode.toLowerCase()); await K2.click('#fgo');
  await K2.clickText('.prof', /Василиса/); await K2.click('#cgo'); await sleep(3000);
  ok('kid phone: login by family code loads the same progress', await K2.S('kid') === 'Василиса' && (await K2.S('xp')) === (await K.S('xp')) && await K2.E(() => Accounts.linked()), `${await K2.S('xp')} vs ${await K.S('xp')}`);
  await K2.close();
  /* ===== 5. Мама на своём телефоне: вход, приглашение папы, «Играть самому» ===== */
  const M = await person('mama-phone'); ctx.M = M;
  await M.p.goto(APP + '?choose=1'); await sleep(1000); await M.click('#aparent');
  await adultLogin(M, 'mama@test.ru');
  ok('mama phone: existing account → cabinet (no consent again)', await M.waitScreen('pcab') && await M.waitText(/Василиса/));
  await M.E(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; }));
  await M.type('#iemail', 'papa@test.ru'); await M.click('#irole .chip[data-r="Второй родитель"]'); await M.click('#iadd'); await sleep(1200);
  ok('invite sent to papa by email', mails().some(m => m.to === 'papa@test.ru' && /Приглашение/.test(m.subject)));
  const F = await person('papa-phone'); ctx.F = F;
  await F.p.goto(APP + '?choose=1'); await sleep(1000); await F.click('#aparent');
  await adultLogin(F, 'papa@test.ru', { invited: true });
  ok('papa joins the same family and sees the kid', await F.waitScreen('pcab') && await F.waitText(/Василиса/) && await F.has(new RegExp(ctx.famCode)));
  await M.go('pcab'); await M.waitText(/Играть самому/);
  await M.click('#gp-go'); await sleep(3500);
  ok('mama «Играть самому» → her own adult player on her phone', await M.S('role') === 'adult' && await M.S('kid') === 'Мама' && await M.E(() => Accounts.linked()), JSON.stringify([await M.S('role'), await M.S('kid')]));
  await M.close(); await M.go('blitz'); await M.click('#go'); await sleep(300); await playPaws(M, 12); await sleep(400); // без принудительной отправки: «Успехи» сами отправляют свежий прогресс
  /* ===== 6. «Успехи»: мама и ребёнок видят друг друга и свои цифры ===== */
  await M.go('board'); await M.waitText(/опыта/);
  ok('mama board: herself (adult) + Vasilisa', await M.E(() => { const t = document.querySelector('#fmp').innerText; return /Мама \(ты\)/.test(t) && /Василиса/.test(t) && /взрослый/.test(t); }));
  ok('mama board: her blitz XP is counted', await M.E(() => { const r = document.querySelector('.fm-row.me'); return r && +(r.querySelector('.fm-xp').innerText.match(/\d+/) || [0])[0] >= 12; }), await M.E(() => (document.querySelector('.fm-row.me') || {}).innerText));
  await K.go('board'); await K.waitText(/опыта/);
  ok('kid board (no PIN asked): Vasilisa + Mama', await K.screen() === 'board' && await K.E(() => /Василиса \(ты\)/.test(document.querySelector('#fmp').innerText) && /Мама/.test(document.querySelector('#fmp').innerText)));
  ok('kid board: her XP is counted', await K.E(() => { const r = document.querySelector('.fm-row.me'); return r && +(r.querySelector('.fm-xp').innerText.match(/\d+/) || [0])[0] >= 6; }), await K.E(() => (document.querySelector('.fm-row.me') || {}).innerText));
  /* ===== 7. Дуэль: мама вызывает ребёнка на «Быстрые лапки» ===== */
  ctx.vasId = ctx.vas.id;
  await M.click(`[data-duel="${ctx.vasId}"]`); await M.click('.modal [data-g="paws"]'); await M.waitScreen('duelplay'); await M.click('#dgo'); await sleep(300);
  await playPaws(M, 9); await sleep(800);
  ok('mama: challenge sent screen with her result', await M.waitText(/Вызов отправлен/) && await M.has(/9 верных/));
  await K.go('home'); let got = false; for (let t = 0; t < 12 && !got; t++) { await sleep(1000); got = await K.E(() => !!document.querySelector('.modal #dacc')); if (!got) await K.E(() => document.querySelectorAll('.modal').forEach(m => { if (!m.querySelector('#dacc')) m.remove(); })); }
  if (!ok('kid: incoming duel invitation pops up on home', got && await K.has(/Мама бросила тебе вызов/))) { console.log('DBG duels', JSON.stringify(accounts().duels)); console.log('DBG K', await K.screen(), await K.E(() => [...document.querySelectorAll('.modal')].map(m => m.innerText.slice(0, 80)).join(' | ')), await K.E(() => JSON.stringify(Accounts.child()))); }
  await K.click('#dacc'); await K.waitScreen('duelplay'); ok('kid duel screen shows mama result', await K.has(/9 верных/));
  const xp0 = await K.S('xp'), days0 = await K.E(() => S.days[today()] || 0);
  await K.click('#dgo'); await sleep(300); await playPaws(K, 4); await sleep(1200);
  ok('kid: result screen shows both results and winner', await K.waitText(/победила Мама|Победа|Ничья/) && await K.has(/4 верных/) && await K.has(/9 верных/), (await K.text()).slice(0, 300));
  ok('kid: duel game counts as play (xp + tasks)', (await K.S('xp')) > xp0 && (await K.E(() => S.days[today()] || 0)) > days0, `${xp0}→${await K.S('xp')}`);
  ok('mama: waiting screen updates by itself to the final result', await M.waitText(/Победа!/, 15000) && await M.has(/4 верных/), (await M.text()).slice(0, 200));
  await K.click('.row-btns [data-go="duels"]'); await K.waitText(/История вызовов/);
  ok('kid: duel in history with both results', await K.E(() => { const t = document.querySelector('#fmp').innerText; return /История вызовов/.test(t) && /4 верных/.test(t) && /9 верных/.test(t); }));
  await M.go('duels'); await M.waitText(/История вызовов|Ждём соперника/);
  ok('mama: duel result visible in her history', await M.E(() => { const t = document.querySelector('#fmp').innerText; return /История вызовов/.test(t) && /4 верных/.test(t) && /9 верных/.test(t); }), (await M.E(() => document.querySelector('#fmp').innerText)).slice(0, 300));
  ok('mama: winner reward claimed once', await M.waitText(/Победа над Василис/, 3000) || (accounts().duels && Object.values(accounts().duels).some(d => d.claimed && Object.keys(d.claimed).length)));
  await M.go('board'); await M.waitText(/опыта/);
  ok('mama board: win counted (⚔️ 1)', await M.E(() => /⚔️ 1/.test((document.querySelector('.fm-row.me') || {}).innerText || '')));
  /* ===== 8. Ребёнок вызывает маму на Шульте 4×4 из вкладки «Вызовы» ===== */
  await K.go('duels'); await K.waitText(/Бросить вызов/);
  await K.clickText('.fm-person', /Мама/); await K.click('.modal [data-g="schulte4"]'); await K.waitScreen('duelplay'); await K.click('#dgo'); await playSchulte(K);
  ok('kid → mama schulte: sent', await K.waitText(/Вызов отправлен/));
  await M.go('home'); got = false; for (let t = 0; t < 12 && !got; t++) { await sleep(1000); got = await M.E(() => !!document.querySelector('.modal #dacc')); if (!got) await M.E(() => document.querySelectorAll('.modal').forEach(m => { if (!m.querySelector('#dacc')) m.remove(); })); }
  ok('mama (adult player) gets the kid challenge on home', got && await M.has(/Василиса бросила тебе вызов/));
  await M.click('#dacc'); await M.click('#dgo'); await playSchulte(M);
  ok('mama: schulte result screen with both times', await M.waitText(/Победа|Ничья|победила/) && await M.E(() => document.querySelectorAll('.fm-score > div').length === 2 && [...document.querySelectorAll('.fm-score > div > span:last-child')].every(s => /\d с/.test(s.innerText))));
  await K.go('duels'); await K.waitText(/История вызовов/);
  ok('kid: schulte duel in history (2 duels done)', await K.E(() => document.querySelectorAll('#fmp .card:last-child .fm-duel').length >= 2));
  /* ===== 9. Блиц по теме: мама → ребёнок ===== */
  await M.go('board'); await M.waitText(/опыта/); await M.click(`[data-duel="${ctx.vasId}"]`); await M.click('.modal [data-g="topic"]'); await M.click('.modal [data-u]'); await M.waitScreen('duelplay'); await M.click('#dgo'); await sleep(500); await playTopic(M);
  ok('mama: topic duel sent', await M.waitText(/Вызов отправлен/, 15000), (await M.text()).slice(0, 200));
  await M.go('home'); await sleep(500);
  await K.go('duels'); await K.waitText(/Тебе бросили вызов/); await K.click('[data-play]'); await K.click('#dgo'); await sleep(500); await playTopic(K);
  ok('kid: topic duel finished with both results', await K.waitText(/из 10/, 15000) && await K.E(() => document.querySelectorAll('.fm-score > div > span:last-child').length === 2 && ![...document.querySelectorAll('.fm-score > div > span:last-child')].some(s => /ещё не/.test(s.innerText))));
  await M.go('home'); got = false; for (let t = 0; t < 12 && !got; t++) { await sleep(1000); got = await M.E(() => /Итог вызова/.test((document.querySelector('.modal') || {}).innerText || '')); if (!got) await M.E(() => document.querySelectorAll('.modal').forEach(m => { if (!/Итог вызова/.test(m.innerText)) m.remove(); })); }
  ok('mama on home: «Итог вызова» pops up with both results, reward given', got && await M.E(() => document.querySelectorAll('.modal .fm-score > div').length === 2) && await until(() => Object.values(accounts().duels).filter(d => d.game === 'topic').every(d => d.claimed && Object.keys(d.claimed).length >= 1)));
  await M.close();
  /* ===== 10. Кабинет: взрослый видит последние вызовы ===== */
  await F.go('pcab'); await F.waitText(/Последние вызовы/, 10000);
  ok('papa cabinet: recent duels with names and results', await F.E(() => { const t = (document.querySelector('.fm-recent') || {}).innerText || ''; return /Мама/.test(t) && /Василиса/.test(t) && /9 верных/.test(t) && /4 верных/.test(t); }), await F.E(() => ((document.querySelector('.fm-recent') || {}).innerText || '').slice(0, 200)));
  /* ===== 11. Два устройства одного ребёнка: отставшее не затирает прогресс ===== */
  const xpTab = await K.S('xp'); await K.push();
  ok('tablet progress (with duels) is in the cloud', (saveOf(ctx.vas.cloudCode) || {}).xp === xpTab, `${(saveOf(ctx.vas.cloudCode) || {}).xp} vs ${xpTab}`);
  await K2.E(() => { award(0, 1); cloudDirty = true; cloudPush(); }); await sleep(1500);
  ok('stale phone does not overwrite tablet progress', (saveOf(ctx.vas.cloudCode) || {}).xp === xpTab);
  ok('stale phone asks to continue from the fresher progress', await K2.waitText(/На другом устройстве ты ушла дальше/, 5000));
  await K2.click('#csYes'); await sleep(2500);
  ok('phone continues from tablet progress', (await K2.S('xp')) === xpTab, `${await K2.S('xp')} vs ${xpTab}`);
  /* ===== 12. Один планшет на двоих: мама играет на планшете ребёнка, переключение через замок ===== */
  await K.close(); await K.E(() => openSettings()); await sleep(400); await K.click('#set-adult'); await passGate(K);
  ok('adult section from kid profile asks PIN, then opens', await K.waitScreen('parents'));
  await K.go('pcab'); await passGate(K); await K.waitText(/Играть самому/); await K.click('#gp-go'); await sleep(4000);
  ok('mama plays on the kid tablet: her cloud progress loaded', await K.S('role') === 'adult' && await K.S('kid') === 'Мама' && (await K.S('xp')) >= 12, JSON.stringify([await K.S('kid'), await K.S('xp')]));
  await K.close(); await K.E(() => Extras.openProfiles()); await sleep(400);
  ok('«Кто играет?»: only family players (Mama, Vasilisa)', await K.E(() => [...document.querySelectorAll('.modal .prof b')].map(b => b.innerText).sort().join() === 'Василиса,Мама'));
  await K.clickText('.modal .prof', /Василиса/); await sleep(3500);
  ok('adult switches back to the kid without PIN', await K.S('kid') === 'Василиса' && await K.S('role') !== 'adult');
  await K.close(); await K.E(() => Extras.openProfiles()); await sleep(400); await K.clickText('.modal .prof', /Мама/); await sleep(800);
  ok('kid → adult profile goes through the lock', await K.screen() === 'agate');
  await passGate(K); await sleep(3500);
  ok('after PIN — mama profile', await K.S('kid') === 'Мама');
  await K.close(); await K.E(() => Extras.openProfiles()); await sleep(300); await K.clickText('.modal .prof', /Василиса/); await sleep(3500); await K.close();
  ok('back to Vasilisa for the rest of the journey', await K.S('kid') === 'Василиса');
  /* ===== 13. Второй ребёнок: папа заводит Петю с картинкой-ПИНом, Петя переносит игру с планшета ===== */
  await F.go('pcab'); await F.waitText(/Добавить ребёнка/); await F.E(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; }));
  await F.type('#kname', 'Петя'); for (const i of [0, 4, 8]) await F.E(i => document.querySelector(`#pk1 .pp[data-i="${i}"]`).click(), i); await F.click('#kadd'); await sleep(2500);
  ok('papa adds Petya with picture PIN', await until(() => /Петя/.test(JSON.stringify(accounts().children))) && await F.waitText(/картинка-ПИН есть/));
  const P = await person('petya-tablet', { width: 800, height: 1180 }); ctx.P = P;
  await newPlayer(P, 'Петя', 'Рыжик'); await P.go('blitz'); await P.click('#go'); await sleep(300); await playPaws(P, 5); await P.go('home');
  const pxp = await P.S('xp'), pcode = await P.E(() => cloudCode());
  await P.go('board'); await P.click('[data-go="clogin"]'); await P.type('#fcode', ctx.famCode); await P.click('#fgo'); await P.clickText('.prof', /Петя/);
  for (const i of [0, 4, 7]) await P.E(i => document.querySelector(`#pkc .pp[data-i="${i}"]`).click(), i); await P.click('#cgo'); await sleep(800);
  ok('wrong picture PIN is rejected', !(await P.E(() => Accounts.linked())));
  for (const i of [0, 4, 8]) await P.E(i => document.querySelector(`#pkc .pp[data-i="${i}"]`).click(), i); await P.click('#cgo'); await sleep(3500);
  const petya = Object.values(accounts().children).find(c => c.name === 'Петя'); ctx.petya = petya;
  ok('Petya: tablet game moved into the family (adopt), progress kept', await P.E(() => Accounts.linked()) && (await P.S('xp')) === pxp && petya.cloudCode === pcode, JSON.stringify([await P.S('xp'), pxp, petya.cloudCode, pcode]));
  await P.close(); await P.go('board'); await P.waitText(/опыта/);
  ok('Petya board: family of three (Mama, Vasilisa, Petya)', await P.E(() => { const t = document.querySelector('#fmp').innerText; return /Петя \(ты\)/.test(t) && /Василиса/.test(t) && /Мама/.test(t); }));
  /* ===== 14. Соня: заведена заранее пустой, мама входит на её устройстве — игра присоединяется к ней ===== */
  await F.go('pcab'); await F.E(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; })); await F.type('#kname', 'Соня'); for (const i of [1, 2, 3]) await F.E(i => document.querySelector(`#pk1 .pp[data-i="${i}"]`).click(), i); await F.click('#kadd'); await sleep(1000);
  const So = await person('sonya-phone', { width: 390, height: 844 });
  await newPlayer(So, 'Соня', 'Снежок'); await So.go('blitz'); await So.click('#go'); await sleep(300); await playPaws(So, 3); await So.go('home'); await sleep(500);
  await So.click('#nudgeGo'); await adultLogin(So, 'mama@test.ru'); await setPin(So, '2580'); await sleep(2500);
  const sonyas = Object.values(accounts().children).filter(c => c.name === 'Соня');
  ok('Sonya: device game attached to the empty child (no duplicate)', sonyas.length === 1 && sonyas[0].cloudCode === await So.E(() => S.cloudCode) && await So.E(() => Accounts.linked()), JSON.stringify(sonyas.map(c => c.cloudCode)));
  /* ===== 15. Друзья: семья — автоматически; другая семья — по кодам и с разрешения взрослых обеих семей ===== */
  await K.go('friends'); await K.waitText(/Мой код друга/);
  ok('kid friends: family members are friends automatically (Petya, Mama)', await K.E(() => { const t = document.querySelector('.fr-list').innerText; return /Петя/.test(t) && /Мама/.test(t) && /семья/.test(t); }));
  const vasPub = await K.E(() => document.querySelector('.fr-me .ccode').textContent.trim());
  const L = await person('liza-tablet', { width: 800, height: 1180 }); ctx.L = L;
  await newPlayer(L, 'Лиза', 'Пушок'); await L.click('#nudgeGo'); await adultLogin(L, 'liza-mama@test.ru'); await setPin(L, '1397'); await sleep(2500);
  ok('another family registers on Liza tablet', await L.E(() => Accounts.linked()));
  await L.go('friends'); await L.waitText(/Мой код друга/); const lizaPub = await L.E(() => document.querySelector('.fr-me .ccode').textContent.trim());
  await L.type('#frc', vasPub); await L.click('#fradd'); await sleep(800);
  await K.go('friends'); await K.waitText(/Хотят дружить|Мой код/);
  ok('kid sees «wants to be friends» from Liza', await K.has(/Хотят дружить/) && await K.has(/Лиза/));
  await K.click('[data-acc]'); await sleep(800);
  ok('codes matched → waiting for adults of both families', await K.waitText(/Ждём разрешения взрослых/));
  await F.go('pcab'); await F.waitText(/Хочет дружить/, 10000); await F.click('[data-fok]'); await sleep(800);
  await L.go('pcab'); await passGate(L, '1397'); await L.waitText(/Хочет дружить/, 10000); await L.click('[data-fok]'); await sleep(800);
  await K.go('friends'); await K.waitText(/Мои друзья/);
  ok('after both approvals — Vasilisa and Liza are friends', await K.E(() => /Лиза/.test(document.querySelector('.fr-list').innerText)));
  await K.go('board'); await K.waitText(/опыта/); await K.click('.fm-scope button[data-s="friends"]'); await sleep(800);
  ok('board «Друзья»: Liza visible, family adults are not', await K.E(() => { const t = document.querySelector('#fmp').innerText; return /Лиза/.test(t) && /Василиса \(ты\)/.test(t) && !/Мама/.test(t); }));
  await K.click(`[data-duel]`); await K.click('.modal [data-g="schulte5"]'); await K.waitScreen('duelplay'); await K.click('#dgo'); await playSchulte(K);
  await L.go('home'); got = false; for (let t = 0; t < 12 && !got; t++) { await sleep(1000); got = await L.E(() => !!document.querySelector('.modal #dacc')); if (!got) await L.E(() => document.querySelectorAll('.modal').forEach(m => { if (!m.querySelector('#dacc')) m.remove(); })); }
  ok('friend from another family gets the duel', got);
  await L.click('#dacc'); await L.click('#dgo'); await playSchulte(L);
  ok('cross-family duel finished', await L.waitText(/Победа|Ничья|победила/));
  /* ===== 16. Челленджи: личный, гонка с подругой, семейный; награда — один раз ===== */
  await K.go('chal'); await K.waitText(/Личный челлендж/); await K.click('[data-solo="solo_tasks"]'); await sleep(800);
  ok('solo challenge started', await K.waitText(/Мои челленджи/) && await K.has(/100 задач за неделю/));
  await K.click('[data-fr="fr_race"]'); await K.clickText('.modal .fm-person', /Лиза/); await K.click('#frgo'); await sleep(800);
  await L.go('chal'); await L.waitText(/Мои челленджи/);
  ok('race appears for Liza automatically', await L.has(/Гонка: кто первым решит 100 задач/));
  await F.go('pcab'); await F.E(() => document.querySelectorAll('#app details').forEach(d => { d.open = true; })); await F.click('[data-cadd="fam_tasks"]'); await sleep(800);
  await K.go('chal'); await K.waitText(/500 задач семьёй/);
  ok('family challenge from papa visible to the kid with members', await K.E(() => { const c = [...document.querySelectorAll('.fm-chal')].find(x => /500 задач семьёй/.test(x.innerText)); return c && /Петя/.test(c.innerText) && /Мама/.test(c.innerText); }));
  await K.E(() => { S.days[today()] = (S.days[today()] || 0) + 120; save(); }); await K.go('chal'); await K.waitText(/Забрать награду/);
  const soloId = Object.values(accounts().chals).find(c => c.tpl === 'solo_tasks').id, cand0 = await K.S('candies'); await K.click('[data-claim="' + soloId + '"]'); await sleep(1000);
  ok('solo challenge reward claimed', (await K.S('candies')) >= cand0 + 30 && await K.has(/Челлендж пройден/));
  await K.close(); await K.go('chal'); await sleep(800);
  ok('reward cannot be claimed twice', await K.E(() => ![...document.querySelectorAll('.fm-chal')].some(c => /100 задач за неделю/.test(c.innerText) && c.querySelector('[data-claim]'))));
  const r2 = await apiJ('/acc/chal/' + Object.values(accounts().chals).find(c => c.tpl === 'solo_tasks').id + '/claim', {}, await K.E(() => Accounts.child().token));
  ok('server refuses the second claim', r2.status === 400 && r2.body.error === 'claimed');
  await M.go('chal'); await M.waitText(/500 задач семьёй/);
  ok('adult player sees the family challenge, reward is for kids', await M.has(/награду за семейный челлендж получают дети/));
  /* ===== 17. Взрослый в своём профиле открывает раздел для взрослых (ПИНа на телефоне ещё нет) ===== */
  await M.close(); await M.E(() => openSettings()); await sleep(400); await M.click('#set-adult');
  ok('adult profile without PIN: lock offers a code by email', await M.screen() === 'agate' && await M.has(/Получить код на почту/));
  await M.click('#gmail'); await adultLogin(M, 'mama@test.ru'); ok('then sets a PIN', await setPin(M, '4682')); await sleep(800);
  ok('and lands in the adult section', await M.waitScreen('parents'));
  /* ===== 18. Время игры: норма, предупреждение, «Пора отдохнуть», +15 минут через замок ===== */
  await M.go('pcab'); await passGate(M, '4682'); await M.waitText(/Время игры/);
  await M.E(id => { const box = document.querySelector(`.lim-kid[data-k="${id}"]`); box.querySelector('.lim-daily .chip[data-d="15"]').click(); box.querySelector('.lim-save').click(); }, ctx.vasId); await sleep(1200);
  ok('limit saved on the server', await until(() => (accounts().children[ctx.vasId].limits || {}).daily === 15));
  await K.reload(); await sleep(1500); await K.close();
  ok('kid tablet picks up the limit', (await K.E(() => (S.limits || {}).daily)) === 15);
  await K.E(() => { S.time = S.time || {}; S.time[today()] = { math: 11 * 60 }; save(); Limits.check(); }); await sleep(600);
  ok('5 minutes before the end — warning', await K.waitText(/Ещё 4 минуты|Ещё 5 минут/, 4000));
  await K.E(() => { S.time[today()] = { math: 16 * 60 }; save(); Limits.check(); }); await sleep(800);
  ok('limit reached → «Пора отдохнуть»', await K.screen() === 'rest' && await K.has(/На сегодня всё/));
  await K.E(() => go('board')); await sleep(500); ok('other screens are blocked', await K.screen() === 'rest');
  await K.click('#rst-adult'); await sleep(400);
  ok('+15 minutes goes through the lock', await K.screen() === 'agate');
  await K.type('#pinin', '0000'); await K.click('#pingo'); await sleep(400);
  ok('wrong adult PIN rejected', await K.has(/Неверный ПИН/));
  await passGate(K); await sleep(800);
  ok('after PIN: +15 minutes, back to the game', await K.screen() === 'home' && (await K.E(() => Limits.state())) === null);
  await M.go('pcab'); await passGate(M, '4682'); await M.waitText(/Время игры/); await M.E(id => { const box = document.querySelector(`.lim-kid[data-k="${id}"]`); box.querySelector('.lim-daily .chip[data-d="0"]').click(); box.querySelector('.lim-save').click(); }, ctx.vasId); await sleep(800);
  /* ===== 19. Раздел для взрослых: вкладки, Telegram без токена бота ===== */
  await K.close(); await K.E(() => openSettings()); await sleep(300); await K.click('#set-adult'); await passGate(K); await K.waitScreen('parents');
  for (const t of ['sum', 'prog', 'acc']) { await K.click(`.ptabs button[data-tab="${t}"]`); await sleep(300); }
  ok('parents section: three tabs work, family report inside', await K.E(() => document.querySelectorAll('.ptabs button').length === 3 && !!document.querySelector('#fmrep')));
  await K.go('pcab'); await passGate(K); await K.waitText(/Отчёт в Telegram/); await K.waitText(/Пока не подключено|Подключено/, 6000);
  await K.E(() => { window.open = () => ({ location: '', close() { } }); }); await K.click('#tglink'); await sleep(800);
  ok('Telegram card without bot token: graceful, no crash', await K.screen() === 'pcab' && !(await K.has(/Не получилось — попробуйте/)));
  /* ===== 20. Выход ребёнка и вход снова — без потерь ===== */
  const xpBefore = await K2.S('xp');
  await K2.close(); await K2.E(() => openSettings()); await sleep(300); await K2.click('#set-exit'); await K2.click('#cout'); await sleep(2500);
  ok('kid exit: saved to cloud and back to the site', /site=1/.test(K2.p.url()));
  await K2.p.goto(APP + '?choose=1'); await sleep(1200); await K2.click('#achild'); await K2.type('#fcode', ctx.famCode); await K2.click('#fgo'); await K2.clickText('.prof', /Василиса/); await K2.click('#cgo'); await sleep(3500);
  ok('login again by family code: same progress', (await K2.S('xp')) >= xpBefore && await K2.E(() => Accounts.linked()), `${await K2.S('xp')} vs ${xpBefore}`);
  /* ===== 21. «У меня уже есть код» — код от поддержки (админка) ===== */
  const adm = await fetch(API + '/admin/api/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user: 'adm', pass: 'secret' }) });
  const cookie = (adm.headers.get('set-cookie') || '').split(';')[0];
  const famId = Object.values(accounts().families).find(f => f.email === 'mama@test.ru').id;
  const lc = await (await fetch(API + `/admin/api/family/${famId}/logincode`, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'papa@test.ru' }) })).json();
  const A2 = await person('papa-laptop', { width: 1280, height: 800 });
  await A2.p.goto(APP + '?choose=1'); await sleep(1000); await A2.click('#aparent'); await A2.type('#aem', 'papa@test.ru'); await A2.click('#ahave'); await A2.type('#acode', lc.code); await A2.click('#averify'); await sleep(1500);
  ok('admin login code works via «У меня уже есть код»', await A2.waitScreen('pcab') && await A2.waitText(/Василиса/));
  /* ===== 22. Админка: метрики и страница ===== */
  const met = await (await fetch(API + '/admin/api/metrics?fresh=1', { headers: { cookie } })).json(), st = await (await fetch(API + '/admin/api/stats', { headers: { cookie } })).json();
  ok('admin metrics + stats respond', !!met && typeof met === 'object' && st.families >= 2 && st.children >= 4, JSON.stringify(st).slice(0, 150));
  await A2.p.goto(API + '/admin'); await sleep(800); ok('admin page loads', /Мурлок|admin|Вход/i.test(await A2.E(() => document.body.innerText)));
  /* ===== 23. Режим бога для GOD_EMAILS ===== */
  const G = await person('god-phone');
  await G.p.goto(APP + '?choose=1'); await sleep(1000); await G.click('#aparent'); await adultLogin(G, 'god@test.ru'); await G.waitScreen('pcab');
  await G.p.goto(APP); await sleep(4500);
  ok('god mode switches on for GOD_EMAILS', await G.E(() => !!document.querySelector('.god-badge') && window.GOD === true));
  /* ===== 24. Ширины экранов: телефон 360/390 и планшет 800 — без горизонтальной прокрутки ===== */
  const Fr = await person('fresh-device', { width: 360, height: 740 });
  for (const w of [360, 390, 800]) {
    const bad = [];
    for (const U of [K, Fr]) await U.p.setViewport({ width: w, height: w < 700 ? 800 : 1180, isMobile: w < 700, hasTouch: true });
    await Fr.p.goto(APP + '?choose=1'); await sleep(900); let o = await Fr.overflow(); if (o.sw > o.w || o.bad.length) bad.push('hello ' + JSON.stringify(o));
    for (const s of ['pauth', 'clogin']) { await Fr.go(s); await sleep(400); o = await Fr.overflow(); if (o.sw > o.w || o.bad.length) bad.push(s + ' ' + JSON.stringify(o)); }
    for (const s of ['board', 'duels', 'chal', 'friends']) { await K.go(s); await sleep(1500); o = await K.overflow(); if (o.sw > o.w || o.bad.length) bad.push(s + ' ' + JSON.stringify(o)); }
    await K.go('pcab'); await passGate(K); await K.waitText(/Последние вызовы/, 8000); o = await K.overflow(); if (o.sw > o.w || o.bad.length) bad.push('pcab ' + JSON.stringify(o));
    await K.go('parents'); await passGate(K); await sleep(800); o = await K.overflow(); if (o.sw > o.w || o.bad.length) bad.push('parents ' + JSON.stringify(o));
    ok(`width ${w}: no horizontal overflow on journey screens`, !bad.length, bad.join(' | ').slice(0, 400));
  }
  return ctx;
}


if (require.main === module) (async () => {
  startProc(['server/server.mjs'], { env }); startProc(['tools/e2e/serve.js', String(WEB_PORT)]);
  await waitUrl(API + '/health'); await waitUrl(WEB + '/app/');
  browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  try { await journey(); }
  catch (e) { ok('journey crashed: ' + e.message, false); console.log(e.stack); }
  await browser.close();
  errors.slice(0, 15).forEach(e => console.log('JOURNEY ERR ' + e));
  console.log(`JOURNEY DONE ${n - fails}/${n}${errors.length ? ' errs: ' + errors.length : ' errs: none'}`);
  process.exit(fails || errors.length ? 1 : 0);
})();
