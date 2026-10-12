/* modes.js (v29) — «по всем темам»:
   • 🦝 Ошибки Енота в любой теме Школы (18 тем программы + столбик, деление, сложение, уравнения) и Академии
     (любой предмет и раздел, «всё вперемешку»): Енот отвечает на вопрос тренажёра, сыщик ловит ошибку и исправляет;
   • 🔍 «Новое дело» — понятные 3 шага, улики из всей программы: Школа + Академия («допрос свидетелей»), выбор тем фишками;
   • ⚡ «Быстрые лапки» — сетка режимов с рекордами: таблица, деление, ×10/100/1000, в уме, двузначные, вперемешку, факты Академии;
   • 🎮 детективные игры: числа для «Погони», «Мемори» и «Сейфа» по выбору + две новые игры на вопросах Академии;
   • 🎲 разнообразие школьных задач: новые сюжеты и диапазоны, без повторов подряд.
   Подключается перед coach.js: только обёртки над готовыми экранами, новые темы контента подхватываются сами. */
'use strict';
const Modes = (() => {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const strip = h => String(h == null ? '' : h).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const nf = n => n >= 10000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n);
  const girl = () => /[аяь]$/i.test(S.kid || '');
  const sbj = id => (typeof subj === 'function' ? subj(id) : (window.SUBJECTS || {})[id]);
  const addNF = (...xs) => xs.forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));

  /* ---------- общие: вопросы тренажёров ---------- */
  const QT = ['one', 'tf', 'input', 'order', 'sort', 'case'];
  function okQ(q) {
    if (!q || !QT.includes(q.type)) return false;
    if (q.type === 'one') return Array.isArray(q.a) && q.a.length > 1 && q.a[q.c] != null;
    if (q.type === 'tf') return typeof q.c === 'boolean' || q.c === 0 || q.c === 1;
    if (q.type === 'input') return /^\d{1,7}$/.test(String(q.c));
    if (q.type === 'order') return Array.isArray(q.items) && q.items.length >= 3;
    if (q.type === 'sort') return Array.isArray(q.groups) && q.groups.length >= 2 && Array.isArray(q.items) && q.items.length >= 3;
    if (q.type === 'case') return Array.isArray(q.a) && q.a.some(o => o.ok === true) && q.a.some(o => o.ok !== true);
    return false;
  }
  /* задачи на счёт (isCalcQ, academy.js) — только в математике и школьных предметах; в Академии их не показываем нигде */
  const calcMemo = new WeakMap();
  function calcOkU(u) {
    if (typeof isCalcQ !== 'function' || typeof calcAllowed !== 'function') return true;
    if (!calcMemo.has(u)) { const s = Object.values(window.SUBJECTS || {}).find(x => Array.isArray(x.units) && x.units.includes(u)); calcMemo.set(u, calcAllowed(s, u)); }
    return calcMemo.get(u);
  }
  const okQU = (u, q) => okQ(q) && (calcOkU(u) || !isCalcQ(q));
  const unitQs = u => (u.quiz || []).filter(q => okQU(u, q));
  const isSchool = s => s.id === 'math4' || !!s.school;
  /* предметы Академии (всё, кроме школьных) — в порядке Академии; новые предметы контента появляются сами */
  function acadSubs(withTeen = true) {
    const ord = (typeof ACAD_ORDER !== 'undefined' ? ACAD_ORDER : []).concat(Object.keys(window.SUBJECTS || {}));
    return ord.filter((id, i) => ord.indexOf(id) === i).map(sbj).filter(s => s && Array.isArray(s.units) && !isSchool(s) && (withTeen || s.id !== 'teen') && s.units.some(u => unitQs(u).length));
  }
  const acadUnits = s => s.units.filter(u => unitQs(u).length);
  // уроки открываются по порядку (mistakes.js): в делах — только открытые уроки Академии («Открыть все уроки» / window.GOD — все)
  const uOpen = (s, u) => !window.Mistakes || !Mistakes.unitOpen || Mistakes.unitOpen(s.id, u.id);
  const coachId = (sid, uid) => sid === 'teen' ? null : 'a:' + sid + (uid ? ':' + uid : '');
  /* мешок без повторов: каждый элемент по разу, потом заново */
  const bag = () => { let b = []; return (arr, key) => { if (!b.length || b.src !== key) { b = shuffle(arr.slice()); b.src = key; } return b.shift(); }; };

  /* =====================================================================
     🎲 РАЗНООБРАЗИЕ: новые сюжеты задач школьных тем + без повторов подряд
     ===================================================================== */
  const WHO = [['Бобёр Бобби', 0], ['Лиса Алиса', 1], ['Сова Соня', 1], ['Хомяк Хрум', 0], ['Ёжик Колючка', 0], ['Мышка Пискля', 1], ['Енот Тимоша', 0], ['Зайка Пуша', 1], ['Белка Шустрик', 0], ['Кролик Пушок', 0]];
  const vb = (w, m, f) => w[1] ? f : m;
  const span = (d, a1, b1, a2, b2, a3, b3) => d >= 3 ? R(a3, b3) : d === 2 ? R(a2, b2) : R(a1, b1);
  const inp = (q, c, why) => ({ type: 'input', q, c, why });
  const VAR = {
    work: [
      d => { const w = pick(WHO), p = span(d, 3, 9, 12, 39, 25, 99), t = R(5, 9), thing = pick(['кормушек', 'скворечников', 'бусин', 'пирожков', 'открыток']); return inp(`${w[0]} за <b>${t} ч</b> ${vb(w, 'сделал', 'сделала')} <b>${p * t}</b> ${thing}, каждый час поровну. Сколько ${thing} в час?`, p, `Производительность = работа : время: ${p * t} : ${t} = <b>${p}</b> в час.`); },
      d => { const w = pick(WHO), p = span(d, 4, 9, 12, 30, 20, 60), t = R(5, 9); return inp(`${w[0]} печёт печенье: <b>${p}</b> шт. в час. Сколько часов ${vb(w, 'ему', 'ей')} нужно, чтобы испечь <b>${p * t}</b> шт.?`, t, `Время = работа : производительность: ${p * t} : ${p} = <b>${t} ч</b>.`); },
      d => { const a = span(d, 2, 6, 8, 20, 15, 45), b = span(d, 2, 6, 8, 20, 15, 45), t = R(2, 6); return inp(`Мама-белка за час собирает <b>${a}</b> орехов, а бельчонок — <b>${b}</b>. Сколько орехов они соберут вместе за <b>${t} ч</b>?`, (a + b) * t, `Вместе за час: ${a} + ${b} = ${a + b}. За ${t} ч: ${a + b} · ${t} = <b>${(a + b) * t}</b>.`); },
    ],
    buy: [
      d => { const n = R(5, 9), p = span(d, 5, 20, 21, 90, 110, 450), it = pick(['тетрадей', 'карандашей', 'пирожных', 'воздушных шаров', 'наклеек']); return inp(`За <b>${n}</b> одинаковых ${it} заплатили <b>${n * p} руб.</b> Сколько стоит одна штука?`, p, `Цена = стоимость : количество: ${n * p} : ${n} = <b>${p} руб.</b>`); },
      d => { const w = pick(WHO), n = R(5, 9), p = span(d, 4, 12, 15, 60, 70, 250); return inp(`${w[0]} ${vb(w, 'взял', 'взяла')} с собой <b>${n * p} руб.</b> и на все деньги ${vb(w, 'купил', 'купила')} фонарики по <b>${p} руб.</b> Сколько фонариков купили?`, n, `Количество = стоимость : цена: ${n * p} : ${p} = <b>${n}</b>.`); },
      d => { const w = pick(WHO), n = R(2, 6), p = span(d, 6, 15, 18, 75, 90, 160), cost = n * p, M = cost < 100 ? 100 : cost < 500 ? 500 : 1000; return inp(`${w[0]} ${vb(w, 'купил', 'купила')} ${n === 2 ? 'два' : n === 3 ? 'три' : n === 4 ? 'четыре' : n === 5 ? 'пять' : 'шесть'} мороженых по <b>${p} руб.</b> и ${vb(w, 'дал', 'дала')} продавцу <b>${M} руб.</b> Сколько рублей сдачи?`, M - cost, `Стоимость: ${p} · ${n} = ${cost} руб. Сдача: ${M} − ${cost} = <b>${M - cost} руб.</b>`); },
    ],
    motion: [
      d => { const V = pick([['Поезд', 'проехал', 50, 90], ['Катер', 'проплыл', 20, 45], ['Велосипедист', 'проехал', 12, 19], ['Самолёт', 'пролетел', 600, 900]]), v = R(V[2], V[3]), t = R(2, d >= 2 ? 9 : 5); return inp(`${V[0]} за <b>${t} ч</b> ${V[1]} <b>${v * t} км</b>, двигаясь равномерно. С какой скоростью (км/ч)?`, v, `Скорость = расстояние : время: ${v * t} : ${t} = <b>${v} км/ч</b>.`); },
      d => { const v = span(d, 10, 20, 40, 80, 60, 95), t = R(2, 8); return inp(`Автобус проехал <b>${v * t} км</b> со скоростью <b>${v} км/ч</b>. Сколько часов он был в пути?`, t, `Время = расстояние : скорость: ${v * t} : ${v} = <b>${t} ч</b>.`); },
      d => { const w = pick(WHO), v = span(d, 20, 60, 60, 150, 120, 250), t = R(3, 9); return inp(`${w[0]} бежит со скоростью <b>${v} м/мин</b>. Какое расстояние (в метрах) ${vb(w, 'он', 'она')} пробежит за <b>${t} мин</b>?`, v * t, `Расстояние = скорость · время: ${v} · ${t} = <b>${v * t} м</b>.`); },
    ],
    part_num: [
      d => { const k = pick([2, 3, 4, 5, 6, 8, 10]), p = span(d, 2, 9, 6, 25, 15, 120); return inp(`<b>1/${k}</b> числа равна <b>${p}</b>. Найди всё число.`, p * k, `Если одна доля равна ${p}, то всё число: ${p} · ${k} = <b>${p * k}</b>.`); },
      d => { const k = pick([3, 4, 5, 6, 8]), m = R(2, k - 1), W = k * span(d, 2, 6, 5, 15, 12, 40); return inp(`Всего деревьев в саду — <b>${W}</b>. Яблони составляют <b>${m}/${k}</b> всех деревьев. Сколько яблонь?`, W / k * m, `${W} : ${k} = ${W / k} (одна доля), ${W / k} · ${m} = <b>${W / k * m}</b>.`); },
      d => { const k = pick([2, 4, 5, 10]), W = k * span(d, 3, 9, 8, 30, 20, 90); return inp(`Длина ленты — <b>${W} см</b>. От неё отрезали <b>1/${k}</b>. Сколько сантиметров отрезали?`, W / k, `Делим на знаменатель: ${W} : ${k} = <b>${W / k} см</b>.`); },
    ],
    remainder: [
      d => { const b = R(3, 9), q = span(d, 3, 9, 10, 30, 30, 99), r = R(1, b - 1), N = b * q + r; return inp(`Сыщики раскладывают <b>${N}</b> конфет по <b>${b}</b> в пакет. Сколько <b>полных</b> пакетов получится?`, q, `${N} : ${b} = ${q} (ост. ${r}): полных пакетов — <b>${q}</b>, и ${r} конфет останется.`); },
      d => { const b = R(3, 9), q = span(d, 3, 9, 10, 30, 30, 99), r = R(1, b - 1), N = b * q + r; return inp(`<b>${N}</b> пирожков разложили по <b>${b}</b> на тарелку. Сколько пирожков <b>осталось</b>?`, r, `${N} : ${b} = ${q} (ост. ${r}). Проверка: ${b} · ${q} + ${r} = ${N}. Осталось <b>${r}</b>.`); },
      d => { const b = R(3, 9), q = span(d, 5, 12, 12, 60, 60, 300), r = R(1, b - 1); return inp(`Найди остаток: <b>${b * q + r} : ${b}</b>`, r, `${b * q + r} : ${b} = ${q} (ост. <b>${r}</b>). Остаток всегда меньше делителя.`); },
    ],
    round_mul: [
      d => { const k = pick([10, 100, 1000]), a = span(d, 2, 99, 12, 999, 101, 9999); return inp(`Вычисли: <b>${nf(a * k)} : ${k}</b>`, a, `Делим на ${k} — убираем справа ${String(k).length - 1} ${String(k).length - 1 === 1 ? 'ноль' : 'нуля'}: <b>${nf(a)}</b>.`); },
      d => { const a = R(2, 9) * pick(d >= 2 ? [10, 100] : [10]), b = R(2, 9) * pick(d >= 3 ? [10, 100] : [1, 10]); return inp(`Вычисли: <b>${a} · ${b}</b>`, a * b, `Умножаем числа без нулей и приписываем все нули: <b>${nf(a * b)}</b>.`); },
      d => { const b = R(2, 9) * 10, q = R(2, 9) * (d >= 2 ? 10 : 1); return inp(`Вычисли: <b>${nf(b * q)} : ${b}</b>`, q, `Убираем по одному нулю у делимого и делителя: ${nf(b * q / 10)} : ${b / 10} = <b>${q}</b>.`); },
    ],
    more_less: [
      d => { const B = span(d, 100, 900, 1000, 9000, 10000, 90000), A = B + span(d, 10, 99, 100, 999, 1000, 9999); return inp(`На сколько <b>${nf(A)}</b> больше, чем <b>${nf(B)}</b>?`, A - B, `Чтобы узнать, на сколько одно число больше другого, вычитаем: ${nf(A)} − ${nf(B)} = <b>${nf(A - B)}</b>.`); },
      d => { const B = R(2, 9) * (d >= 2 ? 10 : 1), m = R(2, 9); return inp(`Во сколько раз <b>${B * m}</b> больше, чем <b>${B}</b>?`, m, `Чтобы узнать, во сколько раз больше, делим: ${B * m} : ${B} = <b>${m}</b>.`); },
      d => { const A = span(d, 1000, 9000, 10000, 90000, 100000, 800000), k = R(1, 9) * (d >= 3 ? 1000 : 100); return inp(`Увеличь число <b>${nf(A)}</b> на <b>${nf(k)}</b>.`, A + k, `Увеличить на — значит прибавить: ${nf(A)} + ${nf(k)} = <b>${nf(A + k)}</b>.`); },
    ],
    area_units: [
      d => { const n = R(2, d >= 2 ? 30 : 9), U = pick([['кв. дм', 'кв. м', 100], ['кв. см', 'кв. дм', 100]]); return inp(`Сколько <b>${U[0]}</b> в <b>${n} ${U[1]}</b>?`, n * U[2], `1 ${U[1]} = ${U[2]} ${U[0]}, значит ${n} ${U[1]} = ${n} · ${U[2]} = <b>${n * U[2]} ${U[0]}</b>.`); },
      d => { const a = span(d, 2, 9, 5, 15, 11, 25); return inp(`Периметр квадрата — <b>${4 * a} см</b>. Найди его площадь (в кв. см).`, a * a, `Сторона: ${4 * a} : 4 = ${a} см. Площадь: ${a} · ${a} = <b>${a * a} кв. см</b>.`); },
      d => { const a = span(d, 2, 9, 5, 15, 11, 25), b = a + R(1, 9); return inp(`Длина прямоугольника — <b>${b} см</b>, ширина — <b>${a} см</b>. Найди периметр (в см).`, 2 * (a + b), `P = (длина + ширина) · 2 = (${b} + ${a}) · 2 = <b>${2 * (a + b)} см</b>.`); },
    ],
    length_mass: [
      d => { const a = R(1, d >= 2 ? 25 : 9), b = R(5, 995); return inp(`Сколько граммов в <b>${a} кг ${b} г</b>?`, a * 1000 + b, `1 кг = 1000 г: ${a} · 1000 + ${b} = <b>${a * 1000 + b} г</b>.`); },
      d => { const a = R(1, d >= 2 ? 40 : 9), b = R(1, 99); return inp(`Сколько сантиметров в <b>${a} м ${b} см</b>?`, a * 100 + b, `1 м = 100 см: ${a} · 100 + ${b} = <b>${a * 100 + b} см</b>.`); },
      d => { const a = R(1, d >= 2 ? 30 : 9), b = R(10, 990); return inp(`Сколько килограммов в <b>${a} т ${b} кг</b>?`, a * 1000 + b, `1 т = 1000 кг: ${a} · 1000 + ${b} = <b>${a * 1000 + b} кг</b>.`); },
    ],
    time: [
      d => { const h = R(1, d >= 2 ? 12 : 5), m = R(1, 59); return inp(`Сколько минут в <b>${h} ч ${m} мин</b>?`, h * 60 + m, `1 ч = 60 мин: ${h} · 60 + ${m} = <b>${h * 60 + m} мин</b>.`); },
      d => { const m = R(1, d >= 2 ? 15 : 5), s = R(1, 59); return inp(`Сколько секунд в <b>${m} мин ${s} с</b>?`, m * 60 + s, `1 мин = 60 с: ${m} · 60 + ${s} = <b>${m * 60 + s} с</b>.`); },
      d => { const n = R(2, d >= 2 ? 9 : 4); return inp(`Сколько часов в <b>${n} сутках</b>?`, n * 24, `В сутках 24 часа: 24 · ${n} = <b>${n * 24} ч</b>.`); },
    ],
    order_ops: [
      d => { const a = span(d, 10, 50, 50, 300, 200, 900), b = R(2, 9), c = R(2, 9); return inp(`Найди значение выражения:<br><b>${a} + ${b} · ${c}</b>`, a + b * c, `Сначала умножение: ${b} · ${c} = ${b * c}, потом сложение: ${a} + ${b * c} = <b>${a + b * c}</b>.`); },
      d => { const a = span(d, 2, 20, 10, 60, 30, 99), b = R(2, 30), c = R(2, 9); return inp(`Найди значение выражения:<br><b>(${a} + ${b}) · ${c}</b>`, (a + b) * c, `Сначала скобки: ${a} + ${b} = ${a + b}, потом умножение: ${a + b} · ${c} = <b>${(a + b) * c}</b>.`); },
      d => { const c = R(2, 9), q = R(2, 12), a = q + span(d, 5, 40, 20, 200, 100, 800); return inp(`Найди значение выражения:<br><b>${a} − ${c * q} : ${c}</b>`, a - q, `Сначала деление: ${c * q} : ${c} = ${q}, потом вычитание: ${a} − ${q} = <b>${a - q}</b>.`); },
    ],
  };
  function wrapGens() {
    const s = (window.SUBJECTS || {}).math4; if (!s) return;
    s.units.forEach(u => {
      if (typeof u.gen !== 'function' || u.gen.v29) return;
      const g0 = u.gen, extra = VAR[u.id] || [], histG = [];
      const sig = q => strip(q.q).replace(/\d[\d\s]*/g, '#'); // «шаблон» задачи без чисел
      const g = function (d) {
        // внутри withSeed (дуэли) — история только этого прогона: задания зависят лишь от зерна и одинаковы у обоих игроков
        const run = window.withSeed && withSeed.run, hist = run ? (run['h:' + u.id] = run['h:' + u.id] || []) : histG;
        let q = null, best = null;
        for (let t = 0; t < 12; t++) {
          const f = extra.length && Math.random() < 0.45 ? pick(extra) : g0;
          let c; try { c = f(d); } catch (e) { c = null; } if (!c || !c.q) continue; best = best || c;
          const txt = strip(c.q), last = hist[hist.length - 1];
          if (hist.some(h => h.txt === txt)) continue;                    // тот же пример — нет
          if (last && c.type === 'input' && last.type === 'input' && String(last.c) === String(c.c) && t < 9) continue;   // тот же ответ подряд — нет
          if (last && last.sig === sig(c) && t < 6) continue;              // тот же сюжет подряд — лучше другой
          q = c; break;
        }
        q = q || best || g0(d);
        hist.push({ txt: strip(q.q), c: q.c, type: q.type, sig: sig(q) }); if (hist.length > 15) hist.shift();
        return q;
      };
      g.v29 = true; g.orig = g0; u.gen = g;
    });
  }
  wrapGens();
  /* новые сюжеты для умножения столбиком; истории идут «мешком» — подряд не повторяются */
  try {
    MUL_STORIES.push(
      (a, b) => `Лиса Алиса вяжет шарфики: на каждый уходит <b>${a}</b> см пряжи. Шарфиков — <b>${b}</b>. Сколько сантиметров пряжи понадобится?`,
      (a, b) => `«Сладкий экспресс»: вагонов — <b>${b}</b>, в каждом вагоне мест — <b>${a}</b>. Сколько всего мест в поезде?`,
      (a, b) => `Самолёт летит со скоростью <b>${a}</b> км/ч. Какое расстояние он пролетит за <b>${b}</b> ч?`,
      (a, b) => `Один билет в цирк стоит <b>${a}</b> руб. Сыщикам нужно билетов — <b>${b}</b>. Сколько рублей за все билеты?`,
      (a, b) => `Кот-почтальон разносит <b>${a}</b> писем в день. Сколько писем он разнесёт, если будет работать дней — <b>${b}</b>?`,
      (a, b) => `В хоре лягушек рядов — <b>${b}</b>, в каждом ряду по <b>${a}</b> певцов. Сколько певцов в хоре?`,
      (a, b) => `Ёжик Колючка собирает <b>${a}</b> грибов за один поход в лес. Сколько грибов будет после походов — <b>${b}</b>?`,
      (a, b) => `На складе конфетной фабрики коробок — <b>${b}</b>, в каждой по <b>${a}</b> леденцов. Сколько леденцов на складе?`,
    );
    let sbag = [];
    const mk = makeTask;
    makeTask = function (kind, level) { const t = mk.apply(this, arguments); if (t && t.kind === 'mul' && t.story) { if (!sbag.length) sbag = shuffle(MUL_STORIES.slice()); t.story = sbag.shift()(t.a, t.b); } return t; };
  } catch (e) { console.warn(e); }

  /* =====================================================================
     🦝 ОШИБКИ ЕНОТА ПО ВСЕМ ТЕМАМ
     ===================================================================== */
  const RACC = ['Енот Тимоша хвастается', 'Енот уверен', 'Енот спешил и говорит', 'Енот подсмотрел у Лисы и говорит', 'Енот тянет лапу и отвечает', 'Енот важно заявляет'];
  function offBy(c) { // типичные ошибки: лишний/потерянный ноль, ±1, ±10, переставленные цифры
    const s = String(c), o = [c * 10, Math.floor(c / 10), c + 1, c - 1, c + 10, c - 10, s.length > 1 ? +(s.slice(0, -2) + s.slice(-1) + s.slice(-2, -1)) : c + 2, c + 100, c + 2];
    const ok = shuffle(o).filter(x => Number.isInteger(x) && x >= 0 && x !== c); return ok.length ? ok[0] : c + 1;
  }
  const RIGHT_P = 0.3; // в 30% случаев Енот прав — нельзя отвечать «ошибся» не глядя
  const says = t => `<div class="racc-says">🦝 ${pick(RACC)}: ${t}</div>`;
  const VERDICT = '<div class="q-ask">Енот прав?</div>';
  /* из любого вопроса тренажёра — «решение Енота» */
  function bugFromQ(q, meta) {
    const right = Math.random() < RIGHT_P, head = meta && meta.label ? `<div class="small">${meta.icon || ''} ${meta.label}</div>` : '';
    const B = { type: 'tf', c: right, wrong: !right, src: meta && meta.src, topic: meta && meta.label, icon: meta && meta.icon, qt: q.type };
    if (q.type === 'input') {
      const c = +q.c, x = right ? c : offBy(c);
      return Object.assign(B, { q: `${head}${q.q}${says(`«Ответ — <b>${nf(x)}</b>!»`)}${VERDICT}`, correct: c, fix: { kind: 'num', c }, why: `${right ? 'Да, Енот прав!' : `Енот ошибся: правильно — <b>${nf(c)}</b>.`} ${q.why || ''}` });
    }
    if (q.type === 'one') {
      const others = q.a.map((_, i) => i).filter(i => i !== q.c), j = right ? q.c : pick(others);
      return Object.assign(B, { q: `${head}${q.q}${says(`«Ответ — <b>${q.a[j]}</b>!»`)}${VERDICT}`, fix: { kind: 'pick', prompt: 'А какой ответ правильный?', opts: q.a, c: q.c }, why: `${right ? 'Да, Енот прав!' : `Енот ошибся. Правильно: <b>${q.a[q.c]}</b>.`} ${q.why || ''}` });
    }
    if (q.type === 'case') {
      const good = q.a.findIndex(o => o.ok === true), bad = q.a.map((o, i) => i).filter(i => q.a[i].ok !== true), j = right ? good : pick(bad.filter(i => q.a[i].ok === false).length ? bad.filter(i => q.a[i].ok === false) : bad);
      return Object.assign(B, { q: `${head}<div class="q-case">${q.story || ''}</div>${q.q ? `<div class="q-text">${q.q}</div>` : ''}${says(`«Я бы сделал так: <b>${q.a[j].t}</b>»`)}${VERDICT}`, fix: { kind: 'pick', prompt: 'А как правильно поступить?', opts: q.a.map(o => o.t), c: good }, why: `${right ? 'Да, Енот прав!' : `Енот ошибся. Лучше так: <b>${q.a[good].t}</b>.`} ${q.a[j].why || ''}${q.why ? `<div class="rule">📏 ${q.why}</div>` : ''}` });
    }
    if (q.type === 'tf') {
      const truth = !!q.c, claim = right ? truth : !truth;
      return Object.assign(B, { q: `${head}<div class="q-case">«${q.q}»</div>${says(`«Это <b>${claim ? 'правда' : 'неправда'}</b>!»`)}${VERDICT}`, why: `${right ? 'Да, Енот прав!' : 'Енот ошибся!'} На самом деле это <b>${truth ? 'правда' : 'неправда'}</b>. ${q.why || ''}` });
    }
    if (q.type === 'order') {
      const n = q.items.length, idx = q.items.map((_, i) => i); let pair = null;
      if (!right) { const i = R(0, n - 2), j = Math.random() < 0.6 ? i + 1 : R(i + 1, n - 1); [idx[i], idx[j]] = [idx[j], idx[i]]; pair = [i, j]; }
      const shown = idx.map(i => q.items[i]);
      return Object.assign(B, { q: `${head}<div class="q-text">${q.q}</div><ol class="racc-ord">${shown.map(t => `<li>${t}</li>`).join('')}</ol>${says('«Вот правильный порядок!»')}${VERDICT}`, fix: pair && { kind: 'swap', items: shown, pair }, why: `${right ? 'Да, Енот прав!' : `Енот перепутал «${shown[pair[0]]}» и «${shown[pair[1]]}».`} Правильно: ${q.items.map((t, i) => `${i + 1}. ${t}`).join(' · ')}. ${q.why || ''}` });
    }
    if (q.type === 'sort') {
      const place = q.items.map(it => it[1]); let k = -1;
      if (!right) { k = R(0, q.items.length - 1); place[k] = pick(q.groups.map((_, g) => g).filter(g => g !== q.items[k][1])); }
      return Object.assign(B, { q: `${head}<div class="q-text">${q.q}</div><div class="racc-sort">${q.groups.map((g, gi) => `<div class="rs-g g${gi}"><b>${g}</b>${q.items.map((it, i) => place[i] === gi ? `<span>${it[0]}</span>` : '').join('')}</div>`).join('')}</div>${says('«Я всё разложил!»')}${VERDICT}`, fix: k >= 0 && { kind: 'pick', prompt: 'Какую карточку Енот положил не туда?', opts: q.items.map(it => it[0]), c: k }, why: `${right ? 'Да, Енот прав!' : `Енот ошибся: «${q.items[k][0]}» — это «${q.groups[q.items[k][1]]}».`} ${q.why || ''}` });
    }
    return null;
  }
  /* ошибки в старых темах: столбик, деление, сложение/вычитание, уравнения */
  const CORE_BUG = {
    mul: () => { const [a, b] = E.genMul(R(1, 3)), c = a * b, right = Math.random() < RIGHT_P, x = right ? c : (b > 9 && Math.random() < 0.5 ? a * (b % 10) + a * Math.floor(b / 10) : offBy(c)), w = x === c && !right ? c + 10 : x;
      return { type: 'tf', c: right, wrong: !right, correct: c, fix: { kind: 'num', c }, q: `<div class="small">✖️ Умножение столбиком</div>Енот умножил столбиком: <b>${a} × ${b} = ${nf(w)}</b>${VERDICT}`, why: `${right ? 'Да, Енот прав!' : `Енот ошибся: ${a} × ${b} = <b>${nf(c)}</b>.`}${b > 9 && !right ? ' Не забывай сдвигать вторую строку влево!' : ''} Проверка прикидкой: ${a} ≈ ${Math.round(a / 10) * 10}, ${b} ≈ ${b > 9 ? Math.round(b / 10) * 10 : b}.` }; },
    div: () => { const P = Column.genDiv(R(1, 3)), right = Math.random() < RIGHT_P; let wq = P.q; if (!right) { const s = String(P.q).split(''), i = R(0, s.length - 1); s[i] = String((+s[i] + R(1, 8)) % 10); if (s[0] === '0' && s.length > 1) s[0] = '1'; wq = +s.join(''); if (wq === P.q) wq = P.q + 1; }
      return { type: 'tf', c: right, wrong: !right, correct: P.q, fix: { kind: 'num', c: P.q }, q: `<div class="small">➗ Деление столбиком</div>Енот разделил столбиком: <b>${P.a} : ${P.b} = ${wq}${P.r ? ` (ост. ${P.r})` : ''}</b>${VERDICT}<div class="small">Если ошибся — напиши правильное частное.</div>`, why: `Проверка: ${P.b} · ${P.q}${P.r ? ' + ' + P.r : ''} = ${P.a}. Правильно: <b>${P.a} : ${P.b} = ${P.q}${P.r ? ` (ост. ${P.r})` : ''}</b>.` }; },
    add: () => { const op = Math.random() < 0.5 ? '+' : '-', P = Column.genAdd(R(1, 3), op), res = P.res, right = Math.random() < RIGHT_P; let w = res; if (!right) { const s = String(res).split(''), i = R(0, s.length - 1); s[i] = String((+s[i] + (Math.random() < 0.5 ? 1 : 9)) % 10); w = +s.join(''); if (w === res || String(w).length < String(res).length) w = res + (op === '+' ? 10 : -10); }
      return { type: 'tf', c: right, wrong: !right, correct: res, fix: { kind: 'num', c: res }, q: `<div class="small">➕ Сложение и вычитание</div>Енот посчитал столбиком: <b>${P.a} ${op === '+' ? '+' : '−'} ${P.b} = ${w}</b>${VERDICT}`, why: `${op === '+' ? `Проверка вычитанием: ${res} − ${P.b} = ${P.a}` : `Проверка сложением: ${res} + ${P.b} = ${P.a}`}. Правильно: <b>${res}</b>.${right ? '' : ' Енот забыл про «запомненную» единицу или «занятый» десяток!'}` }; },
    eq: () => { const eq = E.genEq(R(2, 3)), right = Math.random() < RIGHT_P; let x = eq.x; if (!right) { const c = shuffle([-3, -2, -1, 1, 2, 3, 10, -10]).map(dd => eq.x + dd).filter(v => v > 0 && E.evalE(eq.lhs, v) !== eq.rhs); x = c.length ? c[0] : eq.x + 1; }
      return { type: 'tf', c: right, wrong: !right, correct: eq.x, fix: { kind: 'num', c: eq.x }, q: `<div class="small">📦 Уравнения</div>Енот решил уравнение <b>${E.eqText(eq.lhs)} = ${eq.rhs}</b> и получил <b>x = ${x}</b>.${VERDICT}`, why: `Проверка: подставим x = ${eq.x}: ${E.eqText(eq.lhs, eq.x)} = ${eq.rhs} ✔. Правильно: <b>x = ${eq.x}</b>.` }; },
  };
  // v35: место преступления в предложном падеже — добавляем предлог («в кафе», «на ярмарке»)
  const inPlace = p => /^у\s/.test(p) ? p : (/(^|\s)(ярмарке|конкурсе|катке|кассе|шахте|пляже|пасеке|ферме|рынке|корабле|поле|празднике|мельнице|маяке|лодке|фабрике|фестивале|коробке)(\s|$)/.test(String(p).split(' ').slice(0, 2).join(' ')) ? 'на ' : 'в ') + p;
  /* темы Школы: старые темы + все темы программы + будущие школьные предметы */
  function schoolEntries() {
    const out = [], m4 = sbj('math4'), G = window.School4 ? School4.GROUPS : [];
    G.forEach(g => g.items.forEach(x => {
      if (x[0] === '@') { const k = x.slice(1), c = School4.CORE[k]; if (c && CORE_BUG[k]) out.push({ key: 'c:' + k, label: c.title, icon: c.icon, group: g.t }); }
      else { const u = m4 && m4.units.find(y => y.id === x); if (u) out.push({ key: 'u:math4:' + u.id, label: u.title, icon: u.icon, group: g.t }); }
    }));
    if (m4) m4.units.forEach(u => { if (!out.some(e => e.key === 'u:math4:' + u.id)) out.push({ key: 'u:math4:' + u.id, label: u.title, icon: u.icon, group: '📚 Ещё темы' }); });
    Object.values(window.SUBJECTS || {}).filter(s => s.school && s.id !== 'math4').forEach(s => s.units.filter(u => u.gen || unitQs(u).length).forEach(u => out.push({ key: 'u:' + s.id + ':' + u.id, label: u.title, icon: u.icon, group: '📚 ' + s.name })));
    return out;
  }
  const seenQ = new Set();
  function qFromUnit(s, u) { // вопрос из темы: генератор (бесконечные задачи) или банк тренажёра без повторов
    const qs = unitQs(u);
    if (typeof u.gen === 'function' && (!qs.length || Math.random() < 0.75)) { for (let t = 0; t < 6; t++) { let q; try { q = u.gen(typeof genLv === 'function' ? genLv(s.id, u.id) : 2); } catch (e) { q = null; } if (okQU(u, q)) return q; } }
    if (!qs.length) return null;
    const fresh = qs.filter(q => !seenQ.has(q)), q = pick(fresh.length ? fresh : qs); seenQ.add(q); return q;
  }
  /* источник ошибок по ключу: 'school' | 'acad' | 'c:mul' | 'S:space' | 'u:space:moon' */
  function bugSource(spec) {
    const units = [];
    if (spec === 'school') schoolEntries().forEach(e => units.push(e.key));
    else if (spec === 'acad') acadSubs(false).forEach(s => acadUnits(s).forEach(u => units.push('u:' + s.id + ':' + u.id)));
    else if (/^S:/.test(spec)) { const s = sbj(spec.slice(2)); if (s) s.units.filter(u => u.gen || unitQs(u).length).forEach(u => units.push('u:' + s.id + ':' + u.id)); }
    else units.push(spec);
    const b = bag();
    return () => {
      for (let t = 0; t < 12; t++) {
        const key = units.length > 1 ? b(units, 'u') : units[0]; if (!key) return null; let B = null;
        if (/^c:/.test(key)) { const f = CORE_BUG[key.slice(2)]; B = f ? f() : null; if (B) B.src = null; }
        else { const [, sid, uid] = key.split(':'), s = sbj(sid), u = s && s.units.find(x => x.id === uid); if (!u) continue; const q = qFromUnit(s, u); if (!q) continue; B = bugFromQ(q, { src: sid + ':' + uid, label: u.title, icon: u.icon }); if (B) B.sid = sid; }
        if (B && B.q && !/undefined|NaN/.test(B.q)) return B;
      }
      return null;
    };
  }
  function specMeta(spec) {
    if (spec === 'school') return { title: 'вся школа', tab: 's' };
    if (spec === 'acad') return { title: 'вся Академия', tab: 'a' };
    if (/^c:/.test(spec)) { const c = window.School4 && School4.CORE[spec.slice(2)]; return { title: c ? c.title : 'Школа', tab: 's' }; }
    if (/^S:/.test(spec)) { const s = sbj(spec.slice(2)); return { title: s ? s.icon + ' ' + s.name : '', tab: s && isSchool(s) ? 's' : 'a' }; }
    const [, sid, uid] = spec.split(':'), s = sbj(sid), u = s && s.units.find(x => x.id === uid); return { title: u ? u.icon + ' ' + u.title : 'тема', tab: s && isSchool(s) ? 's' : 'a' };
  }
  { const b2 = SCREENS.bugs2; SCREENS.bugs2 = arg => { if (!arg) return b2(arg); runBugs(String(arg)); }; }
  function runBugs(spec) {
    const meta = specMeta(spec), next = bugSource(spec), N = 8; let k = 0, ok = 0, caught = 0;
    app.innerHTML = `${topbar('🦝 ' + meta.title, 'bugpick')}<div class="page bugs3"><div class="g-head"><div class="g-dots">${Array.from({ length: N }, () => '<i></i>').join('')}</div><div class="pill">🔍 <b id="b3c">0</b></div></div>${helperHTML('b2bub')}<div id="b2q"></div></div>`;
    $('.back', app).dataset.arg = meta.tab;
    $('#b2bub').innerHTML = pick(['Енот решает задачи и хвастается! Проверь его: прав он или ошибся?', 'Енот опять торопится! Найди ошибку — а потом исправь её.', 'Сыщик проверяет каждое слово. Енот прав?']);
    const ask = () => {
      const B = next(); if (!B) { $('#b2q').innerHTML = '<p class="center">В этой теме пока нет вопросов 🙈</p>'; return; }
      window.__aq = B; window.__bug = B; const T = ACAD_Q.tf;
      $('#b2q').innerHTML = T.render(B).replace('✅ Правда', '✅ Енот прав').replace('❌ Неправда', '❌ Енот ошибся').replace(/<div class="q-text">([\s\S]*)<\/div><div class="opts">/, '<div class="q-text racc-q">$1</div><div class="opts">') + '<div id="b2w"></div>';
      T.bind($('#b2q'), B, r => {
        $$('.g-dots i', app)[k].className = r ? 'ok' : 'bad'; if (r) { ok++; SND.ok(); } else SND.bad();
        taskDone('bug', { mistakes: r ? 0 : 1 }); award(r ? 2 : 0, r ? 8 : 2);
        const cid = B.sid ? coachId(B.sid, B.src.split(':')[1]) : null; if (window.Coach && cid) Coach.track(cid, r ? 1 : 0, { count: false });
        const nextBtn = extra => { $('#b2w').innerHTML = `${extra || ''}<div class="b3-why">${B.why}</div><button class="btn big pink" id="b2n">${k + 1 < N ? 'Дальше →' : 'Итоги 🏆'}</button>`; $('#b2n').addEventListener('click', () => { k++; k < N ? ask() : fin(); }); };
        if (r && B.wrong && B.fix) { caught++; $('#b3c').textContent = caught; askFix(B, nextBtn); } else { if (r && B.wrong) { caught++; $('#b3c').textContent = caught; } nextBtn(); }
      });
    };
    const fin = () => { if (ok === N) awardGems(1, 'за то, что поймал(а) все ошибки Енота'); SND.win(); if (ok >= N - 1) confetti(30);
      $('#b2q').innerHTML = `<div class="center g-result"><div class="big-emoji">${ok === N ? '🏆' : '🦝'}</div><h2>${ok} из ${N}!</h2><p>Поймано ошибок Енота: <b>${caught}</b></p><div class="row-btns"><button class="btn big pink" id="b2a">Ещё</button><button class="btn" data-go="bugpick" data-arg="${meta.tab}">Другая тема</button></div></div>`; $('#b2a').addEventListener('click', () => go('bugs2', spec)); };
    ask();
  }
  /* поймал Енота — исправь: напиши ответ, выбери правильный вариант или найди переставленные шаги */
  function askFix(B, after) {
    const w = $('#b2w'), F = B.fix, gl = girl() ? 'а' : '', bonus = '<small>(+3 🍬)</small>';
    const good = () => { SND.win(); award(3, 10); toast(`🎯 Точно! Ты исправил${gl} Енота`); };
    if (F.kind === 'num') {
      let buf = ''; w.innerHTML = `<div class="fb">✔ Поймал${gl} Енота!</div><p>А какой ответ правильный? <span class="inp" id="b2v">?</span> ${bonus}</p>${numpad(true)}<button class="btn sm" id="b2skip">Пропустить</button>`;
      $('#b2skip').addEventListener('click', () => { keyHandler = null; after(); });
      bindPad(w, { digit: x => { if (buf.length < 7) { buf += x; $('#b2v').textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#b2v').textContent = buf || '?'; }, ok: () => { if (!buf) return; keyHandler = null; if (+buf === F.c) { good(); after('<div class="fb">🎯 Исправлено!</div>'); } else { SND.bad(); after(`<div class="fb bad">Правильно: ${nf(F.c)}</div>`); } } });
      return;
    }
    if (F.kind === 'pick') {
      w.innerHTML = `<div class="fb">✔ Поймал${gl} Енота!</div><p>${F.prompt} ${bonus}</p><div class="opts">${F.opts.map((t, i) => ({ t, i })).sort(() => Math.random() - 0.5).map(o => `<button class="opt wide" data-f="${o.i}">${o.t}</button>`).join('')}</div><button class="btn sm" id="b2skip2">Пропустить</button>`;
      $('#b2skip2').addEventListener('click', () => after());
      $$('[data-f]', w).forEach(b => b.addEventListener('click', () => { const r = +b.dataset.f === F.c; b.classList.add(r ? 'right' : 'wrong'); const rb = $(`[data-f="${F.c}"]`, w); if (rb) rb.classList.add('right'); if (r) good(); else SND.bad(); setTimeout(() => after(r ? '<div class="fb">🎯 Исправлено!</div>' : ''), 700); }, { once: true }));
      return;
    }
    if (F.kind === 'swap') {
      const sel = []; w.innerHTML = `<div class="fb">✔ Поймал${gl} Енота!</div><p>Какие два шага Енот переставил? Нажми на оба. ${bonus}</p><div class="ord-pool swap-pool">${F.items.map((t, i) => `<button class="ord" data-f="${i}">${i + 1}. ${t}</button>`).join('')}</div><button class="btn sm" id="b2skip2">Пропустить</button>`;
      $('#b2skip2').addEventListener('click', () => after());
      $$('[data-f]', w).forEach(b => b.addEventListener('click', () => { if (b.disabled || sel.length >= 2) return; b.disabled = true; sel.push(+b.dataset.f); SND.tap(); if (sel.length === 2) { const r = sel.includes(F.pair[0]) && sel.includes(F.pair[1]); F.pair.forEach(i => $(`[data-f="${i}"]`, w).classList.add('ok')); if (r) good(); else SND.bad(); setTimeout(() => after(r ? '<div class="fb">🎯 Исправлено!</div>' : ''), 800); } }));
    }
  }
  /* выбор темы: Школа / Академия → предмет → разделы или «всё вперемешку» */
  SCREENS.bugpick = tab => {
    tab = tab === 'a' || tab === 's' ? tab : (S.prefs.bugTab || 's'); S.prefs.bugTab = tab;
    app.innerHTML = `${topbar('🦝 Ошибки Енота: темы', 'bugs')}<div class="page bugpick"><p class="small center">Выбери тему — Енот будет отвечать на её вопросы и ошибаться. Поймай и исправь!</p><div class="seg bp-tabs"><button data-t="s">📐 Школа</button><button data-t="a">🎓 Академия</button></div><div id="bpbody"></div></div>`;
    const body = $('#bpbody'), chip = (key, html, cls = '') => `<button class="bp-chip ${cls}" data-bug="${key}">${html}</button>`;
    const draw = () => {
      $$('.bp-tabs button', app).forEach(b => b.classList.toggle('on', b.dataset.t === tab));
      if (tab === 's') { const L = schoolEntries(), groups = [...new Set(L.map(e => e.group))];
        body.innerHTML = `${chip('school', '🌀 <b>Вся школа вперемешку</b>', 'bp-all')}${groups.map(g => `<h4 class="bp-h">${g}</h4><div class="bp-chips">${L.filter(e => e.group === g).map(e => chip(e.key, `${e.icon} ${e.label}`)).join('')}</div>`).join('')}`; }
      else { const subs = acadSubs();
        body.innerHTML = `${chip('acad', '🌀 <b>Вся Академия вперемешку</b>', 'bp-all')}<div class="bp-subs">${subs.map(s => `<button class="bp-sub" data-s="${s.id}" style="--c:${s.color || '#FFD9E6'}"><span>${s.icon}</span><b>${s.name}</b></button>`).join('')}</div><div id="bpunits"></div>`;
        $$('.bp-sub', body).forEach(b => b.addEventListener('click', () => { SND.tap(); const s = sbj(b.dataset.s); $$('.bp-sub', body).forEach(x => x.classList.toggle('on', x === b));
          const box = $('#bpunits'); box.innerHTML = `<h4 class="bp-h">${s.icon} ${s.name}</h4><div class="bp-chips">${chip('S:' + s.id, '🌀 Весь предмет', 'all')}${acadUnits(s).map(u => chip(`u:${s.id}:${u.id}`, `${u.icon} ${u.title}`)).join('')}</div>`;
          box.scrollIntoView && box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); })); }
    };
    $$('.bp-tabs button', app).forEach(b => b.addEventListener('click', () => { tab = S.prefs.bugTab = b.dataset.t; SND.tap(); draw(); }));
    body.addEventListener('click', e => { const b = e.target.closest('[data-bug]'); if (!b) return; SND.tap(); save(); go('bugs2', b.dataset.bug); });
    draw();
  };
  /* на экране «Ошибки Енота» — понятный вход во все темы */
  { const bg = SCREENS.bugs; SCREENS.bugs = arg => { bg(arg); const old = $('.bugs2-link', app); if (!old) return;
    old.insertAdjacentHTML('afterend', `<div class="bug-hub"><div class="bh-t">🦝 Енот ошибается во <b>всех темах</b> Школы и Академии</div><div class="bh-row"><button class="btn mint bugs2-link" data-go="bugs2">🌀 Вся программа</button><button class="btn" data-go="bugpick" data-arg="s">📐 Темы Школы</button><button class="btn" data-go="bugpick" data-arg="a">🎓 Темы Академии</button></div><div class="bh-s">А ниже — Енот решает столбиком и уравнения: найди строку с ошибкой 👇</div></div>`); old.remove(); }; }
  addNF('bugpick');

  /* =====================================================================
     🔍 НОВОЕ ДЕЛО: 3 шага, улики из Школы и Академии
     ===================================================================== */
  const TOPICS = [['all', '🧭', 'Вся программа', 'Школа + Академия'], ['school', '📐', 'Школа', 'все темы математики'], ['acad', '🎓', 'Академия', 'допрос свидетелей'], ['pick', '🎯', 'Выбрать темы', '']];
  const CLASSIC = [['mul', '✖️', 'Столбик'], ['eq', '📦', 'Уравнения'], ['mix', '🍬', 'Вперемешку']];
  const TSAY = { all: 'Вся программа — настоящее большое расследование!', school: 'Математика — главный инструмент сыщика!', acad: 'Свидетели из Академии ждут допроса!', pick: 'Выбирай темы, {n}!' };
  const DINFO = ['🍪 Числа поменьше, задачи в 1–2 действия', '🧁 Трёхзначные числа, задачи в 2 действия', '🎂 Большие числа, 3 действия · 💎 кристаллы'];
  const pickCount = () => (S.prefs.caseTopics || []).length + (S.prefs.caseAcad || []).length;
  function nextCrime() { try { if (!S.crimeBag.length) { S.crimeBag = shuffle(E.CRIMES.map((_, i) => i)); save(); } return E.CRIMES[S.crimeBag[0]] || E.CRIMES[0]; } catch (e) { return { title: 'Тайна', place: 'Сладкограде', what: 'конфеты' }; } }
  SCREENS.newcase = () => {
    const p = S.prefs; if (![...TOPICS, ...CLASSIC].some(t => t[0] === p.topic)) p.topic = 'all';
    const cr = nextCrime(), n = S.cases + 1;
    app.innerHTML = `${topbar('Новое дело')}<div class="page newcase nc2">
      <div class="helper nc-case"><div class="mini-cat">${myCat({ cls: 'mini' })}</div><div class="nc-ct"><span class="nc-no">📁 Дело №${n}</span><b>«${esc(cr.title)}»</b><small>Где: ${esc(inPlace(cr.place))}</small></div></div>
      <div class="nc-step"><span class="nc-n">1</span>Что расследуем?</div>
      <div class="choice-grid topic nc-topics">${TOPICS.map(([t, i, nm, sub]) => `<button class="choice nc-t" data-t="${t}"><span>${i}</span><b>${nm}</b><small id="${t === 'pick' ? 'pickn' : ''}">${t === 'pick' ? (pickCount() ? 'тем: ' + pickCount() : 'ты выбираешь') : sub}</small></button>`).join('')}</div>
      <div class="nc-classic"><span>Классика:</span>${CLASSIC.map(([t, i, nm]) => `<button class="choice nc-c" data-t="${t}">${i} ${nm}</button>`).join('')}</div>
      <div class="nc-step"><span class="nc-n">2</span>Сложность</div>
      <div class="seg diff">${[[1, '🍪 Лёгкое'], [2, '🧁 Среднее'], [3, '🎂 Сложное']].map(([v, t]) => `<button data-d="${v}" class="${p.diff === v ? 'on' : ''}">${t}</button>`).join('')}</div>
      <p class="small center" id="dinfo"></p>
      <button class="btn big pink nc-go" id="go"><span class="nc-n w">3</span> Взять дело №${n} →</button></div>`;
    const mark = () => $$('.choice', app).forEach(b => b.classList.toggle('on', b.dataset.t === p.topic));
    $$('.choice', app).forEach(b => b.addEventListener('click', () => { p.topic = b.dataset.t; save(); mark(); SND.tap(); catMood('happy', 700); const ci = { mul: 0, eq: 1, mix: 2 }[p.topic]; say(ci != null ? PH.topic[ci] : TSAY[p.topic], 0, { prio: 0 }); if (p.topic === 'pick') pickTopics(); }));
    const dinfo = () => { $('#dinfo').textContent = DINFO[(p.diff || 1) - 1]; };
    $$('.diff button', app).forEach(b => b.addEventListener('click', () => { p.diff = +b.dataset.d; save(); $$('.diff button', app).forEach(x => x.classList.toggle('on', x === b)); SND.tap(); dinfo(); say(PH.diff[p.diff - 1], 0, { prio: 0 }); }));
    $('#go').addEventListener('click', () => { if (p.topic === 'pick' && !pickCount()) { pickTopics(); return; } save(); startCase(p.topic, p.diff); });
    mark(); dinfo();
  };
  addNF('newcase');
  function pickTopics() {
    const p = S.prefs, L = TaskBank.list().filter(x => !x.acad), groups = [...new Set(L.map(x => x.group))], sel = new Set(p.caseTopics || []), selA = new Set(p.caseAcad || []), subs = acadSubs(false);
    const ch = (v, on, html) => `<label class="tb-chip"><input type="checkbox" value="${v}" ${on ? 'checked' : ''}><span>${html}</span></label>`;
    const m = modal(`<h2>🎯 Какие темы в деле?</h2><div class="tb-scroll"><h3 class="tb-h">📐 Школа</h3><div class="tb-pick">${groups.map(g => `<h4>${g}</h4><div class="tb-chips">${L.filter(x => x.group === g).map(x => ch(x.id, sel.has(x.id), `${x.icon} ${x.name}`)).join('')}</div>`).join('')}</div>
      <h3 class="tb-h">🎓 Академия <small>— допрос свидетелей</small></h3><div class="tb-acad">${subs.map(s => { const us = acadUnits(s).filter(u => uOpen(s, u)), nOn = us.filter(u => selA.has(s.id + ':' + u.id)).length; return `<details class="tb-subj"${nOn ? ' open' : ''}><summary>${s.icon} ${s.name}${nOn ? ` <i>${nOn}</i>` : ''}</summary><div class="tb-chips">${us.map(u => ch(s.id + ':' + u.id, selA.has(s.id + ':' + u.id), `${u.icon} ${u.title}`)).join('')}</div></details>`; }).join('')}</div></div>
      <div class="row-btns"><button class="btn pink" id="tbok">Готово</button><button class="btn" id="tball">Все</button><button class="btn" id="tbnone">Сбросить</button></div>`, 'wide tb-modal');
    $('#tball', m.el).addEventListener('click', () => $$('input', m.el).forEach(i => { i.checked = true; }));
    $('#tbnone', m.el).addEventListener('click', () => $$('input', m.el).forEach(i => { i.checked = false; }));
    $('#tbok', m.el).addEventListener('click', () => {
      p.caseTopics = $$('.tb-pick input:checked', m.el).map(i => i.value); p.caseAcad = $$('.tb-acad input:checked', m.el).map(i => i.value); save(); m.close();
      const nEl = $('#pickn'); if (nEl) nEl.textContent = pickCount() ? 'тем: ' + pickCount() : 'ты выбираешь';
    });
  }
  /* вопросы Академии в деле: «допрос свидетеля» — свидетель расскажет, что видел, если ответишь на его вопрос */
  function acadPool(ids) {
    const out = [];
    if (ids) ids.forEach(id => { const [sid, uid] = id.split(':'), s = sbj(sid), u = s && s.units.find(x => x.id === uid); if (u && unitQs(u).length && uOpen(s, u)) out.push({ s, u }); });
    else acadSubs(false).forEach(s => acadUnits(s).filter(u => uOpen(s, u)).forEach(u => out.push({ s, u })));
    return out;
  }
  function mkAcad(su, d, wit) {
    const qs = unitQs(su.u), cs = qs.filter(q => q.type === 'case'), q = cs.length && Math.random() < 0.6 ? pick(cs) : pick(qs);
    return { kind: 'aq', level: d, src: su.s.id + ':' + su.u.id, pid: 'a:' + su.s.id + ':' + su.u.id, title: su.u.title, icon: su.s.icon, subjName: su.s.name, q, regen: () => pick(qs.length > 1 ? qs.filter(x => x !== q) : qs), wit, acad: true };
  }
  const scPrev = startCase;
  startCase = function (topic, diff) {
    if (!['all', 'school', 'acad', 'pick'].includes(topic)) return scPrev.apply(this, arguments);
    const p = S.prefs; let ids = null, aids = null, nS = 2, nA = 2;
    const known = new Set(TaskBank.list().map(x => x.id));
    if (topic === 'school') { nS = 4; nA = 0; }
    if (topic === 'acad') { nS = 0; nA = 4; }
    if (topic === 'pick') {
      ids = (p.caseTopics || []).filter(x => known.has(x)); aids = acadPool(p.caseAcad || []).map(x => x.s.id + ':' + x.u.id);
      const wantA = (p.caseAcad || []).length > 0;
      // выбранные темы Академии закрылись или пропали — не подменяем их математикой: берём открытые темы Академии
      if (wantA && !aids.length) { if (!acadPool(null).length) { toast('🔒 Выбранные темы Академии пока закрыты. Открой урок в Академии или выбери другие темы!'); pickTopics(); return; } toast('🔒 Выбранные темы Академии пока закрыты — свидетели спросят про открытые темы Академии'); aids = null; if (!ids.length) { nS = 0; nA = 4; } }
      else if (!ids.length && !aids.length) { toast('🔒 Выбранные темы пока недоступны — выбери темы ещё раз'); pickTopics(); return; } else if (!aids.length) { nS = 4; nA = 0; } else if (!ids.length) { nS = 0; nA = 4; }
    }
    const pool = acadPool(aids);
    if (!pool.length && nA && (topic === 'acad' || (topic === 'pick' && !nS))) { toast('🔒 Темы Академии пока закрыты — сначала открой урок в Академии!'); if (topic === 'pick') pickTopics(); return; }
    if (!pool.length) { nS += nA; nA = 0; }
    scPrev('mix', diff); if (!CASE) return;
    const sch = nS ? TaskBank.pick(ids, nS, diff) : [], ab = bag(), wits = CASE.witnesses || [];
    const ac = Array.from({ length: nA }, (_, i) => mkAcad(ab(pool, 'p'), diff, wits[i] || null));
    const tasks = shuffle(sch.concat(ac)); if (tasks.length === 4) CASE.tasks = tasks;
    CASE.topic = topic === 'pick' ? 'pick' : 'all'; CASE.real = topic; // 'all' — бонус «вперемешку» (×1,5)
  };
  { const cc = closeCase; closeCase = function () { const real = CASE && CASE.real, d = CASE && CASE.diff; const r = cc.apply(this, arguments); if (real) { const b = $('#again'); if (b) { const nb = b.cloneNode(true); b.replaceWith(nb); nb.addEventListener('click', () => startCase(real, d)); } } return r; }; }
  { const mt = mountTask; mountTask = function (el, t) {
    const r = mt.apply(this, arguments);
    if (t && t.acad && el && el.parentElement) {
      $$('.wit-card', el.parentElement).forEach(x => x.remove());
      const a = t.wit || pick(E.ANIMALS), f = ((window.Lines.PERSONA || {})[a[1]] || {}).g === 'f', c = document.createElement('div'); c.className = 'story-card wit-card';
      c.innerHTML = `${typeof face === 'function' ? face(a, 'talking') : a[0]}<div><b>Допрос свидетеля — ${a[1]}</b><small>${pick([f ? 'Она видела вора! Но расскажет, только если ответишь на её вопрос.' : 'Он видел вора! Но расскажет, только если ответишь на его вопрос.', 'Свидетель из Академии проверяет, настоящий ли ты сыщик.', f ? 'Ответишь верно — она поделится уликой.' : 'Ответишь верно — он поделится уликой.'])} <i>${t.icon} ${t.subjName || ''}</i></small></div>`;
      el.before(c);
    }
    return r;
  }; }

  /* =====================================================================
     ⚡ БЫСТРЫЕ ЛАПКИ: сетка режимов, рекорды, без прокрутки
     ===================================================================== */
  const facts = []; for (let p = 2; p <= 9; p++) for (let q = 2; q <= 9; q++) facts.push([p, q]);
  const pickFact = last => { const w = facts.map(([p, q]) => 1 + 4 * ((S.facts || {})[factKey(p, q)] || 0) + (p * q > 20 ? 1 : 0)); const tot = w.reduce((x, y) => x + y, 0); let f; do { let r = Math.random() * tot; f = facts.find((_, i) => (r -= w[i]) < 0) || facts[0]; } while (last && f[0] === last[0] && f[1] === last[1]); return f; };
  const NUM = {
    tbl: { icon: '✖️', name: 'Таблица умножения', short: 'Таблица ×', gen: last => { const f = pickFact(last && last.f); return { t: `${f[0]} × ${f[1]}`, a: f[0] * f[1], f }; } },
    div: { icon: '➗', name: 'Деление по таблице', short: 'Деление :', gen: () => { const b = R(2, 9), q = R(2, 10); return { t: `${b * q} : ${b}`, a: q }; } },
    round: { icon: '🔟', name: '×10, ×100, ×1000 и деление', short: '×10 ×100', gen: () => { const k = [10, 100, 1000][R(0, 2)], n = R(2, 99); return Math.random() < 0.5 ? { t: `${n} · ${k}`, a: n * k } : { t: `${n * k} : ${k}`, a: n }; } },
    addsub: { icon: '➕', name: 'Сложение и вычитание в уме', short: 'В уме + −', gen: () => { const a = R(11, 99), b = R(11, 99); return Math.random() < 0.5 ? { t: `${a} + ${b}`, a: a + b } : { t: `${Math.max(a, b)} − ${Math.min(a, b)}`, a: Math.max(a, b) - Math.min(a, b) }; } },
    mul2: { icon: '💪', name: 'Двузначное × однозначное', short: '23 × 4', gen: () => { const a = R(12, 49), b = R(2, 9); return { t: `${a} × ${b}`, a: a * b }; } },
    mixall: { icon: '🌀', name: 'Всё вперемешку', short: 'Вперемешку', gen: last => NUM[pick(['tbl', 'div', 'round', 'addsub', 'mul2'])].gen(last) },
  };
  const MATH_KEYS = ['tbl', 'div', 'round', 'addsub', 'mul2', 'mixall'];
  try { Object.assign(Drills.MODES, { mul2: NUM.mul2 }); } catch (e) { }
  function factItems(s) { // короткие вопросы «правда/неправда» и «выбери» — для режима на скорость
    const out = [];
    s.units.forEach(u => unitQs(u).forEach(q => {
      const t = strip(q.q); if (!t || /текст|картин|рисун|на фото/i.test(t)) return;
      if (q.type === 'tf' && t.length <= 110) out.push({ t: q.q, opts: ['✅ Правда', '❌ Неправда'], c: q.c ? 0 : 1, why: q.why, fixed: true });
      else if (q.type === 'one' && t.length <= 90 && q.a.length <= 4 && q.a.every(x => strip(x).length <= 26)) out.push({ t: q.q, opts: q.a, c: q.c, why: q.why });
    }));
    return out;
  }
  const factSubs = () => acadSubs(false).filter(s => factItems(s).length >= 12);
  function getMode(key) {
    if (NUM[key]) return Object.assign({ key }, NUM[key]);
    const m = /^f:(\w+)$/.exec(key || ''), s = m && sbj(m[1]); if (!s || isSchool(s)) return null;
    const items = factItems(s); if (items.length < 6) return null; const b = bag();
    return { key, icon: s.icon, name: 'Факты: ' + s.name, short: s.name, choice: true, sid: s.id, gen: last => { let it; for (let t = 0; t < 5; t++) { it = b(items, 'f'); if (!last || it !== last.it) break; } const ord = it.fixed ? it.opts.map((x, i) => i) : shuffle(it.opts.map((x, i) => i)); return { t: it.t, opts: ord.map(i => it.opts[i]), c: ord.indexOf(it.c), it }; } };
  }
  const bestOf = k => k === 'tbl' ? S.st.blitz.best : ((S.drillBest || {})[k] || 0);
  SCREENS.blitz = () => {
    let sel = S.prefs.blitzMode; if (!getMode(sel)) sel = 'tbl';
    const fs = factSubs();
    const card = k => { const M = NUM[k], b = bestOf(k); return `<button class="bz-m" data-m="${k}"><span class="bz-i">${M.icon}</span><b>${M.short}</b><small>${b ? '🏆 ' + b : 'нет рекорда'}</small></button>`; };
    app.innerHTML = `${topbar('⚡ Быстрые лапки')}<div class="page bz2">
      <p class="bz-lead">60 секунд — сколько успеешь? Выбери режим:</p>
      <div class="bz-grid">${MATH_KEYS.map(card).join('')}</div>
      ${fs.length ? `<button class="bz-fp" id="bzfp"></button>` : ''}
      <div class="bz-sel" id="bzsel"></div>
      <button class="btn big pink bz-go" id="go">⚡ Старт!</button></div>`;
    const draw = () => {
      const M = getMode(sel), b = bestOf(sel); $$('[data-m]', app).forEach(x => x.classList.toggle('on', x.dataset.m === sel));
      const fp = $('#bzfp'); if (fp) { const fm = /^f:/.test(sel) ? getMode(sel) : null; fp.classList.toggle('on', !!fm); fp.innerHTML = `<span>🎓</span><b>Факты Академии</b><small>${fm ? fm.icon + ' ' + fm.short + (bestOf(sel) ? ' · 🏆 ' + bestOf(sel) : '') : 'правда или нет — выбери предмет'} ▾</small>`; }
      const weak = sel === 'tbl' ? Object.entries(S.facts || {}).sort((x, y) => y[1] - x[1]).slice(0, 4) : [];
      $('#bzsel').innerHTML = `<b>${M.icon} ${M.name}</b> · ${b ? `рекорд <b>${b}</b>` : 'поставь первый рекорд!'}${weak.length ? `<small>Чаще будут: ${weak.map(w => w[0]).join(', ')}</small>` : ''}`;
    };
    $$('[data-m]', app).forEach(x => x.addEventListener('click', () => { sel = x.dataset.m; S.prefs.blitzMode = sel; save(); SND.tap(); draw(); }));
    $('#bzfp')?.addEventListener('click', () => { SND.tap();
      const m = modal(`<h2>🎓 Факты Академии</h2><p class="small">60 секунд: правда или нет, выбери ответ. Какой предмет?</p><div class="bp-subs bz-fsubs">${fs.map(s => { const k = 'f:' + s.id, b = bestOf(k); return `<button class="bp-sub bz-f ${k === sel ? 'on' : ''}" data-fm="${k}" style="--c:${s.color || '#FFD9E6'}"><span>${s.icon}</span><b>${s.name}${b ? `<br><small>🏆 ${b}</small>` : ''}</b></button>`; }).join('')}</div><button class="btn" data-close>Закрыть</button>`, 'wide');
      $$('[data-fm]', m.el).forEach(x => x.addEventListener('click', () => { sel = x.dataset.fm; S.prefs.blitzMode = sel; save(); SND.tap(); m.close(); draw(); })); });
    $('#go').addEventListener('click', () => go('drill', sel));
    draw();
  };
  SCREENS.drill = mode => {
    const M = getMode(mode); if (!M) return go('blitz');
    S.prefs.blitzMode = M.key; save();
    const DUR = 60, misses = []; let t0 = Date.now(), score = 0, cur = M.gen(null), buf = '', lock = false, over = false;
    const prevBest = bestOf(M.key);
    app.innerHTML = `${topbar(M.icon + ' ' + M.name, 'blitz')}<div class="page bz-run${M.choice ? ' bz-choice' : ''}">
      <div class="timer"><i id="tb"></i></div>
      <div class="bz-stat"><span>⏱ <b id="dt">${DUR}</b> с</span><span class="bz-ok">✔ <b id="ds">0</b></span><span>🏆 ${prevBest}</span></div>
      <div class="bz-q" id="q"></div><div id="bzin">${M.choice ? '<div class="opts bz-opts" id="bzo"></div>' : numpad(false)}</div></div>`;
    const q = $('#q');
    const draw = (bad) => {
      window.__bz = cur;
      if (M.choice) { q.innerHTML = `<span id="dq" class="bz-fact">${cur.t}</span>`; $('#bzo').innerHTML = cur.opts.map((o, i) => `<button class="opt" data-i="${i}">${o}</button>`).join(''); return; }
      q.innerHTML = `<span id="dq">${cur.t}</span> = <span class="inp${bad ? ' bad' : ''}" id="dv">${bad != null ? bad : (buf || '?')}</span>`;
    };
    const hit = () => { score++; $('#ds').textContent = score; SND.tap(); catMood('happy', 400); cheer(true); q.classList.add('ok'); setTimeout(() => q.classList.remove('ok'), 150); cur = M.gen(cur); buf = ''; draw(); };
    const miss = (shownCorrect) => { lock = true; SND.bad(); cheer(false); if (cur.f) noteErr('tbl', factKey(cur.f[0], cur.f[1])); misses.push(M.choice ? strip(cur.t).slice(0, 60) + ' → ' + strip(cur.opts[cur.c]) : `${cur.t} = ${cur.a}`); shownCorrect(); setTimeout(() => { if (over) return; lock = false; cur = M.gen(cur); buf = ''; draw(); }, M.choice ? 900 : 800); };
    const end = () => {
      if (over) return; over = true; clearInterval(iv); keyHandler = null;
      const rec = score > prevBest; if (M.key === 'tbl') { S.st.blitz.games++; if (rec) S.st.blitz.best = score; } else { S.drillBest = S.drillBest || {}; if (rec) S.drillBest[M.key] = score; S.st.blitz.games++; }
      markDay(1); save();
      if (M.key === 'tbl') award(Math.floor(score / 3), score); else award(Math.min(15, Math.ceil(score / 2)), score * 2);
      if (M.key !== 'tbl' && score >= 25) awardGems(1, 'за молниеносные лапки!');
      if (window.Coach) { if (M.choice) { const cid = coachId(M.sid); if (cid) Coach.track(cid, Math.min(1, score / 15), { count: false }); } else Coach.track('blitz', Math.min(1, score / 25)); }
      if (rec && score) confetti(30); SND.win();
      $('.bz-run', app).innerHTML = `<div class="center bz-end"><div class="big-emoji">${score >= 20 ? '🏆' : score >= 10 ? '🥈' : '🐾'}</div><h2>${esc(S.kid)}, верных ответов: ${score}!</h2>${rec && score ? '<div class="perfect">Новый рекорд! 🎉</div>' : `<p>Рекорд: ${Math.max(prevBest, score)}</p>`}
        ${misses.length ? `<div class="misses"><b>Повтори:</b>${[...new Set(misses)].slice(0, 8).map(m => `<span class="chip">${m}</span>`).join('')}</div>` : ''}
        <div class="row-btns"><button class="btn big pink" id="again">Ещё раз!</button><button class="btn" data-go="blitz">Другие режимы</button></div></div>`;
      $('#again').addEventListener('click', () => go('drill', M.key));
    };
    draw();
    const iv = setInterval(() => { const left = DUR - (Date.now() - t0) / 1000; const tb = $('#tb'), dt = $('#dt'); if (tb) tb.style.width = Math.min(100, Math.max(0, left / DUR * 100)) + '%'; if (dt) dt.textContent = Math.max(0, Math.ceil(left)); if (left <= 0) end(); }, 100);
    cleanups.push(() => clearInterval(iv));
    if (window.Boosts) Boosts.timed(sec => { if (!over) t0 += sec * 1000; }, () => !over); // 🍭 леденец-заморозка: +10 с и в новых режимах «Быстрых лапок»
    if (M.choice) {
      $('#bzo').addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || lock || over) return; if (+b.dataset.i === cur.c) { b.classList.add('right'); hit(); } else { b.classList.add('wrong'); miss(() => { const rb = $(`#bzo .opt[data-i="${cur.c}"]`); if (rb) rb.classList.add('right'); }); } });
    } else {
      bindPad(app, { digit: d => {
        if (lock || over) return; if (buf.length >= 7) return; buf += d; draw(); const ans = String(cur.a);
        if (buf.length >= ans.length) { if (buf === ans) hit(); else miss(() => draw(nf(cur.a))); }
      }, back: () => { if (lock) return; buf = buf.slice(0, -1); draw(); }, ok: () => { if (lock || !buf) return; if (buf !== String(cur.a)) miss(() => draw(nf(cur.a))); } });
    }
    say(`Быстрее, лапки, ${S.kid || 'сыщик'}! ⚡`, 2500, { silent: true });
  };
  addNF('drill', 'blitz');

  /* =====================================================================
     🎮 ДЕТЕКТИВНЫЕ ИГРЫ: числа по выбору + две игры на вопросах Академии
     ===================================================================== */
  const GN = [['tbl', '✖️ Таблица'], ['div', '➗ Деление'], ['round', '🔟 ×10, ×100'], ['mul2', '💪 Двузначные'], ['addsub', '➕ В уме'], ['school', '📐 Темы школы']];
  const gnKey = () => (GN.some(x => x[0] === S.prefs.gameNums) ? S.prefs.gameNums : 'tbl');
  const gnMode = () => NUM[gnKey() === 'school' ? 'mixall' : gnKey()] || NUM.tbl;
  const schoolInputQ = () => { const us = ((sbj('math4') || {}).units || []).filter(u => typeof u.gen === 'function'); for (let t = 0; t < 40; t++) { const u = pick(us); let q; try { q = u && u.gen(R(1, 2)); } catch (e) { q = null; } if (q && q.type === 'input' && /^\d{1,6}$/.test(String(q.c))) return { u, q }; } return null; };
  if (typeof GAME_FN !== 'undefined') {
    const oChase = GAME_FN.chase, oMemo = GAME_FN.memo, oSafe = GAME_FN.safe;
    GAME_FN.chase = g => {
      if (gnKey() === 'tbl') return oChase(g);
      const Mo = gnMode(), st = gameShell(g, 1); $('#gdots').innerHTML = '';
      let cat = 0, thief = 40, buf = '', f = Mo.gen(null), done = false; const t0 = Date.now();
      $('#garea').innerHTML = `<div class="track"><span class="runner c" id="rc">🐱</span><span class="runner t" id="rt">${face(['🦝', 'Енот Тимоша'], '', 'happy')}</span><span class="finish">🏁</span></div><div class="ask-eq" id="cq"></div>${numpad(false)}`;
      st.say(`Вор убегает с конфетами! Каждый верный ответ — рывок вперёд. Примеры: <b>${Mo.name}</b>.`);
      const draw = () => { $('#rc').style.left = cat + '%'; $('#rt').style.left = thief + '%'; $('#cq').innerHTML = `${f.t} = <span class="inp">${buf || '?'}</span>`; };
      draw();
      const iv = setInterval(() => { if (done) return; thief += 0.8; draw(); if (thief >= 92) end(false); }, 600); cleanups.push(() => clearInterval(iv));
      function end(win) { if (done) return; done = true; clearInterval(iv); keyHandler = null; st.score = win ? Math.max(3, 10 - Math.floor((Date.now() - t0) / 9000)) : Math.round(cat / 15); st.rounds = 10; st.r = 1; finishGame(g, st); }
      bindPad($('#garea'), { digit: d => { if (done) return; buf += d; draw(); const ans = String(f.a); if (buf.length >= ans.length) { if (buf === ans) { cat = Math.min(95, cat + 7); SND.tap(); M.sfx('bounce'); } else { thief = Math.min(95, thief + 4); SND.bad(); if (f.f) noteErr('tbl', factKey(f.f[0], f.f[1])); } buf = ''; f = Mo.gen(f); draw(); if (cat >= thief - 3) end(true); } }, back: () => { buf = buf.slice(0, -1); draw(); } });
    };
    GAME_FN.memo = g => {
      if (gnKey() === 'tbl') return oMemo(g);
      const Mo = gnMode(), st = gameShell(g, 1); $('#gdots').innerHTML = '';
      const pairs = [], used = new Set(); for (let t = 0; t < 200 && pairs.length < 6; t++) { const f = Mo.gen(null); if (used.has(f.a) || used.has(f.t)) continue; used.add(f.a); used.add(f.t); pairs.push(f); }
      const cards = shuffle(pairs.flatMap((f, i) => [{ i, t: f.t }, { i, t: nf(f.a) }]));
      let open = [], found = 0, moves = 0, lock = false;
      st.say(`Найди пары: пример и его ответ (${Mo.name}). Запоминай, где что лежит! 🧠`);
      $('#garea').innerHTML = `<div class="memo">${cards.map((c, k) => `<button class="mc" data-k="${k}"><span class="mf">🐾</span><span class="mb">${c.t}</span></button>`).join('')}</div><p class="center small">Ходов: <b id="mv">0</b></p>`;
      $$('.mc', app).forEach(btn => btn.addEventListener('click', () => {
        if (lock || btn.classList.contains('flip')) return; btn.classList.add('flip'); SND.tap(); open.push(btn);
        if (open.length === 2) { moves++; $('#mv').textContent = moves; lock = true; const [x, y] = open.map(b => cards[+b.dataset.k]);
          if (x.i === y.i && x !== y) setTimeout(() => { open.forEach(b => b.classList.add('done')); open = []; lock = false; found++; SND.ok(); if (found === pairs.length) { st.score = Math.max(1, 10 - Math.max(0, moves - 8)); st.rounds = 10; st.r = 1; finishGame(g, st); } }, 350);
          else setTimeout(() => { open.forEach(b => b.classList.remove('flip')); open = []; lock = false; }, 900); }
      }));
    };
    GAME_FN.safe = g => {
      if (gnKey() === 'tbl') return oSafe(g);
      const st = gameShell(g, 4), code = [], school = gnKey() === 'school', Mo = gnMode(); let last = null;
      function round() {
        let txt, v, why = ''; if (school) { const sq = schoolInputQ(); if (sq) { txt = `<div class="q-text safe-q">${sq.u.icon} ${sq.q.q}</div><div class="ask-eq"><span class="inp" id="sin">?</span></div>`; v = +sq.q.c; why = sq.q.why || ''; } }
        if (v == null) { const f = Mo.gen(last); last = f; v = f.a; txt = `<div class="ask-eq">${f.t} = <span class="inp" id="sin">?</span></div>`; }
        let tries = 0, buf = '';
        $('#garea').innerHTML = `<div class="safe ${code.length === 4 ? 'open' : ''}"><div class="safe-door"><div class="dial">${[0, 1, 2, 3].map(k => `<span class="dg ${code[k] != null ? 'on' : ''}">${code[k] ?? '?'}</span>`).join('')}</div><div class="safe-wheel">⚙️</div></div></div>${txt}${numpad(true)}`;
        st.say(`Цифра №${st.r + 1} кода — это <b>последняя цифра ответа</b>.`);
        bindPad($('#garea'), { digit: d => { if (buf.length < 7) { buf += d; $('#sin').textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#sin').textContent = buf || '?'; }, ok: () => {
          if (+buf === v) { st.mark(true); code.push(v % 10); M.sfx('pop'); const dg = $$('.dg')[st.r]; if (dg) { dg.textContent = v % 10; dg.classList.add('on'); }
            if (code.length === 4) setTimeout(() => { const sf = $('.safe'); if (sf) sf.classList.add('open'); M.sfx('magic'); confetti(25); st.say(`🔓 Код <b>${code.join('')}</b> подошёл! Сейф открыт!`); }, 400);
            st.next(round, code.length === 4 ? 2200 : 900); }
          else { tries++; st.mistakes++; SND.bad(); M.sfx('drum'); buf = ''; $('#sin').textContent = '?'; st.say(tries < 2 ? '🚨 Сигнализация! Неверно. Посчитай ещё раз.' : `Ответ: <b>${nf(v)}</b>. ${why}`); if (tries >= 2) { keyHandler = null; code.push(v % 10); $$('#gdots i')[st.r].className = 'bad'; st.next(round, 2200); } }
        } });
      }
      round();
    };
  }
  /* «Улика или ложь» и «Сортировка улик» — работают для любого предмета Академии */
  function subjChooser(g, start) {
    const subs = acadSubs(false), cur = S.prefs.gameSubj || '*';
    $('#garea').innerHTML = `<p class="center"><b>Из какого предмета улики?</b></p><div class="gs-subs"><button class="bp-sub ${cur === '*' ? 'on' : ''}" data-s="*"><span>🌈</span><b>Все предметы</b></button>${subs.map(s => `<button class="bp-sub ${cur === s.id ? 'on' : ''}" data-s="${s.id}" style="--c:${s.color || '#FFD9E6'}"><span>${s.icon}</span><b>${s.name}</b></button>`).join('')}</div>`;
    $$('[data-s]', $('#garea')).forEach(b => b.addEventListener('click', () => { S.prefs.gameSubj = b.dataset.s; save(); SND.tap(); start(b.dataset.s === '*' ? subs : [sbj(b.dataset.s)].filter(Boolean)); }));
  }
  function truthItems(subs) {
    const out = [];
    subs.forEach(s => s.units.forEach(u => unitQs(u).forEach(q => {
      const t = strip(q.q); if (/текст|картин|рисун|на фото/i.test(t)) return;
      if (q.type === 'tf' && t.length <= 150) out.push({ t: q.q, c: !!q.c, why: q.why || '', icon: s.icon });
      else if (q.type === 'one' && t.length <= 100 && q.a.every(x => strip(x).length <= 40)) { const right = Math.random() < 0.5, j = right ? q.c : pick(q.a.map((_, i) => i).filter(i => i !== q.c)); out.push({ t: `${q.q} — <b>${q.a[j]}</b>`, c: right, why: `Правильный ответ: <b>${q.a[q.c]}</b>. ${q.why || ''}`, icon: s.icon }); }
    })));
    return out;
  }
  if (typeof GAMES !== 'undefined' && typeof GAME_FN !== 'undefined') {
    if (!GAMES.some(x => x.id === 'truth')) GAMES.push({ id: 'truth', icon: '🔦', name: 'Улика или ложь', desc: 'Правда или выдумка? Успей, пока горит фонарик!', skill: 'Знания Академии', kind: 'aq' });
    if (!GAMES.some(x => x.id === 'sortclue')) GAMES.push({ id: 'sortclue', icon: '🗂️', name: 'Сортировка улик', desc: 'Разложи улики по папкам дела', skill: 'Знания Академии', kind: 'aq' });
    GAME_FN.truth = g => {
      const N = 10, st = gameShell(g, N); st.say('Свидетели говорят разное. <b>Улика</b> — это правда, <b>ложь</b> — выдумка. На каждый ответ — 10 секунд!');
      subjChooser(g, subs => {
        const all = shuffle(truthItems(subs)); if (all.length < 3) { $('#garea').innerHTML = '<p class="center">Здесь пока мало вопросов 🙈</p>'; return; }
        const items = all.slice(0, N); while (items.length < N) items.push(all[items.length % all.length]);
        let tid = null;
        const round = () => {
          const it = items[st.r], q = { type: 'tf', q: it.t, c: it.c, why: it.why }; window.__aq = q; let done = false; const T0 = Date.now(), LIM = 10000;
          $('#garea').innerHTML = `<div class="timer tr-timer"><i id="trt"></i></div><div class="q-text tr-q">${it.icon} ${it.t}</div><div class="opts"><button class="opt" data-v="1">🔎 Улика (правда)</button><button class="opt" data-v="0">🤥 Ложь</button></div>`;
          const fin = (r, b) => { if (done) return; done = true; clearInterval(tid); st.mark(r); if (b) b.classList.add(r ? 'right' : 'wrong'); st.say(`${r ? '<div class="fb">✔ Верно!</div>' : `<div class="fb bad">${b ? 'Не так.' : '⏰ Время вышло!'}</div>`}Это <b>${it.c ? 'правда' : 'ложь'}</b>. ${it.why}`); st.nextBtn(round); };
          $$('.opt', $('#garea')).forEach(b => b.addEventListener('click', () => fin((b.dataset.v === '1') === it.c, b)));
          tid = setInterval(() => { const left = 1 - (Date.now() - T0) / LIM, e = $('#trt'); if (e) e.style.width = Math.max(0, left * 100) + '%'; if (left <= 0) fin(false, null); }, 100); cleanups.push(() => clearInterval(tid));
        };
        round();
      });
    };
    GAME_FN.sortclue = g => {
      const N = 4, st = gameShell(g, N); st.say('Разложи улики по папкам дела — нажимай на карточку, чтобы переложить её в другую папку.');
      subjChooser(g, subs => {
        const sorts = shuffle(subs.flatMap(s => s.units.flatMap(u => unitQs(u).filter(q => q.type === 'sort' && q.items.length <= 8)))), tfs = truthItems(subs);
        const round = () => {
          let q = sorts.length && (Math.random() < 0.6 || tfs.length < 6) ? sorts.shift() : null;
          if (!q) { const its = shuffle(tfs).slice(0, 6); q = { type: 'sort', q: 'Разложи улики: где правда, а где ложь?', groups: ['🔎 Правда', '🤥 Ложь'], items: its.map(i => [strip(i.t), i.c ? 0 : 1]), why: its.filter(i => !i.c).slice(0, 3).map(i => { const t = strip(i.t); return `🤥 «${t.length > 70 ? t.slice(0, 68) + '…' : t}» — ложь. ${strip(i.why)}`; }).join('<br>') }; }
          window.__aq = q; $('#garea').innerHTML = ACAD_Q.sort.render(q);
          ACAD_Q.sort.bind($('#garea'), q, (r, why) => { st.mark(r); st.say(`${r ? '<div class="fb">✔ Все улики на месте!</div>' : '<div class="fb bad">Есть ошибки — посмотри, куда нужно было.</div>'}${why || ''}`); st.nextBtn(round); });
        };
        if (!sorts.length && tfs.length < 6) { $('#garea').innerHTML = '<p class="center">Здесь пока мало вопросов 🙈</p>'; return; }
        round();
      });
    };
  }
  { const gm = SCREENS.games; SCREENS.games = arg => { gm(arg); const pg = $('.games-page', app); if (!pg) return; const k = gnKey();
    const h = $('h3', pg); if (!h) return;
    h.insertAdjacentHTML('beforebegin', `<div class="gn-box"><b>🔢 Примеры в играх</b><div class="gn-row">${GN.map(([v, n]) => `<button class="gn ${v === k ? 'on' : ''}" data-gn="${v}">${n}</button>`).join('')}</div><small>Для игр «Погоня», «Мемори» и «Сейф вора»</small></div>`);
    $$('[data-gn]', pg).forEach(b => b.addEventListener('click', () => { S.prefs.gameNums = b.dataset.gn; save(); SND.tap(); $$('[data-gn]', pg).forEach(x => x.classList.toggle('on', x === b)); }));
  }; }

  /* подписи плиток на главной */
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try { const b = $('.t-blitz small', app), g = $('.t-bug small', app), c = $('.t-case small', app); if (b) b.textContent = 'Счёт и факты на скорость'; if (g) g.textContent = 'Ошибки во всех темах'; if (c) c.textContent = 'Школа + Академия'; } catch (e) { } return r; }; }

  /* ---------- стили ---------- */
  const css = document.createElement('style'); css.id = 'v29-modes-css';
  css.textContent = `
.racc-q .racc-says { font-size: 16px; }
.q-ask { font-weight: 900; margin-top: 8px; font-size: 18px; }
.racc-ord { text-align: left; margin: 8px 0; padding-left: 26px; } .racc-ord li { padding: 2px 0; font-weight: 700; }
.racc-sort { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin: 8px 0; }
.rs-g { background: #fff; border-radius: 12px; padding: 8px; box-shadow: var(--sh); text-align: left; } .rs-g b { display: block; margin-bottom: 4px; } .rs-g span { display: inline-block; background: var(--plum-2, #EDE6FF); border-radius: 8px; padding: 2px 8px; margin: 2px; font-size: 14px; font-weight: 700; }
.rs-g.g1 span { background: var(--mint-2, #DDF7EC); } .rs-g.g2 span { background: var(--gold-2, #FFF0C9); }
.b3-why { margin: 10px 0; text-align: left; } .bugs3 .fb { margin-top: 6px; } .swap-pool .ord.ok { outline: 3px solid var(--mint, #4CC9A0); }
.bug-hub { background: #fff; border-radius: 18px; padding: 12px; box-shadow: var(--sh); margin: 0 0 14px; }
.bh-t { font-size: 16px; margin-bottom: 8px; } .bh-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; } .bh-row .btn { padding: 10px 6px; font-size: 14px; margin: 0; white-space: normal; line-height: 1.15; }
.bh-s { font-size: 13px; color: var(--muted); margin-top: 8px; }
@media (max-width: 420px) { .bh-row { grid-template-columns: 1fr 1fr; } .bh-row .bugs2-link { grid-column: 1 / -1; } }
.bugpick .bp-tabs { margin: 8px 0 12px; } .bp-tabs button { font-size: 16px; }
.bp-chip { display: inline-flex; align-items: center; gap: 4px; background: #fff; border-radius: 14px; padding: 9px 12px; margin: 3px; font-weight: 700; font-size: 15px; box-shadow: 0 3px 0 #E6D6C4; text-align: left; line-height: 1.2; }
.bp-chip.bp-all { display: flex; width: 100%; justify-content: center; background: var(--mint-2, #DDF7EC); font-size: 17px; padding: 12px; margin: 0 0 8px; }
.bp-chip.all { background: var(--pink-2); }
.bp-h { margin: 12px 0 4px; font-size: 16px; } .bp-chips { display: flex; flex-wrap: wrap; }
.bp-subs, .gs-subs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 46%), 1fr)); gap: 8px; margin: 6px 0; }
.bp-sub { display: flex; align-items: center; gap: 8px; background: #fff; border-radius: 14px; padding: 10px; box-shadow: 0 3px 0 #E6D6C4; text-align: left; border: 3px solid transparent; font-size: 14px; line-height: 1.15; }
.bp-sub span { font-size: 26px; width: 38px; height: 38px; border-radius: 12px; background: var(--c); display: grid; place-items: center; flex: none; } .bp-sub.on { border-color: var(--pink); }
/* «Новое дело» */
.nc2 { display: flex; flex-direction: column; gap: 8px; max-width: 560px; margin: 0 auto; }
.nc2 .nc-case { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 18px; padding: 6px 12px; box-shadow: var(--sh); margin: 0; }
.nc2 .nc-case .mini-cat { width: 52px; flex: none; } .nc-ct { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
.nc-no { font-size: 13px; font-weight: 800; color: #9C6B45; } .nc-ct b { font-size: 16px; line-height: 1.15; } /* длинное название дела переносится на 2 строки — экран всё равно влезает в 360×740 без прокрутки */ .nc-ct small { color: var(--muted); font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nc-step { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 17px; margin-top: 2px; }
.nc-n { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--pink); color: #fff; font-size: 15px; flex: none; } .nc-n.w { background: #fff; color: var(--pink); }
.newcase.nc2 .choice-grid.nc-topics { grid-template-columns: 1fr 1fr; gap: 8px; }
.newcase.nc2 .choice.nc-t { display: grid; grid-template-columns: 34px 1fr; grid-template-rows: auto auto; column-gap: 8px; padding: 9px 10px; text-align: left; border-width: 3px; min-height: 62px; }
.newcase.nc2 .choice.nc-t span { grid-row: span 2; font-size: 28px; } .newcase.nc2 .choice.nc-t b { font-size: 16px; line-height: 1.1; } .newcase.nc2 .choice.nc-t small { font-size: 12.5px; line-height: 1.15; }
.nc-classic { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; color: var(--muted); font-weight: 700; }
.newcase.nc2 .choice.nc-c { display: inline-flex; flex-direction: row; padding: 6px 10px; border-radius: 12px; border-width: 2px; font-size: 14px; font-weight: 800; box-shadow: 0 3px 0 rgba(59,42,74,.1); color: var(--ink); }
.nc2 .seg.diff { width: 100%; box-sizing: border-box; } .nc2 .seg.diff button { padding: 9px 6px; font-size: 15px; } .nc2 #dinfo { margin: 0; min-height: 1.3em; font-size: 13px; }
.nc2 .nc-go { margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; }
.tb-modal .tb-scroll { max-height: 62vh; overflow-y: auto; text-align: left; margin: 6px 0; padding-right: 4px; }
.tb-h { margin: 10px 0 4px; font-size: 17px; } .tb-h small { font-weight: 600; color: var(--muted); font-size: 13px; }
.tb-pick h4, .tb-acad h4 { margin: 8px 0 4px; font-size: 14px; color: var(--muted); }
.tb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.tb-chip { cursor: pointer; } .tb-chip input { position: absolute; opacity: 0; pointer-events: none; }
.tb-chip span { display: inline-block; padding: 7px 11px; border-radius: 14px; background: #F4ECE2; font-weight: 700; font-size: 14px; border: 2px solid transparent; }
.tb-chip input:checked + span { background: var(--pink-2); border-color: var(--pink); }
.tb-subj { background: #FFF9F2; border-radius: 12px; padding: 6px 10px; margin: 4px 0; } .tb-subj summary { font-weight: 800; cursor: pointer; padding: 4px 0; }
.tb-subj summary i { font-style: normal; background: var(--pink); color: #fff; border-radius: 10px; padding: 0 7px; font-size: 13px; margin-left: 4px; }
.wit-card { display: flex; align-items: center; gap: 10px; text-align: left; } .wit-card .pt { width: 58px; height: 58px; flex: none; font-size: 40px; }
.wit-card b { display: block; } .wit-card small { color: var(--muted); font-size: 13.5px; } .wit-card i { font-style: normal; white-space: nowrap; }
/* «Быстрые лапки» */
.bz2 { max-width: 560px; margin: 0 auto; display: flex; flex-direction: column; gap: 8px; }
.bz-lead { margin: 2px 0; text-align: center; font-weight: 700; }
.bz-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.bz-m { background: #fff; border-radius: 16px; padding: 8px 4px; box-shadow: 0 4px 0 #E6D6C4; border: 3px solid transparent; display: flex; flex-direction: column; align-items: center; gap: 1px; line-height: 1.15; }
.bz-m .bz-i { font-size: 26px; } .bz-m b { font-size: 14px; } .bz-m small { font-size: 12px; color: var(--muted); } .bz-m.on, .bz-f.on { border-color: var(--pink); background: #FFF7FA; }
.bz-sub { font-weight: 900; margin-top: 4px; } .bz-sub small { font-weight: 600; color: var(--muted); }
.bz-fp { display: grid; grid-template-columns: 34px 1fr; column-gap: 8px; align-items: center; text-align: left; background: #fff; border-radius: 16px; padding: 8px 12px; box-shadow: 0 4px 0 #E6D6C4; border: 3px solid transparent; } .bz-fp span { grid-row: span 2; font-size: 26px; } .bz-fp b { font-size: 15px; } .bz-fp small { color: var(--muted); font-size: 13px; } .bz-fp.on { border-color: var(--pink); background: #FFF7FA; }
.bz-f { background: #fff; border-radius: 12px; padding: 5px 9px; font-weight: 800; font-size: 13px; box-shadow: 0 3px 0 #E6D6C4; border: 3px solid transparent; white-space: nowrap; }
.bz-sel { background: #fff; border-radius: 16px; padding: 10px 12px; box-shadow: var(--sh); text-align: center; font-size: 15px; } .bz-sel small { display: block; color: var(--muted); font-size: 13px; margin-top: 2px; }
.bz-go { width: 100%; }
.bz-run { max-width: 520px; margin: 0 auto; display: flex; flex-direction: column; }
.bz-run .timer { margin: 4px 0 6px; height: 14px; }
.bz-stat { display: flex; justify-content: space-between; font-weight: 800; font-size: 17px; color: var(--muted); padding: 0 4px; } .bz-stat .bz-ok { color: var(--mint-d, #1E9C74); font-size: 20px; }
.bz-run .bz-q { margin: 8px 0 12px; padding: 12px; text-align: center; font-size: clamp(36px, 10vw, 56px); }
.bz-run.bz-choice .bz-q { font-size: 19px; font-weight: 800; min-height: 96px; display: grid; place-items: center; line-height: 1.3; }
.bz-run .pad .k { height: clamp(52px, 8.4vh, 64px); }
.bz-opts { grid-template-columns: 1fr 1fr; } .bz-opts .opt { min-height: 64px; font-size: 17px; }
.bz-end .misses { margin: 8px 0; }
/* игры */
.gn-box { background: #fff; border-radius: 16px; padding: 10px 12px; box-shadow: var(--sh); margin: 8px 0 12px; }
.gn-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 6px 0 4px; } .gn-box small { color: var(--muted); font-size: 13px; }
.gn { background: #F4ECE2; border-radius: 12px; padding: 7px 10px; font-weight: 800; font-size: 14px; border: 2px solid transparent; } .gn.on { background: var(--pink-2); border-color: var(--pink); }
.tr-timer { height: 12px; } .tr-q { min-height: 70px; } .safe-q { font-size: 16px; text-align: left; }
`;
  document.head.appendChild(css);

  return { okQ, unitQs, qFromUnit, bugFromQ, bugSource, schoolEntries, acadSubs, factItems, getMode, NUM, VAR, CORE_BUG, truthItems };
})();
window.Modes = Modes;
