/* app.js — экраны и игровая логика «Мурлок и Ко» */
'use strict';
const E = window.Engine, { FURS, catSVG, ITEMS, SLOTS } = window.Cat;
const { rnd, pick, shuffle, plural, SYM } = E;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ================= Сохранение ================= */
const KEY = 'murlok-detective-v1';
function fresh() {
  return { v: 1, name: '', fur: 'ginger', candies: 0, totalCandies: 0, xp: 0, owned: ['deer', 'loupe'],
    wear: { head: 'deer', face: null, neck: null, hand: 'loupe' }, cases: 0, casesPerfect: 0, caseLog: [],
    st: { mul: { done: 0, perfect: 0 }, eq: { done: 0, perfect: 0 }, bug: { done: 0, perfect: 0 }, blitz: { games: 0, best: 0 } },
    err: {}, facts: {}, badges: [], days: {}, sound: true, vibro: true, voice: true, kid: '', music: { mode: 'light', vol: 0.3 }, gems: 0, gemsTotal: 0, perf: {}, login: { last: '', day: 0 }, goals: { date: '', got: [] }, furn: [], roomsSeen: ['living'], recent: [], crimeBag: [], seenVersion: '', lessons: { mul: false, eq: false }, prefs: { mulLv: 2, eqLv: 2, diff: 1, topic: 'mix' } };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === 1) { const f = fresh(); return { ...f, ...s, st: { ...f.st, ...s.st }, wear: { ...f.wear, ...s.wear }, music: { ...f.music, ...(s.music || {}) }, prefs: { ...f.prefs, ...s.prefs }, lessons: { ...f.lessons, ...s.lessons } }; }
  } catch (e) { }
  return fresh();
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } cloudSoon(); }
/* облачная копия: прогресс не пропадёт при смене устройства/браузера; восстановление по коду */
const CLOUD = 'https://level.tech-wave.ru/murlok-api';
let cloudT = null, cloudDirty = false;
function cloudCode() { if (!S.cloudCode) { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; S.cloudCode = Array.from({ length: 8 }, () => a[Math.floor(Math.random() * a.length)]).join(''); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } } return S.cloudCode; }
function cloudSoon() { if (!S.kid) return; cloudDirty = true; clearTimeout(cloudT); cloudT = setTimeout(cloudPush, 8000); }
function cloudPush() { if (!cloudDirty || !S.kid) return; cloudDirty = false; const data = { ...S, chatLog: [] }; /* переписку с котиком на сервер не отправляем */ fetch(CLOUD + '/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: cloudCode(), data }) }).then(r => { if (r.ok) { S.cloudAt = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } } else cloudDirty = true; }).catch(() => { cloudDirty = true; }); }
document.addEventListener('visibilitychange', () => { if (document.hidden) cloudPush(); });
async function cloudRestore(code) {
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code.length !== 8) throw new Error('code');
  const r = await fetch(CLOUD + '/load?code=' + code); if (!r.ok) throw new Error('nf');
  const d = await r.json(); if (!d || d.v !== 1) throw new Error('bad'); d.cloudCode = code; localStorage.setItem(KEY, JSON.stringify(d)); location.reload();
}
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }

const dkey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dkey(new Date());
function markDay(n = 1) { const t = today(); S.days[t] = (S.days[t] || 0) + n; }
function streak() { let n = 0; const d = new Date(); if (!S.days[dkey(d)]) d.setDate(d.getDate() - 1); while (S.days[dkey(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }
function noteErr(type, fact) { S.err[type] = (S.err[type] || 0) + 1; if (fact) S.facts[fact] = (S.facts[fact] || 0) + 1; save(); }
const factKey = (p, q) => Math.min(p, q) + '×' + Math.max(p, q);

/* ================= Звания, награды ================= */
const RANKS_OLD = [0, 60, 180, 360, 600, 900, 1300];
const RANKS = [[0, 'Котёнок-стажёр'], [150, 'Юный следопыт'], [400, 'Младший сыщик'], [800, 'Сыщик'], [1400, 'Опытный сыщик'], [2200, 'Детектив'], [3200, 'Старший детектив'], [4500, 'Инспектор'], [6000, 'Старший инспектор'], [8000, 'Главный инспектор'], [10500, 'Мастер дедукции'], [13500, 'Знаток улик'], [17000, 'Гроза воришек'], [21000, 'Легенда Сладкограда'], [26000, 'Великий детектив'], [32000, 'Легенда сыска']];
function ranksMigrate() { // переход на новую шкалу: звание ребёнка не понижается
  if (S.rankV === 2) return; let oi = 0; RANKS_OLD.forEach((t, i) => { if (S.xp >= t) oi = i; });
  const map = [0, 2, 3, 7, 8, 9, 15], ni = map[oi] || 0; if (S.xp < RANKS[ni][0]) S.xp = RANKS[ni][0]; S.rankV = 2; save();
}
function rank(xp = S.xp) { ranksMigrate(); let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; }); const next = RANKS[i + 1]; return { i, name: RANKS[i][1], next, prog: next ? (xp - RANKS[i][0]) / (next[0] - RANKS[i][0]) : 1 }; }
const BADGES = [
  { id: 'case1', icon: '🔍', name: 'Первое дело', desc: 'Раскрыть первое дело', t: s => s.cases >= 1 },
  { id: 'case5', icon: '🕵️', name: 'Опытный сыщик', desc: 'Раскрыть 5 дел', t: s => s.cases >= 5 },
  { id: 'case15', icon: '🏆', name: 'Гроза воришек', desc: 'Раскрыть 15 дел', t: s => s.cases >= 15 },
  { id: 'clean', icon: '💎', name: 'Чистая работа', desc: 'Раскрыть дело без единой ошибки', t: s => s.casesPerfect >= 1 },
  { id: 'mul10', icon: '✖️', name: 'Мастер столбика', desc: 'Решить 10 примеров столбиком', t: s => s.st.mul.done >= 10 },
  { id: 'mul40', icon: '🧮', name: 'Профессор столбика', desc: 'Решить 40 примеров столбиком', t: s => s.st.mul.done >= 40 },
  { id: 'eq10', icon: '📦', name: 'Открыватель коробок', desc: 'Решить 10 уравнений', t: s => s.st.eq.done >= 10 },
  { id: 'eq40', icon: '🗝️', name: 'Повелитель иксов', desc: 'Решить 40 уравнений', t: s => s.st.eq.done >= 40 },
  { id: 'bug10', icon: '🦝', name: 'Зоркий глаз', desc: 'Найти 10 ошибок Енота', t: s => s.st.bug.done >= 10 },
  { id: 'blitz20', icon: '⚡', name: 'Быстрые лапки', desc: '20 верных ответов за минуту', t: s => s.st.blitz.best >= 20 },
  { id: 'blitz30', icon: '🚀', name: 'Молния', desc: '30 верных ответов за минуту', t: s => s.st.blitz.best >= 30 },
  { id: 'streak3', icon: '🔥', name: 'Три дня подряд', desc: 'Заниматься 3 дня подряд', t: () => streak() >= 3 },
  { id: 'streak7', icon: '🌟', name: 'Неделя сыска', desc: 'Заниматься 7 дней подряд', t: () => streak() >= 7 },
  { id: 'sweet100', icon: '🍬', name: 'Сладкоежка', desc: 'Собрать 100 конфет', t: s => s.totalCandies >= 100 },
  { id: 'school', icon: '🎓', name: 'Выпускник', desc: 'Пройти оба урока в Школе сыщика', t: s => s.lessons.mul && s.lessons.eq },
];
function checkBadges() {
  BADGES.forEach(b => {
    if (!S.badges.includes(b.id) && b.t(S)) { S.badges.push(b.id); save(); setTimeout(() => { toast(`<span class="tb">${b.icon}</span><div><b>Новая награда!</b><br>${b.name}</div>`); SND.win(); later(() => speakT(PH.badgeNew[0]), 900); }, 700); }
  });
}
function award(c, xp) {
  const before = rank().i;
  S.candies += c; S.totalCandies += c; S.xp += xp; save(); updCandy();
  if (c > 0) { floatText(`+${c} 🍬`); SND.coin(); }
  const r = rank(); if (r.i > before) setTimeout(() => { toast(`<span class="tb">🎖️</span><div><b>Новое звание!</b><br>${r.name}</div>`); confetti(30); speakT(PH.rank[0]); M.meow({ shape: 'long', dur: 1.1, force: true }); later(() => SND.purr(2.5), 1200); }, 1200);
  checkBadges();
}
/* 💎 кристаллы — только за сложное */
function awardGems(n, why) { if (!n) return; S.gems = (S.gems || 0) + n; S.gemsTotal = (S.gemsTotal || 0) + n; save(); updCandy(); floatText(`+${n} 💎`); M.sfx('magic'); if (why) setTimeout(() => toast(`<span class="tb">💎</span><div><b>+${n} ${plural(n, 'кристалл', 'кристалла', 'кристаллов')}</b><br>${why}</div>`), 600); }
/* адаптация: запоминаем, как идут дела на уровне; хвалим и предлагаем уровень выше / помощь */
function trackPerf(topic, level, res, sec) {
  if (!topic || !level) return; S.perf = S.perf || {}; const k = topic + level, L = S.perf[k] = S.perf[k] || [];
  L.push({ ok: !res.mistakes && !res.helped, m: res.mistakes || 0, sec: Math.round(sec || 0) }); if (L.length > 10) L.shift(); save();
  const last = L.slice(-6), max = topic === 'mul' ? 4 : 4;
  if (last.length >= 6 && last.filter(x => x.ok).length >= 5 && level < max) offerLevel(topic, level, +1);
  else if (L.slice(-4).length >= 4 && L.slice(-4).filter(x => x.m >= 3).length >= 3 && level > 1) offerLevel(topic, level, -1);
}
function offerLevel(topic, level, dir) {
  S.perf[topic + level] = []; save();
  const names = topic === 'mul' ? E.MUL_LEVELS : E.EQ_LEVELS, to = level + dir, key = topic === 'mul' ? 'mulLv' : 'eqLv';
  setTimeout(() => {
    if ($('.modal')) return;
    const up = dir > 0;
    const m = modal(`<div class="big-emoji">${up ? '🚀' : '🤝'}</div><h2>${up ? `${esc(S.kid)}, ты тут круто научил${/[аяь]$/i.test(S.kid || '') ? 'ась' : 'ся'}!` : `${esc(S.kid)}, давай чуть полегче?`}</h2><p>${up ? `Уровень «${names[level].name}» уже получается почти без ошибок. Пора повысить уровень до <b>«${names[to].name}»</b>! За сложные задачи дают 💎 кристаллы.` : `Сейчас задачи даются тяжело — это нормально! Давай потренируемся на уровне <b>«${names[to].name}»</b> с подсказками, а потом вернёмся.`}</p><div class="row-btns"><button class="btn pink" id="lvyes">${up ? '⬆ Повысить уровень' : 'Давай полегче'}</button><button class="btn" data-close>Остаться</button></div>`);
    say(up ? 'Ты тут круто научился! Пора повысить уровень, {n}!'.replace('научился', /[аяь]$/i.test(S.kid || '') ? 'научилась' : 'научился') : 'Ничего, {n}, разберёмся вместе!', 0, { silent: !up });
    $('#lvyes', m.el).addEventListener('click', () => { S.prefs[key] = to; S.prefs[key + 'Chosen'] = true; save(); m.close(); SND.win(); if (curScreen === 'practice') go('practice', topic); });
  }, 1600);
}
function taskDone(kind, res) { S.st[kind].done++; if (!res.mistakes && !res.helped) S.st[kind].perfect++; markDay(1); save(); setTimeout(() => { if (['home', 'house'].includes(curScreen)) { checkGoals(); checkRooms(); } else rewardHint(); }, 1500); }
function rewardHint() { // во время задач сундуки не всплывают — ждут на главной
  const t = today(), n = S.days[t] || 0, got = S.goals.date === t ? S.goals.got : [];
  const g = GOAL_TIERS.find(x => n >= x.n && !got.includes(x.n)), room = window.Lines.ROOMS.find(r => roomOpen(r) && !S.roomsSeen.includes(r.id));
  const key = (g ? g.n : '') + '|' + (room ? room.id : ''); if (key === '|' || rewardHint.last === key) return; rewardHint.last = key;
  toast(`<span class="tb">${g ? '🎁' : '🔓'}</span><div>${g ? `<b>${g.name}</b> ждёт тебя на главной!` : `Открылась комната «${room.name}»!`}<br><small>Загляни, когда закончишь.</small></div>`);
}
const GOAL_TIERS = [{ n: 5, c: 5, icon: '🎁', name: 'Сундук задания дня' }, { n: 10, c: 8, icon: '🎁', name: 'Сундук усердия' }, { n: 20, c: 15, icon: '👑', name: 'Королевский сундук', gift: true }];
function checkGoals() {
  const t = today(); if (S.goals.date !== t) S.goals = { date: t, got: [] };
  const n = S.days[t] || 0, k = GOAL_TIERS.findIndex(g => n >= g.n && !S.goals.got.includes(g.n));
  if (k < 0 || $('.modal')) return;
  const g = GOAL_TIERS[k]; S.goals.got.push(g.n); save();
  openChest(g.icon, g.name, `${esc(S.kid)}, сегодня решено ${n} ${plural(n, 'задача', 'задачи', 'задач')}!`, g.c, g.gift, PH.goal[k]);
}
function solvedTotal() { return S.st.mul.done + S.st.eq.done + S.st.bug.done; }
/* сундук: трясётся, по нажатию открывается — конфеты и, может быть, сюрприз */
function openChest(icon, title, sub, candies, gift, line) {
  const m = modal(`<div class="chest-wrap"><button class="chest" id="chest" aria-label="Открыть сундук">${icon === '👑' ? '👑' : '🎁'}</button><h2>${title}</h2><p>${sub}</p><p class="small" id="chint">Нажми на сундук!</p><div id="loot"></div></div>`);
  if (line) speakT(line); M.haptic([30, 60, 30]);
  const ch = $('#chest', m.el); let opened = false;
  ch.addEventListener('click', () => {
    if (opened) return; opened = true; ch.classList.add('open'); SND.win(); confetti(45); M.haptic([20, 40, 20, 40, 120]);
    const got = gift ? surprise() : null;
    award(candies, 20);
    $('#chint', m.el).remove();
    $('#loot', m.el).innerHTML = `<div class="loot"><div>🍬 <b>+${candies}</b><small>конфет</small></div>${got ? `<div>${got.icon} <b>${got.name}</b><small>сюрприз!</small></div>` : ''}</div><button class="btn pink" data-close>Ура!</button>`;
    if (got) later(() => speakT(PH.surprise[0]), 1500);
  });
}
/* подарок за вход каждый день: 7-дневный календарь */
const LOGIN_REW = [2, 3, 3, 4, 5, 6, 10];
function checkLogin() {
  const t = today(); if (S.login.last === t) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  const day = S.login.last === dkey(y) ? (S.login.day % 7) + 1 : 1;
  const m = modal(`<h2>🎁 Подарок за вход!</h2><p>Заходи каждый день — подарки растут! На 7-й день — супер-сюрприз.</p>
    <div class="cal">${LOGIN_REW.map((c, i) => `<div class="cd ${i + 1 < day ? 'past' : i + 1 === day ? 'now' : ''}"><small>День ${i + 1}</small><span>${i + 1 < day ? '✅' : i === 6 ? '🎁' : '🍬'}</span><b>${c}</b></div>`).join('')}</div>
    <button class="btn big pink" id="claim">Забрать ${LOGIN_REW[day - 1]} 🍬${day === 7 ? ' + сюрприз' : ''}!</button>`, 'wide');
  speakT(day === 7 ? PH.daily[1] : PH.daily[0]);
  $('#claim', m.el).addEventListener('click', () => {
    S.login = { last: t, day }; save();
    const got = day === 7 ? surprise() : null; award(LOGIN_REW[day - 1], 10); confetti(35); SND.win();
    m.el.querySelector('.sheet').innerHTML = `<div class="big-emoji">🎉</div><h2>+${LOGIN_REW[day - 1]} 🍬${got ? ` и ${got.icon} ${got.name}` : ''}</h2><p>${day < 7 ? `Завтра — ${LOGIN_REW[day]} 🍬. Приходи!` : 'Неделя подарков пройдена! Завтра всё начнётся заново.'}</p><button class="btn pink" data-close>Мур, спасибо!</button>`;
    later(() => speakT(got ? PH.surprise[0] : PH.daily[2]), 700);
  });
}

/* ================= Звуки и эффекты ================= */
const M = window.Meow;
M.setEnabled(() => S.sound); M.setVibro(() => S.vibro !== false); M.setVoice(() => S.sound && S.voice !== false);
M.onTalk(on => { document.body.classList.toggle('cat-talking', on); Music.setDuck(on); });
document.addEventListener('pointerdown', function unlock() { M.ctx(); M.unlockSpeech(); setTimeout(() => Music.play(), 50); document.removeEventListener('pointerdown', unlock, true); }, true);
const tone = seq => M.tone(seq), later = (f, ms) => setTimeout(f, ms);
const SND = {
  ok: () => { cheer(true); tone([[660, 0.12], [880, 0.2, 0.09]]); if (Math.random() < 0.3) later(() => M.chirp(), 260); catMood('happy', 900); M.haptic(15); },
  bad: () => { cheer(false); tone([[200, 0.22, 0, 'triangle', 0.14]]); later(() => M.custom('oops') || M.meow({ shape: 'question', vol: 0.32, pitch: 1.2, dur: 0.45 }), 120); catMood('sad', 1300); M.haptic([40, 60, 40]); },
  tap: () => { tone([[560, 0.05, 0, 'sine', 0.06]]); M.haptic(8); },
  coin: () => { tone([[988, 0.09], [1319, 0.25, 0.07]]); flyCandy(); },
  win: () => { tone([[523, 0.14], [659, 0.14, 0.11], [784, 0.14, 0.22], [1047, 0.45, 0.33]]); later(() => M.custom('yay') || M.meow({ shape: 'happy', force: true }), 650); later(() => M.purr(1.8), 1350); catMood('happy', 2400); later(() => hearts(), 600); M.haptic([20, 40, 20, 40, 80]); },
  meow: () => { pick([() => M.meow(), () => M.meow({ shape: 'happy' }), M.kitten, () => M.trill()])(); catMood('happy', 900); M.haptic(20); },
  purr: d => { M.purr(d); catMood('purr', d * 1000); M.haptic([30, 50, 30, 50, 30]); },
  hiss: () => { M.hiss(); M.haptic([80, 40, 120]); },
  trill: () => { M.trill(); catMood('happy', 900); },
  crunch: () => { M.crunch(); later(() => M.purr(1.6), 1000); M.haptic([15, 120, 15, 120, 15]); },
};
/* реакции кота: подменяем мордочку у всех видимых котов на экране */
let moodTimer = null;
function catMood(mood, ms = 1200) {
  const boxes = $$('.mini-cat, .hero-cat, .win-cat-in, .shop-cat, .m-cat, .room-cat' + (mascot.hidden ? '' : ', .ms-cat'));
  if (!boxes.length) return;
  clearTimeout(moodTimer);
  boxes.forEach(b => {
    const mini = b.classList.contains('mini-cat');
    b.innerHTML = myCat({ happy: mood === 'happy' || mood === 'purr', sad: mood === 'sad', cls: mini ? 'mini' : '' });
    b.classList.remove('m-happy', 'm-sad', 'm-purr'); void b.offsetWidth; b.classList.add('m-' + mood);
  });
  moodTimer = setTimeout(() => boxes.forEach(b => { if (!b.isConnected) return; b.classList.remove('m-happy', 'm-sad', 'm-purr'); b.innerHTML = myCat({ cls: b.classList.contains('mini-cat') ? 'mini' : '' }); }), ms);
}
function hearts(src, n = 6) {
  const el = src || $('.mini-cat, .hero-cat, .win-cat-in'); if (!el) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) { const h = document.createElement('div'); h.className = 'heart'; h.textContent = pick(['❤️', '💗', '💕', '💖', '😻']); h.style.left = (r.left + r.width * (0.2 + Math.random() * 0.6)) + 'px'; h.style.top = (r.top + r.height * 0.3) + 'px'; h.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px'); h.style.animationDelay = (i * 0.12) + 's'; document.body.appendChild(h); setTimeout(() => h.remove(), 2200 + i * 120); }
}
function flyCandy() {
  const pill = $('.candy'); if (!pill) return; const r = pill.getBoundingClientRect();
  for (let i = 0; i < 3; i++) { const c = document.createElement('div'); c.className = 'flycandy'; c.textContent = '🍬'; c.style.setProperty('--tx', (r.left + r.width / 2 - innerWidth / 2) + 'px'); c.style.setProperty('--ty', (r.top + r.height / 2 - innerHeight / 2) + 'px'); c.style.animationDelay = (i * 0.1) + 's'; document.body.appendChild(c); setTimeout(() => c.remove(), 1200); }
  setTimeout(() => { pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump'); }, 800);
}
function pawAt(el) {
  if (!el) return; const r = el.getBoundingClientRect(); const p = document.createElement('div'); p.className = 'pawfx'; p.textContent = '🐾';
  p.style.left = (r.left + r.width / 2) + 'px'; p.style.top = (r.top) + 'px'; document.body.appendChild(p); setTimeout(() => p.remove(), 900);
}
function toast(html) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 2800); setTimeout(() => t.remove(), 3300); }
function floatText(txt) { const f = document.createElement('div'); f.className = 'floater'; f.textContent = txt; document.body.appendChild(f); setTimeout(() => f.remove(), 1500); }
function confetti(n = 40) {
  const box = document.createElement('div'); box.className = 'confetti'; const em = ['🍬', '🍭', '🍩', '🧁', '🍫', '⭐', '🐾', '🍪'];
  for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.textContent = pick(em); s.style.left = Math.random() * 100 + 'vw'; s.style.animationDelay = Math.random() * 0.9 + 's'; s.style.fontSize = (18 + Math.random() * 24) + 'px'; box.appendChild(s); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 3800);
}
function modal(html, cls = '') {
  const m = document.createElement('div'); m.className = 'modal'; m.innerHTML = `<div class="sheet ${cls}">${html}</div>`; document.body.appendChild(m);
  const close = () => m.remove(); m.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  return { el: m, close };
}
function shake(el) { if (!el) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
const myCat = (o = {}) => catSVG({ fur: S.fur, wear: S.wear, ...o });


/* ================= Фоновая музыка (Kevin MacLeod, incompetech.com, CC BY 4.0) ================= */
const MUSIC = {
  light: { name: 'Лайтовая', icon: '🌸', desc: 'Спокойная и весёлая — для уроков', tracks: [['light1', 'Carefree'], ['light2', 'Easy Lemon'], ['light3', 'Hep Cats']] },
  hard: { name: 'Жёсткая', icon: '🎸', desc: 'Драйв и бодрость — для блица и дел', tracks: [['hard1', 'Bit Shift'], ['hard2', 'Run Amok'], ['hard3', 'Volatile Reaction']] },
  mystic: { name: 'Мистическая', icon: '🔮', desc: 'Волшебная и загадочная — как в сказке', tracks: [['myst1', 'Comfortable Mystery'], ['myst2', 'Comfortable Mystery 4'], ['myst3', 'Mystery Bazaar'], ['myst4', 'Enchanted Valley'], ['myst5', 'Magic Forest'], ['myst6', 'Dreamy Flashback']] },
  spy: { name: 'Таинственная', icon: '🕵️', desc: 'Шпионская — для секретных расследований', tracks: [['spy1', 'Hidden Agenda'], ['spy2', 'Spy Glass'], ['spy3', 'Sneaky Adventure'], ['spy4', 'Night on the Docks'], ['spy5', 'Thinking Music']] },
  focus: { name: 'Для ударной работы', icon: '⚡', desc: 'Детективный ритм — помогает сосредоточиться', tracks: [['focus1', 'Sneaky Snitch'], ['focus2', 'Investigations'], ['focus3', 'Pixelland']] },
};
const Music = (() => {
  let audio = null, gain = null, list = [], idx = 0, started = false, duck = false, mode = '';
  const vol = () => (S.music && S.music.vol != null ? S.music.vol : 0.3);
  function setup() {
    if (audio) return;
    audio = new Audio(); audio.preload = 'auto'; audio.addEventListener('ended', next); audio.addEventListener('error', () => setTimeout(next, 1000));
    const ac = M.ctx();
    if (ac && location.protocol !== 'file:') { try { const src = ac.createMediaElementSource(audio); gain = ac.createGain(); gain.gain.value = 0; src.connect(gain); gain.connect(ac.destination); } catch (e) { gain = null; } }
  }
  function apply() {
    if (!audio) return; const v = (S.sound ? vol() : 0) * (duck ? 0.3 : 1);
    if (gain) { gain.gain.setTargetAtTime(v * 0.6, M.ctx().currentTime, 0.25); audio.volume = 1; } else audio.volume = Math.min(1, v * 0.6);
  }
  function load() { list = shuffle(MUSIC[S.music.mode].tracks); idx = 0; audio.src = 'music/' + list[0][0] + '.mp3'; mode = S.music.mode; }
  function play() {
    if (!S.music || S.music.mode === 'off' || !MUSIC[S.music.mode] || !S.sound) return pause();
    setup(); if (mode !== S.music.mode) load(); apply();
    audio.play().then(() => { started = true; document.body.classList.add('music-on'); }).catch(() => { });
  }
  function pause() { if (audio) audio.pause(); document.body.classList.remove('music-on'); }
  function next() { if (!list.length) return; idx = (idx + 1) % list.length; if (idx === 0) list = shuffle(list); audio.src = 'music/' + list[idx][0] + '.mp3'; apply(); audio.play().catch(() => { }); const np = $('#nowp'); if (np) np.innerHTML = nowPlaying(); }
  // музыка идёт по кругу; если браузер её остановил — сторож запускает снова
  const want = () => started && S.sound && S.music && S.music.mode !== 'off' && MUSIC[S.music.mode] && !document.hidden;
  setInterval(() => { if (!audio || !want()) return; const ac = M.ctx(); if (ac && ac.state === 'suspended') ac.resume(); if (audio.ended) next(); else if (audio.paused) audio.play().catch(() => { }); }, 4000);
  document.addEventListener('pointerdown', () => { if (audio && want() && audio.paused) audio.play().catch(() => { }); }, true);
  return { play, pause, next, apply, setDuck: d => { duck = d; apply(); }, current: () => (list[idx] ? list[idx][1] : ''), get started() { return started; }, get playing() { return !!audio && !audio.paused; } };
})();
function nowPlaying() { return Music.playing ? `🎶 Сейчас играет: <b>${Music.current()}</b>` : (S.music.mode === 'off' ? 'Музыка выключена' : !S.sound ? 'Включи звук 🔊 на главном экране' : ''); }
document.addEventListener('visibilitychange', () => { if (document.hidden) Music.pause(); else if (Music.started) Music.play(); });
function openMusic() {
  const PH_M = { light: PH.music[0], hard: PH.music[1], focus: PH.music[2], off: PH.music[3], mystic: PH.music[4], spy: PH.music[5] };
  const m = modal(`<h2>🎵 Музыка</h2><p class="small">Выбери настроение — котик будет слушать вместе с тобой!</p>
    <div class="music-grid">${Object.entries(MUSIC).map(([k, v]) => `<button class="mcard ${S.music.mode === k ? 'on' : ''}" data-m="${k}"><span>${v.icon}</span><b>${v.name}</b><small>${v.desc}</small></button>`).join('')}<button class="mcard ${S.music.mode === 'off' ? 'on' : ''}" data-m="off"><span>🔕</span><b>Без музыки</b><small>Тишина</small></button></div>
    <div class="vol"><span>🔈</span><input type="range" id="mvol" min="0" max="100" value="${Math.round(S.music.vol * 100)}" aria-label="Громкость музыки"><span>🔊</span></div>
    <div class="nowp" id="nowp">${nowPlaying()}</div><button class="btn sm" id="mnext">⏭ Другой трек</button>
    <p class="credit">Музыка: Kevin MacLeod (incompetech.com). Лицензия Creative Commons: By Attribution 4.0</p><button class="btn pink" data-close>Готово</button>`, 'wide');
  $$('.mcard', m.el).forEach(b => b.addEventListener('click', () => {
    S.music.mode = b.dataset.m; save(); $$('.mcard', m.el).forEach(x => x.classList.toggle('on', x === b)); SND.tap();
    if (S.music.mode === 'off') Music.pause(); else Music.play();
    say(PH_M[S.music.mode]); setTimeout(() => { const np = $('#nowp', m.el); if (np) np.innerHTML = nowPlaying(); }, 600);
  }));
  $('#mvol', m.el).addEventListener('input', e => { S.music.vol = +e.target.value / 100; Music.apply(); });
  $('#mvol', m.el).addEventListener('change', save);
  $('#mnext', m.el).addEventListener('click', () => { SND.tap(); if (S.music.mode === 'off') { S.music.mode = 'light'; save(); } Music.play(); Music.next(); });
}
/* ================= Маскот: котик-напарник на каждом экране ================= */
const PH = window.Lines.PH;
const names = () => ({ kid: S.kid, cat: S.name });
const speakT = (t, o) => M.voice(t, names(), o);
function homeGreet() {
  const low = careLow(); if (low.length && Math.random() < 0.7) return window.Lines.CARE[low[0]].low;
  const G = PH.greet, h0 = new Date().getHours(), t0 = S.days[today()] || 0;
  return pick([G[h0 < 12 ? 0 : h0 < 18 ? 1 : 2], G[3], streak() >= 2 ? G[5] : G[4], t0 >= 5 ? G[6] : G[7], (!S.lessons.mul || !S.lessons.eq) ? G[8] : G[9]]);
}
function homeGreetOld() {
  const h = new Date().getHours(), t = S.days[today()] || 0, st = streak();
  const hi = h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  return pick([`${hi}, ${S.kid}! Мур-р 😺`, `${S.kid}, я так по тебе соскучился! 🐾`, st >= 2 ? `Уже ${st} ${plural(st, 'день', 'дня', 'дней')} подряд! Ты молодец! 🔥` : 'Погладь меня — я замурлычу! 🐾', t >= 5 ? 'Задание дня выполнено! Я горжусь тобой!' : `Решим ещё ${5 - t} ${plural(5 - t, 'задачу', 'задачи', 'задач')} для задания дня?`, (!S.lessons.mul || !S.lessons.eq) ? 'Начнём со Школы сыщика? Я всё объясню!' : 'Возьмём новое дело? Сладкоград ждёт! 🍬']);
}
const NO_FLOAT = ['home', 'hello', 'casetask', 'practice', 'bugs', 'parents', 'lesson', 'blitz', 'chat', 'game'];
let curScreen = '', okRun = 0, lastCheer = 0;
const mascot = document.createElement('div'); mascot.id = 'mascot'; mascot.hidden = true;
mascot.innerHTML = '<div class="ms-bubble" hidden></div><button class="ms-cat" aria-label="Котик-напарник"></button>';
document.body.appendChild(mascot);
const msCat = mascot.querySelector('.ms-cat'), msBub = mascot.querySelector('.ms-bubble');
function bubbleOn(el, text, ms = 3800) { el.textContent = text; el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); clearTimeout(el._t); if (el === msBub) mascot.classList.add('talk'); el._t = setTimeout(() => { el.hidden = true; if (el === msBub) mascot.classList.remove('talk'); }, ms); }
/* сказать фразу тем котом, который сейчас на экране */
function say(tpl, ms, o = {}) {
  const tpls = [].concat(tpl);
  let text = tpls.join(' ').replace(/!!/g, '!').replace(/\{n\}/g, S.kid || 'сыщик').replace(/\{c\}/g, S.name || 'котик').replace(/^@s /, '').replace(/<[^>]+>/g, '');
  let sp = o.speech || tpls;
  if (!o.speech && !tpls.some(t => String(t).includes('{n}')) && Math.random() < 0.45 && S.kid) { sp = ['{n}!', ...tpls]; text = S.kid + ', ' + text.charAt(0).toLowerCase() + text.slice(1); }
  if (!o.silent) speakT(sp, { prio: o.prio });
  ms = ms || Math.max(3800, text.length * 75);
  const hs = $('#heroSay'); if (hs) return bubbleOn(hs, text, ms);
  if (!mascot.hidden) return bubbleOn(msBub, text, ms);
  const hp = $('.modal .m-cat') || $('.helper') || $('.slide-head'); if (hp) { $$('.cheer').forEach(x => x.remove()); const c = document.createElement('div'); c.className = 'cheer'; c.textContent = text; hp.appendChild(c); setTimeout(() => c.remove(), Math.min(ms, 5000)); }
}
function catSay(...a) { return say(...a); } // для экранов, где есть свой локальный say
function cheer(ok) {
  const now = Date.now();
  if (ok) { okRun++; if (okRun % 3 === 0 && now - lastCheer > 4000) { lastCheer = now; say(pick(PH.cheerOk), 0, { prio: 0 }); } }
  else { okRun = 0; if (now - lastCheer > 5000 && Math.random() < 0.6) { lastCheer = now; say(pick(PH.cheerBad), 0, { prio: 0 }); } }
}
function mascotScene(name) {
  curScreen = name; okRun = 0; M.hush();
  mascot.hidden = NO_FLOAT.includes(name);
  document.body.classList.toggle('has-mascot', !mascot.hidden);
  msBub.hidden = true;
  if (!mascot.hidden || name === 'lesson' || name === 'blitz') { if (!mascot.hidden) msCat.innerHTML = myCat({ cls: 'mini' }); const key = PH[name] ? name : 'idle'; setTimeout(() => say(name === 'caseintro' && CASE ? [`Новое дело: ${CASE.c.crime.title}! Сегодня утром в ${CASE.c.crime.place} кто-то украл ${CASE.c.crime.what}.`, 'Решай задачи, {n}, — за каждую получишь улику!'] : pick(PH[key]), 0, { prio: name === 'caseintro' ? 2 : 0 }), 600); }
  if (name === 'home') { setTimeout(() => say(homeGreet(), 4500), 700); if (!mascotScene.hi) { mascotScene.hi = 1; setTimeout(() => M.custom('hello'), 300); } }
}
// погладить маскота: касание — мурлыканье и фраза, удержание — мурлычет, пока держишь
let msHold = null, msPurr = false;
msCat.addEventListener('pointerdown', e => { e.preventDefault(); M.ctx(); mascot.classList.add('talk'); msHold = setTimeout(() => { msPurr = true; M.purrStart(); msCat.classList.add('m-purr'); msCat.innerHTML = myCat({ happy: true, cls: 'mini' }); say(PH.purr[0]); hearts(msCat, 3); M.haptic([25, 60, 25, 60, 25]); }, 380); });
const msStop = () => { clearTimeout(msHold); if (msPurr) { msPurr = false; M.purrStop(); msCat.classList.remove('m-purr'); msCat.innerHTML = myCat({ cls: 'mini' }); } };
msCat.addEventListener('pointerup', () => { if (!msPurr) { clearTimeout(msHold); SND.purr(1.4); hearts(msCat, 3); say(pick(PH.pet)); } msStop(); });
['pointerleave', 'pointercancel'].forEach(ev => msCat.addEventListener(ev, msStop));
msCat.addEventListener('contextmenu', e => e.preventDefault());
// время от времени котик сам подбадривает
setInterval(() => {
  if (document.hidden || msPurr) return;
  if (!mascot.hidden) { say(pick(PH.idle), 0, { prio: 0 }); if (Math.random() < 0.5) { M.purr(1.5); catMood('purr', 1500); } else M.trill(); }
  else if (['casetask', 'practice', 'bugs', 'lesson', 'blitz'].includes(curScreen) && Math.random() < 0.5) say(pick(PH.idle), 0, { prio: 0 });
  else if (curScreen === 'home') say(homeGreet(), 4500, { prio: 0 });
}, 32000);

