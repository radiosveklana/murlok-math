/* engine.js — математика и генераторы, без DOM (проверяется в node) */
(function (root) {
'use strict';
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const digitsOf = n => String(n).split('').map(Number);
function plural(n, a, b, c) { n = Math.abs(n) % 100; const n1 = n % 10; if (n > 10 && n < 20) return c; if (n1 > 1 && n1 < 5) return b; if (n1 === 1) return a; return c; }

/* ================= УМНОЖЕНИЕ СТОЛБИКОМ ================= */
const MUL_LEVELS = {
  1: { name: '2 × 1', hint: 'двузначное на однозначное', shapes: [[2, 1], [3, 1]] },
  2: { name: '2 × 2', hint: 'двузначное на двузначное', shapes: [[2, 2]] },
  3: { name: '3 × 2', hint: 'трёхзначное на двузначное', shapes: [[3, 2]] },
  4: { name: '3 × 3', hint: 'трёх- и четырёхзначные', shapes: [[3, 3], [4, 2]] },
};
function numWithDigits(n, noZero) {
  let s = '' + rnd(1, 9);
  for (let i = 1; i < n; i++) s += (noZero || Math.random() > 0.15) ? rnd(1, 9) : 0;
  return +s;
}
function hasCarry(a, b) { return digitsOf(b).some(d => digitsOf(a).some(x => x * d >= 10)); }
function genMul(level) {
  const [na, nb] = pick(MUL_LEVELS[level].shapes);
  for (let t = 0; t < 300; t++) {
    const a = numWithDigits(na, false), b = numWithDigits(nb, true);
    if (a % 10 === 0) continue;
    const bd = digitsOf(b);
    if (bd.includes(1) && Math.random() < 0.7) continue;
    if (!hasCarry(a, b)) continue;
    return [a, b];
  }
  return [324, 23];
}
/* План решения: строки (неполные произведения), шаги для пошагового режима */
function mulPlan(a, b) {
  const A = digitsOf(a).reverse(), B = digitsOf(b).reverse(); // [0] = единицы
  const rows = B.map((bd, i) => ({ bd, i, val: a * bd, shift: i, carries: [] }));
  const steps = [];
  rows.forEach((r, i) => {
    if (i > 0) steps.push({ t: 'shift', row: i, bd: r.bd });
    let carry = 0;
    A.forEach((ad, j) => {
      const v = r.bd * ad + carry, last = j === A.length - 1;
      steps.push({ t: 'mul', row: i, j, bd: r.bd, ad, carry, v, last, col: i + j, first: j === 0 });
      if (!last) { carry = Math.floor(v / 10); r.carries[j + 1] = carry; }
    });
  });
  const total = a * b;
  const sumCarries = [];
  if (B.length > 1) {
    const maxCol = Math.max(...rows.map(r => String(r.val).length + r.shift)) - 1;
    let carry = 0;
    for (let c = 0; c <= maxCol; c++) {
      const parts = [];
      rows.forEach(r => {
        const p = c - r.shift, s = String(r.val);
        if (p < 0) parts.push(0); else if (p < s.length) parts.push(+s[s.length - 1 - p]);
      });
      const v = parts.reduce((x, y) => x + y, 0) + carry, last = c === maxCol;
      steps.push({ t: 'add', col: c, parts, carry, v, last, first: c === 0 });
      if (!last) { carry = Math.floor(v / 10); sumCarries[c + 1] = carry; }
    }
  }
  return { a, b, A, B, rows, total, steps, sumCarries };
}
/* значение строки, если «забыть» перенос в разряд jDrop */
function mulDropCarry(a, bd, jDrop) {
  const A = digitsOf(a).reverse(); let carry = 0; const out = [];
  A.forEach((ad, j) => {
    const v = ad * bd + (j === jDrop ? 0 : carry);
    if (j === A.length - 1) out.unshift(...String(v)); else { out.unshift(v % 10); carry = Math.floor(v / 10); }
  });
  return +out.join('');
}

/* ================= УРАВНЕНИЯ ================= */
const SYM = { '+': '+', '-': '−', '*': '·', '/': ':' };
const fam = op => (op === '+' || op === '-') ? 1 : 2;
let _id = 0;
const EQ_LEVELS = {
  1: { name: 'Простые', hint: 'одно действие', depth: 1, xMax: 90, nMax: 100, mMax: 9 },
  2: { name: 'Составные', hint: 'два действия', depth: 2, xMax: 40, nMax: 200, mMax: 9 },
  3: { name: 'Составные+', hint: 'большие числа', depth: 2, xMax: 150, nMax: 1000, mMax: 12 },
  4: { name: 'Тройные', hint: 'три действия', depth: 3, xMax: 40, nMax: 1000, mMax: 9 },
};
function genEq(level) {
  const L = EQ_LEVELS[level];
  for (let t = 0; t < 3000; t++) {
    const x = rnd(2, L.xMax);
    let node = { k: 'x' }, val = x, ok = true, prevFam = 0;
    for (let d = 0; d < L.depth; d++) {
      let op; do { op = pick(['+', '-', '*', '/']); } while (fam(op) === prevFam);
      prevFam = fam(op);
      const right = Math.random() < 0.4;
      const half = Math.max(12, Math.floor(L.nMax / 2));
      let b, nv;
      if (op === '+') { b = rnd(2, Math.min(half, 99 + (level > 2 ? 400 : 0))); nv = val + b; }
      else if (op === '-') {
        if (!right) { if (val < 4) { ok = false; break; } b = rnd(1, val - 1); nv = val - b; }
        else { b = val + rnd(1, half); nv = b - val; }
      } else if (op === '*') { b = rnd(2, L.mMax); nv = val * b; }
      else {
        if (!right) {
          const ds = []; for (let k = 2; k <= L.mMax; k++) if (val % k === 0 && val / k >= 2) ds.push(k);
          if (!ds.length) { ok = false; break; } b = pick(ds); nv = val / b;
        } else { const k = rnd(2, L.mMax); b = val * k; nv = k; }
      }
      if (b > L.nMax || nv > L.nMax || nv < 1 || b < 1) { ok = false; break; }
      const bn = { k: 'n', v: b }, id = ++_id;
      node = right ? { k: 'op', op, l: bn, r: node, id } : { k: 'op', op, l: node, r: bn, id };
      val = nv;
    }
    if (!ok) continue;
    return { lhs: node, rhs: val, x };
  }
  return genEq(1);
}
const containsX = n => n.k === 'x' || (n.k === 'op' && (containsX(n.l) || containsX(n.r)));
const needBr = (c, p) => c.k === 'op' && !(fam(c.op) === 2 && fam(p.op) === 1);
function calc(p, op, q) { return op === '+' ? p + q : op === '-' ? p - q : op === '*' ? p * q : p / q; }
function evalE(n, x) { return n.k === 'x' ? x : n.k === 'n' ? n.v : calc(evalE(n.l, x), n.op, evalE(n.r, x)); }
/* o: {xv, box, tapOps} */
function eqHTML(n, o = {}) {
  if (n.k === 'x') { const s = o.xv != null ? `<span class="sub">${o.xv}</span>` : '<i class="x">x</i>'; return o.box === 'x' ? `<span class="box">${s}</span>` : s; }
  if (n.k === 'n') return `<span class="n">${n.v}</span>`;
  const side = c => needBr(c, n) ? `<span class="br">(</span>${eqHTML(c, o)}<span class="br">)</span>` : eqHTML(c, o);
  const opEl = o.tapOps ? `<button class="op tap" data-op="${n.id}">${SYM[n.op]}</button>` : `<span class="op">${SYM[n.op]}</span>`;
  let s = `${side(n.l)}${opEl}${side(n.r)}`;
  if (o.box === n.id) s = `<span class="box">${s}</span>`;
  return s;
}
function eqText(n, xv) {
  if (n.k === 'x') return xv != null ? String(xv) : 'x';
  if (n.k === 'n') return String(n.v);
  const side = c => needBr(c, n) ? `(${eqText(c, xv)})` : eqText(c, xv);
  return `${side(n.l)} ${SYM[n.op]} ${side(n.r)}`;
}
/* цепочка вычислений для проверки: изнутри наружу */
function evalChain(n, x) {
  const out = [];
  (function go(m) { if (m.k !== 'op') return evalE(m, x); const l = go(m.l), r = go(m.r), v = calc(l, m.op, r); out.push(`${l} ${SYM[m.op]} ${r} = ${v}`); return v; })(n);
  return out;
}
const ROLES = {
  add: { name: 'слагаемое', gen: 'неизвестное слагаемое', f: (c, b) => [c, '-', b], wrong: (c, b) => [[c, '+', b], [b, '-', c]],
    rule: 'Чтобы найти неизвестное слагаемое, нужно из суммы вычесть известное слагаемое.',
    hint: 'Слагаемое — это часть суммы. Чтобы найти часть, из целого вычитают другую часть.' },
  minuend: { name: 'уменьшаемое', gen: 'неизвестное уменьшаемое', f: (c, b) => [c, '+', b], wrong: (c, b) => [[c, '-', b], [b, '-', c]],
    rule: 'Чтобы найти неизвестное уменьшаемое, нужно к разности прибавить вычитаемое.',
    hint: 'Уменьшаемое — самое большое число в вычитании, из него отнимали. Значит, его находим сложением.' },
  subtrahend: { name: 'вычитаемое', gen: 'неизвестное вычитаемое', f: (c, b) => [b, '-', c], wrong: (c, b) => [[c, '-', b], [c, '+', b]],
    rule: 'Чтобы найти неизвестное вычитаемое, нужно из уменьшаемого вычесть разность.',
    hint: 'Вычитаемое — это сколько отняли. Из большого числа (уменьшаемого) вычитаем то, что осталось (разность).' },
  factor: { name: 'множитель', gen: 'неизвестный множитель', f: (c, b) => [c, '/', b], wrong: (c, b) => [[c, '*', b], [b, '/', c]],
    rule: 'Чтобы найти неизвестный множитель, нужно произведение разделить на известный множитель.',
    hint: 'Множитель находим делением: произведение делим на другой множитель.' },
  dividend: { name: 'делимое', gen: 'неизвестное делимое', f: (c, b) => [c, '*', b], wrong: (c, b) => [[c, '/', b], [b, '/', c]],
    rule: 'Чтобы найти неизвестное делимое, нужно частное умножить на делитель.',
    hint: 'Делимое — самое большое число в делении, его делили на части. Значит, его находим умножением.' },
  divisor: { name: 'делитель', gen: 'неизвестный делитель', f: (c, b) => [b, '/', c], wrong: (c, b) => [[c, '/', b], [c, '*', b]],
    rule: 'Чтобы найти неизвестный делитель, нужно делимое разделить на частное.',
    hint: 'Делитель находим делением: большое число (делимое) делим на частное.' },
};
const ROLE_ORDER = ['add', 'minuend', 'subtrahend', 'factor', 'dividend', 'divisor'];
const PART_NAMES = { '+': ['слагаемое', 'слагаемое', 'сумма'], '-': ['уменьшаемое', 'вычитаемое', 'разность'], '*': ['множитель', 'множитель', 'произведение'], '/': ['делимое', 'делитель', 'частное'] };
function roleOf(op, xLeft) { return op === '+' ? 'add' : op === '*' ? 'factor' : op === '-' ? (xLeft ? 'minuend' : 'subtrahend') : (xLeft ? 'dividend' : 'divisor'); }
function eqSteps(eq) {
  const steps = []; let node = eq.lhs, c = eq.rhs;
  while (node.k === 'op') {
    const xLeft = containsX(node.l), Ex = xLeft ? node.l : node.r, b = (xLeft ? node.r : node.l).v;
    const role = roleOf(node.op, xLeft), f = ROLES[role].f(c, b), newC = calc(...f);
    steps.push({ node, E: Ex, b, c, role, f, newC, xLeft, single: node.l.k !== 'op' && node.r.k !== 'op' });
    node = Ex; c = newC;
  }
  return steps;
}

/* ================= ОШИБКИ ЕНОТА ================= */
function genMulBug(level) {
  const lv = level >= 2 ? pick([3, 3, 4]) : 2;
  const [a, b] = genMul(lv);
  const plan = mulPlan(a, b);
  const rows = plan.rows.map(r => ({ val: r.val, shift: r.shift, bd: r.bd }));
  let type = pick(['tbl', 'carry', 'carry', 'shift', 'add']), wrong;
  if (type === 'carry') {
    const cand = plan.rows.filter(r => r.carries.some((c, j) => c > 0 && j > 0));
    if (!cand.length) type = 'tbl';
    else { const r = pick(cand); const js = r.carries.map((c, j) => c > 0 ? j : -1).filter(j => j > 0); rows[r.i].val = mulDropCarry(a, r.bd, pick(js)); wrong = 'p' + r.i; }
  }
  if (type === 'tbl') {
    const ri = rnd(0, rows.length - 1), s = String(rows[ri].val).split('').map(Number);
    const p = rnd(0, s.length - 1); let nd;
    do { nd = s[p] + pick([-2, -1, 1, 2]); } while (nd < 0 || nd > 9 || (p === 0 && nd === 0));
    s[p] = nd; rows[ri].val = +s.join(''); wrong = 'p' + ri;
  }
  if (type === 'shift') { rows[1].shift = 0; wrong = 'p1'; }
  let sum = rows.reduce((t, r) => t + r.val * 10 ** r.shift, 0);
  if (type === 'add') {
    const s = String(sum).split('').map(Number); const p = rnd(0, s.length - 1); let nd;
    do { nd = s[p] + pick([-1, 1]); } while (nd < 0 || nd > 9 || (p === 0 && nd === 0));
    s[p] = nd; sum = +s.join(''); wrong = 's';
  }
  return { a, b, rows, sum, type, wrong, plan };
}
function genEqBug(level) {
  for (let t = 0; t < 400; t++) {
    const eq = genEq(level), st = eqSteps(eq);
    const k = rnd(0, st.length - 1), type = pick(['rule', 'rule', 'calc']);
    const lines = []; let c = eq.rhs, bad = -1, valid = true;
    st.forEach((s, i) => {
      let f = ROLES[s.role].f(c, s.b);
      if (i === k && type === 'rule') f = pick(ROLES[s.role].wrong(c, s.b));
      let v = calc(...f);
      if (!Number.isInteger(v) || v < 0) valid = false;
      lines.push({ kind: 'expr', E: s.E, f, step: s }); if (i === k && type === 'rule') bad = lines.length - 1;
      if (i === k && type === 'calc') { v = v + pick([-10, -2, -1, 1, 2, 10]); if (v < 0) valid = false; }
      lines.push({ kind: 'val', E: s.E, v, step: s, f }); if (i === k && type === 'calc') bad = lines.length - 1;
      c = v;
    });
    if (!valid || bad < 0) continue;
    return { eq, lines, bad, type, k, steps: st };
  }
  return null;
}

/* ================= ДЕЛА (детективная часть) ================= */
const ANIMALS = [['🦝', 'Енот Тимоша'], ['🦊', 'Лиса Алиса'], ['🐭', 'Мышка Пискля'], ['🐶', 'Пёс Барбос'], ['🦉', 'Сова Соня'], ['🐹', 'Хомяк Хрум'], ['🐰', 'Кролик Пушок'], ['🐿️', 'Белка Шустрик'], ['🐻', 'Мишка Топтыжка'], ['🐷', 'Свинка Хрюша'], ['🐸', 'Лягушонок Квак'], ['🐧', 'Пингвин Пинг'], ['🦔', 'Ёжик Колючка'], ['🐼', 'Панда Бао'], ['🐯', 'Тигрёнок Полосатик'], ['🐨', 'Коала Эвкалиптик'], ['🐵', 'Обезьянка Чичи'], ['🦁', 'Львёнок Лёва'], ['🐮', 'Бурёнка Мила'], ['🐺', 'Волчонок Вуди'], ['🦄', 'Единорожка Искорка'], ['🐲', 'Дракоша Пыхалка'], ['🦒', 'Жирафик Тянучка'], ['🐙', 'Осьминожка Лапочка'], ['🦜', 'Попугай Кеша'], ['🐊', 'Крокодильчик Тото']];
const CX = root.CASES_EXTRA || (typeof global !== 'undefined' && global.CASES_EXTRA) || {}; (CX.animals || []).forEach(x => { if (!ANIMALS.some(y => y[1] === x[1])) ANIMALS.push(x); }); // + новые персонажи
const ATTRS = {
  hat: { label: 'Шляпа', vals: [{ e: '🎩', w: 'в цилиндре' }, { e: '🧢', w: 'в кепке' }, { e: '👒', w: 'в панаме' }, { e: '🎀', w: 'с бантиком' }],
    clue: v => `Свидетель запомнил: вор был ${v.w} ${v.e}` },
  scarf: { label: 'Шарф', vals: [{ c: '#E6455A', w: 'красного', n: 'красный' }, { c: '#3D8BFD', w: 'синего', n: 'синий' }, { c: '#2FB37A', w: 'зелёного', n: 'зелёный' }, { c: '#FFC23D', w: 'жёлтого', n: 'жёлтый' }],
    clue: v => `На заборе остались нитки от шарфа <b style="color:${v.c}">${v.w}</b> цвета 🧣` },
  sweet: { label: 'Любит', vals: [{ e: '🍩', w: 'пончики' }, { e: '🍭', w: 'леденцы' }, { e: '🧁', w: 'капкейки' }, { e: '🍫', w: 'шоколад' }],
    clue: v => `У витрины нашли крошки. Вор обожает ${v.w} ${v.e}` },
  item: { label: 'С собой', vals: [{ e: '🎒', w: 'с рюкзаком' }, { e: '☂️', w: 'с зонтиком' }, { e: '👓', w: 'в очках' }, { e: '🎈', w: 'с воздушным шариком' }],
    clue: v => `Камера наблюдения сняла вора: он был ${v.w} ${v.e}` },
};
const CRIMES = [
  { title: 'Пропавший торт', place: 'кондитерской «Сладкая лапка»', what: 'огромный клубничный торт 🎂' },
  { title: 'Исчезнувшие пончики', place: 'пекарне «Пышка»', what: 'целую коробку пончиков 🍩' },
  { title: 'Тайна мармеладного сундука', place: 'Мармеладном банке', what: 'сундук с мармеладом 🍬' },
  { title: 'Кража на ярмарке', place: 'Осенней ярмарке', what: 'корзину карамельных яблок 🍎' },
  { title: 'Похищенный рецепт', place: 'кафе «Мур-Мур»', what: 'секретный рецепт эклеров 📜' },
  { title: 'Шоколадный переполох', place: 'шоколадной фабрике', what: 'золотую шоколадку 🍫' },
  { title: 'Ночное печенье', place: 'школьной столовой', what: 'противень с печеньем 🍪' },
  { title: 'Мороженое пропало!', place: 'парке у фонтана', what: 'тележку с мороженым 🍦' },
  { title: 'Загадка медового пирога', place: 'чайной «Самовар»', what: 'медовый пирог 🥧' },
  { title: 'Леденцовый след', place: 'магазине игрушек', what: 'банку радужных леденцов 🍭' },
  { title: 'Тайна вишнёвого варенья', place: 'бабушкином погребе', what: 'три банки вишнёвого варенья 🍒' },
  { title: 'Пропажа на дне рождения', place: 'празднике у Зайчихи', what: 'все капкейки с праздничного стола 🧁' },
  { title: 'Тайна ночного маяка', place: 'старом маяке', what: 'мешок карамелек-светлячков 🍬' },
  { title: 'Призрак в библиотеке', place: 'городской библиотеке', what: 'книгу рецептов волшебных пирожных 📕' },
  { title: 'Загадка снежного торта', place: 'зимнем катке', what: 'торт-снеговик ☃️' },
  { title: 'Пропавшие пряники', place: 'музее игрушек', what: 'расписные пряники 🍪' },
  { title: 'Дело о лунном печенье', place: 'обсерватории', what: 'печенье в форме луны 🌙' },
  { title: 'Пиратский клад', place: 'порту Сладкограда', what: 'сундук шоколадных монет 🪙' },
  { title: 'Исчезновение в цирке', place: 'цирке-шапито', what: 'гору сахарной ваты 🍭' },
  { title: 'Тайна поезда-мармеладки', place: 'игрушечном поезде', what: 'вагон мармеладных мишек 🐻' },
  { title: 'Секрет старого замка', place: 'замке на холме', what: 'королевский пудинг 🍮' },
  { title: 'Дело о пропавшем мороженщике', place: 'летнем пляже', what: 'целый холодильник эскимо 🍦' },
  { title: 'Кража на конкурсе тортов', place: 'большом конкурсе кондитеров', what: 'торт-победитель 🏆' },
  { title: 'Туманная загадка', place: 'туманном парке', what: 'корзинку булочек с корицей 🥐' },
  { title: 'Тайна подводного кафе', place: 'подводном кафе «Медуза»', what: 'жемчужный торт 🐚' },
  { title: 'Кража в оранжерее', place: 'волшебной оранжерее', what: 'конфеты-цветы 🌺' },
  { title: 'Загадка воздушного шара', place: 'фестивале воздушных шаров', what: 'корзину пирожков 🎈' },
  { title: 'Пропажа в зоопарке', place: 'городском зоопарке', what: 'бананы для обезьянок 🍌' },
  { title: 'Секрет кукольного театра', place: 'кукольном театре', what: 'сундучок леденцов 🎭' },
  { title: 'Дело о ледяном дворце', place: 'ледяном дворце', what: 'мороженое-корону 👑' },
  { title: 'Тайна старой мельницы', place: 'старой мельнице', what: 'мешок сахарной пудры 🌾' },
  { title: 'Пропажа на космодроме', place: 'игрушечном космодроме', what: 'космические батончики 🚀' },
  { title: 'Загадка пиратского корабля', place: 'пиратском корабле', what: 'бочонок карамели 🏴‍☠️' },
  { title: 'Дело о радужном водопаде', place: 'у радужного водопада', what: 'радужные мармеладки 🌈' },
  { title: 'Тайна ночного рынка', place: 'ночном рынке', what: 'фонарик с конфетами 🏮' },
  { title: 'Кража в конфетной шахте', place: 'конфетной шахте', what: 'шоколадные самоцветы 💎' },
];
(CX.crimes || []).forEach(c => { if (!CRIMES.some(x => x.title === c.title)) CRIMES.push(c); }); // + новые преступления

function genCase(n) {
  const crime = pick(CRIMES), order = shuffle(Object.keys(ATTRS));
  const culprit = {}; order.forEach(a => { culprit[a] = rnd(0, 3); });
  const list = [{ ...culprit, culprit: true }];
  for (let k = 0; k < 4; k++) {
    const s = { ...culprit, culprit: false }, a = order[k];
    s[a] = (culprit[a] + rnd(1, 3)) % 4;
    for (let m = k + 1; m < 4; m++) if (Math.random() < 0.45) s[order[m]] = rnd(0, 3);
    s.out = k; // на какой улике отпадает
    list.push(s);
  }
  const animals = shuffle(ANIMALS).slice(0, 5);
  const suspects = shuffle(list).map((s, i) => ({ ...s, animal: animals[i] }));
  const clues = order.map(a => ({ attr: a, text: ATTRS[a].clue(ATTRS[a].vals[culprit[a]]) }));
  return { n, crime, suspects, order, culprit, clues };
}
/* какая из найденных улик противоречит подозреваемому */
function alibi(c, s, found) {
  for (let k = 0; k < found; k++) { const a = c.order[k]; if (s[a] !== c.culprit[a]) return k; }
  return -1;
}

const api = { rnd, pick, shuffle, digitsOf, plural, MUL_LEVELS, genMul, mulPlan, mulDropCarry, SYM, fam, EQ_LEVELS, genEq, containsX, calc, evalE, eqHTML, eqText, evalChain, ROLES, ROLE_ORDER, PART_NAMES, eqSteps, genMulBug, genEqBug, ANIMALS, ATTRS, CRIMES, genCase, alibi };
if (typeof module !== 'undefined') module.exports = api; else root.Engine = api;
})(this);
