/* limits.js (v30) — время игры ребёнка: норма на день, разрешённые часы, перерыв 5 минут каждые 25 минут.
   Настраивает взрослый в кабинете (grownup.js), правила хранятся в записи ребёнка на сервере и приходят через /acc/child/me;
   без интернета работают последние известные настройки (S.limits). Время считает coach.js — только активные секунды,
   раздел для взрослых не считается. Здесь же — точный учёт минут по разделам и предметам Академии (S.use) для метрик админки. */
'use strict';
const Limits = (() => {
  const FREE = new Set(['rest', 'limitunlock', 'adultswitch', 'parents', 'pcab', 'pauth', 'agate', 'pinset']); // сюда можно и при ограничении
  const BREAK_RUN = 25 * 60, BREAK_LEN = 5 * 60e3, WARN = 5 * 60, PLUS = 15;
  const isAdult = () => S.role === 'adult';
  const girl = () => /[аяь]$/i.test(S.kid || '');
  const rules = () => { if (isAdult() || !S.limits || !(window.Accounts && Accounts.linked())) return null; const l = S.limits; return l.daily || l.from || l.breaks ? l : null; };
  const usedSec = () => Object.values((S.time || {})[today()] || {}).reduce((a, b) => a + b, 0);
  const ext = () => { const x = S.limitX; return x && x.d === today() ? x : { d: today(), add: 0, until: 0 }; }; // продление от взрослого на сегодня
  const hm = s => { const m = /^(\d{1,2}):(\d{2})$/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
  const inHours = l => { const a = hm(l.from), b = hm(l.to); if (a == null || b == null) return true; const n = nowMin(); return a < b ? n >= a && n < b : n >= a || n < b; };
  const toEnd = l => { let d = hm(l.to) - nowMin(); if (d < 0) d += 1440; return d * 60; };

  /* ---------- можно ли играть сейчас ---------- */
  function state() {
    const l = rules(); if (!l) return null; const x = ext(), t = Date.now();
    if (l.from && l.to && !inHours(l) && t > (x.until || 0)) return { why: 'hours', l, key: 'h:' + today() + ':' + (x.until || 0) };
    if (l.daily > 0 && usedSec() >= (l.daily + (x.add || 0)) * 60) return { why: 'daily', l, key: 'd:' + today() + ':' + (x.add || 0) };
    if (l.breaks && S.limitBrk && t < S.limitBrk.until) return { why: 'break', l, until: S.limitBrk.until, key: 'b:' + S.limitBrk.until };
    return null;
  }
  function left() { // сколько секунд до «Пора отдохнуть» и по какой причине
    const l = rules(); if (!l) return null; const x = ext(), t = Date.now(); let out = null;
    const take = (sec, key) => { if (out == null || sec < out.sec) out = { sec, key }; };
    if (l.daily > 0) take((l.daily + (x.add || 0)) * 60 - usedSec(), 'd:' + today() + ':' + (x.add || 0));
    if (l.from && l.to) { if (inHours(l)) take(toEnd(l), 'h:' + today() + ':' + l.to); else if (x.until > t) take((x.until - t) / 1000, 'u:' + x.until); }
    return out;
  }
  const stat = (k, key) => { const st = S.limitStat = S.limitStat || { blocks: 0, unlocks: 0 }; if (key && st.last === key) return; if (key) st.last = key; st[k] = (st[k] || 0) + 1; };

  /* ---------- проверка раз в 5 секунд: предупреждение, экран отдыха, возврат после перерыва ---------- */
  let warned = ''; try { warned = sessionStorage.getItem('limWarn') || ''; } catch (e) { }
  function check() {
    if (!S.kid) return;
    if (S.limitBrk && Date.now() >= S.limitBrk.until) { S.limitBrk = null; S.limitRun = { sec: 0, at: Date.now() }; save(); }
    const st = state();
    if (st) { if (!FREE.has(curScreen)) go('rest'); else if (curScreen === 'rest') { const h = $('#rst-why'); if (h && h.dataset.why !== st.why) go('rest'); } return; }
    if (curScreen === 'rest') { go('home'); return; }
    const L = left(); if (!L || L.sec > WARN || L.sec <= 0 || warned === L.key || FREE.has(curScreen)) return;
    warned = L.key; try { sessionStorage.setItem('limWarn', warned); } catch (e) { }
    const m = Math.max(1, Math.round(L.sec / 60));
    toast(`<span class="tb">⏰</span><div><b>Ещё ${m} ${plural(m, 'минута', 'минуты', 'минут')}</b><br>Потом котику пора отдыхать — успей закончить задание!</div>`);
    try { say(`Ещё ${m} ${plural(m, 'минута', 'минуты', 'минут')} — и пора отдыхать. Успеем закончить?`, 4500, { prio: 1 }); } catch (e) { }
  }
  setInterval(check, 5000); setTimeout(check, 1500);

  /* ---------- учёт: раздел, предмет Академии, перерывы (вызывает coach.js каждые 20 активных секунд) ---------- */
  const SECT = { school: 'school', practice: 'school', lesson: 'school', colwork: 'school', collesson: 'school', newcase: 'case', caseintro: 'case', casetask: 'case', accuse: 'case', solved: 'case', book: 'case',
    blitz: 'paws', drill: 'paws', bugs: 'raccoon', bugs2: 'raccoon', games: 'games', game: 'games', schulte: 'games', academy: 'academy', subject: 'academy', alesson: 'academy', aquiz: 'academy', asearch: 'academy',
    roleplay: 'academy', rpchat: 'academy', solar: 'academy', rescue: 'academy', citywalk: 'academy', helpharm: 'academy', fakenews: 'academy', bodybuild: 'academy', ideas: 'academy', practice2: 'academy',
    house: 'house', shop: 'house', fitting: 'house', earn: 'house', photo: 'photo', studio: 'photo', spacetrip: 'arcade', spacefly: 'arcade', mission: 'arcade', starmap: 'starmap',
    duels: 'duels', duelplay: 'duels', chal: 'chal', board: 'board', friends: 'friends', visit: 'friends', chat: 'chat', diplomas: 'awards' };
  const GAME_SUBJ = { roleplay: 'talk', rpchat: 'talk', solar: 'space', rescue: 'obzh', citywalk: 'safety', helpharm: 'obzh', fakenews: 'think', bodybuild: 'body', ideas: 'creative', practice2: 'health' };
  function subjOf(scr) {
    if (GAME_SUBJ[scr]) return GAME_SUBJ[scr];
    if (!['subject', 'alesson', 'aquiz'].includes(scr) || !window.Nav) return '';
    const a = String((Nav.current() || {}).a || '').split(':')[0]; return a && (window.SUBJECTS || {})[a] && a !== 'teen' ? a : ''; // что читает подросток — не учитываем
  }
  let ticks = 0;
  function tick(scr, sec) {
    const t = Date.now(), d = today(), U = S.use = S.use || {}, u = U[d] = U[d] || {}, k = SECT[scr] || 'other', sj = subjOf(scr);
    u[k] = (u[k] || 0) + sec; if (sj) u['a:' + sj] = (u['a:' + sj] || 0) + sec;
    const keys = Object.keys(U); if (keys.length > 40) keys.sort().slice(0, -35).forEach(x => delete U[x]);
    // непрерывная игра: перерыв в 5+ минут без нажатий сбрасывает счёт
    let r = S.limitRun; if (!r || t - (r.at || 0) > 5 * 60e3) r = S.limitRun = { sec: 0, at: t }; r.sec += sec; r.at = t;
    const l = rules();
    if (l && l.breaks) {
      if (r.sec >= BREAK_RUN) { S.limitBrk = { until: t + BREAK_LEN }; S.limitRun = { sec: 0, at: t }; setTimeout(check, 50); }
      else if (r.sec >= BREAK_RUN - 60 && !r.warned) { r.warned = 1; toast('<span class="tb">🤸</span><div><b>Через минуту — перерыв</b><br>Котик предложит размяться 5 минут.</div>'); }
    }
    if (++ticks % 9 === 0 && typeof cloudSoon === 'function') cloudSoon(); // раз в 3 минуты — свежие минуты в облако (видно в кабинете)
  }

  /* ---------- экран «Пора отдохнуть» ---------- */
  const IDEAS = ['🚶 Погулять', '📚 Почитать книжку', '🧸 Поиграть с игрушками', '🎨 Порисовать', '🤸 Попрыгать', '🫖 Помочь взрослым'];
  SCREENS.rest = () => {
    const st = state(); if (!st) return go('home');
    const ab = girl() ? 'ась' : 'ся', um = Math.round(usedSec() / 60);
    const T = {
      daily: ['На сегодня всё!', `${esc(S.kid)}, ты занимал${ab} ${um} ${plural(um, 'минуту', 'минуты', 'минут')} — это твоя норма на сегодня. Котик тоже устал и свернулся клубочком. Возвращайся завтра — я буду ждать! 🐾`],
      hours: ['Сейчас время отдыха', `Котик играет с тобой с <b>${esc(st.l.from)}</b> до <b>${esc(st.l.to)}</b>. А пока можно отдохнуть и заняться чем-нибудь другим.`],
      break: ['Перерыв на 5 минут!', `Ты занимал${ab} 25 минут подряд — молодец! Теперь разомнёмся: потянись, попрыгай, посмотри в окно вдаль. Котик тоже потягивается 🐾`],
    }[st.why];
    app.innerHTML = `<div class="page center rest-pg"><div class="rest-cat">${myCat({ happy: true })}<span class="rest-z">${st.why === 'break' ? '🤸' : '💤'}</span></div><h2 id="rst-why" data-why="${st.why}">${T[0]}</h2><p>${T[1]}</p>
      ${st.why === 'break' ? '<div class="rest-cd" id="rcd"></div>' : ''}<div class="rest-ideas">${IDEAS.map(x => `<span>${x}</span>`).join('')}</div>
      <button class="btn" id="rst-adult">🔐 Для взрослых: ещё ${PLUS} минут</button><p class="small">Ограничение настроили взрослые в личном кабинете.</p></div>`;
    stat('blocks', st.key); save();
    $('#rst-adult').addEventListener('click', () => { SND.tap(); go('limitunlock'); });
    if (st.why === 'break') { const cd = () => { const el = $('#rcd'); if (!el) return; const s = Math.max(0, Math.ceil((st.until - Date.now()) / 1000)); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; if (!s) check(); }; cd(); const iv = setInterval(cd, 1000); cleanups.push(() => clearInterval(iv)); }
    try { speakT([T[0]]); } catch (e) { }
  };
  // продление на 15 минут — только через замок для взрослых (ПИН или код из почты)
  SCREENS.limitunlock = () => {
    if (!Accounts.adultOk()) return Accounts.gate('limitunlock');
    const x = ext(); x.add = (x.add || 0) + PLUS; x.until = Math.max(x.until || 0, Date.now()) + PLUS * 60e3; S.limitX = x;
    S.limitBrk = null; S.limitRun = { sec: 0, at: Date.now() }; stat('unlocks', 'x:' + Date.now()); warned = ''; save();
    toast(`⏳ Добавлено ${PLUS} минут`); go('home');
  };
  if (window.Accounts && Accounts.ADULT) ['limitunlock', 'adultswitch'].forEach(x => Accounts.ADULT.add(x));
  ['rest', 'limitunlock'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));

  // при ограничении любой переход ведёт на экран отдыха (кроме раздела для взрослых)
  { const g0 = go; go = function (name) { if (!FREE.has(name) && state()) return g0.call(this, 'rest'); return g0.apply(this, arguments); }; }

  /* ---------- настройки с сервера: при запуске и раз в 10 минут; без сети — последние известные ---------- */
  function pull() {
    const c = window.Accounts && Accounts.child(); if (!c || !c.token) return;
    Accounts.api('child/me', null, c.token).then(d => {
      let ch = false;
      if (d.role === 'adult-player' && S.role !== 'adult') { S.role = 'adult'; ch = true; }
      if ('limits' in d) { const nl = d.limits || null; if (JSON.stringify(nl) !== JSON.stringify(S.limits || null)) { S.limits = nl; ch = true; } }
      if (ch) { save(); check(); }
    }).catch(() => { });
  }
  setTimeout(pull, 1200); setInterval(() => { if (!document.hidden) pull(); }, 10 * 60e3);
  // ребёнок только что вошёл по семейному коду (без перезагрузки) — правила берём сразу, при первом же переходе
  let lastTok = ''; { const g1 = go; go = function () { const c = window.Accounts && Accounts.child(), t = c && c.token || ''; if (t && t !== lastTok) { lastTok = t; pull(); } return g1.apply(this, arguments); }; }
  function apply(l) { S.limits = l || null; save(); check(); } // кабинет на этом же устройстве — применяем сразу

  if (typeof NEWS !== 'undefined') NEWS.unshift('🎮 Взрослые тоже могут играть: «Играть самому» в кабинете — свой котик, вызовы и челленджи всей семьёй', '⏳ Взрослые могут настроить время игры — котик напомнит, когда пора отдохнуть');

  if (!document.getElementById('limits-css')) { const st = document.createElement('style'); st.id = 'limits-css'; st.textContent = `
    .rest-pg{padding-top:28px}.rest-cat{position:relative;width:170px;height:170px;margin:0 auto 6px}.rest-cat svg{width:100%;height:100%}
    .rest-z{position:absolute;right:-6px;top:4px;font-size:34px;animation:restz 2.4s ease-in-out infinite}@keyframes restz{0%,100%{transform:translateY(0);opacity:.6}50%{transform:translateY(-8px);opacity:1}}
    .rest-cd{font-size:44px;font-weight:900;margin:6px 0 10px;font-variant-numeric:tabular-nums}
    .rest-ideas{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:10px 0 18px}.rest-ideas span{background:#fff;border-radius:12px;padding:6px 10px;box-shadow:var(--sh);font-weight:700;font-size:14px}
    .rest-pg #rst-adult{margin-top:6px}
  `; document.head.appendChild(st); }

  return { state, left, tick, check, pull, apply, usedSec, rules, FREE };
})();
window.Limits = Limits;