/* ================= Роутер ================= */
let keyHandler = null, cleanups = [];
const SCREENS = {};
document.addEventListener('keydown', e => { if (keyHandler && !(e.target.closest && e.target.closest('input'))) keyHandler(e); });
function go(name, arg) {
  cleanups.forEach(f => { try { f(); } catch (e) { } }); cleanups = []; keyHandler = null; M.stopAll();
  $$('.modal').forEach(m => m.remove());
  app.innerHTML = ''; app.className = 'scr-' + name;
  (SCREENS[name] || SCREENS.home)(arg); window.scrollTo(0, 0); mascotScene(app.className.slice(4));
}
document.addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) { SND.tap(); go(g.dataset.go, g.dataset.arg); } });
// тактильный отклик на каждое касание кнопок, вещей и персонажей (внутри касания — так работает и на iPhone)
document.addEventListener('click', e => { if (e.target.closest('button, .fx, .sus, .mini-cat, .hero-cat, .room-cat, .ccell, .lc')) M.haptic(10); }, true);
function topbar(title, back = 'home') {
  return `<header class="top"><button class="back" data-go="${back}" aria-label="Назад">←</button><h1>${title}</h1><div class="pill gem" title="Кристаллы сыщика — за сложные задачи">💎 <b class="gemN">${S.gems || 0}</b></div><div class="pill candy">🍬 <b class="candyN">${S.candies}</b></div></header>`;
}
function updCandy() { $$('.candyN').forEach(e => { e.textContent = S.candies; }); $$('.gemN').forEach(e => { e.textContent = S.gems || 0; }); }

