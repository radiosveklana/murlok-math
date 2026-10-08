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
    err: {}, facts: {}, badges: [], days: {}, sound: true, vibro: true, kid: '', lessons: { mul: false, eq: false }, prefs: { mulLv: 2, eqLv: 2, diff: 1, topic: 'mix' } };
}
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && s.v === 1) { const f = fresh(); return { ...f, ...s, st: { ...f.st, ...s.st }, wear: { ...f.wear, ...s.wear }, prefs: { ...f.prefs, ...s.prefs }, lessons: { ...f.lessons, ...s.lessons } }; }
  } catch (e) { }
  return fresh();
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }

const dkey = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const today = () => dkey(new Date());
function markDay(n = 1) { const t = today(); S.days[t] = (S.days[t] || 0) + n; }
function streak() { let n = 0; const d = new Date(); if (!S.days[dkey(d)]) d.setDate(d.getDate() - 1); while (S.days[dkey(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }
function noteErr(type, fact) { S.err[type] = (S.err[type] || 0) + 1; if (fact) S.facts[fact] = (S.facts[fact] || 0) + 1; save(); }
const factKey = (p, q) => Math.min(p, q) + '×' + Math.max(p, q);

/* ================= Звания, награды ================= */
const RANKS = [[0, 'Котёнок-стажёр'], [60, 'Младший сыщик'], [180, 'Сыщик'], [360, 'Инспектор'], [600, 'Старший инспектор'], [900, 'Главный детектив'], [1300, 'Легенда сыска']];
function rank(xp = S.xp) { let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; }); const next = RANKS[i + 1]; return { i, name: RANKS[i][1], next, prog: next ? (xp - RANKS[i][0]) / (next[0] - RANKS[i][0]) : 1 }; }
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
    if (!S.badges.includes(b.id) && b.t(S)) { S.badges.push(b.id); save(); setTimeout(() => { toast(`<span class="tb">${b.icon}</span><div><b>Новая награда!</b><br>${b.name}</div>`); SND.win(); }, 700); }
  });
}
function award(c, xp) {
  const before = rank().i;
  S.candies += c; S.totalCandies += c; S.xp += xp; save(); updCandy();
  if (c > 0) { floatText(`+${c} 🍬`); SND.coin(); }
  const r = rank(); if (r.i > before) setTimeout(() => { toast(`<span class="tb">🎖️</span><div><b>Новое звание!</b><br>${r.name}</div>`); confetti(30); M.meow({ shape: 'long', dur: 1.1, force: true }); later(() => SND.purr(2.5), 1200); }, 1200);
  checkBadges();
}
function taskDone(kind, res) { S.st[kind].done++; if (!res.mistakes && !res.helped) S.st[kind].perfect++; markDay(1); save(); }

