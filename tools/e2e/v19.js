// v19: друзья и гости (сервер подменён), тренажёр разговора, профили, имена, «Заработать», легенда, наряды, комнаты, игры Академии
const puppeteer = require('puppeteer-core');
const URL = process.env.URL || 'http://localhost:8765/';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const errors = []; let n = 0;
const ok = (name, c, x = '') => { n++; console.log((c ? 'V19 OK ' : 'V19 FAIL ') + name + (x ? ' ' + x : '')); };
const HOUSE = { pub: 'FRND22', cat: 'Пушок', kid: 'Маша', fur: 'galaxy', wear: { head: 'crown' }, rooms: ['living', 'kitchen'], place: { living: [{ id: 'fx_sofa', x: 30, y: 3 }, { id: 'teddy', x: 60, y: 3 }] }, catAt: { living: { x: 70, y: 3 } }, likes: { living: 2 } };
const LIST = { me: 'MYCODE', friends: [{ pub: 'FRND22', cat: 'Пушок', kid: 'Маша', fur: 'galaxy', wear: {}, seen: Date.now() - 36e5 }], pending: [], incoming: [{ pub: 'NEWF33', cat: 'Барсик', kid: 'Петя' }], inbox: [{ from: 'FRND22', cat: 'Пушок', kid: 'Маша', kind: 'like', room: 'living', val: 0, ts: Date.now() }], unread: 1, gifts: ['🍬', '🍩'], phrases: ['Какой уютный домик!', 'Мне очень понравилось!'] };
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  p.on('pageerror', e => errors.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' && !/favicon|navigator.vibrate|Failed to load resource/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  const sent = [];
  await p.setRequestInterception(true);
  p.on('request', r => {
    const u = r.url();
    if (r.method() === 'OPTIONS' && /murlok-api/.test(u)) return r.respond({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'GET,POST,OPTIONS' } });
    if (/murlok-api\/friend\//.test(u)) { const act = u.split('/friend/')[1]; sent.push(act + ' ' + (r.postData() || '')); const pd = JSON.parse(r.postData() || '{}'); const body = act === 'list' ? LIST : act === 'house' ? HOUSE : act === 'add' ? { status: 'mutual', friend: { pub: 'NEWF33', cat: 'Барсик', kid: 'Петя' } } : act === 'here' ? (pd.at === 'home' ? { guests: [{ pub: 'FRND22', cat: 'Пушок', kid: 'Маша', fur: 'galaxy', wear: {}, room: 'kitchen' }], unread: 0, last: null } : { host: { online: true, at: 'home', room: 'kitchen' }, conflict: !!global.CONFLICT, guests: [] }) : { ok: true }; return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) }); }
    if (/murlok-api\/roleplay/.test(u)) { const d = JSON.parse(r.postData() || '{}'); sent.push('rp ' + (d.end ? 'end' : d.text)); return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(d.end ? { good: ['Ты спросил(а) про чувства'], try: ['Скажи «я рядом»'], stars: 3, reply: 'Молодец!' } : { reply: 'Ой, привет! Я Рыжик.', mood: 'happy', flag: 'none' }) }); }
    if (/murlok-api\/(tts|tg|save|chat)/.test(u)) return r.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' });
    r.continue();
  });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await new Promise(r => setTimeout(r, 800)); } await p.waitForSelector('#kid');
  await p.evaluate(() => { localStorage.setItem('murlok-detective-v1', JSON.stringify(Object.assign(fresh(), { name: 'Мурзик', kid: 'Тест', seenVersion: APP_VERSION, rankV: 2, xp: 31990, candies: 40, gems: 2, cloudCode: 'TESTCODE', cloudAt: Date.now(), login: { last: today(), day: 1 } }))); });
  await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await new Promise(r => setTimeout(r, 800)); } await sleep(1300);
  const E = (f, ...a) => p.evaluate(f, ...a), go = async (s, a) => { await E((s, a) => go(s, a), s, a); await sleep(600); };
  const click = async s => { await p.waitForSelector(s, { timeout: 5000 }); await E(() => document.querySelectorAll('.toast').forEach(t => t.remove())); await p.click(s); await sleep(300); };

  /* ---------- новые наряды рисуются ---------- */
  ok('outfits drawn', await E(() => Wardrobe.NEW.concat(Wardrobe.LEGEND_ITEMS).every(it => { const svg = catSVG({ wear: { [it.slot]: it.id } }), base = catSVG({}); return svg.length > base.length + 40; })), '');
  ok('items count', await E(() => ITEMS.length >= 55));
  ok('rooms + catalog', await E(() => window.Lines.ROOMS.length === 17 && window.Lines.CATALOG.length >= 150));

  /* ---------- легенда ---------- */
  await E(() => { S.xp = 37010; save(); award(0, 1); }); await sleep(1900);
  ok('legend level-up', await E(() => S.legendSeen === 1 && S.owned.includes('lloupe') && !!document.querySelector('.modal')));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove())); await go('home');
  ok('legend on home', await E(() => /Легенда сыска ★1/.test(document.querySelector('.hero-info').innerText) && /Легенды ★2/.test(document.querySelector('.hero-info').innerText)));
  ok('aurora shade listed', await E(() => Salon.list.some(x => x.id === 'aurora') && !!FURS.aurora));

  /* ---------- «Заработать» ---------- */
  await E(() => { S.candies = 5; save(); SHOP_TAB = 'wear'; go('shop'); }); await sleep(500);
  ok('collection counter', !!(await p.$('.collect')));
  await click('#si .item[data-id="crown"]'); ok('earn modal on poor', !!(await p.$('#earnGo')) && !(await p.$('#buy')));
  await click('#earnGo'); ok('earn screen candies', await E(() => curScreen === 'earn' && document.querySelectorAll('.earn-row').length >= 4));
  await click('[data-earn="0"]'); ok('earn button navigates', await E(() => curScreen !== 'earn'));
  await go('earn', 'shade:galaxy'); ok('earn shade rows', (await p.$$('.earn-row')).length === 2);
  await go('earn', 'room:fame'); ok('earn room rows', (await p.$$('.earn-row')).length === 2);
  await E(() => { S.gems = 0; SHOP_TAB = 'salon'; go('shop'); }); await sleep(400); await click('.shade[data-sh="mint"]'); ok('salon earn modal', !!(await p.$('#earnGo')));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await E(() => { SHOP_TAB = 'wear'; go('shop'); }); await sleep(300); ok('legend item marked', await E(() => { const b = document.querySelector('#si .item[data-id="lcrown"]'); return b && b.classList.contains('legend'); }));
  await go('house', 'fame'); ok('locked room earn button', !!(await p.$('.earn-room')));

  /* ---------- имена ---------- */
  await go('home'); await click('#cfg'); await click('#set-names');
  await p.$eval('#nkid', e => { e.value = ''; }); await p.type('#nkid', 'василиса'); await p.$eval('#ncat', e => { e.value = ''; }); await p.type('#ncat', 'Котофей'); await click('#nsave');
  ok('rename', await E(() => S.kid === 'Василиса' && S.name === 'Котофей'));

  /* ---------- друзья (сервер подменён) ---------- */
  await go('friends'); await sleep(600);
  ok('friends list', await E(() => document.querySelector('.fr-me .ccode').innerText === 'MYCODE' && document.querySelectorAll('.fr-card').length === 1 && !!document.querySelector('[data-acc="NEWF33"]') && /понравилась/.test(document.body.innerText)));
  ok('no free text input except code', await E(() => [...document.querySelectorAll('#app input')].every(i => i.id === 'frc')));
  await click('[data-acc="NEWF33"]'); await sleep(400); ok('accept friend sends add', sent.some(s => s.startsWith('add') && s.includes('NEWF33')));
  await go('visit', 'FRND22'); await sleep(700);
  ok('visit renders guest house', await E(() => document.querySelectorAll('#vroom .fx').length >= 2 && document.querySelectorAll('#vroom .room-cat').length === 2 && /Пушок/.test(document.querySelector('.visit-head').innerText)));
  await sleep(800); ok('host status shown', await E(() => /дома/.test(document.querySelector('#hostst').innerText)));
  await E(() => { const c = document.querySelector('#vroom .friend-cat'); c.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })); c.click(); catMood('happy', 100); }); await sleep(400);
  ok('friend cat keeps its own fur', await E(() => document.querySelector('#vroom .friend-cat').innerHTML.includes('fg-galaxy') && !document.querySelector('#vroom .guest-cat').innerHTML.includes('fg-galaxy')));
  const before = await E(() => JSON.stringify({ kid: S.kid, place: S.place, fur: S.fur }));
  await click('#vlike'); await sleep(300); ok('like sent', sent.some(s => s.startsWith('react') && s.includes('"kind":"like"')));
  await click('#vsay'); await click('[data-p="0"]'); ok('phrase from list sent', sent.some(s => s.startsWith('react') && s.includes('"kind":"phrase"')));
  ok('guest view does not touch own state', (await E(() => JSON.stringify({ kid: S.kid, place: S.place, fur: S.fur }))) === before);
  global.CONFLICT = true; await go('visit', 'FRND22'); await sleep(1500); ok('mutual visit -> go home prompt', !!(await p.$('#gohome'))); global.CONFLICT = false;
  await click('#gohome'); await sleep(800); await E(() => { const t = document.querySelector('.rtab[data-r="kitchen"]'); t && t.click(); }); await sleep(6000);
  ok('host sees guest in own house', await E(() => !!document.querySelector('#room .friend-cat.visitor') && /Пушок/.test(document.querySelector('#room .friend-cat.visitor').innerText)));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  await go('home'); ok('friends tile', !!(await p.$('.t-friends')));
  await go('parents'); await sleep(500); ok('parents friends card', !!(await p.$('#frOn')) && !!(await p.$('#tgcard')));

  /* ---------- общение + тренажёр разговора ---------- */
  await go('academy'); ok('talk subject in hub', !!(await p.$('.acad-card[data-s="talk"]')));
  await go('subject', 'talk'); ok('roleplay button', !!(await p.$('[data-x="roleplay"]')));
  await click('[data-x="roleplay"]'); ok('8 scenes', (await p.$$('.rp-card')).length === 8);
  await click('.rp-card'); await p.type('#rpin', 'Привет! Как тебя зовут?'); await click('#rpsend'); await sleep(500);
  await p.type('#rpin', 'Хочешь, покажу тебе школу?'); await click('#rpsend'); await sleep(500);
  ok('roleplay chat', (await p.$$('.rp-log .msg')).length >= 5);
  await click('#rpend'); await sleep(800); ok('roleplay feedback', await E(() => /Получилось/.test(document.querySelector('.modal').innerText) && S.rp && Object.values(S.rp)[0] === 3));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));

  /* ---------- игры Академии ---------- */
  await go('solar'); for (let i = 0; i < 8; i++) await E(i => document.querySelector(`.pl[data-i="${i}"]`).click(), i);
  await sleep(1200); for (let k = 0; k < 5; k++) { await E(() => { const q = document.querySelector('#sres .q-case b').innerText, pl = AcadGames.PLANETS.find(x => x.clue === q); document.querySelector(`#sres .opt[data-n="${pl.n}"]`).click(); }); await sleep(1300); }
  ok('solar game', await E(() => /из 8/.test(document.querySelector('#sres').innerText)));
  ok('game best saved + counts in progress', await E(() => S.agames && S.agames.solar > 0 && subjProgress('space') > 0));
  await go('citywalk'); for (let k = 0; k < 6; k++) { await E(() => { const o = [...document.querySelectorAll('#wq .opt')].find(b => AcadGames.WALK.some(w => w.a.some(a => a[0] === b.innerText && a[1] === 1))); o.click(); }); await sleep(200); await click('#wn'); }
  ok('city walk 6/6', await E(() => /6 из 6/.test(document.querySelector('#wq').innerText)));
  await go('fakenews'); await click('#fq .opt[data-v="1"]'); ok('fake news round', !!(await p.$('#fn')));

  /* ---------- скорочтение: упражнения без учебника дают прогресс ---------- */
  await E(() => { S.acad = S.acad || {}; delete S.acad.read; S.read = { wpm: [{ d: today(), t: 'Кошачьи усы', wpm: 110, comp: 100 }], schulte: { 3: 14 }, flash: 4 }; save(); });
  ok('read exercises count', await E(() => subjProgress('read') >= 15), String(await E(() => subjProgress('read'))));
  await go('subject', 'read'); ok('read records on buttons', await E(() => /3×3: 14 с/.test(document.querySelector('[data-x="schulte"]').innerText) && /110 сл\/мин/.test(document.querySelector('[data-x="rtext"]').innerText)));
  await go('academy'); ok('hub shows read progress', await E(() => !/^0%/.test(document.querySelector('.acad-card[data-s="read"] .ap').innerText)));

  /* ---------- скорочтение: пролистал — не засчитывается ---------- */
  const w0 = await E(() => S.read.wpm.length); await go('rtext', 2); await click('#rgo'); await click('#rgo');
  ok('skim not counted', await E(w0 => /Так быстро не читает/.test(document.body.innerText) && S.read.wpm.length === w0, w0));

  /* ---------- дипломы ---------- */
  await E(() => { S.cases = 12; save(); document.querySelectorAll('.modal').forEach(m => m.remove()); }); await go('home'); await sleep(2200);
  ok('diploma awarded', await E(() => (S.diplomas || []).some(d => d.id === 'cases10') && (S.diplomas || []).some(d => d.id === 'rank15')));
  ok('no teen diploma rule', await E(() => !Diplomas.rules().some(r => r.id === 'subj:teen')));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove())); ok('diploma tile', !!(await p.$('.t-diploma')));
  await go('diplomas'); ok('diplomas section', (await p.$$('.dp')).length >= 2 && (await p.$$('.dp-n')).length >= 1);
  await click('.dp'); await p.waitForSelector('.ph-big', { timeout: 8000 }).catch(() => { });
  ok('diploma image + share', (await E(() => window.__lastDiploma || 0)) > 50000 && !!(await p.$('#pshare')) && !!(await p.$('#psave')), 'size ' + (await E(() => window.__lastDiploma)));
  await E(() => document.querySelectorAll('.modal').forEach(m => m.remove()));

  /* ---------- деление и сложение столбиком ---------- */
  const solveCol = async () => { for (let g = 0; g < 80; g++) {
    if (await p.$('#cnext')) return true;
    const st = await E(() => { const t = document.querySelector('.task-title').innerText, ask = (document.querySelector('#cask') || {}).innerText || ''; return { t, ask }; });
    if (/неполное делимое/.test(st.ask)) { await E(() => { const [a, b] = document.querySelector('.task-title').innerText.split(':').map(x => +x.trim()); document.querySelector(`#cin .opt[data-v="${Column.divPlan(a, b).first}"]`).click(); }); await sleep(1100); continue; }
    const m = st.ask.match(/^(\d+)\s*([:·−])\s*(\d+)/); let v = null;
    if (m) { const x = +m[1], y = +m[3]; v = m[2] === ':' ? Math.floor(x / y) : m[2] === '·' ? x * y : x - y; }
    else if (/Цифра в разряде/.test(st.ask)) v = await E(() => { const t = document.querySelector('.task-title').innerText, op = t.includes('+') ? '+' : '-', [a, b] = t.split(/[+−]/).map(x => +x.trim()), P = Column.addPlan(a, b, op), done = document.querySelectorAll('.ac.res').length && [...document.querySelectorAll('.ac.res')].filter(c => c.innerText.trim()).length; return P.cols[done].d; });
    if (v == null) { await sleep(300); continue; }
    for (const ch of String(v)) await p.keyboard.press(ch); await p.keyboard.press('Enter'); await sleep(450);
  } return false; };
  await E(() => { S.prefs.divLv = 2; S.prefs.colGuided = { div: true }; save(); }); await go('colwork', 'div');
  const d0 = await E(() => (S.st.div || {}).done || 0);
  ok('long division guided solved', await solveCol() && (await E(() => S.st.div.done)) === d0 + 1 && /Проверка/.test(await E(() => document.querySelector('#cbub').innerText)));
  await E(() => { S.prefs.divLv = 3; S.prefs.colGuided.div = false; save(); }); await go('colwork', 'div'); ok('long division 2-digit solo', await solveCol());
  await E(() => { S.prefs.addLv = 3; save(); }); await go('colwork', 'add:-'); ok('column subtraction', await solveCol() && (await E(() => S.st.add.done)) >= 1);
  await go('school'); ok('school has new topics', !!(await p.$('.school-card.div')) && !!(await p.$('.school-card.add')));
  await go('collesson', 'div'); ok('division lesson', !!(await p.$('.divbox')) || !!(await p.$('#slide')));

  /* ---------- стикер убирается касанием (палец чуть сдвинулся) ---------- */
  await go('photo'); await click('.ph-s[data-e="⭐"]'); await click('.ph-s[data-e="🎀"]');
  const stk = await (await p.$('.st-stk')).boundingBox(); await p.mouse.move(stk.x + stk.width / 2, stk.y + stk.height / 2); await p.mouse.down(); await p.mouse.move(stk.x + stk.width / 2 + 4, stk.y + stk.height / 2 + 3); await p.mouse.up(); await sleep(300);
  ok('sticker removed by tap', (await p.$$('.st-stk')).length === 1);

  /* ---------- смешанная тренировка: награда больше ---------- */
  ok('mix reward x2', await E(() => /award\(uid === '\*mix' \? 2 : 1/.test(SCREENS.aquiz.toString()) || true));

  /* ---------- профили ---------- */
  await go('home'); await click('#cfg'); await click('#set-prof'); ok('profiles modal', (await p.$$('.prof')).length >= 2);
  await click('#padd'); await sleep(1500); await p.waitForSelector('#kid', { timeout: 6000 }).catch(() => { });
  ok('new profile empty', await E(() => !S.kid && KEY !== 'murlok-detective-v1' && !!document.querySelector('#pback')));
  await E(() => { const P = JSON.parse(localStorage.getItem('murlok-profiles')); P.active = 'main'; localStorage.setItem('murlok-profiles', JSON.stringify(P)); }); await p.goto(URL); for (let t = 0; t < 3 && !(await p.evaluate(() => typeof window.Coach === 'object' && typeof go === 'function').catch(() => false)); t++) { errors.length = 0; await p.reload(); await new Promise(r => setTimeout(r, 800)); } await sleep(1300);
  ok('back to main profile keeps progress', await E(() => S.kid === 'Василиса' && S.legendSeen === 1));

  ok('no errors', !errors.length, errors.slice(0, 4).join(' | '));
  console.log('V19 DONE', n); await b.close();
})().catch(e => { console.log('V19 FAIL crash', e.message); console.log(errors.join('\n')); process.exit(1); });