/* ================= Цифровая клавиатура ================= */
function numpad(ok = true) {
  return `<div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="k" data-k="${n}">${n}</button>`).join('')}<button class="k fn" data-k="back" aria-label="Стереть">⌫</button><button class="k" data-k="0">0</button>${ok ? '<button class="k ok" data-k="ok" aria-label="Проверить">✓</button>' : '<span></span>'}</div>`;
}
function bindPad(root, h) {
  const press = k => { if (k === 'back') h.back && h.back(); else if (k === 'ok') h.ok && h.ok(); else h.digit && h.digit(+k); };
  $$('.pad .k', root).forEach(b => b.addEventListener('click', () => press(b.dataset.k)));
  keyHandler = e => { let k = null; if (/^[0-9]$/.test(e.key)) k = e.key; else if (e.key === 'Backspace') k = 'back'; else if (e.key === 'Enter') k = 'ok'; if (k) { e.preventDefault(); press(k); } };
}
function helperHTML(id) { return `<div class="helper"><div class="mini-cat">${myCat({ cls: 'mini' })}</div><div class="bubble" id="${id}"></div></div>`; }
/* погладить любого кота на экране: касание — мяу и фраза, удержание — мурлычет */
const PET_SEL = '.mini-cat, .shop-cat, .win-cat-in, .m-cat, .hello-cat, .room-cat';
let petT = null, petEl = null, petPurr = false;
document.addEventListener('pointerdown', e => {
  const el = e.target.closest(PET_SEL); if (!el) return;
  petEl = el; petPurr = false;
  petT = setTimeout(() => { petPurr = true; M.purrStart(); el.classList.add('m-purr'); hearts(el, 3); say(PH.purr[0], 2500); M.haptic([25, 60, 25, 60, 25]); }, 380);
});
const petEnd = () => { clearTimeout(petT); if (!petEl) return; const el = petEl; petEl = null;
  if (petPurr) { petPurr = false; M.purrStop(); el.classList.remove('m-purr'); return; }
  pick([() => M.meow({ shape: 'happy' }), () => M.trill(), M.kitten])(); catMood('happy', 1000); hearts(el, 3); M.haptic(20); say(pick(PH.pet)); };
document.addEventListener('pointerup', petEnd); document.addEventListener('pointercancel', petEnd);
document.addEventListener('contextmenu', e => { if (e.target.closest(PET_SEL)) e.preventDefault(); });

function placeWord(i, n) { return i === 1 ? plural(n, 'десяток', 'десятка', 'десятков') : i === 2 ? plural(n, 'сотня', 'сотни', 'сотен') : 'тысяч'; }

/* ======================================================================
   ТРЕНАЖЁР: УМНОЖЕНИЕ СТОЛБИКОМ
   guided=true  — кот ведёт по шагам: «3 × 4 + 1 = ?», объясняет перенос и сдвиг
   guided=false — сам(а) пишешь цифры в клетки справа налево, кот проверяет каждую
   ====================================================================== */
function mountMul(el, { a, b, guided, onDone }) {
  const P = E.mulPlan(a, b), nA = P.A.length, nB = P.B.length, multi = nB > 1;
  const W = Math.max(String(P.total).length, ...P.rows.map(r => String(r.val).length + r.shift), nA, nB) + 1;
  const uid = 'm' + rnd(1e5, 1e6);
  const defs = [{ k: 'mc', small: true }, { k: 'a' }, { k: 'b', ul: true }];
  if (multi) { defs.push({ k: 'sc', small: true }); P.rows.forEach((r, i) => defs.push({ k: 'p' + i, ul: i === nB - 1 })); defs.push({ k: 's' }); }
  else defs.push({ k: 'p0' });
  const grid = defs.map(d => `<div class="mrow ${d.small ? 'small' : ''}">${Array.from({ length: W }, (_, q) => { const c = W - 1 - q; return `<div class="cell ${d.ul && c < W - 1 ? 'ul' : ''}" id="${uid}-${d.k}-${c}" data-k="${d.k}" data-c="${c}"></div>`; }).join('')}</div>`).join('');
  el.innerHTML = `<div class="task-wrap">
    <div class="paper-col"><div class="task-title">${a} × ${b}</div><div class="paper"><div class="mgrid" style="--w:${W}">${grid}</div></div>
      <div class="legend">${guided ? '<span><i class="lg hl"></i>умножаем</span><span><i class="lg hlc"></i>запомненное</span>' : ''}<span><i class="lg target"></i>пишем сюда</span></div></div>
    <div class="ctrl-col">${helperHTML(uid + '-bub')}<div class="ask" id="${uid}-ask"></div>${numpad(guided)}
      ${guided ? '' : `<div class="row-btns"><button class="btn ghost sm" id="${uid}-hint">🐾 Подсказка</button></div>`}</div></div>`;
  const cell = (k, c) => document.getElementById(`${uid}-${k}-${c}`);
  const set = (k, c, t, cls) => { const x = cell(k, c); if (!x) return; x.textContent = t; x.className = x.className.replace(/\b(w|ghost|carry|sign|pop)\b/g, '').trim(); if (cls) x.classList.add(...cls.split(' ')); };
  P.A.forEach((d, j) => set('a', j, d)); P.B.forEach((d, i) => set('b', i, d)); set('b', W - 1, '×', 'sign'); if (multi) set('p1', W - 1, '+', 'sign');
  const bub = $('#' + uid + '-bub'), ask = $('#' + uid + '-ask');
  const say = h => { bub.innerHTML = h; bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); };

  // шаги для самостоятельного режима — по одной цифре
  const dsteps = [];
  P.steps.forEach(s => {
    if (s.t === 'shift') { dsteps.push(s); return; }
    const key = s.t === 'mul' ? 'p' + s.row : 's';
    if (!s.last) dsteps.push({ t: 'dig', key, col: s.col, expect: s.v % 10, s, part: 'u' });
    else String(s.v).split('').reverse().forEach((d, q) => dsteps.push({ t: 'dig', key, col: s.col + q, expect: +d, s, part: q ? 't' : 'u' }));
  });
  const list = guided ? P.steps : dsteps;
  let si = 0, buf = '', tries = 0, mistakes = 0, helped = false, done = false, hintLvl = 0;
  const cur = () => list[si];
  const base = s => (s.t === 'dig' ? s.s : s);

  function hl(s) {
    $$('.cell', el).forEach(c => c.classList.remove('hl', 'hlc', 'target', 'tap', 'pulse'));
    if (!s) return;
    const st = base(s);
    if (st.t === 'mul') { cell('b', st.row).classList.add('hl'); cell('a', st.j).classList.add('hl'); if (st.carry && guided) cell('mc', st.j)?.classList.add('hlc'); }
    if (st.t === 'add' && guided) { P.rows.forEach((r, i) => { const c = cell('p' + i, st.col); if (c && c.textContent) c.classList.add('hl'); }); if (st.carry) cell('sc', st.col)?.classList.add('hlc'); }
    if (st.t === 'shift') { for (let c = 0; c < W - 1; c++) cell('p' + st.row, c).classList.add('tap'); return; }
    if (s.t === 'dig') cell(s.key, s.col).classList.add('target');
    else { const key = st.t === 'mul' ? 'p' + st.row : 's'; cell(key, st.col).classList.add('target'); if (st.last && st.v >= 10) cell(key, st.col + 1).classList.add('target'); }
  }
  function writeStep(st) { // пошаговый режим: записать результат шага целиком
    const key = st.t === 'mul' ? 'p' + st.row : 's';
    if (!st.last) { set(key, st.col, st.v % 10, 'w pop'); if (st.v >= 10) { if (st.t === 'mul') set('mc', st.j + 1, Math.floor(st.v / 10), 'carry pop'); else set('sc', st.col + 1, Math.floor(st.v / 10), 'carry pop'); } }
    else String(st.v).split('').reverse().forEach((d, q) => set(key, st.col + q, d, 'w pop'));
  }
  const clearMC = () => { for (let c = 0; c < W; c++) set('mc', c, ''); };
  const expr = st => st.t === 'mul' ? `${st.bd} × ${st.ad}${st.carry ? ` + <span class="cc">${st.carry}</span>` : ''}` : `${st.parts.join(' + ')}${st.carry ? ` + <span class="cc">${st.carry}</span>` : ''}`;

  function prompt(s) { // объяснение текущего шага (пошагово / по подсказке)
    const st = base(s);
    if (st.t === 'shift') return `Теперь умножаем на <b>${st.bd}</b>. Но это не просто ${st.bd}, а <b>${st.bd} ${placeWord(st.row, st.bd)}</b> = ${st.bd * 10 ** st.row}! Поэтому записывать начинаем со <b>сдвигом на ${st.row} ${plural(st.row, 'клетку', 'клетки', 'клеток')} влево</b>. Нажми на клетку, с которой начнёшь писать 👆`;
    if (st.t === 'mul') {
      let t = st.first ? `Умножаем ${a} на <b>${st.bd}</b>. Всегда начинаем справа — с последней цифры верхнего числа. ` : '';
      t += `Сколько будет <b>${st.bd} × ${st.ad}</b>${st.carry ? ` и ещё прибавить запомненное <b class="cc">${st.carry}</b>` : ''}?`;
      if (st.last) t += ` Это последняя цифра — число запишем целиком.`;
      return t;
    }
    let t = st.first ? 'Неполные произведения готовы! Теперь их складываем — тоже справа налево, по столбикам. ' : '';
    if (st.parts.length === 1 && !st.carry) t += `В этом столбике одна цифра — просто сносим её вниз: <b>${st.parts[0]}</b>.`;
    else t += `Складываем столбик: <b>${st.parts.join(' + ')}</b>${st.carry ? ` и запомненное <b class="cc">${st.carry}</b>` : ''}.`;
    if (st.last && st.v >= 10) t += ' Последний столбик — пишем число целиком.';
    return t;
  }
  function renderAsk() {
    const s = cur(); if (!s) return;
    const st = base(s);
    if (st.t === 'shift') { ask.innerHTML = `<div class="ask-txt">👆 Нажми на клетку в строке ${st.row + 1}</div>`; return; }
    if (guided) ask.innerHTML = `<div class="ask-eq">${expr(st)} = <span class="inp">${buf || '?'}</span></div>`;
    else {
      const what = st.t === 'mul' ? `Строка ${st.row + 1}: умножаем на <b>${st.bd}</b>` : 'Складываем неполные произведения';
      ask.innerHTML = `<div class="ask-txt">${what}</div><div class="ask-sub">Какую цифру пишем в выделенную клетку?</div>`;
    }
  }
  function next(fb) {
    const s = cur(); tries = 0; buf = ''; hintLvl = 0;
    if (!s) return finish(fb);
    if (s.t === 'shift') clearMC();
    hl(s); renderAsk();
    if (guided) say((fb ? `<div class="fb">${fb}</div>` : '') + prompt(s));
    else if (s.t === 'shift') say((fb ? `<div class="fb">${fb}</div>` : '') + `Первая строка готова! С какой клетки начнёшь писать <b>вторую строку</b>? Нажми на неё.`);
    else if (fb) say(`<div class="fb">${fb}</div>`);
  }
  function finish(fb) {
    done = true; hl(null); keyHandler = null;
    const key = multi ? 's' : 'p0'; for (let c = 0; c < W; c++) cell(key, c)?.classList.add('done');
    ask.innerHTML = `<div class="ask-eq win">${a} × ${b} = <b>${P.total}</b></div>`;
    say((fb ? `<div class="fb">${fb}</div>` : '') + `🎉 ${pick(['Молодец', 'Умница', 'Отлично', 'Ура'])}, ${esc(S.kid)}! <b>${a} × ${b} = ${P.total}</b>${mistakes ? '' : '<br>Без единой ошибки — вот это лапки!'}`);
    SND.win(); later(() => catSay(pick(PH.done)), 400); onDone && onDone({ mistakes, helped });
  }
  function feedbackMul(st) {
    if (st.t === 'mul') {
      if (st.last) return st.v >= 10 ? `✔ ${st.v} — пишем целиком.` : `✔ Пишем ${st.v}.`;
      return st.v >= 10 ? `✔ ${st.v}: пишем <b>${st.v % 10}</b>, а <b class="cc">${Math.floor(st.v / 10)}</b> запоминаем — записываю маленькой сверху.` : `✔ Пишем ${st.v}.`;
    }
    if (st.last) return `✔ Пишем ${st.v}.`;
    return st.v >= 10 ? `✔ ${st.v}: пишем <b>${st.v % 10}</b>, <b class="cc">${Math.floor(st.v / 10)}</b> запоминаем.` : `✔ Пишем ${st.v}.`;
  }
  function rowDoneMsg(st) {
    if (st.t === 'mul' && st.last) { const r = P.rows[st.row]; return ` ${multi ? `Строка ${st.row + 1} готова: ${a} × ${st.bd}${st.row ? ' ' + placeWord(st.row, st.bd) : ''} = <b>${r.val}</b>${st.row ? '<span class="g">' + '0'.repeat(st.row) + '</span>' : ''}` : ''}`; }
    return '';
  }
  // пошаговый ввод
  function checkFull() {
    const s = cur(); if (!s || !buf) return; const v = +buf, st = s;
    if (v === st.v) { SND.ok(); writeStep(st); si++; next(feedbackMul(st) + rowDoneMsg(st)); return; }
    mistakes++; tries++; SND.bad(); shake(ask);
    let msg;
    if (st.t === 'mul') {
      if (st.carry && v === st.bd * st.ad) { noteErr('carry'); msg = `Почти! ${st.bd} × ${st.ad} = ${st.bd * st.ad} — верно, но не забудь прибавить запомненное <b class="cc">${st.carry}</b>.`; }
      else { noteErr('tbl', factKey(st.bd, st.ad)); msg = tries < 2 ? `Не совсем. Вспомни таблицу: сколько будет <b>${st.bd} × ${st.ad}</b>?${st.carry ? ` Потом прибавь <b class="cc">${st.carry}</b>.` : ''}` : `${st.bd} × ${st.ad} = <b>${st.bd * st.ad}</b>${st.carry ? `, и ещё + ${st.carry} = <b>${st.v}</b>` : ''}.`; }
    } else { noteErr('add'); msg = tries < 2 ? `Пересчитай внимательно: ${expr(st)}.` : `${expr(st)} = <b>${st.v}</b>.`; }
    buf = '';
    if (tries >= 3) { helped = true; writeStep(st); si++; next(`Записываю ответ: ${st.v}. Ничего, в следующий раз получится!`); return; }
    say(`<div class="fb bad">${msg}</div>`); renderAsk();
  }
  // самостоятельный ввод по цифре
  function checkDigit(d) {
    const s = cur(); if (!s || s.t !== 'dig') return; const st = s.s;
    if (d === s.expect) {
      set(s.key, s.col, d, 'w pop'); SND.tap(); pawAt(cell(s.key, s.col));
      if (s.part === 'u' && !st.last && st.v >= 10) { if (st.t === 'mul') set('mc', st.j + 1, Math.floor(st.v / 10), 'carry pop'); else set('sc', st.col + 1, Math.floor(st.v / 10), 'carry pop'); }
      const finishedRow = st.last && (s.part === 't' || st.v < 10);
      si++;
      next(finishedRow && st.t === 'mul' && multi ? `✔ Строка ${st.row + 1} готова!` : (tries || hintLvl ? '✔ Верно!' : ''));
      return;
    }
    mistakes++; tries++; SND.bad(); shake(cell(s.key, s.col));
    let msg;
    if (st.t === 'mul') {
      if (s.part === 't') { noteErr('carry'); msg = `Это последняя цифра в строке: ${expr(st)} = ${st.v}, пишем число целиком. Сюда идёт <b>${Math.floor(st.v / 10)}</b>.`; }
      else if (st.carry && d === (st.bd * st.ad) % 10) { noteErr('carry'); msg = `Не забудь прибавить запомненное число <b class="cc">${st.carry}</b> (оно записано маленькой цифрой сверху)!`; }
      else { noteErr('tbl', factKey(st.bd, st.ad)); msg = tries < 2 ? `Проверь: сколько будет <b>${expr(st)}</b>? В клетку пишем последнюю цифру.` : `${expr(st)} = <b>${st.v}</b>. В клетку пишем <b>${s.expect}</b>${st.v >= 10 && !st.last ? `, а ${Math.floor(st.v / 10)} запоминаем` : ''}.`; }
    } else { noteErr('add'); msg = tries < 2 ? `Сложи цифры в этом столбике${st.carry ? ' и не забудь запомненное' : ''}.` : `${expr(st)} = <b>${st.v}</b>. Пишем <b>${s.expect}</b>.`; }
    if (tries >= 3) { helped = true; set(s.key, s.col, s.expect, 'w pop'); if (s.part === 'u' && !st.last && st.v >= 10) { if (st.t === 'mul') set('mc', st.j + 1, Math.floor(st.v / 10), 'carry'); else set('sc', st.col + 1, Math.floor(st.v / 10), 'carry'); } si++; next(`Здесь <b>${s.expect}</b>. Идём дальше!`); return; }
    say(`<div class="fb bad">${msg}</div>`);
  }
  // клик по клетке — выбор сдвига
  $('.mgrid', el).addEventListener('click', e => {
    const c = e.target.closest('.cell.tap'); if (!c || done) return; const s = cur(); if (!s || s.t !== 'shift') return;
    const col = +c.dataset.c;
    if (col === s.row) { SND.ok(); for (let q = 0; q < s.row; q++) set('p' + s.row, q, '0', 'ghost'); si++; next(`✔ Верно! Сдвиг на ${s.row} ${plural(s.row, 'клетку', 'клетки', 'клеток')}. Пустая клетка — как невидимый нолик: мы ведь умножаем на ${s.bd * 10 ** s.row}.`); return; }
    mistakes++; tries++; SND.bad(); noteErr('shift'); c.classList.add('wrong'); setTimeout(() => c.classList.remove('wrong'), 700);
    say(`<div class="fb bad">Не сюда! Умножаем на ${s.bd} ${placeWord(s.row, s.bd)}, поэтому начинаем писать под <b>${s.row === 1 ? 'десятками' : 'сотнями'}</b> — на ${s.row} ${plural(s.row, 'клетку', 'клетки', 'клеток')} левее начала первой строки.</div>`);
    if (tries >= 2) cell('p' + s.row, s.row).classList.add('pulse');
  });
  bindPad(el, {
    digit: d => { if (done) return; const s = cur(); if (!s || s.t === 'shift') return; if (guided) { if (buf.length < 3) { buf += d; renderAsk(); } } else checkDigit(d); },
    back: () => { if (guided) { buf = buf.slice(0, -1); renderAsk(); } },
    ok: () => { if (guided && !done) checkFull(); },
  });
  const hb = $('#' + uid + '-hint');
  if (hb) hb.addEventListener('click', () => { const s = cur(); if (!s || done) return; helped = true; hintLvl++; if (base(s).t === 'mul') { cell('mc', base(s).j)?.classList.add('hlc'); } say('🐾 ' + prompt(s)); });
  say(guided ? `${esc(S.kid)}, решаем вместе: <b>${a} × ${b}</b>. Я буду подсказывать каждый шаг!<br>` + prompt(list[0]) : `${esc(S.kid)}, реши пример <b>${a} × ${b}</b> столбиком. Пиши цифры справа налево — я проверю каждую 🐾`);
  hl(cur()); renderAsk();
}

/* ======================================================================
   ТРЕНАЖЁР: СОСТАВНЫЕ УРАВНЕНИЯ — «метод коробки»
   ====================================================================== */
function mountEq(el, { eq, guided, onDone }) {
  const steps = E.eqSteps(eq), uid = 'e' + rnd(1e5, 1e6);
  el.innerHTML = `<div class="task-wrap eqw">
    <div class="paper-col"><div class="task-title">Реши уравнение</div><div class="paper eqpaper"><div class="eq-lines" id="${uid}-lines"></div></div></div>
    <div class="ctrl-col">${helperHTML(uid + '-bub')}<div class="eq-focus" id="${uid}-focus"></div><div class="ask" id="${uid}-ask"></div><div id="${uid}-pad"></div>
      ${guided ? '' : `<div class="row-btns"><button class="btn ghost sm" id="${uid}-hint">🐾 Подсказка</button></div>`}</div></div>`;
  const linesEl = $('#' + uid + '-lines'), focus = $('#' + uid + '-focus'), ask = $('#' + uid + '-ask'), padBox = $('#' + uid + '-pad'), bub = $('#' + uid + '-bub');
  const say = h => { bub.innerHTML = h; bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); };
  const lines = [];
  const drawLines = () => { linesEl.innerHTML = lines.map((l, i) => `<div class="eql ${l.cls || ''} ${i === lines.length - 1 ? 'last' : ''}">${l.h}</div>`).join(''); };
  const addLine = (h, cls) => { lines.push({ h, cls }); drawLines(); };
  addLine(`${E.eqHTML(eq.lhs)} = ${eq.rhs}`, 'first');
  let li = 0, phase = '', buf = '', tries = 0, mistakes = 0, helped = false, done = false;
  const S_ = () => steps[li];
  const Etxt = s => E.eqText(s.E);
  const Ehtml = s => s.E.k === 'x' ? '<i class="x">x</i>' : `<span class="boxed">${E.eqHTML(s.E)}</span>`;
  const fTxt = f => `${f[0]} ${SYM[f[1]]} ${f[2]}`;
  const boxOf = s => s.E.k === 'x' ? 'x' : s.E.id;
  const showPad = on => { padBox.innerHTML = on ? numpad(true) : ''; if (on) bindPad(padBox, { digit: d => { if (buf.length < 5) { buf += d; renderAsk(); } }, back: () => { buf = buf.slice(0, -1); renderAsk(); }, ok: () => { if (buf) checkNum(+buf); } }); else keyHandler = null; };
  const partsLabel = s => { const n = E.PART_NAMES[s.node.op]; return `<div class="labels"><span>${E.eqText(s.node.l)}</span> — ${n[0]}, <span>${E.eqText(s.node.r)}</span> — ${n[1]}, <span>${s.c}</span> — ${n[2]}</div>`; };

  function startLayer() {
    const s = S_(); tries = 0; buf = '';
    if (guided) { phase = s.single ? 'role' : 'op'; }
    else phase = 'num';
    render();
  }
  function render() {
    const s = S_();
    if (phase === 'op') {
      focus.innerHTML = `<div class="eqbig">${E.eqHTML(s.node, { tapOps: true })} = ${s.c}</div>`;
      ask.innerHTML = `<div class="ask-txt">Какое действие выполняется <b>последним</b>? Нажми на знак 👆</div>`;
      showPad(false);
      say(li === 0 ? `Начинаем расследование! Первый вопрос сыщика: какое действие здесь делается в самом конце?` : `Снова ищем последнее действие в уравнении.`);
      $$('.op.tap', focus).forEach(b => b.addEventListener('click', () => tapOp(+b.dataset.op, b)));
      return;
    }
    if (phase === 'role') {
      focus.innerHTML = `<div class="eqbig">${E.eqHTML(s.node, { box: boxOf(s) })} = ${s.c}</div>`;
      ask.innerHTML = `<div class="ask-txt">Кем является ${s.E.k === 'x' ? '<i class="x">x</i>' : '📦 коробка'} в этом действии?</div><div class="opts six">${E.ROLE_ORDER.map(r => `<button class="opt" data-r="${r}">${E.ROLES[r].name}</button>`).join('')}</div>`;
      showPad(false);
      if (s.single) say(s.E.k === 'x' ? `Осталось одно действие — «${SYM[s.node.op]}». Как называется <i class="x">x</i> в этом действии?` : `Здесь одно действие. Как называется коробка?`);
      $$('.opt', ask).forEach(b => b.addEventListener('click', () => pickRole(b.dataset.r, b)));
      return;
    }
    if (phase === 'rule') {
      const seen = new Set(), opts = shuffle([s.f, ...E.ROLES[s.role].wrong(s.c, s.b)].filter(f => { const k = f.join('|'); if (seen.has(k)) return false; seen.add(k); return true; }));
      focus.innerHTML = `<div class="eqbig">${E.eqHTML(s.node, { box: boxOf(s) })} = ${s.c}</div>`;
      ask.innerHTML = `<div class="ask-txt">Как найти ${E.ROLES[s.role].gen}?</div><div class="opts">${opts.map(f => `<button class="opt wide" data-f="${f.join('|')}">${Etxt(s)} = ${fTxt(f)}</button>`).join('')}</div>`;
      showPad(false);
      $$('.opt', ask).forEach(b => b.addEventListener('click', () => pickRule(b.dataset.f, b)));
      return;
    }
    if (phase === 'calc' || phase === 'num') {
      focus.innerHTML = `<div class="eqbig">${E.eqHTML(s.node, { box: boxOf(s) })} = ${s.c}</div>`;
      renderAsk(); showPad(true);
      if (phase === 'num' && tries === 0) say(li === 0 ? `Реши уравнение сам(а)! Подсказка сыщика: спрячь в коробку 📦 всё, что вместе с <i class="x">x</i>. Чему равна коробка?` : `Отлично! Теперь открываем коробку: чему равно ${Ehtml(s)}?`);
      return;
    }
    if (phase === 'check') {
      focus.innerHTML = `<div class="eqbig">${E.eqHTML(eq.lhs, { xv: eq.x })} = ?</div>`;
      renderAsk(); showPad(true);
      say(`<i class="x">x</i> = ${eq.x}. Но настоящий сыщик всегда проверяет алиби! Подставим ${eq.x} вместо <i class="x">x</i> и посчитаем левую часть.`);
    }
  }
  function renderAsk() {
    const s = S_();
    if (phase === 'calc') ask.innerHTML = `<div class="ask-eq">${fTxt(s.f)} = <span class="inp">${buf || '?'}</span></div>`;
    else if (phase === 'num') ask.innerHTML = `<div class="ask-eq">${Ehtml(s)} = <span class="inp">${buf || '?'}</span></div>`;
    else if (phase === 'check') ask.innerHTML = `<div class="ask-eq">${E.eqText(eq.lhs, eq.x)} = <span class="inp">${buf || '?'}</span></div>`;
  }
  function tapOp(id, btn) {
    const s = S_();
    if (id === s.node.id) {
      SND.ok(); btn.classList.add('right'); phase = 'role';
      setTimeout(() => { render(); say(`<div class="fb">✔ Да! Последнее действие — «${SYM[s.node.op]}».</div>Всё, что с <i class="x">x</i> по другую сторону знака, прячем в коробку 📦 — будто это одно неизвестное число.`); }, 450);
      return;
    }
    mistakes++; tries++; SND.bad(); noteErr('order'); btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 600);
    say(`<div class="fb bad">Это действие выполняется раньше.</div>Порядок такой: сначала <b>( скобки )</b>, потом <b>· и :</b>, потом <b>+ и −</b>. Последнее — то, что остаётся на самый конец.`);
    if (tries >= 2) $(`.op.tap[data-op="${s.node.id}"]`, focus)?.classList.add('pulse');
  }
  function pickRole(r, btn) {
    const s = S_();
    if (r === s.role) {
      SND.ok(); btn.classList.add('right'); tries = 0; phase = 'rule';
      setTimeout(() => { render(); say(`<div class="fb">✔ Верно! ${s.E.k === 'x' ? '<i class="x">x</i>' : Ehtml(s)} — ${E.ROLES[s.role].gen}.</div>${partsLabel(s)}`); }, 450);
      return;
    }
    mistakes++; tries++; SND.bad(); noteErr('role'); btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 600);
    const n = E.PART_NAMES[s.node.op];
    say(tries < 2 ? `<div class="fb bad">Не то.</div>В действии «${SYM[s.node.op]}» участвуют: <b>${n[0]}</b>, <b>${n[1]}</b> и <b>${n[2]}</b>. ${s.node.op === '-' || s.node.op === '/' ? `Посмотри, где стоит ${s.E.k === 'x' ? 'x' : 'коробка'} — <b>до</b> знака или <b>после</b>?` : ''}` : `<div class="fb bad">Смотри:</div>${partsLabel(s)}`);
  }
  function pickRule(fs, btn) {
    const s = S_(), f = fs.split('|');
    if (+f[0] === s.f[0] && f[1] === s.f[1] && +f[2] === s.f[2]) {
      SND.ok(); btn.classList.add('right'); tries = 0; phase = 'calc';
      addLine(`${Ehtml(s)} = ${fTxt(s.f)}`);
      setTimeout(() => { render(); say(`<div class="fb">✔ Правило сыщика:</div><div class="rule">📏 ${E.ROLES[s.role].rule}</div>Теперь посчитай!`); }, 450);
      return;
    }
    mistakes++; tries++; SND.bad(); noteErr('rule'); btn.classList.add('wrong'); setTimeout(() => btn.classList.remove('wrong'), 600);
    say(tries < 2 ? `<div class="fb bad">Хм, проверь.</div>${E.ROLES[s.role].hint}` : `<div class="fb bad">Правило:</div><div class="rule">📏 ${E.ROLES[s.role].rule}</div>`);
  }
  function checkNum(v) {
    const s = S_();
    if (phase === 'check') {
      if (v === eq.rhs) { SND.ok(); addLine(`Проверка: ${E.eqText(eq.lhs, eq.x)} = ${eq.rhs} ✔`, 'check'); return finish(); }
      mistakes++; tries++; SND.bad(); noteErr('check'); buf = ''; shake(ask);
      say(`<div class="fb bad">Посчитай по шагам:</div>${tries < 2 ? E.evalChain(eq.lhs, eq.x)[0] + ' …' : E.evalChain(eq.lhs, eq.x).join('<br>')}`); renderAsk(); return;
    }
    if (v === s.newC) {
      SND.ok();
      if (phase === 'num') addLine(`${Ehtml(s)} = ${v} <span class="why">(${fTxt(s.f)})</span>`); else addLine(`${Ehtml(s)} = ${v}`);
      li++;
      if (li < steps.length) {
        const ns = S_();
        startLayer();
        if (guided) say(`<div class="fb">✔ ${E.eqText(s.E)} = ${v}. Открываем коробку!</div>` + (ns.single ? '' : 'Внутри снова несколько действий. Какое из них последнее?'));
        return;
      }
      // x найден
      if (guided) { phase = 'check'; tries = 0; buf = ''; render(); }
      else { addLine(`Проверка: ${E.eqText(eq.lhs, eq.x)} = ${eq.rhs} ✔`, 'check'); finish(); }
      return;
    }
    mistakes++; tries++; SND.bad(); buf = ''; shake(ask);
    let msg;
    if (phase === 'num') {
      const wrongVals = E.ROLES[s.role].wrong(s.c, s.b).map(f => E.calc(...f));
      if (wrongVals.includes(v)) { noteErr('rule'); msg = `Похоже, перепутано правило. ${s.E.k === 'x' ? '<i class="x">x</i>' : 'Коробка'} — это <b>${E.ROLES[s.role].gen}</b>.<div class="rule">📏 ${E.ROLES[s.role].rule}</div>`; }
      else { noteErr('calc'); msg = tries < 2 ? `Подумай: ${s.E.k === 'x' ? '<i class="x">x</i>' : Ehtml(s)} — это ${E.ROLES[s.role].gen}. ${E.ROLES[s.role].hint}` : `Посчитай: ${Ehtml(s)} = <b>${fTxt(s.f)}</b>`; }
      if (tries >= 2) msg = `${Ehtml(s)} = <b>${fTxt(s.f)}</b>. Посчитай внимательно${s.f[1] === '*' && s.f[0] > 20 ? ' (можно столбиком на листочке ✏️)' : ''}.`;
    } else {
      noteErr('calc');
      msg = s.f[1] === '/' ? `Подумай наоборот: <b>${s.f[2]} · ? = ${s.f[0]}</b>` : s.f[1] === '*' ? `Посчитай ещё раз${s.f[0] > 20 ? ' — можно столбиком на листочке ✏️' : ''}.` : `Посчитай ещё раз внимательно${s.f[0] > 99 ? ', можно столбиком' : ''}.`;
    }
    if (tries >= 3) { helped = true; say(`Ответ: <b>${s.newC}</b>. Запишем и идём дальше!`); setTimeout(() => checkNum(s.newC), 900); renderAsk(); return; }
    say(`<div class="fb bad">Не сходится.</div>${msg}`); renderAsk();
  }
  function finish() {
    done = true; phase = 'done'; showPad(false);
    focus.innerHTML = `<div class="eqbig win"><i class="x">x</i> = ${eq.x}</div>`;
    ask.innerHTML = '';
    say(`🎉 ${pick(['Молодец', 'Умница', 'Отлично'])}, ${esc(S.kid)}! <b><i class="x">x</i> = ${eq.x}</b>. Проверка сошлась — алиби подтверждено.${mistakes ? '' : '<br>Ни одной ошибки!'}`);
    SND.win(); later(() => catSay(pick(PH.done)), 400); onDone && onDone({ mistakes, helped });
  }
  const hb = $('#' + uid + '-hint');
  if (hb) hb.addEventListener('click', () => {
    if (done) return; const s = S_(); helped = true; tries = Math.max(tries, 1);
    say(`🐾 Последнее действие — «${SYM[s.node.op]}». ${s.E.k === 'x' ? '<i class="x">x</i>' : Ehtml(s)} — это <b>${E.ROLES[s.role].gen}</b>.<div class="rule">📏 ${E.ROLES[s.role].rule}</div>`);
  });
  startLayer();
}

/* ======================================================================
   ОШИБКИ ЕНОТА — найти неверную строку
   ====================================================================== */
const raccoonPic = () => window.Chibi ? `<span class="pt chibi-pt talking">${Chibi.chibiSVG('Енот Тимоша', { hat: '🎩' })}</span><b>Енот Тимоша</b><small>«Я умножаю быстрее всех!»</small>` : '🦝';
function mountBugMul(el, { level, onDone }) {
  const g = E.genMulBug(level), { a, b, rows, sum } = g, nB = rows.length;
  const W = Math.max(String(sum).length, String(a * b).length, ...rows.map(r => String(r.val).length + r.shift), String(a).length) + 1;
  const rowHTML = (k, digits, shift, opts = {}) => {
    const s = String(digits); const cells = [];
    for (let q = 0; q < W; q++) { const c = W - 1 - q; const p = c - shift; let t = ''; if (p >= 0 && p < s.length) t = s[s.length - 1 - p]; if (c === W - 1 && opts.sign) t = opts.sign; cells.push(`<div class="cell ${opts.ul && c < W - 1 ? 'ul' : ''} ${c === W - 1 && opts.sign ? 'sign' : ''}">${t}</div>`); }
    return `<div class="mrow ${opts.pick ? 'pickrow' : ''}" ${opts.pick ? `data-row="${k}"` : ''}>${cells.join('')}</div>`;
  };
  let html = rowHTML('a', a, 0) + rowHTML('b', b, 0, { sign: '×', ul: true });
  rows.forEach((r, i) => { html += rowHTML('p' + i, r.val, r.shift, { pick: true, sign: i === 1 ? '+' : '', ul: i === nB - 1 }); });
  html += rowHTML('s', sum, 0, { pick: true });
  el.innerHTML = `<div class="task-wrap"><div class="paper-col"><div class="task-title">🦝 Енот решал: ${a} × ${b}</div><div class="paper raccoon"><div class="mgrid" style="--w:${W}">${html}</div></div></div>
    <div class="ctrl-col"><div class="enot-pic">${raccoonPic()}</div>${helperHTML('bb')}<div class="ask"><div class="ask-txt">Нажми на строку, где Енот ошибся 👆</div><div class="ask-sub">Проверь каждое неполное произведение и сумму. Можно считать на листочке ✏️</div></div></div></div>`;
  const bub = $('#bb', el); bub.innerHTML = `Енот Тимоша хвастается, что умножает быстрее всех. Но в его решении <b>одна ошибка</b>! Найди её.`;
  let mistakes = 0, done = false;
  const correct = g.plan;
  $$('.pickrow', el).forEach(r => r.addEventListener('click', () => {
    if (done || r.classList.contains('okrow')) return; const k = r.dataset.row;
    if (k === g.wrong) {
      done = true; SND.ok(); r.classList.add('badrow');
      const i = +k.slice(1);
      let ex;
      if (g.type === 'tbl') ex = `Ошибка в строке ${i + 1}: ${a} × ${rows[i].bd} = <b>${correct.rows[i].val}</b>, а у Енота ${rows[i].val}. Он ошибся в таблице умножения!`;
      else if (g.type === 'carry') ex = `Ошибка в строке ${i + 1}: Енот <b>забыл прибавить запомненное число</b>! Правильно: ${a} × ${rows[i].bd} = <b>${correct.rows[i].val}</b>.`;
      else if (g.type === 'shift') ex = `Енот <b>забыл про сдвиг</b>! Вторая строка — это ${a} × ${rows[1].bd} десятков, её надо писать на одну клетку левее. Правильный ответ: <b>${a * b}</b>.`;
      else ex = `Неполные произведения верные, а вот <b>сложил</b> Енот неправильно. Правильный ответ: <b>${a * b}</b>.`;
      bub.innerHTML = `<div class="fb">🔍 Нашли!</div>${ex}`; SND.win(); later(() => say(pick(PH.bugFound)), 400);
      onDone && onDone({ mistakes, helped: false, type: g.type });
      return;
    }
    mistakes++; SND.bad(); noteErr('bugmiss');
    if (k === 's' && g.wrong !== 's') { r.classList.add('warnrow'); setTimeout(() => r.classList.remove('warnrow'), 900); bub.innerHTML = `<div class="fb bad">Хм!</div>Сумма неверная, но для <b>этих</b> строк Енот сложил правильно. Значит, ошибка случилась <b>раньше</b> — в одной из строк!`; }
    else { r.classList.add('okrow'); bub.innerHTML = `<div class="fb bad">Здесь всё верно ✔</div>Эту строку Енот посчитал правильно. Ищи дальше!`; }
  }));
}
function mountBugEq(el, { level, onDone }) {
  const g = E.genEqBug(level); if (!g) return mountBugMul(el, { level, onDone });
  const ln = l => `${l.E.k === 'x' ? '<i class="x">x</i>' : E.eqHTML(l.E)} = ${l.kind === 'expr' ? `${l.f[0]} ${SYM[l.f[1]]} ${l.f[2]}` : l.v}`;
  el.innerHTML = `<div class="task-wrap eqw"><div class="paper-col"><div class="task-title">🦝 Енот решал уравнение</div><div class="paper eqpaper raccoon"><div class="eq-lines">
     <div class="eql first">${E.eqHTML(g.eq.lhs)} = ${g.eq.rhs}</div>${g.lines.map((l, i) => `<div class="eql pickrow" data-i="${i}">${ln(l)}</div>`).join('')}</div></div></div>
    <div class="ctrl-col"><div class="enot-pic">${raccoonPic()}</div>${helperHTML('bb')}<div class="ask"><div class="ask-txt">Нажми на первую неверную строку 👆</div><div class="ask-sub">Проверяй каждую строку по порядку: правило и вычисления.</div></div></div></div>`;
  const bub = $('#bb', el); bub.innerHTML = `Енот решил уравнение и получил ответ <b>x = ${g.lines[g.lines.length - 1].v}</b>. Но где-то закралась ошибка! Найди строку, где она <b>появилась впервые</b>.`;
  let mistakes = 0, done = false;
  $$('.pickrow', el).forEach(r => r.addEventListener('click', () => {
    if (done || r.classList.contains('okrow')) return; const i = +r.dataset.i;
    if (i === g.bad) {
      done = true; SND.ok(); r.classList.add('badrow'); const l = g.lines[i], s = l.step;
      let ex;
      if (g.type === 'rule') ex = `Здесь ${E.eqText(s.E)} — это <b>${E.ROLES[s.role].gen}</b>.<div class="rule">📏 ${E.ROLES[s.role].rule}</div>Правильно: ${E.eqText(s.E)} = ${E.ROLES[s.role].f(s.c, s.b).map(x => SYM[x] || x).join(' ')}`;
      else ex = `Ошибка в вычислении: ${l.f[0]} ${SYM[l.f[1]]} ${l.f[2]} = <b>${E.calc(...l.f)}</b>, а не ${l.v}.`;
      bub.innerHTML = `<div class="fb">🔍 Попался!</div>${ex}<br>Правильный ответ: <b>x = ${g.eq.x}</b>.`; SND.win(); later(() => say(pick(PH.bugFound)), 400);
      onDone && onDone({ mistakes, helped: false });
      return;
    }
    mistakes++; SND.bad(); noteErr('bugmiss');
    if (i > g.bad) { r.classList.add('warnrow'); setTimeout(() => r.classList.remove('warnrow'), 900); bub.innerHTML = `<div class="fb bad">Тепло!</div>Эта строка неверная, но ошибка началась <b>раньше</b>. Поднимись выше!`; }
    else { r.classList.add('okrow'); bub.innerHTML = `<div class="fb bad">Здесь всё верно ✔</div>Проверь следующую строку.`; }
  }));
}

/* ================= Подбор задачи ================= */
function fresh_(gen, keyOf) { // не повторять последние 300 примеров
  let x; for (let t = 0; t < 40; t++) { x = gen(); if (!S.recent.includes(keyOf(x))) break; }
  S.recent.push(keyOf(x)); if (S.recent.length > 300) S.recent.splice(0, S.recent.length - 300); save(); return x;
}
function makeTask(kind, level) {
  if (kind === 'mul') { const [a, b] = fresh_(() => E.genMul(level), x => x.join('x')); return { kind, level, a, b, story: Math.random() < 0.5 ? mulStory(a, b) : '' }; }
  if (kind === 'eq') { const eq = fresh_(() => E.genEq(level), x => E.eqText(x.lhs) + '=' + x.rhs); return { kind, level, eq, story: Math.random() < 0.45 ? eqStory(eq) : '' }; }
  return { kind, level };
}
/* текстовые истории к примерам — чтобы задания не казались одинаковыми */
const MUL_STORIES = [
  (a, b) => `В кондитерскую привезли <b>${b}</b> коробок, в каждой по <b>${a}</b> конфет. Сколько всего конфет?`,
  (a, b) => `Пекарня «Пышка» каждый день печёт <b>${a}</b> пончиков. Сколько пончиков испекут за <b>${b}</b> дней?`,
  (a, b) => `В одной банке <b>${a}</b> мармеладок. Сколько мармеладок в <b>${b}</b> банках?`,
  (a, b) => `Котик-почтальон разнёс <b>${b}</b> посылок, в каждой по <b>${a}</b> леденцов. Сколько леденцов он доставил?`,
  (a, b) => `На шоколадной фабрике <b>${b}</b> полок, на каждой по <b>${a}</b> плиток. Сколько всего плиток?`,
  (a, b) => `Енот спрятал <b>${b}</b> мешочков, в каждом по <b>${a}</b> орешков. Сколько орешков у Енота?`,
  (a, b) => `В школьной столовой <b>${b}</b> противней, на каждом по <b>${a}</b> печенек. Сколько печенья всего?`,
  (a, b) => `Белка Шустрик пробегает <b>${a}</b> метров за минуту. Сколько метров она пробежит за <b>${b}</b> минут?`,
  (a, b) => `В кинотеатре для котов <b>${b}</b> рядов по <b>${a}</b> мест. Сколько всего мест?`,
  (a, b) => `Сова Соня прочитала <b>${b}</b> книг по <b>${a}</b> страниц. Сколько страниц она прочитала?`,
  (a, b) => `На ярмарку привезли <b>${b}</b> ящиков, в каждом по <b>${a}</b> яблок. Сколько яблок привезли?`,
  (a, b) => `Хомяк Хрум складывает в норку по <b>${a}</b> зёрнышек каждый день. Сколько зёрен будет через <b>${b}</b> дней?`,
];
const mulStory = (a, b) => pick(MUL_STORIES)(a, b);
function eqStory(eq) { // «Енот задумал число…» — пересказ уравнения словами
  const [who, g] = pick([['Енот Тимоша', 0], ['Лиса Алиса', 1], ['Сова Соня', 1], ['Хомяк Хрум', 0], ['Кролик Пушок', 0], ['Мышка Пискля', 1], ['Котик ' + (S.name || 'Мурлок'), 0]]);
  const v = (m, w) => g ? w : m;
  const steps = []; let n = eq.lhs, guard = 0;
  const path = []; while (n.k === 'op' && guard++ < 5) { path.unshift(n); n = E.containsX(n.l) ? n.l : n.r; }
  for (const op of path) {
    const xL = E.containsX(op.l), b = (xL ? op.r : op.l).v;
    if (op.op === '+') steps.push(`${v('прибавил', 'прибавила')} ${b}`);
    else if (op.op === '*') steps.push(`${v('умножил', 'умножила')} на ${b}`);
    else if (op.op === '-') steps.push(`${v('вычел', 'вычла')} ${b}`);
    else steps.push(`${v('разделил', 'разделила')} на ${b}`);
  }
  if (path.some(o => !E.containsX(o.l) && (o.op === '-' || o.op === '/'))) return '';
  return `${who} ${v('задумал', 'задумала')} число, ${steps.join(', потом ')} — и получилось <b>${eq.rhs}</b>. Какое число было задумано? Запишем уравнением:`;
}
function mountTask(el, t, guided, onDone) {
  $$('.story-card', el.parentElement).forEach(x => x.remove());
  if (t.story) { const st = document.createElement('div'); st.className = 'story-card'; st.innerHTML = '📖 ' + t.story; el.before(st); }
  if (t.kind === 'mul') mountMul(el, { a: t.a, b: t.b, guided, onDone });
  else if (t.kind === 'eq') mountEq(el, { eq: t.eq, guided, onDone });
  else if (t.kind === 'interro') mountCaseInterro(el, { eqMode: t.level === 'eq', witnesses: CASE && CASE.witnesses, onDone });
  else if (t.kind === 'bugmul') mountBugMul(el, { level: t.level, onDone });
  else mountBugEq(el, { level: t.level, onDone });
}
const statKind = k => k.startsWith('bug') || k === 'interro' ? 'bug' : k;


/* ================= ЭКРАН: знакомство ================= */
SCREENS.hello = () => {
  let fur = S.fur;
  app.innerHTML = `<div class="hello">
    <div class="hello-cat" id="hcat">${catSVG({ fur, wear: S.wear })}</div>
    <h1>Детективное агентство<br><span class="brand">«Мурлок и Ко»</span></h1>
    <p class="lead">В городе Сладкограде творятся странные дела: кто-то ворует сладости! Нужен самый умный детектив. А главное оружие детектива — <b>математика</b> 🔍</p>
    <label class="lbl" for="kid">Как тебя зовут?</label>
    <input id="kid" class="nmi" maxlength="16" placeholder="Твоё имя" value="${esc(S.kid || '')}" autocomplete="off">
    <label class="lbl" for="nm">А как зовут твоего котика-напарника?</label>
    <input id="nm" class="nmi" maxlength="16" placeholder="Например, Мурлок" value="${esc(S.name || '')}" autocomplete="off">
    <div class="lbl">Выбери окрас</div>
    <div class="furs">${Object.entries(FURS).map(([k, f]) => `<button class="fur ${k === fur ? 'on' : ''}" data-f="${k}"><i style="background:${f.sw}"></i>${f.name}</button>`).join('')}</div>
    <button class="btn big pink" id="start">Начать расследования →</button>
    <button class="link" id="restore">🔑 У меня уже есть код восстановления</button></div>`;
  $$('.fur').forEach(b => b.addEventListener('click', () => { fur = b.dataset.f; $$('.fur').forEach(x => x.classList.toggle('on', x === b)); $('#hcat').innerHTML = catSVG({ fur, wear: S.wear }); SND.meow(); M.voice(pick(PH.fur), {}); }));
  $('#restore').addEventListener('click', () => {
    const m = modal(`<h2>🔑 Восстановить прогресс</h2><p>Введи код из 8 букв и цифр — он есть в разделе «Для взрослых» на старом устройстве.</p><input id="rcode" class="nmi" maxlength="9" placeholder="Например, K7M2Q9XA" autocomplete="off" style="text-transform:uppercase"><p class="small" id="rerr"></p><div class="row-btns"><button class="btn pink" id="rgo">Восстановить</button><button class="btn" data-close>Отмена</button></div>`);
    $('#rgo', m.el).addEventListener('click', async () => { try { $('#rerr', m.el).textContent = 'Ищем…'; await cloudRestore($('#rcode', m.el).value); } catch (e) { $('#rerr', m.el).textContent = 'Код не найден. Проверь буквы и цифры.'; } });
  });
  $('#start').addEventListener('click', () => {
    const kid = $('#kid').value.trim();
    if (!kid) { SND.bad(); shake($('#kid')); $('#kid').focus(); $('#kid').placeholder = 'Напиши своё имя 🙂'; return; }
    const nm = $('#nm').value.trim() || 'Мурлок';
    S.kid = kid[0].toUpperCase() + kid.slice(1); S.name = nm; S.fur = fur; save(); SND.win(); go('home');
    setTimeout(() => { modal(`<div class="m-cat">${myCat({ happy: true })}</div><h2>Приятно познакомиться, ${esc(S.kid)}! Я — ${esc(nm)} 😺</h2><p>Теперь мы напарники по расследованиям!</p><p>Вот как устроено наше агентство:</p><ul class="howto"><li>🎓 <b>Школа сыщика</b> — разберёмся, как умножать столбиком и решать составные уравнения. Начни отсюда!</li><li>🔍 <b>Дела</b> — решай задачи, получай улики и вычисляй вора сладостей.</li><li>🍬 За задачи дают <b>конфеты</b> — на них можно купить котику наряды.</li><li>⭐ Чем больше дел раскрыто — тем выше <b>звание</b>.</li></ul><button class="btn pink" data-close>Понятно, мяу!</button>`); say(PH.welcome[0]); }, 300);
  });
};

/* ================= ЭКРАН: главная ================= */
SCREENS.home = () => {
  if (!S.name || !S.kid) return go('hello');
  const r = rank(), st = streak(), todayN = S.days[today()] || 0, goal = 5;
  const learnFirst = !S.lessons.mul || !S.lessons.eq;
  app.innerHTML = `
  <header class="home-top"><div class="pill" title="Дней подряд">🔥 ${st} ${plural(st, 'день', 'дня', 'дней')}</div><div class="pill gem">💎 <b class="gemN">${S.gems || 0}</b></div><div class="pill candy">🍬 <b class="candyN">${S.candies}</b></div>${true ? `<button class="pill icon" id="voi" aria-label="Голос котика">${S.voice !== false ? '🗣️' : '🤐'}</button>` : ''}<button class="pill icon" id="vib" aria-label="Вибрация">${S.vibro !== false ? '📳' : '📴'}</button><button class="pill icon" id="mus" aria-label="Музыка">🎵</button><button class="pill icon" id="snd" aria-label="Звук">${S.sound ? '🔊' : '🔇'}</button></header>
  <section class="hero">
    <button class="hero-cat" id="pet" aria-label="Погладить котика">${myCat()}</button>
    <div class="hero-info">
      <div class="hero-say" id="heroSay" hidden></div>
      <div class="hero-name">Детектив ${esc(S.kid)}</div>
      <div class="small">Напарник — кот ${esc(S.name)} 🐾</div>
      <div class="rank">🎖️ ${r.name}</div>
      <div class="bar"><i style="width:${Math.round(r.prog * 100)}%"></i></div>
      <div class="small">${r.next ? `До звания «${r.next[1]}» — ещё ${r.next[0] - S.xp} ⭐` : 'Высшее звание агентства!'}</div>
      <div class="daily"><div><b>Задание дня:</b> решено ${todayN} ${plural(todayN, 'задача', 'задачи', 'задач')}</div><div class="goalbar"><div class="bar mint"><i style="width:${Math.min(1, todayN / 20) * 100}%"></i></div>${GOAL_TIERS.map(g => `<span class="gt ${todayN >= g.n ? 'got' : ''}" style="left:${g.n / 20 * 100}%">${todayN >= g.n ? '✅' : g.icon}<small>${g.n}</small></span>`).join('')}</div><div class="small">Сундуки за 5, 10 и 20 задач в день 🎁</div></div>
    </div>
  </section>
  ${careAlertHTML()}
  ${questHTML()}
  ${CASE ? `<button class="resume" data-go="${CASE.idx < 4 ? 'casetask' : 'accuse'}">📁 Продолжить дело №${CASE.c.n} «${CASE.c.crime.title}» — улик: ${CASE.idx} из 4 →</button>` : ''}
  <section class="tiles">
    <button class="tile t-school ${learnFirst ? 'glow' : ''}" data-go="school"><span class="ti">🎓</span><b>Школа сыщика</b><small>${learnFirst ? 'Начни отсюда!' : 'Как умножать и решать уравнения'}</small></button>
    <button class="tile t-case" data-go="newcase"><span class="ti">🔍</span><b>Новое дело</b><small>Найди вора сладостей</small></button>
    <button class="tile t-blitz" data-go="blitz"><span class="ti">⚡</span><b>Быстрые лапки</b><small>Таблица умножения на скорость</small></button>
    <button class="tile t-games" data-go="games"><span class="ti">🎲</span><b>Детективные игры</b><small>Весы, допрос, сейф, логика…</small></button>
    <button class="tile t-bug" data-go="bugs"><span class="ti">🦝</span><b>Ошибки Енота</b><small>Найди, где он ошибся</small></button>
    ${S.chatOn !== false ? '<button class="tile t-chat" data-go="chat"><span class="ti">💬</span><b>Поболтать с котиком</b><small>Говори или пиши — котик ответит</small></button>' : ''}
    <button class="tile t-house" data-go="house"><span class="ti">🏠</span><b>Домик котика</b><small>Корми, играй, обустраивай комнаты</small></button>
    <button class="tile t-shop" data-go="shop"><span class="ti">🧁</span><b>Кондитерская</b><small>Наряды для котика</small></button>
    <button class="tile t-studio" data-go="studio"><span class="ti">🎙️</span><b>Студия звуков</b><small>Запиши голоса для персонажей</small></button>
    <button class="tile t-book" data-go="book"><span class="ti">📒</span><b>Блокнот детектива</b><small>Правила, награды, дела</small></button>
  </section>
  <footer class="foot"><button class="link" data-go="parents">Для взрослых</button></footer>`;
  $('#snd').addEventListener('click', e => { S.sound = !S.sound; save(); e.currentTarget.textContent = S.sound ? '🔊' : '🔇'; SND.tap(); if (S.sound) Music.play(); else { Music.pause(); M.hush(); } });
  $('#mus').addEventListener('click', () => { SND.tap(); openMusic(); });
  const phrases = ['Мяу! Готов(а) к новому делу?', 'Мур-р… Я чую запах пончиков!', 'Сыщик всегда проверяет ответ!', 'Справа налево — так пишут столбиком!', 'Последнее действие — главная улика!', 'Мяу! Давай раскроем ещё одно дело!'];
  $('#voi')?.addEventListener('click', e => { S.voice = S.voice === false; save(); e.currentTarget.textContent = S.voice ? '🗣️' : '🤐'; if (S.voice) { M.ctx(); say(PH.voiceOn[0]); } else M.hush(); });
  $('#vib').addEventListener('click', e => { S.vibro = S.vibro === false; save(); e.currentTarget.textContent = S.vibro ? '📳' : '📴'; M.haptic([30, 40, 30]); });
  // погладить: короткое касание — мяу, удержание — мурлычет, пока держишь
  const pet = $('#pet'); let holdT = null, purring = false, heartIv = null;
  const stopPurr = () => { clearTimeout(holdT); if (purring) { purring = false; M.purrStop(); clearInterval(heartIv); pet.classList.remove('m-purr'); pet.innerHTML = myCat(); } };
  pet.addEventListener('pointerdown', e => {
    e.preventDefault(); M.ctx();
    holdT = setTimeout(() => { purring = true; M.purrStart(); pet.innerHTML = myCat({ happy: true }); pet.classList.add('m-purr'); floatText('Мур-мур-мур… 😻'); hearts(pet, 3); M.haptic([25, 60, 25, 60, 25, 60, 25]);
      heartIv = setInterval(() => { hearts(pet, 2); M.haptic([25, 60, 25, 60, 25, 60, 25]); }, 1100); }, 380);
  });
  pet.addEventListener('pointerup', () => { if (!purring) { clearTimeout(holdT); SND.meow(); pet.classList.remove('wiggle'); void pet.offsetWidth; pet.classList.add('wiggle'); hearts(pet, 2); floatText(pick(phrases)); } stopPurr(); });
  ['pointerleave', 'pointercancel'].forEach(ev => pet.addEventListener(ev, stopPurr));
  pet.addEventListener('contextmenu', e => e.preventDefault());
  cleanups.push(stopPurr);
  // кот сам иногда подаёт голос, если на главной ничего не происходит
  const idle = setInterval(() => { if (document.hidden || purring) return; const k = pick(['trill', 'yawn', 'purr', 'kitten', 'twitch']); const hc = $('.hero-cat'); if (!hc) return;
    if (k === 'trill') { M.trill(); catMood('happy', 900); } else if (k === 'yawn') { M.yawn(); hc.classList.add('m-yawn'); setTimeout(() => hc.classList.remove('m-yawn'), 1300); }
    else if (k === 'purr') SND.purr(2); else if (k === 'kitten') { M.kitten(); catMood('happy', 700); } else { hc.classList.add('m-twitch'); setTimeout(() => hc.classList.remove('m-twitch'), 800); } }, 28000);
  cleanups.push(() => clearInterval(idle));
  const qg = $('#qgo'); if (qg) qg.addEventListener('click', () => { SND.tap(); goEquations(); });
  // окна на главной — по очереди: новости → подарок за вход → сундуки → новая комната
  const queue = [checkNews, checkLogin, checkGoals, checkRooms];
  const step = () => { if (curScreen !== 'home') return; if ($('.modal')) return setTimeout(step, 700); const f = queue.shift(); if (!f) return; f(); setTimeout(step, 500); };
  setTimeout(step, 900);
};

/* ================= ЭКРАН: выбор дела ================= */
SCREENS.newcase = () => {
  const p = S.prefs;
  app.innerHTML = `${topbar('Новое дело')}
  <div class="page">
    <div class="case-head"><div class="paper-note">📁 Дело №${S.cases + 1}</div><p>Выбери, какими уликами будешь пользоваться в расследовании:</p></div>
    <div class="choice-grid topic">
      <button class="choice" data-t="mul"><span>✖️</span><b>Умножение столбиком</b><small>4 примера</small></button>
      <button class="choice" data-t="eq"><span>📦</span><b>Составные уравнения</b><small>4 уравнения · двойные конфеты 🍬🍬</small></button>
      <button class="choice" data-t="mix"><span>🍬</span><b>Всё вперемешку</b><small>столбик + уравнения + Енот</small></button>
    </div>
    <div class="lbl">Сложность</div>
    <div class="seg diff">${[[1, '🍪 Лёгкое'], [2, '🧁 Среднее'], [3, '🎂 Сложное']].map(([v, t]) => `<button data-d="${v}" class="${p.diff === v ? 'on' : ''}">${t}</button>`).join('')}</div>
    <p class="small center">💎 За «Сложное» дают кристаллы для особых вещей! Лёгкое: 2-значные числа и простые уравнения · Среднее: 3-значные · Сложное: 3-значные на 3-значные и уравнения в 3 действия</p>
    <button class="btn big pink" id="go">Взять дело →</button>
  </div>`;
  $$('.choice').forEach(b => { b.classList.toggle('on', b.dataset.t === p.topic); b.addEventListener('click', () => { p.topic = b.dataset.t; save(); $$('.choice').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); catMood('happy', 700); say(PH.topic[{ mul: 0, eq: 1, mix: 2 }[p.topic]]); }); });
  $$('.diff button').forEach(b => b.addEventListener('click', () => { p.diff = +b.dataset.d; save(); $$('.diff button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); say(PH.diff[p.diff - 1]); }));
  $('#go').addEventListener('click', () => { save(); startCase(p.topic, p.diff); });
};
let CASE = null;
function startCase(topic, diff) {
  const mulLv = { 1: [2, 2, 3, 3], 2: [3, 3, 3, 4], 3: [4, 4, 4, 4] }[diff];
  const eqLv = { 1: [2, 2, 2, 2], 2: [2, 3, 3, 3], 3: [3, 4, 3, 4] }[diff];
  if (diff === 1) mulLv[0] = 1;
  const kinds = topic === 'mul' ? ['mul', 'mul', 'interro', 'mul'] : topic === 'eq' ? ['eq', 'eq', 'interro', 'eq'] : shuffle(['mul', 'eq', pick(['bugmul', 'bugeq', 'interro'])]).concat([pick(['mul', 'eq', 'interro'])]);
  const tasks = kinds.map((k, i) => makeTask(k, k === 'mul' ? mulLv[i] : k === 'eq' ? eqLv[i] : k === 'interro' ? (topic === 'eq' || (topic === 'mix' && Math.random() < 0.5) ? 'eq' : 'mul') : k === 'bugeq' ? diff + 1 : (diff >= 2 ? 2 : 1)));
  if (!S.crimeBag.length) S.crimeBag = shuffle(E.CRIMES.map((_, i) => i));
  const ci = S.crimeBag.shift(); save();
  const cc = E.genCase(S.cases + 1); cc.crime = E.CRIMES[ci] || cc.crime;
  const others = E.ANIMALS.filter(a => !cc.suspects.some(x => x.animal[1] === a[1]));
  CASE = { c: cc, ci, tasks, idx: 0, mistakes: 0, crossed: new Set(), earned: 0, xp: 0, topic, diff, accuseTries: 0, marks: [], witnesses: shuffle(others).slice(0, 4), witnessMode: Math.random() < 0.5 };
  go('caseintro');
}
/* портрет персонажа: зверь в шляпе, шарфе и с вещью; покачивается, при разговоре подпрыгивает */
function portrait(s, cls = '', mood) {
  const A = E.ATTRS, d = (s.animal[1].length % 7) / 5;
  if (window.Chibi && Chibi.has(s.animal[1])) return `<span class="pt chibi-pt ${cls}" style="--d:${d}s">${Chibi.chibiSVG(s.animal[1], { mood, hat: s.hat != null ? A.hat.vals[s.hat].e : null, scarf: s.scarf != null ? A.scarf.vals[s.scarf].c : null, item: s.item != null ? A.item.vals[s.item].e : null })}</span>`;
  return `<span class="pt ${cls}" style="--d:${d}s"><span class="pt-a">${s.animal[0]}</span>${s.hat != null ? `<span class="pt-h">${A.hat.vals[s.hat].e}</span><span class="pt-s" style="background:${A.scarf.vals[s.scarf].c}"></span><span class="pt-i">${A.item.vals[s.item].e}</span>` : ''}</span>`;
}
function personaSay(s, kind) { const L = window.Lines.personaLines(s.animal[1]); if (L) speakT(L[kind], { prio: 2 }); }
function interrogate(i) {
  /* каждый вопрос на счету: 1–2 — отвечает, 3–4 — возмущается, 5+ — обижается и молчит до следующего дела */
  const s = CASE.c.suspects[i], P0 = window.Lines.PERSONA[s.animal[1]] || { who: '', quirk: '' }, f = P0.g === 'f', L = window.Lines.personaLines(s.animal[1]);
  const plain = t => String(t || '').replace(/^@v:\S+ /, '');
  const answers = [['hi', `Я ${s.animal[1]}, ${P0.who}. Я тут ни при чём!`], ['quirk', P0.quirk], ['nervous', plain(L && L.nervous)]];
  CASE.asked = CASE.asked || {};
  const m = modal(`<div class="interro"><div class="interro-lamp"></div><div id="ipt"></div><h2>${s.animal[1]}</h2><p class="small">${P0.who}</p><div class="interro-say" id="isay"></div><div class="mood-bar" id="imood"></div>
    <div class="row-btns"><button class="btn pink" id="ask">🎤 Спросить</button><button class="btn" data-close>Отпустить</button></div></div>`, 'interro-sheet');
  function ask() {
    const n = CASE.asked[i] = (CASE.asked[i] || 0) + 1;
    let kind, text, mood;
    if (n >= 5) { kind = 'offended'; mood = 'angry'; text = f ? 'Хмф! Я обиделась и больше ничего не скажу!' : 'Хмф! Я обиделся и больше ничего не скажу!'; }
    else if (n >= 3) { kind = 'annoyed'; mood = 'angry'; text = f ? 'Ну сколько можно спрашивать?! Я уже всё рассказала!' : 'Ну сколько можно спрашивать?! Я уже всё рассказал!'; }
    else { [kind, text] = answers[(n - 1) % answers.length]; mood = 'idle'; }
    $('#ipt', m.el).innerHTML = portrait(s, 'big talking' + (mood === 'angry' ? ' angry' : ''), mood);
    const say_ = $('#isay', m.el); say_.textContent = `«${text}»`; say_.classList.toggle('angry', mood === 'angry'); say_.classList.remove('pop'); void say_.offsetWidth; say_.classList.add('pop');
    const pat = 5 - Math.min(5, n);
    $('#imood', m.el).innerHTML = n >= 5 ? '😤 Обиделся(ась) — больше не отвечает' : `Терпение: ${'💛'.repeat(pat)}${'🖤'.repeat(5 - pat)}`;
    personaSay(s, kind);
    if (mood === 'angry') { M.sfx('drum'); M.haptic([40, 40, 80]); } else M.sfx('magic');
    if (n >= 5) { const b = $('#ask', m.el); b.disabled = true; b.textContent = '🤐 Молчит'; }
    if (n === 3) toast('<span class="tb">😾</span><div>Подозреваемый сердится — не спрашивай одно и то же много раз!</div>');
  }
  if ((CASE.asked[i] || 0) >= 5) { CASE.asked[i]--; } // повторное открытие — сразу обиженный ответ
  ask();
  $('#ask', m.el).addEventListener('click', ask);
}
function suspectCard(s, i, found) {
  const A = E.ATTRS;
  return `<button class="sus ${CASE.crossed.has(i) ? 'crossed' : ''}" data-i="${i}"><span class="ask-b" data-ask="${i}" title="Допросить">💬</span>${portrait(s)}<span class="sn">${s.animal[1]}</span>
    <span class="attrs"><span title="шляпа">${A.hat.vals[s.hat].e}</span><span class="scarf" title="шарф" style="background:${A.scarf.vals[s.scarf].c}"></span><span title="любит">${A.sweet.vals[s.sweet].e}</span><span title="с собой">${A.item.vals[s.item].e}</span></span></button>`;
}
function suspectsHTML(found) { return `<div class="sus-grid">${CASE.c.suspects.map((s, i) => suspectCard(s, i, found)).join('')}</div><div class="sus-legend">🎩 шляпа · <i class="scarf mini"></i> шарф · 🍩 любимая сладость · 🎒 что с собой</div>`; }
function bindAsk(root) { $$('.ask-b', root).forEach(x => x.addEventListener('click', e => { e.stopPropagation(); SND.tap(); interrogate(+x.dataset.ask); })); }
function bindSuspects(root, found, onChange) {
  bindAsk(root);
  $$('.sus', root).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i, s = CASE.c.suspects[i];
    if (CASE.crossed.has(i)) { CASE.crossed.delete(i); b.classList.remove('crossed'); SND.tap(); onChange && onChange(); return; }
    if (E.alibi(CASE.c, s, found) < 0) { SND.bad(); shake(b); say(found ? `Подожди, {n}! ${s.animal[1]} подходит под все улики.` : PH.noClue[0]); return; }
    CASE.crossed.add(i); b.classList.add('crossed'); SND.tap(); catMood('happy', 700); say(Math.random() < 0.4 ? `${s.animal[1]} — не вор!` : pick(PH.cross), 0, { silent: true }); personaSay(s, 'free'); onChange && onChange();
  }));
}
/* «фото» с места происшествия: вспышка, луч фонарика, туман, пылинки; найденные улики отмечаются на фото */
function sceneHTML(cls = '') {
  const marks = CASE.marks.map(m => `<span class="mark" style="left:${m.x}%;top:${m.y}%">${m.e}</span>`).join('');
  return `<div class="scene ${cls}" style="--img:url('img/scene2/${CASE.ci}.jpg'), url('img/scene/${CASE.ci}.jpg')"><div class="sc-img"></div><div class="sc-fog"></div><div class="sc-dust">${'<i></i>'.repeat(14)}</div><div class="sc-beam"></div>${marks}<div class="sc-tape">МЕСТО ПРОИСШЕСТВИЯ · НЕ ВХОДИТЬ</div><div class="sc-flash"></div><div class="sc-stamp">ФОТО №${CASE.c.n}</div></div>`;
}
function sceneSound() { M.sfx('shutter'); later(() => M.sfx('mystery'), 250); }
function clueMark(k) { const a = CASE.c.order[k], v = E.ATTRS[a].vals[CASE.c.culprit[a]]; return a === 'scarf' ? '🧵' : v.e; }
SCREENS.caseintro = () => {
  if (!CASE) return go('newcase');
  const c = CASE.c;
  app.innerHTML = `${topbar('Дело №' + c.n, 'newcase')}
  <div class="page">
    ${sceneHTML('intro')}
    <div class="dossier"><div class="stamp">СЕКРЕТНО</div><h2>«${c.crime.title}»</h2>
      <p>Сегодня утром в <b>${c.crime.place}</b> кто-то украл <b>${c.crime.what}</b>! На месте преступления видели пятерых подозреваемых.</p>
      <p>Реши <b>4 задачи</b> — за каждую получишь улику. По уликам вычисли вора! 🔍</p></div>
    <h3>Подозреваемые <small class="small">— нажми 💬, чтобы допросить</small></h3>${suspectsHTML(0)}
    <button class="btn big pink" id="go">Начать расследование →</button>
  </div>`;
  $('#go').addEventListener('click', () => go('casetask'));
  bindAsk(app); $$('.sus', app).forEach(b => b.addEventListener('click', () => interrogate(+b.dataset.i)));
  sceneSound();
};
function clueBar() { return `<div class="clues">${[0, 1, 2, 3].map(k => `<span class="clue-dot ${k < CASE.idx ? 'got' : k === CASE.idx ? 'now' : ''}">${k < CASE.idx ? '🔎' : '🔒'}</span>`).join('')}</div>`; }
SCREENS.casetask = () => {
  if (!CASE) return go('newcase');
  const t = CASE.tasks[CASE.idx];
  const title = { mul: 'Умножь столбиком', eq: 'Реши уравнение', bugmul: 'Найди ошибку Енота', bugeq: 'Найди ошибку Енота', interro: 'Математический допрос' }[t.kind];
  app.innerHTML = `${topbar('Дело №' + CASE.c.n, 'home')}
  <div class="page task-page"><div class="task-head"><div><b>Улика ${CASE.idx + 1} из 4</b> · ${title}</div>${clueBar()}<button class="btn ghost sm" id="sus">👥 Подозреваемые</button></div>
  <div id="task"></div><div id="after" class="after"></div></div>`;
  $('#sus').addEventListener('click', showSuspects);
  mountTask($('#task'), t, false, res => {
    CASE.mistakes += res.mistakes;
    const perfect = !res.mistakes && !res.helped, isEq = t.kind === 'eq', c = (perfect ? 3 : 1) * (isEq ? 2 : 1), xp = (perfect ? 15 : 10) + (isEq ? 5 : 0);
    taskDone(statKind(t.kind), res); CASE.earned += c; CASE.xp += xp; award(c, xp);
    { const hard = (t.kind === 'mul' && t.level >= 3) || (t.kind === 'eq' && t.level >= 3); if (hard && perfect) awardGems(1, 'за сложную задачу без ошибок'); }
    $('#after').innerHTML = `<button class="btn big pink" id="clue">🔎 Получить улику</button>`;
    $('#clue').addEventListener('click', revealClue);
  });
};
function showSuspects() {
  const found = CASE.idx;
  const m = modal(`<h2>Подозреваемые</h2>${found ? `<div class="clue-list">${CASE.c.clues.slice(0, found).map((c, k) => `<div class="clue">🔎 ${c.text}</div>`).join('')}</div><p class="small">Нажми на подозреваемого, который не подходит под улики, — вычеркнем его.</p>` : '<p class="small">Улик пока нет. Реши задачу, чтобы получить первую!</p>'}${suspectsHTML(found)}<button class="btn" data-close>Закрыть</button>`, 'wide');
  bindSuspects(m.el, found);
}
function revealClue() {
  const k = CASE.idx, clue = CASE.c.clues[k];
  CASE.idx++;
  tone([[784, 0.12], [988, 0.12, 0.1], [1319, 0.3, 0.2]]); later(() => SND.trill(), 400); M.haptic([20, 40, 60]);
  CASE.marks.push({ e: clueMark(k), x: 12 + Math.random() * 74, y: 30 + Math.random() * 50 });
  const wit = CASE.witnessMode ? CASE.witnesses[k] : null;
  later(() => speakT([PH.clueN[k], clue.text], { prio: 2 }), 700); later(sceneSound, 100);
  const m = modal(`${sceneHTML('clue')}<div class="clue-big">${wit ? `<div class="witness">${portrait({ animal: wit }, 'talking')}<b>Свидетель — ${wit[1]}:</b></div>` : '<div class="clue-ic">🔎</div>'}<h2>Улика №${k + 1}</h2><p class="clue-txt">${clue.text}</p></div>
    <div class="clue-list">${CASE.c.clues.slice(0, k).map(c => `<div class="clue old">🔎 ${c.text}</div>`).join('')}</div>
    <p class="small center">Вычеркни тех, кто <b>не подходит</b> под улики (нажми на карточку):</p>${suspectsHTML(CASE.idx)}
    <button class="btn big pink" id="nx">${CASE.idx < 4 ? 'Следующая задача →' : 'Вычислить вора! 🚨'}</button>`, 'wide');
  bindSuspects(m.el, CASE.idx);
  $('#nx', m.el).addEventListener('click', () => { m.close(); go(CASE.idx < 4 ? 'casetask' : 'accuse'); });
}
SCREENS.accuse = () => {
  if (!CASE) return go('newcase');
  let sel = -1;
  app.innerHTML = `${topbar('Дело №' + CASE.c.n, 'home')}
  <div class="page"><div class="dossier"><h2>🚨 Кто же вор?</h2><p>Все 4 улики собраны! Выбери подозреваемого, который подходит под <b>все</b> улики, и арестуй его.</p>
    <div class="clue-list">${CASE.c.clues.map(c => `<div class="clue">🔎 ${c.text}</div>`).join('')}</div></div>
    ${sceneHTML('small')}${suspectsHTML(4)}<button class="btn big pink" id="arrest" disabled>Выбери подозреваемого</button></div>`;
  bindAsk(app);
  $$('.sus', app).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i; if (CASE.crossed.has(i)) { CASE.crossed.delete(i); b.classList.remove('crossed'); }
    sel = i; $$('.sus', app).forEach(x => x.classList.toggle('sel', x === b)); SND.tap();
    const btn = $('#arrest'); btn.disabled = false; btn.textContent = `🚔 Арестовать: ${CASE.c.suspects[i].animal[1]}!`; say(`Думаешь, это ${CASE.c.suspects[i].animal[1]}? Сравни с уликами!`);
  }));
  $('#arrest').addEventListener('click', () => {
    if (sel < 0) return; const s = CASE.c.suspects[sel];
    if (s.culprit) return closeCase();
    CASE.accuseTries++; CASE.mistakes++; SND.hiss(); catMood('sad', 1500); later(() => personaSay(s, 'alibi'), 400);
    const k = E.alibi(CASE.c, s, 4), a = CASE.c.order[k], A = E.ATTRS[a], v = A.vals[s[a]];
    const why = a === 'scarf' ? `у него ${v.n} шарф` : a === 'sweet' ? `${s.animal[1].split(' ')[1]} любит ${v.w}` : `${s.animal[1].split(' ')[1]} был ${v.w} ${v.e}`;
    CASE.crossed.add(sel); $(`.sus[data-i="${sel}"]`, app).classList.add('crossed'); $(`.sus[data-i="${sel}"]`, app).classList.remove('sel'); sel = -1;
    $('#arrest').disabled = true; $('#arrest').textContent = 'Выбери подозреваемого';
    modal(`<div class="big-emoji hissing">${s.animal[0]}💨</div><h2>«Пфф! Это не я!» — фыркает ${s.animal[1]}</h2><p><b>У подозреваемого алиби!</b></p><p>Не подходит под улику №${k + 1}: ${why}.</p><p>Посмотри на улики ещё раз!</p><button class="btn pink" data-close>Хорошо</button>`);
  });
};
function closeCase() {
  const perfect = CASE.mistakes === 0;
  const c = 6 + (perfect ? 3 : 0), xp = 25;
  if (CASE.diff >= 3) awardGems(perfect ? 3 : 2, 'за сложное дело'); else if (CASE.diff === 2 && perfect) awardGems(1, 'за дело без ошибок');
  S.cases++; if (perfect) S.casesPerfect++;
  const culprit = CASE.c.suspects.find(s => s.culprit);
  S.caseLog.unshift({ n: CASE.c.n, title: CASE.c.crime.title, who: culprit.animal.join(' '), date: today(), perfect });
  S.caseLog = S.caseLog.slice(0, 60);
  CASE.earned += c; award(c, xp + 0); save();
  confetti(50); SND.win(); later(() => M.custom('thief') || personaSay(culprit, 'caught'), 900); later(() => M.purr(3), 4200); later(() => say(pick(PH.win)), 3800);
  app.innerHTML = `${topbar('Дело раскрыто!', 'home')}
  <div class="page center win-page">
    <div class="win-cat"><div class="win-cat-in">${myCat({ happy: true })}</div><div class="arrested">${portrait(culprit, 'talking')}<span>🚔</span></div></div>
    <h2>${esc(S.kid)}, дело №${CASE.c.n} «${CASE.c.crime.title}» раскрыто!</h2>
    <p>Вором оказался <b>${culprit.animal[1]}</b>. Он во всём признался и вернул ${CASE.c.crime.what} в ${CASE.c.crime.place}.</p>
    ${perfect ? '<div class="perfect">💎 Без единой ошибки! +5 бонусных конфет</div>' : ''}
    <div class="loot"><div>🍬 <b>+${CASE.earned}</b><small>конфет</small></div><div>⭐ <b>+${CASE.xp + xp}</b><small>опыта</small></div></div>
    <div class="row-btns"><button class="btn big pink" id="again">Новое дело →</button><button class="btn" data-go="home">Домой</button></div>
  </div>`;
  const t = CASE.topic, d = CASE.diff; CASE = null;
  $('#again').addEventListener('click', () => startCase(t, d));
}

/* ================= ЭКРАН: Школа сыщика ================= */
SCREENS.school = () => {
  app.innerHTML = `${topbar('Школа сыщика')}
  <div class="page">
    <div class="school-card mul">
      <div class="sc-ic">✖️</div><div class="sc-body"><h2>Умножение столбиком</h2><p>Почему пишем справа налево, что делать с «запомненным» и зачем сдвигать строку.</p>
      <div class="row-btns"><button class="btn pink" data-go="lesson" data-arg="mul">📖 Урок ${S.lessons.mul ? '✔' : ''}</button><button class="btn" data-go="practice" data-arg="mul">🐾 Решаем вместе</button></div></div></div>
    <div class="school-card eq">
      <div class="sc-ic">📦</div><div class="sc-body"><h2>Составные уравнения</h2><p>Метод коробки: найти последнее действие, назвать компонент, применить правило — и так слой за слоем.</p>
      <div class="row-btns"><button class="btn pink" data-go="lesson" data-arg="eq">📖 Урок ${S.lessons.eq ? '✔' : ''}</button><button class="btn" data-go="practice" data-arg="eq">🐾 Решаем вместе</button></div></div></div>
    <p class="small center">Совет: сначала урок, потом «Решаем вместе» с подсказками, а когда получается — раскрывай дела самостоятельно!</p>
  </div>`;
};
function miniColumn(a, b, o = {}) { // статичный столбик для слайдов
  const P = E.mulPlan(a, b), rows = o.rows ?? P.rows.length, nB = P.B.length;
  const W = Math.max(String(P.total).length, ...P.rows.map(r => String(r.val).length + r.shift)) + 1;
  const line = (txt, shift, opt = {}) => { const s = String(txt); let h = ''; for (let q = 0; q < W; q++) { const c = W - 1 - q, p = c - shift; let t = ''; let cls = ''; if (p >= 0 && p < s.length) t = s[s.length - 1 - p]; if (opt.ghost && c < shift) { t = '0'; cls = 'ghost'; } if (opt.carry && opt.carry[c]) { t = opt.carry[c]; cls = 'carry'; } if (c === W - 1 && opt.sign) { t = opt.sign; cls = 'sign'; } if (opt.hl && opt.hl.includes(c)) cls += ' hl'; h += `<div class="cell ${cls} ${opt.ul && c < W - 1 ? 'ul' : ''}">${t}</div>`; } return `<div class="mrow ${opt.small ? 'small' : ''}">${h}</div>`; };
  let h = o.carry ? line('', 0, { small: true, carry: o.carry }) : '';
  h += line(a, 0, { hl: o.hlA }) + line(b, 0, { sign: '×', ul: true, hl: o.hlB });
  for (let i = 0; i < rows; i++) h += line(o.partial && o.partial[i] != null ? o.partial[i] : P.rows[i].val, i, { ghost: o.ghost && i > 0, sign: i === 1 ? '+' : '', ul: o.sum && i === nB - 1 });
  if (o.sum) h += line(P.total, 0);
  return `<div class="paper mini"><div class="mgrid" style="--w:${W}">${h}</div></div>`;
}
const LESSONS = {
  mul: [
    { t: 'Зачем умножать столбиком?', h: () => `<div class="slide-row"><div class="story">В кондитерскую привезли <b>23 коробки</b> конфет. В каждой коробке <b>324 конфеты</b>. Сколько всего конфет?<br><br>Нужно посчитать <b>324 × 23</b>. В уме сложно! А столбиком — легко.<br><br>🔑 <b>Секрет:</b> большое умножение разбивается на маленькие шаги из таблицы умножения.</div><div class="boxes">${'📦'.repeat(23)}</div></div>` },
    { t: 'Шаг 1. Разбиваем число', h: () => `<div class="story">23 — это <b>20 + 3</b>. Значит, 23 коробки = 3 коробки + 20 коробок.</div><div class="formula">324 × 23 = <span class="hlm">324 × 3</span> + <span class="hlp">324 × 20</span></div><div class="story">Сначала посчитаем, сколько конфет в 3 коробках, потом — в 20 коробках, и сложим. Каждая часть называется <b>неполное произведение</b>.</div>` },
    { t: 'Шаг 2. Умножаем на единицы: 324 × 3', interactive: 'mulA' },
    { t: 'Шаг 3. Умножаем на десятки: 324 × 20', h: () => `<div class="slide-row"><div class="story">Теперь умножаем на <b>2</b>. Но двойка стоит в разряде десятков — это <b>2 десятка = 20</b>!<br><br>324 × 20 = 324 × 2 × 10 = 648 × 10 = <b>6480</b>.<br><br>Нолик на конце можно не писать — просто начинаем писать на <b>одну клетку левее</b>. Это и есть <b>сдвиг</b>! Пустая клетка — как невидимый нолик.</div>${miniColumn(324, 23, { ghost: true, hlB: [1] })}</div>` },
    { t: 'Шаг 4. Складываем', h: () => `<div class="slide-row"><div class="story">Складываем неполные произведения столбиком, тоже <b>справа налево</b>:<br><br>972 + 6480 = <b>7452</b><br><br>Ответ: в кондитерской <b>7452 конфеты</b>! 🍬</div>${miniColumn(324, 23, { ghost: true, sum: true })}</div>` },
    { t: 'Памятка сыщика', h: () => `<ol class="rules"><li>Пишем числа так, чтобы <b>единицы были под единицами</b>.</li><li>Умножаем верхнее число на каждую цифру нижнего — <b>справа налево</b>.</li><li>Если получилось двузначное число — пишем единицы, а десятки <b>запоминаем</b> (маленькой цифрой сверху) и <b>обязательно прибавляем</b> к следующему произведению.</li><li>Каждое следующее неполное произведение пишем со <b>сдвигом на одну клетку влево</b>.</li><li><b>Складываем</b> неполные произведения.</li><li>Проверяем прикидкой: 324 × 23 ≈ 300 × 20 = 6000. Ответ 7452 — похоже на правду! ✔</li></ol>` },
  ],
  eq: [
    { t: 'Названия — это ключи', h: () => `<div class="story">Чтобы решать уравнения, сыщику нужно знать, как называются числа в каждом действии:</div><div class="names"><div><span class="nm">слагаемое</span> + <span class="nm">слагаемое</span> = <span class="nm r">сумма</span></div><div><span class="nm">уменьшаемое</span> − <span class="nm">вычитаемое</span> = <span class="nm r">разность</span></div><div><span class="nm">множитель</span> · <span class="nm">множитель</span> = <span class="nm r">произведение</span></div><div><span class="nm">делимое</span> : <span class="nm">делитель</span> = <span class="nm r">частное</span></div></div>` },
    { t: 'Как найти неизвестное', h: () => `<div class="rules6">${E.ROLE_ORDER.map(r => { const R = E.ROLES[r]; const ex = { add: ['x + 5 = 12', 'x = 12 − 5'], minuend: ['x − 4 = 9', 'x = 9 + 4'], subtrahend: ['15 − x = 6', 'x = 15 − 6'], factor: ['x · 3 = 21', 'x = 21 : 3'], dividend: ['x : 4 = 5', 'x = 5 · 4'], divisor: ['24 : x = 6', 'x = 24 : 6'] }[r]; return `<div class="r6"><b>${R.gen[0].toUpperCase() + R.gen.slice(1)}</b><small>${R.rule.split(', нужно ')[1].replace('.', '')}</small><code>${ex[0]}<br>${ex[1]}</code></div>`; }).join('')}</div><div class="story small">💡 <b>Уменьшаемое</b> и <b>делимое</b> — самые большие числа, их находим «наоборот»: сложением и умножением. Остальные — вычитанием и делением.</div>` },
    { t: 'Метод коробки 📦', interactive: 'box' },
    { t: 'Как найти, что спрятать в коробку?', h: () => `<div class="story">Ищем <b>последнее действие</b>. Помни порядок: сначала <b>( скобки )</b>, потом <b>· и :</b>, потом <b>+ и −</b>.</div><div class="ex-list"><div><div class="formula sm"><span class="boxed">x · 3</span> <b class="lastop">+</b> 15 = 60</div><small>Последнее «+» → коробка <b>x · 3</b> — слагаемое</small></div><div><div class="formula sm">(<span class="boxed">x − 7</span>) <b class="lastop">:</b> 4 = 9</div><small>Скобки сначала, последнее «:» → коробка <b>x − 7</b> — делимое</small></div><div><div class="formula sm">100 <b class="lastop">−</b> <span class="boxed">x · 8</span> = 36</div><small>Последнее «−» → коробка <b>x · 8</b> — вычитаемое</small></div></div>` },
    { t: 'Проверка — алиби для ответа', h: () => `<div class="story">Нашли <b>x</b>? Настоящий сыщик всегда проверяет! Подставляем число вместо x и считаем:</div><div class="formula">(15 + 15) · 4 = 30 · 4 = 120 ✔</div><div class="story">Получилось 120 — как в уравнении. Значит, x = 15 — верный ответ!</div><ol class="rules"><li>Найди <b>последнее действие</b>.</li><li>Спрячь часть с x в <b>коробку</b> и назови её (слагаемое, множитель…).</li><li>Примени <b>правило</b> и посчитай, чему равна коробка.</li><li><b>Открой коробку</b> — получится уравнение попроще. Повторяй, пока не найдёшь x.</li><li>Сделай <b>проверку</b>.</li></ol>` },
  ],
};
SCREENS.lesson = (topic = 'mul') => {
  const L = LESSONS[topic]; let i = 0;
  app.innerHTML = `${topbar(topic === 'mul' ? 'Урок: столбик' : 'Урок: уравнения', 'school')}<div class="page lesson"><div class="slide" id="slide"></div>
    <div class="slide-nav"><button class="btn" id="prev">←</button><div class="dots">${L.map((_, k) => `<i data-k="${k}"></i>`).join('')}</div><button class="btn pink" id="next">Дальше →</button></div></div>`;
  const draw = () => {
    const sl = L[i];
    $('#slide').innerHTML = `<div class="slide-head"><div class="mini-cat">${myCat({ cls: 'mini' })}</div><h2>${sl.t}</h2></div><div class="slide-body" id="sb">${sl.h ? sl.h() : ''}</div>`;
    if (sl.interactive) INTER[sl.interactive]($('#sb'));
    $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#prev').style.visibility = i ? 'visible' : 'hidden';
    $('#next').textContent = i < L.length - 1 ? 'Дальше →' : '🐾 Решаем вместе!';
    if (i === L.length - 1 && !S.lessons[topic]) { S.lessons[topic] = true; save(); award(5, 20); checkBadges(); later(() => { SND.win(); say(PH.lessonDone[0]); }, 400); }
  };
  $('#prev').addEventListener('click', () => { if (i > 0) { i--; SND.tap(); draw(); } });
  $('#next').addEventListener('click', () => { SND.tap(); if (i < L.length - 1) { i++; draw(); } else go('practice', topic); });
  draw();
};
const INTER = {
  mulA(el) {
    const st = window.Lines.LESSON_STEPS.mulA;
    let k = -1;
    const draw = () => {
      const s = st[k];
      el.innerHTML = `<div class="slide-row"><div class="story">${s ? s.txt : 'Умножаем 324 на <b>3</b> (единицы нижнего числа). Нажимай «Следующий шаг».'}<br><br><button class="btn mint" id="stp">${k < st.length - 1 ? 'Следующий шаг ▶' : 'Ещё раз ↺'}</button></div>${miniColumn(324, 23, { rows: s ? 1 : 0, partial: s ? [s.p] : [], carry: s ? s.carry : null, hlA: s ? s.hlA : [], hlB: [0] })}</div>`;
      $('#stp', el).addEventListener('click', () => { SND.tap(); k = k < st.length - 1 ? k + 1 : -1; draw(); if (st[k]) { speakT(st[k].txt, { prio: 2 }); catMood('happy', 600); } });
    };
    draw();
  },
  box(el) {
    const st = window.Lines.LESSON_STEPS.box;
    let k = 0;
    const draw = () => {
      el.innerHTML = `<div class="box-demo">${st.slice(0, k + 1).map((s, q) => `<div class="formula ${q === k ? 'now' : 'old'}">${s.f}</div>`).join('')}</div><div class="story">${st[k].t}</div><button class="btn mint" id="stp">${k < st.length - 1 ? 'Следующий шаг ▶' : 'Ещё раз ↺'}</button>`;
      $('#stp', el).addEventListener('click', () => { SND.tap(); k = k < st.length - 1 ? k + 1 : 0; draw(); speakT(st[k].t, { prio: 2 }); catMood('happy', 600); });
    };
    draw();
  },
};

/* ================= ЭКРАН: Решаем вместе (практика) ================= */
SCREENS.practice = (topic = 'mul') => {
  const isMul = topic === 'mul', levels = isMul ? E.MUL_LEVELS : E.EQ_LEVELS, key = isMul ? 'mulLv' : 'eqLv';
  S.prefs.guided = S.prefs.guided || {}; let guided = S.prefs.guided[topic] !== false, count = 0;
  app.innerHTML = `${topbar(isMul ? 'Столбик: тренировка' : 'Уравнения: тренировка', 'school')}
  <div class="page task-page"><div class="task-head wrap">
    <div class="seg lv">${Object.entries(levels).map(([v, l]) => `<button data-v="${v}" class="${+v === S.prefs[key] ? 'on' : ''}">${l.name}</button>`).join('')}</div>
    <div class="seg mode"><button data-m="1" class="${guided ? 'on' : ''}">🐾 С подсказками</button><button data-m="0" class="${guided ? '' : 'on'}">💪 Сам(а)</button></div></div>
    <div id="task"></div><div id="after" class="after"></div></div>`;
  const load = () => {
    $('#after').innerHTML = '';
    const t = makeTask(topic, S.prefs[key]), t0 = Date.now();
    mountTask($('#task'), t, guided, res => {
      count++; taskDone(topic, res); if (!guided) trackPerf(topic, t.level, res, (Date.now() - t0) / 1000);
      if (!guided && t.level >= 3 && !res.mistakes && !res.helped) awardGems(1, 'за сложную задачу без ошибок');
      const c = ((!res.mistakes && !res.helped) ? 2 : 1) * (topic === 'eq' ? 2 : 1); award(c, (guided ? 6 : 10) + (topic === 'eq' ? 4 : 0));
      if (topic === 'eq') { const q = nextQuest(); if (q && q.e) toast(`<span class="tb">📦</span><div>До комнаты «${q.r.name}»: ещё ${lockText(q.r)}</div>`); }
      $('#after').innerHTML = `<button class="btn big pink" id="more">Ещё пример →</button>`;
      $('#more').addEventListener('click', () => { SND.tap(); load(); });
    });
  };
  $$('.lv button').forEach(b => b.addEventListener('click', () => { S.prefs[key] = +b.dataset.v; S.prefs[key + 'Chosen'] = true; save(); $$('.lv button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); load(); }));
  $$('.mode button').forEach(b => b.addEventListener('click', () => { guided = b.dataset.m === '1'; S.prefs.guided[topic] = guided; save(); $$('.mode button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); load(); }));
  load();
};

/* ================= ЭКРАН: Ошибки Енота ================= */
SCREENS.bugs = () => {
  let lv = 1, found = 0;
  app.innerHTML = `${topbar('Ошибки Енота')}<div class="page task-page"><div class="task-head wrap"><div class="seg lv"><button data-v="1" class="on">🍪 Попроще</button><button data-v="2">🎂 Посложнее</button></div><div class="pill">🔍 Найдено: <b id="fc">0</b></div></div><div id="task"></div><div id="after" class="after"></div></div>`;
  const load = () => {
    $('#after').innerHTML = '';
    const t = { kind: pick(['bugmul', 'bugeq']), level: lv };
    if (t.kind === 'bugeq') t.level = lv === 1 ? 2 : pick([3, 4]);
    mountTask($('#task'), t, false, res => {
      found++; $('#fc').textContent = found; taskDone('bug', res); award(res.mistakes ? 1 : 3, res.mistakes ? 6 : 12);
      $('#after').innerHTML = `<button class="btn big pink" id="more">Следующее решение Енота →</button>`;
      $('#more').addEventListener('click', () => { SND.tap(); load(); });
    });
  };
  $$('.lv button').forEach(b => b.addEventListener('click', () => { lv = +b.dataset.v; $$('.lv button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); load(); }));
  load();
};

/* ================= ЭКРАН: Быстрые лапки ================= */
SCREENS.blitz = () => {
  app.innerHTML = `${topbar('Быстрые лапки')}<div class="page center blitz" id="bz"></div>`;
  const box = $('#bz');
  const intro = () => {
    const weak = Object.entries(S.facts).sort((x, y) => y[1] - x[1]).slice(0, 6);
    box.innerHTML = `${helperHTML('bzi')}<div class="big-emoji">⚡🐾</div><h2>Таблица умножения на скорость</h2><p>За <b>60 секунд</b> реши как можно больше примеров. Без таблицы умножения столбик не работает — тренируем лапки!</p>
      <div class="pill big">🏆 Рекорд: <b>${S.st.blitz.best}</b></div>
      ${weak.length ? `<p class="small">Эти примеры будут попадаться чаще (в них были ошибки): ${weak.map(w => `<span class="chip">${w[0]}</span>`).join(' ')}</p>` : ''}
      <button class="btn big pink" id="go">Старт!</button>`;
    { const ph = pick(PH.blitz); $('#bzi').innerHTML = ph; later(() => speakT(ph), 500); }
    $('#go').addEventListener('click', run);
  };
  const facts = []; for (let p = 2; p <= 9; p++) for (let q = 2; q <= 9; q++) facts.push([p, q]);
  const pickFact = last => { const w = facts.map(([p, q]) => 1 + 4 * (S.facts[factKey(p, q)] || 0) + (p * q > 20 ? 1 : 0)); let tot = w.reduce((x, y) => x + y, 0), f; do { let r = Math.random() * tot; f = facts.find((_, i) => (r -= w[i]) < 0) || facts[0]; } while (last && f[0] === last[0] && f[1] === last[1]); return f; };
  const run = () => {
    let score = 0, f = pickFact(), buf = '', left = 60, lock = false; const misses = [];
    box.innerHTML = `${helperHTML('bzb')}<div class="timer"><i id="tb"></i></div><div class="bz-score">✔ <b id="sc">0</b></div><div class="bz-q" id="q"></div>${numpad(false)}`;
    $('#bzb').innerHTML = `Быстрее, лапки, ${esc(S.kid)}! ⚡`; speakT(PH.blitzGo[0]);
    const q = $('#q'), draw = () => { q.innerHTML = `${f[0]} × ${f[1]} = <span class="inp">${buf || '?'}</span>`; };
    draw();
    const t0 = Date.now();
    const iv = setInterval(() => { left = 60 - (Date.now() - t0) / 1000; $('#tb').style.width = Math.max(0, left / 60 * 100) + '%'; if (left <= 0) { clearInterval(iv); end(); } }, 100);
    cleanups.push(() => clearInterval(iv));
    bindPad(box, {
      digit: d => {
        if (lock) return; buf += d; draw(); const ans = String(f[0] * f[1]);
        if (buf.length >= ans.length) {
          if (buf === ans) { score++; $('#sc').textContent = score; SND.tap(); catMood('happy', 500); cheer(true); q.classList.add('ok'); setTimeout(() => q.classList.remove('ok'), 150); f = pickFact(f); buf = ''; draw(); }
          else { lock = true; SND.bad(); noteErr('tbl', factKey(f[0], f[1])); misses.push(`${f[0]} × ${f[1]} = ${ans}`); q.innerHTML = `${f[0]} × ${f[1]} = <span class="inp bad">${ans}</span>`; setTimeout(() => { lock = false; f = pickFact(f); buf = ''; draw(); }, 1100); }
        }
      },
      back: () => { buf = buf.slice(0, -1); draw(); },
    });
    const end = () => {
      keyHandler = null; const rec = score > S.st.blitz.best; S.st.blitz.games++; if (rec) S.st.blitz.best = score; markDay(1); save();
      const c = Math.floor(score / 3); award(c, score);
      if (rec) confetti(30);
      box.innerHTML = `<div class="big-emoji">${score >= 20 ? '🏆' : score >= 10 ? '🥈' : '🐾'}</div><h2>${esc(S.kid)}, верных ответов: ${score}!</h2>${rec ? '<div class="perfect">Новый рекорд! 🎉</div>' : `<p>Рекорд: ${S.st.blitz.best}</p>`}
        ${misses.length ? `<div class="misses"><b>Повтори:</b>${[...new Set(misses)].map(m => `<span class="chip">${m}</span>`).join('')}</div>` : ''}
        <div class="row-btns"><button class="btn big pink" id="again">Ещё раз!</button><button class="btn" data-go="home">Домой</button></div>`;
      $('#again').addEventListener('click', run);
    };
  };
  intro();
};

/* ================= ЭКРАН: Кондитерская ================= */
SCREENS.shop = () => {
  let tab = SHOP_TAB; SHOP_TAB = 'wear';
  app.innerHTML = `${topbar('Кондитерская')}<div class="seg tabs shoptabs"><button data-t="wear" class="${tab === 'wear' ? 'on' : ''}">👗 Наряды</button><button data-t="home" class="${tab === 'home' ? 'on' : ''}">🏠 Вещи для домика</button></div><div class="page shop"><div class="shop-cat" id="sc">${myCat()}</div><div class="shop-items" id="si"></div></div>`;
  $$('.shoptabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; $$('.shoptabs button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); draw(); }));
  const draw = () => {
    if (tab === 'home') { $('#sc').innerHTML = myCat(); $('#si').innerHTML = furnShopHTML(); bindFurnShop($('#si'), draw); return; }
    $('#sc').innerHTML = myCat();
    $('#si').innerHTML = Object.entries(SLOTS).map(([slot, nm]) => `<h3>${nm}</h3><div class="items">${ITEMS.filter(it => it.slot === slot).map(it => { const own = S.owned.includes(it.id), on = S.wear[slot] === it.id; return `<button class="item ${own ? 'own' : ''} ${on ? 'on' : ''} ${it.gems ? 'gemitem' : ''}" data-id="${it.id}"><span class="ii">${it.icon}</span><span class="in">${it.name}</span><span class="ip">${on ? 'надето ✔' : own ? 'надеть' : it.gems ? it.gems + ' 💎' : it.price + ' 🍬'}</span></button>`; }).join('')}</div>`).join('')
      + `<h3>Окрас котика</h3><div class="furs">${Object.entries(FURS).map(([k, f]) => `<button class="fur ${k === S.fur ? 'on' : ''}" data-f="${k}"><i style="background:${f.sw}"></i>${f.name}</button>`).join('')}</div>`;
    $$('.item', app).forEach(b => b.addEventListener('click', () => clickItem(ITEMS.find(x => x.id === b.dataset.id))));
    $$('.fur', app).forEach(b => b.addEventListener('click', () => { S.fur = b.dataset.f; save(); SND.meow(); draw(); }));
  };
  const clickItem = it => {
    if (S.owned.includes(it.id)) { S.wear[it.slot] = S.wear[it.slot] === it.id ? null : it.id; save(); SND.tap(); draw(); if (S.wear[it.slot]) { catMood('happy', 1200); M.meow({ shape: 'happy' }); { const w = pick(PH.wear); say(`${it.name} — ${w}`, 0, { speech: w }); } } else say(PH.unwear[0]); return; }
    if (it.gems) { if ((S.gems || 0) < it.gems) { SND.bad(); toast(`<span class="tb">💎</span><div>Нужно <b>${it.gems} 💎</b>, у тебя ${S.gems || 0}.<br>Кристаллы дают за сложные задачи и дела!</div>`); return; } const mg = modal(`<div class="big-emoji">${it.icon}</div><h2>${it.name}</h2><p>Особая вещь за <b>${it.gems} 💎</b>. Купить?</p><div class="row-btns"><button class="btn pink" id="buyg">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`); $('#buyg', mg.el).addEventListener('click', () => { S.gems -= it.gems; S.owned.push(it.id); S.wear[it.slot] = it.id; save(); updCandy(); mg.close(); M.sfx('magic'); confetti(30); draw(); say(PH.bought[0]); }); return; }
    if (S.candies < it.price) { SND.bad(); say(PH.poor[0]); toast(`<span class="tb">🍬</span><div>Не хватает конфет: нужно ещё <b>${it.price - S.candies}</b>.<br>Раскрой пару дел!</div>`); return; }
    const m = modal(`<div class="big-emoji">${it.icon}</div><h2>${it.name}</h2><p>Купить за <b>${it.price} 🍬</b>?</p><div class="row-btns"><button class="btn pink" id="buy">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`);
    $('#buy', m.el).addEventListener('click', () => { S.candies -= it.price; S.owned.push(it.id); S.wear[it.slot] = it.id; save(); updCandy(); m.close(); tone([[988, 0.09], [1319, 0.25, 0.07]]); confetti(20); draw(); later(() => { SND.crunch(); catMood('happy', 2600); hearts($('.shop-cat'), 5); say(PH.bought[0]); }, 150); });
  };
  draw();
};

/* ================= ЭКРАН: Блокнот ================= */
SCREENS.book = () => {
  let tab = 'rules';
  app.innerHTML = `${topbar('Блокнот детектива')}<div class="page"><div class="seg tabs"><button data-t="rules" class="on">📏 Правила</button><button data-t="table">✖️ Таблица</button><button data-t="awards">🏅 Награды</button><button data-t="cases">📁 Дела</button></div><div id="bk"></div></div>`;
  const draw = () => {
    const el = $('#bk');
    if (tab === 'rules') el.innerHTML = `<div class="card"><h3>✖️ Умножение столбиком</h3>${LESSONS.mul[5].h()}${miniColumn(324, 23, { ghost: true, sum: true })}</div>
      <div class="card"><h3>📦 Составные уравнения</h3>${LESSONS.eq[0].h()}${LESSONS.eq[1].h()}${LESSONS.eq[4].h()}</div>`;
    if (tab === 'table') { let h = '<div class="ttable"><div class="tc hd">×</div>'; for (let q = 1; q <= 9; q++) h += `<div class="tc hd">${q}</div>`; for (let p = 1; p <= 9; p++) { h += `<div class="tc hd">${p}</div>`; for (let q = 1; q <= 9; q++) { const e = S.facts[factKey(p, q)] || 0; h += `<div class="tc ${e >= 3 ? 'e3' : e ? 'e1' : ''}" data-p="${p}" data-q="${q}">${p * q}</div>`; } } el.innerHTML = h + '</div><p class="small center">Нажми на число — котик скажет пример. Розовым отмечены примеры, в которых были ошибки.</p>'; $$('.tc[data-p]', el).forEach(c => c.addEventListener('click', () => { const p = +c.dataset.p, q = +c.dataset.q; SND.tap(); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); say(`${p} на ${q} — будет ${p * q}!`); })); }
    if (tab === 'awards') el.innerHTML = `<div class="badges">${BADGES.map(b => { const got = S.badges.includes(b.id); return `<div class="badge ${got ? 'got' : ''}" data-b="${b.id}"><span>${got ? b.icon : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`; }).join('')}</div>`;
    if (tab === 'awards') $$('.badge', el).forEach(c => c.addEventListener('click', () => { const b = BADGES.find(x => x.id === c.dataset.b), got = S.badges.includes(b.id); SND.tap(); if (got) { catMood('happy', 900); say(`Награда «${b.name}»! ${PH.badgeGot[0]}`, 0, { speech: PH.badgeGot[0] }); } else say(`Чтобы получить награду «${b.name}», нужно ${b.desc.toLowerCase()}. ${PH.badgeNot[0]}`, 0, { speech: PH.badgeNot[0] }); }));
    if (tab === 'cases') el.innerHTML = S.caseLog.length ? `<div class="caselog">${S.caseLog.map(c => `<div class="cl"><b>№${c.n} «${c.title}»</b><span>Вор: ${c.who}</span><small>${c.date.split('-').reverse().join('.')}${c.perfect ? ' · 💎 без ошибок' : ''}</small></div>`).join('')}</div>` : `<p class="center">Пока нет раскрытых дел. <button class="btn pink" data-go="newcase">Взять первое дело</button></p>`;
  };
  $$('.tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.t; $$('.tabs button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); draw(); }));
  draw();
};

/* ================= ЭКРАН: Для взрослых ================= */
const ERR_INFO = {
  tbl: ['Таблица умножения', 'Слабые факты чаще выпадают в «Быстрых лапках». Список — ниже.'],
  carry: ['Забывает прибавить «запомненное»', 'Режим «С подсказками» в Школе подсвечивает перенос. Попросите проговаривать вслух: «пишу 2, один в уме».'],
  shift: ['Сдвиг второй строки', 'Объясните, что вторая строка — умножение на десятки (на 20, а не на 2). Урок «Столбик», шаг 3.'],
  add: ['Сложение неполных произведений', 'Следить, чтобы цифры стояли строго в своих клетках; складывать по столбикам справа налево.'],
  order: ['Порядок действий', 'Скобки → умножение и деление → сложение и вычитание. Урок «Уравнения», слайд 4.'],
  role: ['Названия компонентов', 'Слагаемое, уменьшаемое, вычитаемое, множитель, делимое, делитель — карточки в «Блокноте».'],
  rule: ['Правило нахождения неизвестного', 'Чаще путают вычитаемое и делитель. Помогает проверка подстановкой.'],
  calc: ['Вычисления внутри уравнения', 'Часто это деление или умножение многозначных чисел — можно разрешить считать на листочке.'],
  check: ['Проверка уравнения', 'Считать левую часть по действиям, в правильном порядке.'],
  bugmiss: ['Поиск ошибок Енота (промахи)', 'Это нормально: игра учит проверять каждую строку.'],
};
SCREENS.parents = () => {
  const days = Object.keys(S.days).length, tasks = Object.values(S.days).reduce((x, y) => x + y, 0);
  const errs = Object.entries(S.err).sort((x, y) => y[1] - x[1]), maxE = errs.length ? errs[0][1] : 1;
  const facts = Object.entries(S.facts).sort((x, y) => y[1] - x[1]).slice(0, 12);
  const last14 = []; for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); last14.push([d, S.days[dkey(d)] || 0]); }
  const max14 = Math.max(1, ...last14.map(x => x[1]));
  const pct = o => o.done ? Math.round(o.perfect / o.done * 100) + '%' : '—';
  app.innerHTML = `${topbar('Для взрослых')}<div class="page parents">
    <div class="card"><h3>Коротко</h3><div class="kpis"><div><b>${days}</b><small>дней занятий</small></div><div><b>${tasks}</b><small>задач решено</small></div><div><b>${S.cases}</b><small>дел раскрыто</small></div><div><b>${streak()}</b><small>дней подряд</small></div></div></div>
    <div class="card"><h3>По темам</h3><table class="tbl"><tr><th>Тема</th><th>Решено</th><th>Без ошибок</th></tr>
      <tr><td>Умножение столбиком</td><td>${S.st.mul.done}</td><td>${pct(S.st.mul)}</td></tr>
      <tr><td>Составные уравнения</td><td>${S.st.eq.done}</td><td>${pct(S.st.eq)}</td></tr>
      <tr><td>Поиск ошибок</td><td>${S.st.bug.done}</td><td>${pct(S.st.bug)}</td></tr>
      <tr><td>Таблица умножения (блиц)</td><td>${S.st.blitz.games} игр</td><td>рекорд ${S.st.blitz.best}</td></tr></table>
      <p class="small">Уроки: столбик ${S.lessons.mul ? '✔ пройден' : '— не пройден'}, уравнения ${S.lessons.eq ? '✔ пройден' : '— не пройден'}.</p></div>
    <div class="card"><h3>Где ошибается чаще всего</h3>${errs.length ? errs.map(([k, n]) => `<div class="erow"><div class="et"><b>${(ERR_INFO[k] || [k])[0]}</b><small>${(ERR_INFO[k] || ['', ''])[1]}</small></div><div class="ebar"><i style="width:${n / maxE * 100}%"></i><span>${n}</span></div></div>`).join('') : '<p class="small">Пока ошибок нет — или занятия ещё не начались.</p>'}</div>
    ${facts.length ? `<div class="card"><h3>Трудные примеры из таблицы</h3><div>${facts.map(([k, n]) => { const [p, q] = k.split('×'); return `<span class="chip">${p} × ${q} = ${p * q} <small>(${n})</small></span>`; }).join(' ')}</div></div>` : ''}
    <div class="card"><h3>Активность за 2 недели</h3><div class="act">${last14.map(([d, n]) => `<div class="ab"><i style="height:${n / max14 * 100}%"></i><small>${d.getDate()}</small></div>`).join('')}</div></div>
    <div class="card small"><h3>Как устроен тренажёр</h3><p>«Школа сыщика» объясняет тему и ведёт по шагам: в столбике кот спрашивает каждое действие («3 × 4 + 1 = ?»), подсвечивает запомненное число и просит самостоятельно выбрать клетку для сдвига. В уравнениях — «метод коробки»: найти последнее действие → назвать компонент → выбрать правило → посчитать → повторить → проверка.</p><p>В «Делах» те же задачи решаются самостоятельно: каждая цифра проверяется сразу, на ошибке кот даёт подсказку, после третьей попытки показывает ответ. За решённые задачи даются улики, по которым нужно вычислить вора — это тренирует внимательность и логику.</p><p>Прогресс хранится только на этом устройстве, в браузере.</p><p>Голос котика — встроенный синтез речи устройства. Музыка: Kevin MacLeod (incompetech.com), лицензия CC BY 4.0.</p></div>
    <div class="card"><h3>💬 Разговоры с котиком</h3><p class="small">Котик отвечает с помощью нейросети по строгим правилам: только детские темы; никаких личных данных, ссылок и встреч; если ребёнку грустно, страшно или его обижают — котик поддерживает и советует рассказать взрослому, даёт детский телефон доверия 8-800-2000-122. На сервере переписка не хранится — только здесь, на этом устройстве.</p>
      <label class="tgl"><input type="checkbox" id="chatOn" ${S.chatOn !== false ? 'checked' : ''}> Разрешить разговоры с котиком</label>
      ${(() => { const L = S.chatLog || []; const fl = L.filter(m => m.flag); const FL = { distress: '⚠️ ребёнку плохо или страшно', pii: '🔒 личные данные', offtopic: '🚫 неподходящая тема' }; return `<p class="small">Сообщений: ${L.filter(m => m.r === 'u').length}. Отмечено котиком: ${fl.length}.</p>${fl.length ? `<div class="flags">${fl.slice(-15).reverse().map(m => `<div class="flag ${m.flag}"><b>${FL[m.flag] || m.flag}</b> · ${new Date(m.ts).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}<br>${m.r === 'u' ? 'Ребёнок' : 'Котик'}: ${esc(m.t)}</div>`).join('')}</div>` : ''}${L.length ? `<details><summary>Показать последние сообщения</summary><div class="chatlog-p">${L.slice(-40).map(m => `<div><b>${m.r === 'u' ? esc(S.kid || 'Ребёнок') : 'Котик'}:</b> ${esc(m.t)}</div>`).join('')}</div></details>` : ''}`; })()}</div>
    <div class="card"><h3>☁️ Облачная копия прогресса</h3><p>Прогресс автоматически сохраняется на сервере. Чтобы продолжить на другом телефоне или планшете (или если браузер всё стёр), нажмите на первом экране «🔑 У меня уже есть код» и введите:</p><div class="ccode">${cloudCode()}</div><p class="small">Запишите этот код. ${S.cloudAt ? 'Последнее сохранение: ' + new Date(S.cloudAt).toLocaleString('ru-RU') : 'Первое сохранение — в течение минуты.'}</p><div class="row-btns"><button class="btn" id="cloudnow">☁️ Сохранить сейчас</button><button class="btn" id="vibtest">📳 Проверить вибрацию</button></div><p class="small">Вибрация: на Android — в Chrome; на iPhone — только с iOS 18 и одиночным откликом; на iPad вибромотора нет.</p></div>
    <div class="card"><h3>Резервная копия</h3><p class="small">Прогресс хранится в браузере этого устройства и не пропадает при обновлениях тренажёра. На всякий случай можно сохранить его в файл — и восстановить на этом или другом устройстве.</p><div class="row-btns"><button class="btn" id="exp">💾 Сохранить в файл</button><label class="btn">📂 Восстановить<input type="file" id="imp" accept="application/json" hidden></label></div></div>
    <button class="btn danger" id="reset">Сбросить весь прогресс</button></div>`;
  $('#chatOn').addEventListener('change', e => { S.chatOn = e.target.checked; save(); });
  $('#cloudnow').addEventListener('click', () => { cloudDirty = true; cloudPush(); toast('☁️ Сохраняем на сервер…'); });
  $('#vibtest').addEventListener('click', () => { M.haptic([60, 80, 60]); toast(S.vibro === false ? 'Вибрация выключена на главном экране (📴)' : 'Бз-з! Если телефон не дрогнул — он не поддерживает вибрацию в браузере.'); });
  $('#exp').addEventListener('click', exportProgress); $('#imp').addEventListener('change', e => e.target.files[0] && importProgress(e.target.files[0]));
  $('#reset').addEventListener('click', () => {
    const m = modal(`<h2>Сбросить прогресс?</h2><p>Удалятся имя, конфеты, звания, награды и статистика. Это нельзя отменить.</p><div class="row-btns"><button class="btn danger" id="yes">Да, сбросить</button><button class="btn" data-close>Отмена</button></div>`);
    $('#yes', m.el).addEventListener('click', () => { S = fresh(); save(); m.close(); go('hello'); });
  });
};

/* ================= обновления и резервная копия ================= */
const APP_VERSION = '16';
const NEWS = ['📱 Всё удобно и на телефоне', '😾 Подозреваемые сердятся и обижаются, если допрашивать их слишком часто', '🔊 У ответов котика есть кнопка «повторить голосом»', '☁️ Прогресс сохраняется в облаке — его можно восстановить по коду на любом устройстве', '🎖️ 16 званий — расти стало интереснее', '🏠 Вещи падают на пол, а котик ложится точно в кроватку и залезает в ванну', '💎 Кристаллы сыщика за сложные задачи — на них особые вещи!', '🎨 Новая игра: математическая раскраска', '🚀 Котик предлагает повысить уровень, когда уже всё получается', '🎨 Всё перерисовано в милом аниме-стиле: места происшествий, комнаты домика и все вещи!', '🎲 Детективные игры: волшебные весы, допрос свидетелей, сейф, прикидка, мемори, погоня, логика и закономерности!', '😺 Подозреваемые стали милыми аниме-персонажами — и обижаются, если их допрашивать слишком часто', '🗣️ Котик отвечает голосом быстрее', '📦 За уравнения — двойные конфеты, а новые комнаты и волшебные вещи открываются за уравнения!', '🎵 Музыка теперь играет по кругу', '🎙️ Студия звуков: запиши мяуканье, смех и другие звуки — персонажи будут говорить твоим голосом!', '🕵️ Подозреваемые ожили: у каждого свой голос и характер — их можно допрашивать!', '📸 Фото с места происшествия и свидетели в каждом деле', '💬 С котиком можно поболтать — голосом или текстом!', '🛁 Котик по-настоящему пользуется вещами: спит в кроватке, купается, играет', '👆 Вещи ставятся туда, куда нажмёшь, и перетаскиваются пальцем', '🏠 Новый большой домик: расставляй вещи пальцем, 8 комнат', '🐟 Ухаживай за котиком: корми, пои, играй, укладывай спать и купай', '🛍️ 65 вещей для домика: питомцы, волшебство, космос, карусель!', '🗣️ Котик говорит мультяшным голосом и зовёт тебя по имени', '🎁 Подарок за вход каждый день и сундуки за задание дня', '🏠 Домик котика: 7 комнат открываются за решённые задачи', '🛋️ Мебель и новые наряды в Кондитерской', '📖 Задачи-истории и примеры без повторов', '🎵 Музыка на выбор — теперь есть мистическая и таинственная'];
function checkNews() {
  if (S.seenVersion === APP_VERSION) return;
  const first = !S.seenVersion && !S.cases && !solvedTotal(); S.seenVersion = APP_VERSION; save(); if (first) return;
  modal(`<div class="big-emoji">🎉</div><h2>Обновление!</h2><p>Вот что появилось:</p><ul class="howto">${NEWS.slice(0, 6).map(x => `<li>${x}</li>`).join('')}</ul><button class="btn pink" data-close>Ура, мяу!</button>`);
  speakT(PH.news[0]);
}
setInterval(() => { if (document.hidden) return; fetch('version.json?t=' + Date.now()).then(r => r.json()).then(v => { if (v.v && v.v !== APP_VERSION && !$('.upd')) { const t = document.createElement('button'); t.className = 'upd'; t.textContent = '✨ Есть обновление — нажми!'; t.onclick = () => location.reload(); document.body.appendChild(t); } }).catch(() => { }); }, 5 * 60 * 1000);
function exportProgress() { const b = new Blob([JSON.stringify(S)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `murlok-progress-${today()}.json`; a.click(); }
function importProgress(file) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); if (d.v !== 1) throw 0; localStorage.setItem(KEY, JSON.stringify(d)); location.reload(); } catch (e) { toast('Не получилось прочитать файл'); } }; fr.readAsText(file); }

/* ================= старт ================= */
window.addEventListener('DOMContentLoaded', () => go(S.name && S.kid ? 'home' : 'hello'));
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(r => r.update()).catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtrl && !window.__reloaded) { window.__reloaded = true; location.reload(); } }); // новая версия — сразу перезагружаемся
}
// проверка обновления сразу при запуске и потом каждые 5 минут
setTimeout(() => fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(r => r.json()).then(v => { if (v.v && v.v !== APP_VERSION && !sessionStorage.getItem('upd' + v.v)) { sessionStorage.setItem('upd' + v.v, 1); location.reload(); } }).catch(() => { }), 2500);