/* ================= Звуки и эффекты ================= */
const M = window.Meow;
M.setEnabled(() => S.sound); M.setVibro(() => S.vibro !== false);
const tone = seq => M.tone(seq), later = (f, ms) => setTimeout(f, ms);
const SND = {
  ok: () => { cheer(true); tone([[660, 0.12], [880, 0.2, 0.09]]); if (Math.random() < 0.3) later(() => M.chirp(), 260); catMood('happy', 900); M.haptic(15); },
  bad: () => { cheer(false); tone([[200, 0.22, 0, 'triangle', 0.14]]); later(() => M.meow({ shape: 'question', vol: 0.32, pitch: 1.2, dur: 0.45 }), 120); catMood('sad', 1300); M.haptic([40, 60, 40]); },
  tap: () => { tone([[560, 0.05, 0, 'sine', 0.06]]); M.haptic(8); },
  coin: () => { tone([[988, 0.09], [1319, 0.25, 0.07]]); flyCandy(); },
  win: () => { tone([[523, 0.14], [659, 0.14, 0.11], [784, 0.14, 0.22], [1047, 0.45, 0.33]]); later(() => M.meow({ shape: 'happy', force: true }), 650); later(() => M.purr(1.8), 1350); catMood('happy', 2400); later(() => hearts(), 600); M.haptic([20, 40, 20, 40, 80]); },
  meow: () => { pick([() => M.meow(), () => M.meow({ shape: 'happy' }), M.kitten, () => M.trill()])(); catMood('happy', 900); M.haptic(20); },
  purr: d => { M.purr(d); catMood('purr', d * 1000); M.haptic([30, 50, 30, 50, 30]); },
  hiss: () => { M.hiss(); M.haptic([80, 40, 120]); },
  trill: () => { M.trill(); catMood('happy', 900); },
  crunch: () => { M.crunch(); later(() => M.purr(1.6), 1000); M.haptic([15, 120, 15, 120, 15]); },
};
/* реакции кота: подменяем мордочку у всех видимых котов на экране */
let moodTimer = null;
function catMood(mood, ms = 1200) {
  const boxes = $$('.mini-cat, .hero-cat, .win-cat-in, .shop-cat, .m-cat' + (mascot.hidden ? '' : ', .ms-cat'));
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

/* ================= Маскот: котик-напарник на каждом экране ================= */
const PH = {
  cheerOk: ['Молодец, {n}! 😻', 'Мур-р, отлично, {n}!', 'Так держать, {n}!', 'Вот это лапки! 🐾', '{n}, ты настоящий детектив!', 'Ух ты, без ошибок!', 'Мяу-класс, {n}!', 'Я горжусь тобой, {n}!', 'Супер! 😻'],
  cheerBad: ['Ничего, {n}, разберёмся вместе!', 'Ошибка — тоже улика 🔍', 'Спокойно, {n}, ещё разок!', 'Я рядом, мур!', 'Даже Шерлок ошибался!', 'Почти получилось, {n}!', '{n}, я в тебя верю!'],
  idle: ['{n}, ты отлично справляешься!', 'Мур-р, {n}, я в тебя верю!', 'Мне так нравится расследовать вместе с тобой, {n}!', 'Ошибаться не страшно — так учатся даже великие сыщики!', 'Помнишь? В столбике пишем справа налево!', 'Не забывай про запомненные числа ✨', 'Последнее действие — главная улика!', 'Каждая задача — шаг к новому званию ⭐', 'Устал(а)? Потянись, как котик 🐈', 'Мы отличная команда!', 'Мяу! А пончики сегодня будут? 🍩', 'Проверка — лучший друг сыщика!'],
  newcase: ['Выбирай дело — я уже навострил уши! 👂', 'Чую запах пропавших сладостей… 🍰', 'Возьмём дело посложнее? Я верю в тебя!'],
  caseintro: ['Посмотри внимательно на подозреваемых 👀', 'Запомни их шляпы и шарфы — пригодится!', 'Кто-то из них точно любит сладкое…'],
  accuse: ['Сравни каждого с уликами — по одной!', 'Вор подходит под ВСЕ улики. Не торопись!', 'Мур-р… я чую, разгадка близко!'],
  school: ['Учиться — это тоже приключение!', 'Сначала урок, потом решаем вместе 🐾', 'Знания — главное оружие сыщика!'],
  lesson: ['Не спеши, читай внимательно 📖', 'Нажимай «Следующий шаг» — я всё покажу!', 'Если непонятно — листай назад, это нормально!'],
  blitz: ['Лапки на старт! ⚡', 'Таблица умножения — это суперсила!', 'Ошибёшься — не беда, такие примеры вернутся для тренировки.'],
  shop: ['Мур! Мне так идёт… 😺', 'Может, корону? Я ведь главный детектив!', 'Конфеты заработаны честно — выбирай!'],
  book: ['Здесь все секреты сыщика 🤫', 'Загляни в правила, если что-то забылось.', 'Смотри, сколько наград уже собрано!'],
  win: ['Ура, {n}! Мы раскрыли дело! 🎉', 'Мур-р-р, {n}, я так счастлив!', '{n}, ты лучший сыщик Сладкограда!'],
};
function homeGreet() {
  const h = new Date().getHours(), t = S.days[today()] || 0, st = streak();
  const hi = h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
  return pick([`${hi}, ${S.kid}! Мур-р 😺`, `${S.kid}, я так по тебе соскучился! 🐾`, st >= 2 ? `Уже ${st} ${plural(st, 'день', 'дня', 'дней')} подряд! Ты молодец! 🔥` : 'Погладь меня — я замурлычу! 🐾', t >= 5 ? 'Задание дня выполнено! Я горжусь тобой!' : `Решим ещё ${5 - t} ${plural(5 - t, 'задачу', 'задачи', 'задач')} для задания дня?`, (!S.lessons.mul || !S.lessons.eq) ? 'Начнём со Школы сыщика? Я всё объясню!' : 'Возьмём новое дело? Сладкоград ждёт! 🍬']);
}
const NO_FLOAT = ['home', 'hello', 'casetask', 'practice', 'bugs', 'parents', 'lesson', 'blitz'];
let curScreen = '', okRun = 0, lastCheer = 0;
const mascot = document.createElement('div'); mascot.id = 'mascot'; mascot.hidden = true;
mascot.innerHTML = '<div class="ms-bubble" hidden></div><button class="ms-cat" aria-label="Котик-напарник"></button>';
document.body.appendChild(mascot);
const msCat = mascot.querySelector('.ms-cat'), msBub = mascot.querySelector('.ms-bubble');
function bubbleOn(el, text, ms = 3800) { el.textContent = text; el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); clearTimeout(el._t); if (el === msBub) mascot.classList.add('talk'); el._t = setTimeout(() => { el.hidden = true; if (el === msBub) mascot.classList.remove('talk'); }, ms); }
/* сказать фразу тем котом, который сейчас на экране */
function say(text, ms) {
  text = String(text).replace(/\{n\}/g, S.kid || 'сыщик');
  const hs = $('#heroSay'); if (hs) return bubbleOn(hs, text, ms);
  if (!mascot.hidden) return bubbleOn(msBub, text, ms);
  const hp = $('.helper') || $('.slide-head'); if (hp) { $$('.cheer', hp).forEach(x => x.remove()); const c = document.createElement('div'); c.className = 'cheer'; c.textContent = text; hp.appendChild(c); setTimeout(() => c.remove(), 2200); }
}
function cheer(ok) {
  const now = Date.now();
  if (ok) { okRun++; if (okRun % 3 === 0 && now - lastCheer > 4000) { lastCheer = now; say(pick(PH.cheerOk)); } }
  else { okRun = 0; if (now - lastCheer > 5000 && Math.random() < 0.6) { lastCheer = now; say(pick(PH.cheerBad)); } }
}
function mascotScene(name) {
  curScreen = name; okRun = 0;
  mascot.hidden = NO_FLOAT.includes(name);
  document.body.classList.toggle('has-mascot', !mascot.hidden);
  msBub.hidden = true;
  if (!mascot.hidden || name === 'lesson' || name === 'blitz') { if (!mascot.hidden) msCat.innerHTML = myCat({ cls: 'mini' }); const key = PH[name] ? name : 'idle'; setTimeout(() => say(pick(PH[key])), 600); }
  if (name === 'home') setTimeout(() => say(homeGreet(), 4500), 700);
}
// погладить маскота: касание — мурлыканье и фраза, удержание — мурлычет, пока держишь
let msHold = null, msPurr = false;
msCat.addEventListener('pointerdown', e => { e.preventDefault(); M.ctx(); mascot.classList.add('talk'); msHold = setTimeout(() => { msPurr = true; M.purrStart(); msCat.classList.add('m-purr'); msCat.innerHTML = myCat({ happy: true, cls: 'mini' }); say('Мур-мур-мур… 😻'); hearts(msCat, 3); M.haptic([25, 60, 25, 60, 25]); }, 380); });
const msStop = () => { clearTimeout(msHold); if (msPurr) { msPurr = false; M.purrStop(); msCat.classList.remove('m-purr'); msCat.innerHTML = myCat({ cls: 'mini' }); } };
msCat.addEventListener('pointerup', () => { if (!msPurr) { clearTimeout(msHold); SND.purr(1.4); hearts(msCat, 3); say(pick(PH.idle)); } msStop(); });
['pointerleave', 'pointercancel'].forEach(ev => msCat.addEventListener(ev, msStop));
msCat.addEventListener('contextmenu', e => e.preventDefault());
// время от времени котик сам подбадривает
setInterval(() => {
  if (document.hidden || msPurr) return;
  if (!mascot.hidden) { say(pick(PH.idle)); if (Math.random() < 0.5) { M.purr(1.5); catMood('purr', 1500); } else M.trill(); }
  else if (['casetask', 'practice', 'bugs', 'lesson', 'blitz'].includes(curScreen) && Math.random() < 0.5) say(pick(PH.idle));
  else if (curScreen === 'home') say(homeGreet(), 4500);
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
function topbar(title, back = 'home') {
  return `<header class="top"><button class="back" data-go="${back}" aria-label="Назад">←</button><h1>${title}</h1><div class="pill candy">🍬 <b class="candyN">${S.candies}</b></div></header>`;
}
function updCandy() { $$('.candyN').forEach(e => { e.textContent = S.candies; }); }

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
    SND.win(); onDone && onDone({ mistakes, helped });
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
    SND.win(); onDone && onDone({ mistakes, helped });
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
    <div class="ctrl-col">${helperHTML('bb')}<div class="ask"><div class="ask-txt">Нажми на строку, где Енот ошибся 👆</div><div class="ask-sub">Проверь каждое неполное произведение и сумму. Можно считать на листочке ✏️</div></div></div></div>`;
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
      bub.innerHTML = `<div class="fb">🔍 Нашли!</div>${ex}`; SND.win();
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
    <div class="ctrl-col">${helperHTML('bb')}<div class="ask"><div class="ask-txt">Нажми на первую неверную строку 👆</div><div class="ask-sub">Проверяй каждую строку по порядку: правило и вычисления.</div></div></div></div>`;
  const bub = $('#bb', el); bub.innerHTML = `Енот решил уравнение и получил ответ <b>x = ${g.lines[g.lines.length - 1].v}</b>. Но где-то закралась ошибка! Найди строку, где она <b>появилась впервые</b>.`;
  let mistakes = 0, done = false;
  $$('.pickrow', el).forEach(r => r.addEventListener('click', () => {
    if (done || r.classList.contains('okrow')) return; const i = +r.dataset.i;
    if (i === g.bad) {
      done = true; SND.ok(); r.classList.add('badrow'); const l = g.lines[i], s = l.step;
      let ex;
      if (g.type === 'rule') ex = `Здесь ${E.eqText(s.E)} — это <b>${E.ROLES[s.role].gen}</b>.<div class="rule">📏 ${E.ROLES[s.role].rule}</div>Правильно: ${E.eqText(s.E)} = ${E.ROLES[s.role].f(s.c, s.b).map(x => SYM[x] || x).join(' ')}`;
      else ex = `Ошибка в вычислении: ${l.f[0]} ${SYM[l.f[1]]} ${l.f[2]} = <b>${E.calc(...l.f)}</b>, а не ${l.v}.`;
      bub.innerHTML = `<div class="fb">🔍 Попался!</div>${ex}<br>Правильный ответ: <b>x = ${g.eq.x}</b>.`; SND.win();
      onDone && onDone({ mistakes, helped: false });
      return;
    }
    mistakes++; SND.bad(); noteErr('bugmiss');
    if (i > g.bad) { r.classList.add('warnrow'); setTimeout(() => r.classList.remove('warnrow'), 900); bub.innerHTML = `<div class="fb bad">Тепло!</div>Эта строка неверная, но ошибка началась <b>раньше</b>. Поднимись выше!`; }
    else { r.classList.add('okrow'); bub.innerHTML = `<div class="fb bad">Здесь всё верно ✔</div>Проверь следующую строку.`; }
  }));
}

/* ================= Подбор задачи ================= */
function makeTask(kind, level) {
  if (kind === 'mul') { const [a, b] = E.genMul(level); return { kind, level, a, b }; }
  if (kind === 'eq') return { kind, level, eq: E.genEq(level) };
  return { kind, level };
}
function mountTask(el, t, guided, onDone) {
  if (t.kind === 'mul') mountMul(el, { a: t.a, b: t.b, guided, onDone });
  else if (t.kind === 'eq') mountEq(el, { eq: t.eq, guided, onDone });
  else if (t.kind === 'bugmul') mountBugMul(el, { level: t.level, onDone });
  else mountBugEq(el, { level: t.level, onDone });
}
const statKind = k => k.startsWith('bug') ? 'bug' : k;

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
    <button class="btn big pink" id="start">Начать расследования →</button></div>`;
  $$('.fur').forEach(b => b.addEventListener('click', () => { fur = b.dataset.f; $$('.fur').forEach(x => x.classList.toggle('on', x === b)); $('#hcat').innerHTML = catSVG({ fur, wear: S.wear }); SND.meow(); }));
  $('#start').addEventListener('click', () => {
    const kid = $('#kid').value.trim();
    if (!kid) { SND.bad(); shake($('#kid')); $('#kid').focus(); $('#kid').placeholder = 'Напиши своё имя 🙂'; return; }
    const nm = $('#nm').value.trim() || 'Мурлок';
    S.kid = kid[0].toUpperCase() + kid.slice(1); S.name = nm; S.fur = fur; save(); SND.win(); go('home');
    setTimeout(() => { modal(`<div class="m-cat">${myCat({ happy: true })}</div><h2>Приятно познакомиться, ${esc(S.kid)}! Я — ${esc(nm)} 😺</h2><p>Теперь мы напарники по расследованиям!</p><p>Вот как устроено наше агентство:</p><ul class="howto"><li>🎓 <b>Школа сыщика</b> — разберёмся, как умножать столбиком и решать составные уравнения. Начни отсюда!</li><li>🔍 <b>Дела</b> — решай задачи, получай улики и вычисляй вора сладостей.</li><li>🍬 За задачи дают <b>конфеты</b> — на них можно купить котику наряды.</li><li>⭐ Чем больше дел раскрыто — тем выше <b>звание</b>.</li></ul><button class="btn pink" data-close>Понятно, мяу!</button>`); }, 300);
  });
};

/* ================= ЭКРАН: главная ================= */
SCREENS.home = () => {
  if (!S.name || !S.kid) return go('hello');
  const r = rank(), st = streak(), todayN = S.days[today()] || 0, goal = 5;
  const learnFirst = !S.lessons.mul || !S.lessons.eq;
  app.innerHTML = `
  <header class="home-top"><div class="pill" title="Дней подряд">🔥 ${st} ${plural(st, 'день', 'дня', 'дней')}</div><div class="pill candy">🍬 <b class="candyN">${S.candies}</b></div><button class="pill icon" id="vib" aria-label="Вибрация">${S.vibro !== false ? '📳' : '📴'}</button><button class="pill icon" id="snd" aria-label="Звук">${S.sound ? '🔊' : '🔇'}</button></header>
  <section class="hero">
    <button class="hero-cat" id="pet" aria-label="Погладить котика">${myCat()}</button>
    <div class="hero-info">
      <div class="hero-say" id="heroSay" hidden></div>
      <div class="hero-name">Детектив ${esc(S.kid)}</div>
      <div class="small">Напарник — кот ${esc(S.name)} 🐾</div>
      <div class="rank">🎖️ ${r.name}</div>
      <div class="bar"><i style="width:${Math.round(r.prog * 100)}%"></i></div>
      <div class="small">${r.next ? `До звания «${r.next[1]}» — ещё ${r.next[0] - S.xp} ⭐` : 'Высшее звание агентства!'}</div>
      <div class="daily"><div><b>Задание дня:</b> реши ${goal} задач ${todayN >= goal ? '✅' : ''}</div><div class="bar mint"><i style="width:${Math.min(1, todayN / goal) * 100}%"></i></div><div class="small">${Math.min(todayN, goal)} из ${goal}</div></div>
    </div>
  </section>
  ${CASE ? `<button class="resume" data-go="${CASE.idx < 4 ? 'casetask' : 'accuse'}">📁 Продолжить дело №${CASE.c.n} «${CASE.c.crime.title}» — улик: ${CASE.idx} из 4 →</button>` : ''}
  <section class="tiles">
    <button class="tile t-school ${learnFirst ? 'glow' : ''}" data-go="school"><span class="ti">🎓</span><b>Школа сыщика</b><small>${learnFirst ? 'Начни отсюда!' : 'Как умножать и решать уравнения'}</small></button>
    <button class="tile t-case" data-go="newcase"><span class="ti">🔍</span><b>Новое дело</b><small>Найди вора сладостей</small></button>
    <button class="tile t-blitz" data-go="blitz"><span class="ti">⚡</span><b>Быстрые лапки</b><small>Таблица умножения на скорость</small></button>
    <button class="tile t-bug" data-go="bugs"><span class="ti">🦝</span><b>Ошибки Енота</b><small>Найди, где он ошибся</small></button>
    <button class="tile t-shop" data-go="shop"><span class="ti">🧁</span><b>Кондитерская</b><small>Наряды для котика</small></button>
    <button class="tile t-book" data-go="book"><span class="ti">📒</span><b>Блокнот детектива</b><small>Правила, награды, дела</small></button>
  </section>
  <footer class="foot"><button class="link" data-go="parents">Для взрослых</button></footer>`;
  $('#snd').addEventListener('click', e => { S.sound = !S.sound; save(); e.currentTarget.textContent = S.sound ? '🔊' : '🔇'; SND.tap(); });
  const phrases = ['Мяу! Готов(а) к новому делу?', 'Мур-р… Я чую запах пончиков!', 'Сыщик всегда проверяет ответ!', 'Справа налево — так пишут столбиком!', 'Последнее действие — главная улика!', 'Мяу! Давай раскроем ещё одно дело!'];
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
};

/* ================= ЭКРАН: выбор дела ================= */
SCREENS.newcase = () => {
  const p = S.prefs;
  app.innerHTML = `${topbar('Новое дело')}
  <div class="page">
    <div class="case-head"><div class="paper-note">📁 Дело №${S.cases + 1}</div><p>Выбери, какими уликами будешь пользоваться в расследовании:</p></div>
    <div class="choice-grid topic">
      <button class="choice" data-t="mul"><span>✖️</span><b>Умножение столбиком</b><small>4 примера</small></button>
      <button class="choice" data-t="eq"><span>📦</span><b>Составные уравнения</b><small>4 уравнения</small></button>
      <button class="choice" data-t="mix"><span>🍬</span><b>Всё вперемешку</b><small>столбик + уравнения + Енот</small></button>
    </div>
    <div class="lbl">Сложность</div>
    <div class="seg diff">${[[1, '🍪 Лёгкое'], [2, '🧁 Среднее'], [3, '🎂 Сложное']].map(([v, t]) => `<button data-d="${v}" class="${p.diff === v ? 'on' : ''}">${t}</button>`).join('')}</div>
    <p class="small center">Лёгкое: 2-значные числа и простые уравнения · Среднее: 3-значные · Сложное: 3-значные на 3-значные и уравнения в 3 действия</p>
    <button class="btn big pink" id="go">Взять дело →</button>
  </div>`;
  $$('.choice').forEach(b => { b.classList.toggle('on', b.dataset.t === p.topic); b.addEventListener('click', () => { p.topic = b.dataset.t; $$('.choice').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); }); });
  $$('.diff button').forEach(b => b.addEventListener('click', () => { p.diff = +b.dataset.d; $$('.diff button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); }));
  $('#go').addEventListener('click', () => { save(); startCase(p.topic, p.diff); });
};
let CASE = null;
function startCase(topic, diff) {
  const mulLv = { 1: [2, 2, 3, 3], 2: [3, 3, 3, 4], 3: [4, 4, 4, 4] }[diff];
  const eqLv = { 1: [2, 2, 2, 2], 2: [2, 3, 3, 3], 3: [3, 4, 3, 4] }[diff];
  if (diff === 1) mulLv[0] = 1;
  const kinds = topic === 'mul' ? ['mul', 'mul', 'mul', 'mul'] : topic === 'eq' ? ['eq', 'eq', 'eq', 'eq'] : shuffle(['mul', 'eq', pick(['bugmul', 'bugeq'])]).concat([pick(['mul', 'eq'])]);
  const tasks = kinds.map((k, i) => makeTask(k, k === 'mul' ? mulLv[i] : k === 'eq' ? eqLv[i] : k === 'bugeq' ? diff + 1 : (diff >= 2 ? 2 : 1)));
  CASE = { c: E.genCase(S.cases + 1), tasks, idx: 0, mistakes: 0, crossed: new Set(), earned: 0, xp: 0, topic, diff, accuseTries: 0 };
  go('caseintro');
}
function suspectCard(s, i, found) {
  const A = E.ATTRS;
  return `<button class="sus ${CASE.crossed.has(i) ? 'crossed' : ''}" data-i="${i}"><span class="sa">${s.animal[0]}</span><span class="sn">${s.animal[1]}</span>
    <span class="attrs"><span title="шляпа">${A.hat.vals[s.hat].e}</span><span class="scarf" title="шарф" style="background:${A.scarf.vals[s.scarf].c}"></span><span title="любит">${A.sweet.vals[s.sweet].e}</span><span title="с собой">${A.item.vals[s.item].e}</span></span></button>`;
}
function suspectsHTML(found) { return `<div class="sus-grid">${CASE.c.suspects.map((s, i) => suspectCard(s, i, found)).join('')}</div><div class="sus-legend">🎩 шляпа · <i class="scarf mini"></i> шарф · 🍩 любимая сладость · 🎒 что с собой</div>`; }
function bindSuspects(root, found, onChange) {
  $$('.sus', root).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i, s = CASE.c.suspects[i];
    if (CASE.crossed.has(i)) { CASE.crossed.delete(i); b.classList.remove('crossed'); SND.tap(); onChange && onChange(); return; }
    if (E.alibi(CASE.c, s, found) < 0) { SND.bad(); shake(b); floatText('Подходит под все улики! 🤔'); return; }
    CASE.crossed.add(i); b.classList.add('crossed'); SND.tap(); onChange && onChange();
  }));
}
SCREENS.caseintro = () => {
  if (!CASE) return go('newcase');
  const c = CASE.c;
  app.innerHTML = `${topbar('Дело №' + c.n, 'newcase')}
  <div class="page">
    <div class="dossier"><div class="stamp">СЕКРЕТНО</div><h2>«${c.crime.title}»</h2>
      <p>Сегодня утром в <b>${c.crime.place}</b> кто-то украл <b>${c.crime.what}</b>! На месте преступления видели пятерых подозреваемых.</p>
      <p>Реши <b>4 задачи</b> — за каждую получишь улику. По уликам вычисли вора! 🔍</p></div>
    <h3>Подозреваемые</h3>${suspectsHTML(0)}
    <button class="btn big pink" id="go">Начать расследование →</button>
  </div>`;
  $('#go').addEventListener('click', () => go('casetask'));
};
function clueBar() { return `<div class="clues">${[0, 1, 2, 3].map(k => `<span class="clue-dot ${k < CASE.idx ? 'got' : k === CASE.idx ? 'now' : ''}">${k < CASE.idx ? '🔎' : '🔒'}</span>`).join('')}</div>`; }
SCREENS.casetask = () => {
  if (!CASE) return go('newcase');
  const t = CASE.tasks[CASE.idx];
  const title = { mul: 'Умножь столбиком', eq: 'Реши уравнение', bugmul: 'Найди ошибку Енота', bugeq: 'Найди ошибку Енота' }[t.kind];
  app.innerHTML = `${topbar('Дело №' + CASE.c.n, 'home')}
  <div class="page task-page"><div class="task-head"><div><b>Улика ${CASE.idx + 1} из 4</b> · ${title}</div>${clueBar()}<button class="btn ghost sm" id="sus">👥 Подозреваемые</button></div>
  <div id="task"></div><div id="after" class="after"></div></div>`;
  $('#sus').addEventListener('click', showSuspects);
  mountTask($('#task'), t, false, res => {
    CASE.mistakes += res.mistakes;
    const perfect = !res.mistakes && !res.helped, c = perfect ? 3 : 1, xp = perfect ? 15 : 10;
    taskDone(statKind(t.kind), res); CASE.earned += c; CASE.xp += xp; award(c, xp);
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
  const m = modal(`<div class="clue-big"><div class="clue-ic">🔎</div><h2>Улика №${k + 1}</h2><p class="clue-txt">${clue.text}</p></div>
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
    ${suspectsHTML(4)}<button class="btn big pink" id="arrest" disabled>Выбери подозреваемого</button></div>`;
  $$('.sus', app).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i; if (CASE.crossed.has(i)) { CASE.crossed.delete(i); b.classList.remove('crossed'); }
    sel = i; $$('.sus', app).forEach(x => x.classList.toggle('sel', x === b)); SND.tap();
    const btn = $('#arrest'); btn.disabled = false; btn.textContent = `🚔 Арестовать: ${CASE.c.suspects[i].animal[1]}!`;
  }));
  $('#arrest').addEventListener('click', () => {
    if (sel < 0) return; const s = CASE.c.suspects[sel];
    if (s.culprit) return closeCase();
    CASE.accuseTries++; CASE.mistakes++; SND.hiss(); catMood('sad', 1500);
    const k = E.alibi(CASE.c, s, 4), a = CASE.c.order[k], A = E.ATTRS[a], v = A.vals[s[a]];
    const why = a === 'scarf' ? `у него ${v.n} шарф` : a === 'sweet' ? `${s.animal[1].split(' ')[1]} любит ${v.w}` : `${s.animal[1].split(' ')[1]} был ${v.w} ${v.e}`;
    CASE.crossed.add(sel); $(`.sus[data-i="${sel}"]`, app).classList.add('crossed'); $(`.sus[data-i="${sel}"]`, app).classList.remove('sel'); sel = -1;
    $('#arrest').disabled = true; $('#arrest').textContent = 'Выбери подозреваемого';
    modal(`<div class="big-emoji hissing">${s.animal[0]}💨</div><h2>«Пфф! Это не я!» — фыркает ${s.animal[1]}</h2><p><b>У подозреваемого алиби!</b></p><p>Не подходит под улику №${k + 1}: ${why}.</p><p>Посмотри на улики ещё раз!</p><button class="btn pink" data-close>Хорошо</button>`);
  });
};
function closeCase() {
  const perfect = CASE.mistakes === 0;
  const c = 8 + (perfect ? 5 : 0), xp = 25;
  S.cases++; if (perfect) S.casesPerfect++;
  const culprit = CASE.c.suspects.find(s => s.culprit);
  S.caseLog.unshift({ n: CASE.c.n, title: CASE.c.crime.title, who: culprit.animal.join(' '), date: today(), perfect });
  S.caseLog = S.caseLog.slice(0, 60);
  CASE.earned += c; award(c, xp + 0); save();
  confetti(50); SND.win(); later(() => M.purr(3), 3200); later(() => say(pick(PH.win)), 1500);
  app.innerHTML = `${topbar('Дело раскрыто!', 'home')}
  <div class="page center win-page">
    <div class="win-cat"><div class="win-cat-in">${myCat({ happy: true })}</div><div class="arrested">${culprit.animal[0]}<span>🚔</span></div></div>
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
    if (i === L.length - 1 && !S.lessons[topic]) { S.lessons[topic] = true; save(); award(5, 20); checkBadges(); }
  };
  $('#prev').addEventListener('click', () => { if (i > 0) { i--; SND.tap(); draw(); } });
  $('#next').addEventListener('click', () => { SND.tap(); if (i < L.length - 1) { i++; draw(); } else go('practice', topic); });
  draw();
};
const INTER = {
  mulA(el) {
    const st = [
      { txt: 'Начинаем <b>справа</b> — с единиц. <b>4 × 3 = 12</b>. Пишем <b>2</b>, а <b>1</b> запоминаем — пишем её маленькой сверху над следующей цифрой.', p: '2', carry: { 1: 1 }, hlA: [0] },
      { txt: 'Дальше: <b>2 × 3 = 6</b>, и прибавляем запомненную единицу: <b>6 + 1 = 7</b>. Пишем 7.', p: '72', carry: { 1: 1 }, hlA: [1] },
      { txt: 'И последняя: <b>3 × 3 = 9</b>. Пишем 9. Получилось <b>972</b> — это первое неполное произведение!', p: '972', carry: { 1: 1 }, hlA: [2] },
    ];
    let k = -1;
    const draw = () => {
      const s = st[k];
      el.innerHTML = `<div class="slide-row"><div class="story">${s ? s.txt : 'Умножаем 324 на <b>3</b> (единицы нижнего числа). Нажимай «Следующий шаг».'}<br><br><button class="btn mint" id="stp">${k < st.length - 1 ? 'Следующий шаг ▶' : 'Ещё раз ↺'}</button></div>${miniColumn(324, 23, { rows: s ? 1 : 0, partial: s ? [s.p] : [], carry: s ? s.carry : null, hlA: s ? s.hlA : [], hlB: [0] })}</div>`;
      $('#stp', el).addEventListener('click', () => { SND.tap(); k = k < st.length - 1 ? k + 1 : -1; draw(); });
    };
    draw();
  },
  box(el) {
    const st = [
      { f: '(x + 15) · 4 = 120', t: 'Вот хитрое уравнение. Здесь два действия. Что делать?' },
      { f: '(<span class="boxed">x + 15</span>) <b class="lastop">·</b> 4 = 120', t: 'Последнее действие — <b>умножение</b> (скобки считаются раньше). Спрячем <b>x + 15</b> в коробку!' },
      { f: '📦 · 4 = 120', t: 'Теперь всё просто: коробка — это <b>неизвестный множитель</b>. Чтобы его найти, произведение делим на известный множитель.' },
      { f: '📦 = 120 : 4 = 30', t: 'Коробка равна 30!' },
      { f: 'x + 15 = 30', t: 'Открываем коробку: внутри было <b>x + 15</b>. Получилось простое уравнение. x — <b>неизвестное слагаемое</b>.' },
      { f: 'x = 30 − 15 = 15', t: 'Из суммы вычитаем известное слагаемое. <b>x = 15</b>! 🎉' },
    ];
    let k = 0;
    const draw = () => {
      el.innerHTML = `<div class="box-demo">${st.slice(0, k + 1).map((s, q) => `<div class="formula ${q === k ? 'now' : 'old'}">${s.f}</div>`).join('')}</div><div class="story">${st[k].t}</div><button class="btn mint" id="stp">${k < st.length - 1 ? 'Следующий шаг ▶' : 'Ещё раз ↺'}</button>`;
      $('#stp', el).addEventListener('click', () => { SND.tap(); k = k < st.length - 1 ? k + 1 : 0; draw(); });
    };
    draw();
  },
};

