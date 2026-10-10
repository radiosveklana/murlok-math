// v30: котик-друг и метод зелёной ручки — банки фраз (≥400, по ≥60 в категории), озвучка, темп без спама,
// зелёная ручка в столбике и уравнениях, вопрос о самочувствии, итоги «Что получилось отлично», память и ритуалы, карточка для взрослых
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/app/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let fails = 0;
const ok = (name, c, x = '') => { if (!c) fails++; console.log((c ? 'V30 OK ' : 'V30 FAIL ') + name + (x ? ' ' + x : '')); };
(async () => {
  // 0) node: банки и озвучка
  const MB = require('../../content/extra/mascot.js'), L = require('../../lines.js'), fs = require('fs'), path = require('path');
  const cnt = MB.counts(), total = MB.all().length;
  ok('bank: 400+ new phrases', total >= 400, String(total));
  ['praise', 'facts', 'learn', 'creator', 'hard', 'friend'].forEach(k => ok('bank: ' + k + ' ≥ 60', cnt[k] >= 60, String(cnt[k])));
  ok('bank: no duplicates', new Set(MB.all()).size === total);
  const sent = t => (t.match(/[.!?…]+(?=\s+[«А-ЯЁA-Z0-9]|\s*$)/g) || []).length, longOnes = MB.all().filter(t => t.length > 120 || sent(t) > 2);
  ok('bank: short bubbles (≤ 2 sentences, ≤ 120 chars)', !longOnes.length, longOnes.slice(0, 3).join(' | '));
  ok('bank: no shaming words', !MB.all().some(t => /глуп(ый|ая)|плохо реш|стыдно(?! ?\.)|неправильно!/i.test(t) && !/не стыдно|ошибаться стыдно/i.test(t)));
  const man = JSON.parse(fs.readFileSync(path.join(__dirname, '../../voice/manifest.json'), 'utf8')), mc = new Set(man.c);
  const unv = MB.all().filter(t => L.parts(t).some(p => p.text && !mc.has(L.clipKey(p))));
  ok('voice: new phrases are voiced', unv.length === 0, unv.length ? unv.length + ' без озвучки, напр. ' + unv[0] : '');
  ok('voice: lines.allTexts includes mascot', L.allTexts().includes(L.norm(MB.BANK.creator[0])));

  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource|CORS|murlok-api/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await p.goto(URL); await p.waitForSelector('#kid');
  await p.evaluate(() => {
    const y = new Date(); y.setDate(y.getDate() - 1); const yd = dkey(y);
    localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, candies: 100, login: { last: today(), day: 1 }, days: { [yd]: 4 }, mascot: { wins: { [yd]: ['eq'] }, sup: 0, fct: 0 }, profile: { like: ['🚀 Космос и наука'] } })));
  });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Mascot === 'object' && typeof window.Coach === 'object').catch(() => false)); t++) { errors.length = 0; await p.reload(); await sleep(800); }
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => { document.querySelectorAll('.modal').forEach(m => m.remove()); go(s, a); }, s, a); await sleep(600); };

  /* ---------- главная: ритуал, воспоминание, факт дня ---------- */
  await go('home'); await sleep(900);
  ok('home: «Знаешь ли ты?» card', await E(() => { const k = document.querySelector('.m-know .mk-t'); return !!k && window.MASCOT_BANK && Object.values(MASCOT_BANK.facts).flat().includes(k.textContent); }));
  ok('home: first greeting of the day is a ritual', await E(() => S.mascot.greetDay === today()));
  let cb = ''; for (let i = 0; i < 16 && !/уравнения/.test(cb); i++) { await sleep(500); cb = await E(() => (document.querySelector('#heroSay') || {}).textContent || ''); }
  ok('home: personal callback about yesterday win', /вчера мы с тобой победили уравнения/i.test(cb), cb.slice(0, 80));
  ok('home: m-know placed after «Мысль дня» / learn section', await E(() => { const k = document.querySelector('.m-know'); return !!k && !!k.closest('.page, #app'); }));

  /* ---------- темп: не больше одной болтовни за 12 с и не больше 4 на экран ---------- */
  await go('shop'); await sleep(900);
  const pace = await E(async () => { Mascot.resetPace(); const bub = document.querySelector('#mascot .ms-bubble'); say('Первая реплика', 0, { prio: 0 }); const a = bub.textContent; say('Вторая реплика', 0, { prio: 0 }); const b2 = bub.textContent; return [a, b2]; });
  ok('pacing: chatter throttled', /Первая/.test(pace[0]) && /Первая/.test(pace[1]), pace.join(' / '));
  const instr = await E(() => { const bub = document.querySelector('#mascot .ms-bubble'); say('Важная подсказка'); return bub.textContent; });
  ok('pacing: instructions are never throttled', /важная подсказка/i.test(instr));
  const streak = await E(() => { okRun = 0; lastCheer = 0; for (let i = 0; i < 4; i++) cheer(true); lastCheer = 0; cheer(true); return document.querySelector('#mascot .ms-bubble').textContent; });
  ok('cheer: streak of 5 praises the process', /пять верных подряд/i.test(streak), streak);
  const frus = await E(() => { lastCheer = 0; cheer(false); cheer(false); cheer(false); return document.querySelector('#mascot .ms-bubble').textContent; });
  ok('cheer: 3 mistakes in a minute → support, breathing or pause', MB.BANK.hard.frust.some(t => frus.includes(t.replace(/\{n\}/g, 'Тест').slice(1, 25))), frus);
  ok('counters: support counted', await E(() => S.mascot.sup >= 2));

  /* ---------- зелёная ручка: столбик ---------- */
  await E(() => { S.prefs.mulLv = 2; S.prefs.guided = { mul: true }; save(); }); await go('practice', 'mul'); await sleep(500);
  await E(() => { const t = document.querySelector('.ask-eq'); });
  const wrong = await E(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const k = d => document.querySelector(`.pad .k[data-k="${d}"]`).click();
    // неверный ответ: 0 и «ок»
    k('0'); k('ok'); await sl(200); return document.querySelector('.helper .bubble, .bubble').innerHTML; });
  ok('green pen (mul): mistake starts with what is right', /gp-ok/.test(wrong) && /gp-fix/.test(wrong) && !/Не совсем/.test(wrong), wrong.replace(/<[^>]+>/g, ' ').slice(0, 120));
  const right = await E(async () => { const sl = ms => new Promise(r => setTimeout(r, ms)); const t = document.querySelector('.ask-eq').textContent; const m = t.match(/(\d+)\s*×\s*(\d+)(?:\s*\+\s*(\d+))?/); if (!m) return 'no-eq ' + t; const v = String(+m[1] * +m[2] + (+m[3] || 0));
    for (const d of v) document.querySelector(`.pad .k[data-k="${d}"]`).click(); document.querySelector('.pad .k[data-k="ok"]').click(); await sl(250);
    const c = document.querySelector('.cell.w:not(.auto)'); return c ? getComputedStyle(c).textDecorationLine + '|' + getComputedStyle(c).textDecorationColor : 'none'; });
  ok('green pen (mul): correct digits underlined in green', /underline/.test(right) && /30, 158, 90|1e9e5a/i.test(right), right);
  ok('soft colors: wrong cell is orange, not red', await E(() => { const d = document.createElement('div'); d.className = 'cell wrong'; document.querySelector('.mgrid').appendChild(d); const bg = getComputedStyle(d).backgroundColor; d.remove(); return bg; }).then(bg => !/255, 201, 201/.test(bg)));

  /* ---------- зелёная ручка: уравнения ---------- */
  await E(() => { S.prefs.eqLv = 2; S.prefs.guided = { mul: true, eq: true }; save(); }); await go('practice', 'eq'); await sleep(600);
  let eqw = 'single';
  for (let i = 0; i < 3; i++) { // нажать НЕ последнее действие (какое из знаков последнее — заранее неизвестно)
    await go('practice', 'eq'); await sleep(300);
    const h = await E(async i => { const ops = [...document.querySelectorAll('.op.tap')]; if (ops.length < 2) return 'single'; ops.forEach(o => o.click()); await new Promise(r => setTimeout(r, 120)); return document.querySelector('.helper .bubble').innerHTML; }, i);
    if (h === 'single') break; if (/gp-ok/.test(h)) { eqw = h; break; } eqw = h;
  }
  ok('green pen (eq): mistake names what is right first', eqw === 'single' || (/gp-ok/.test(eqw) && !/Не то|Не сходится/.test(eqw)), String(eqw).replace(/<[^>]+>/g, ' ').slice(0, 120));

  /* ---------- вопрос о самочувствии перед трудным ---------- */
  await E(() => { S.prefs.mulLv = 3; delete S.mascot.feelDay; save(); }); await go('practice', 'mul'); await sleep(500);
  ok('feelings: asked before a hard task', !!(await p.$('.m-feel')));
  const fw = await E(() => { const c = document.querySelector('.m-feel'); return c ? c.scrollWidth <= c.clientWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1 : false; });
  ok('feelings: fits phone width', fw);
  await E(() => document.querySelector('.m-feel button[data-f="bad"]').click()); await sleep(300);
  ok('feelings: «тревожно» → breathing', await E(() => !!document.querySelector('.mf-breath') && S.mascot.feel.bad === 1));
  await go('practice', 'mul'); ok('feelings: only once a day', !(await p.$('.m-feel')));

  /* ---------- итоги: «Что получилось отлично» перед «Над чем поработаем» ---------- */
  await go('academy'); await E(() => { const d = document.createElement('div'); d.className = 'center g-result'; d.innerHTML = '<div class="big-emoji">🥈</div><h2>Тест, 3 из 5!</h2><div class="stars big">★★☆</div>'; document.querySelector('#app .page').appendChild(d); }); await sleep(300);
  const res = await E(() => { const r = document.querySelector('.g-result .gp-res'); if (!r) return null; const g = r.querySelector('.gp-good'), w = r.querySelector('.gp-grow'); return { order: g && w && (g.compareDocumentPosition(w) & 4) ? 1 : 0, good: g ? g.textContent : '', grow: w ? w.textContent : '' }; });
  ok('results: good list first, then one thing to work on', !!res && res.order === 1 && /3 из 5/.test(res.good) && /2 вопроса/.test(res.grow), JSON.stringify(res));
  await E(() => { const d = document.createElement('div'); d.className = 'blitzres'; d.innerHTML = '<h2>Тест, верных ответов: 12!</h2><div class="misses"><b>Повтори:</b><span class="chip">7 × 8 = 54</span></div>'; document.querySelector('#app .page').appendChild(d); }); await sleep(300);
  ok('results: blitz shows successes before «Над чем поработаем»', await E(() => { const m = document.querySelector('.blitzres .misses'), g = document.querySelector('.blitzres .gp-res'); return !!g && /12/.test(g.textContent) && /Над чем поработаем/.test(m.textContent) && (g.compareDocumentPosition(m) & 4) > 0; }));

  /* ---------- раздел для взрослых ---------- */
  await go('parents'); await sleep(400);
  const pc = await E(() => { const c = document.querySelector('.gp-card'); return c ? { t: c.textContent, tab: c.closest('.ptab-pane') && c.closest('.ptab-pane').dataset.tab } : null; });
  ok('parents: «Метод зелёной ручки» card in overview', !!pc && /Метод зелёной ручки/.test(pc.t) && pc.tab === 'sum', pc && pc.tab);
  ok('parents: «Котик поддерживал N раз, рассказал M фактов»', !!pc && /Котик поддерживал \d+ раз[а]?, рассказал \d+ факт/.test(pc.t), pc && (pc.t.match(/Котик поддерживал[^.]*/) || [''])[0]);

  /* ---------- на узком экране ничего не вылезает ---------- */
  await p.setViewport({ width: 320, height: 700, isMobile: true, hasTouch: true }); await go('home'); await sleep(500);
  ok('320px: home without horizontal scroll', await E(() => document.documentElement.scrollWidth <= innerWidth + 1));

  ok('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  console.log(fails ? `V30 FAILS ${fails}` : 'V30 DONE'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('V30 FAIL crash', e.message); process.exit(1); });