/* ================= ЭКРАН: Решаем вместе (практика) ================= */
SCREENS.practice = (topic = 'mul') => {
  const isMul = topic === 'mul', levels = isMul ? E.MUL_LEVELS : E.EQ_LEVELS, key = isMul ? 'mulLv' : 'eqLv';
  let guided = true, count = 0;
  app.innerHTML = `${topbar(isMul ? 'Столбик: тренировка' : 'Уравнения: тренировка', 'school')}
  <div class="page task-page"><div class="task-head wrap">
    <div class="seg lv">${Object.entries(levels).map(([v, l]) => `<button data-v="${v}" class="${+v === S.prefs[key] ? 'on' : ''}">${l.name}</button>`).join('')}</div>
    <div class="seg mode"><button data-m="1" class="on">🐾 С подсказками</button><button data-m="0">💪 Сам(а)</button></div></div>
    <div id="task"></div><div id="after" class="after"></div></div>`;
  const load = () => {
    $('#after').innerHTML = '';
    const t = makeTask(topic, S.prefs[key]);
    mountTask($('#task'), t, guided, res => {
      count++; taskDone(topic, res);
      const c = (!res.mistakes && !res.helped) ? 2 : 1; award(c, guided ? 6 : 10);
      $('#after').innerHTML = `<button class="btn big pink" id="more">Ещё пример →</button>`;
      $('#more').addEventListener('click', () => { SND.tap(); load(); });
    });
  };
  $$('.lv button').forEach(b => b.addEventListener('click', () => { S.prefs[key] = +b.dataset.v; save(); $$('.lv button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); load(); }));
  $$('.mode button').forEach(b => b.addEventListener('click', () => { guided = b.dataset.m === '1'; $$('.mode button').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); load(); }));
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
    $('#bzi').innerHTML = pick(PH.blitz);
    $('#go').addEventListener('click', run);
  };
  const facts = []; for (let p = 2; p <= 9; p++) for (let q = 2; q <= 9; q++) facts.push([p, q]);
  const pickFact = last => { const w = facts.map(([p, q]) => 1 + 4 * (S.facts[factKey(p, q)] || 0) + (p * q > 20 ? 1 : 0)); let tot = w.reduce((x, y) => x + y, 0), f; do { let r = Math.random() * tot; f = facts.find((_, i) => (r -= w[i]) < 0) || facts[0]; } while (last && f[0] === last[0] && f[1] === last[1]); return f; };
  const run = () => {
    let score = 0, f = pickFact(), buf = '', left = 60, lock = false; const misses = [];
    box.innerHTML = `${helperHTML('bzb')}<div class="timer"><i id="tb"></i></div><div class="bz-score">✔ <b id="sc">0</b></div><div class="bz-q" id="q"></div>${numpad(false)}`;
    $('#bzb').innerHTML = `Быстрее, лапки, ${esc(S.kid)}! ⚡`;
    const q = $('#q'), draw = () => { q.innerHTML = `${f[0]} × ${f[1]} = <span class="inp">${buf || '?'}</span>`; };
    draw();
    const t0 = Date.now();
    const iv = setInterval(() => { left = 60 - (Date.now() - t0) / 1000; $('#tb').style.width = Math.max(0, left / 60 * 100) + '%'; if (left <= 0) { clearInterval(iv); end(); } }, 100);
    cleanups.push(() => clearInterval(iv));
    bindPad(box, {
      digit: d => {
        if (lock) return; buf += d; draw(); const ans = String(f[0] * f[1]);
        if (buf.length >= ans.length) {
          if (buf === ans) { score++; $('#sc').textContent = score; SND.tap(); q.classList.add('ok'); setTimeout(() => q.classList.remove('ok'), 150); f = pickFact(f); buf = ''; draw(); }
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
  app.innerHTML = `${topbar('Кондитерская')}<div class="page shop"><div class="shop-cat" id="sc">${myCat()}</div><div class="shop-items" id="si"></div></div>`;
  const draw = () => {
    $('#sc').innerHTML = myCat();
    $('#si').innerHTML = Object.entries(SLOTS).map(([slot, nm]) => `<h3>${nm}</h3><div class="items">${ITEMS.filter(it => it.slot === slot).map(it => { const own = S.owned.includes(it.id), on = S.wear[slot] === it.id; return `<button class="item ${own ? 'own' : ''} ${on ? 'on' : ''}" data-id="${it.id}"><span class="ii">${it.icon}</span><span class="in">${it.name}</span><span class="ip">${on ? 'надето ✔' : own ? 'надеть' : it.price + ' 🍬'}</span></button>`; }).join('')}</div>`).join('')
      + `<h3>Окрас котика</h3><div class="furs">${Object.entries(FURS).map(([k, f]) => `<button class="fur ${k === S.fur ? 'on' : ''}" data-f="${k}"><i style="background:${f.sw}"></i>${f.name}</button>`).join('')}</div>`;
    $$('.item', app).forEach(b => b.addEventListener('click', () => clickItem(ITEMS.find(x => x.id === b.dataset.id))));
    $$('.fur', app).forEach(b => b.addEventListener('click', () => { S.fur = b.dataset.f; save(); SND.meow(); draw(); }));
  };
  const clickItem = it => {
    if (S.owned.includes(it.id)) { S.wear[it.slot] = S.wear[it.slot] === it.id ? null : it.id; save(); SND.tap(); draw(); return; }
    if (S.candies < it.price) { SND.bad(); toast(`<span class="tb">🍬</span><div>Не хватает конфет: нужно ещё <b>${it.price - S.candies}</b>.<br>Раскрой пару дел!</div>`); return; }
    const m = modal(`<div class="big-emoji">${it.icon}</div><h2>${it.name}</h2><p>Купить за <b>${it.price} 🍬</b>?</p><div class="row-btns"><button class="btn pink" id="buy">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`);
    $('#buy', m.el).addEventListener('click', () => { S.candies -= it.price; S.owned.push(it.id); S.wear[it.slot] = it.id; save(); updCandy(); m.close(); tone([[988, 0.09], [1319, 0.25, 0.07]]); confetti(20); draw(); later(() => { SND.crunch(); catMood('happy', 2600); hearts($('.shop-cat'), 5); }, 150); });
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
    if (tab === 'table') { let h = '<div class="ttable"><div class="tc hd">×</div>'; for (let q = 1; q <= 9; q++) h += `<div class="tc hd">${q}</div>`; for (let p = 1; p <= 9; p++) { h += `<div class="tc hd">${p}</div>`; for (let q = 1; q <= 9; q++) { const e = S.facts[factKey(p, q)] || 0; h += `<div class="tc ${e >= 3 ? 'e3' : e ? 'e1' : ''}">${p * q}</div>`; } } el.innerHTML = h + '</div><p class="small center">Розовым отмечены примеры, в которых были ошибки. Потренируй их в «Быстрых лапках»!</p>'; }
    if (tab === 'awards') el.innerHTML = `<div class="badges">${BADGES.map(b => { const got = S.badges.includes(b.id); return `<div class="badge ${got ? 'got' : ''}"><span>${got ? b.icon : '🔒'}</span><b>${b.name}</b><small>${b.desc}</small></div>`; }).join('')}</div>`;
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
    <div class="card small"><h3>Как устроен тренажёр</h3><p>«Школа сыщика» объясняет тему и ведёт по шагам: в столбике кот спрашивает каждое действие («3 × 4 + 1 = ?»), подсвечивает запомненное число и просит самостоятельно выбрать клетку для сдвига. В уравнениях — «метод коробки»: найти последнее действие → назвать компонент → выбрать правило → посчитать → повторить → проверка.</p><p>В «Делах» те же задачи решаются самостоятельно: каждая цифра проверяется сразу, на ошибке кот даёт подсказку, после третьей попытки показывает ответ. За решённые задачи даются улики, по которым нужно вычислить вора — это тренирует внимательность и логику.</p><p>Прогресс хранится только на этом устройстве, в браузере.</p></div>
    <button class="btn danger" id="reset">Сбросить весь прогресс</button></div>`;
  $('#reset').addEventListener('click', () => {
    const m = modal(`<h2>Сбросить прогресс?</h2><p>Удалятся имя, конфеты, звания, награды и статистика. Это нельзя отменить.</p><div class="row-btns"><button class="btn danger" id="yes">Да, сбросить</button><button class="btn" data-close>Отмена</button></div>`);
    $('#yes', m.el).addEventListener('click', () => { S = fresh(); save(); m.close(); go('hello'); });
  });
};

/* ================= старт ================= */
go(S.name && S.kid ? 'home' : 'hello');
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => { });
