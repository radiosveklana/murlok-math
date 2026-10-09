window.SUBJECTS = window.SUBJECTS || {};
(function () {
  // ───────────────────────── помощники
  function R(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function plural(n, f1, f2, f5) { n = Math.abs(n) % 100; var n1 = n % 10; if (n > 10 && n < 20) return f5; if (n1 > 1 && n1 < 5) return f2; if (n1 === 1) return f1; return f5; }
  function fmt(n) { var s = String(n); if (s.length < 5) return s; return s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function pn(n, f1, f2, f5) { return fmt(n) + ' ' + plural(n, f1, f2, f5); }
  function rub(n) { return pn(n, 'рубль', 'рубля', 'рублей'); }
  function hrs(n) { return pn(n, 'час', 'часа', 'часов'); }
  function mins(n) { return pn(n, 'минуту', 'минуты', 'минут'); }
  function secs(n) { return pn(n, 'секунду', 'секунды', 'секунд'); }
  function raz(n) { return n + ' ' + plural(n, 'раз', 'раза', 'раз'); }
  function L3(level) { level = level | 0; return level < 1 ? 1 : level > 3 ? 3 : level; }
  function byL(L, a) { return a[L - 1]; }
  function one(q, correct, wrongs, why) {
    var c = String(correct), opts = [c];
    for (var i = 0; i < wrongs.length && opts.length < 4; i++) {
      var w = String(wrongs[i]);
      if (w && opts.indexOf(w) < 0 && !/NaN|undefined|Infinity|null/.test(w)) opts.push(w);
    }
    var n = Number(c.replace(/[\s ]/g, '')), k = 1;
    while (opts.length < 3 && !isNaN(n) && k < 60) { var cand = fmt(n + k * (k % 2 ? 1 : 10)); if (opts.indexOf(cand) < 0) opts.push(cand); k++; }
    opts = shuffle(opts);
    return { type: 'one', q: q, a: opts, c: opts.indexOf(c), why: why };
  }
  function nums(arr) { return arr.filter(function (x) { return typeof x === 'number' && x >= 0 && Math.floor(x) === x; }).map(fmt); }
  var SIGNS = ['&gt;', '&lt;', '='];
  function sign(a, b) { return a > b ? '&gt;' : a < b ? '&lt;' : '='; }
  function signQ(q, a, b, why) { var s = sign(a, b); return one(q, s, SIGNS.filter(function (x) { return x !== s; }), why); }

  // персонажи: имя, женский род, родительный падеж
  var CH = [['Енот', 0, 'Енота'], ['Лиса', 1, 'Лисы'], ['Белочка', 1, 'Белочки'], ['Ёжик', 0, 'Ёжика'], ['Мышонок', 0, 'Мышонка'], ['Зайчиха', 1, 'Зайчихи'], ['Барсук', 0, 'Барсука'], ['Сова', 1, 'Совы'], ['Бобёр', 0, 'Бобра'], ['Хомячок', 0, 'Хомячка'], ['Кошка Мурка', 1, 'Кошки Мурки'], ['Медвежонок', 0, 'Медвежонка']];
  function mk(c) { return { n: c[0], f: c[1], g: c[2], v: function (m, f) { return c[1] ? f : m; } }; }
  function who() { return mk(pick(CH)); }
  function whoN(k) { return shuffle(CH).slice(0, k).map(mk); }

  // число прописью (до 1 000 000)
  var U1 = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  var U1F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
  var TEEN = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
  var TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
  var HUN = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
  function w3(n, fem) { var h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), u = n % 10, r = []; if (h) r.push(HUN[h]); if (t === 1) r.push(TEEN[u]); else { if (t) r.push(TENS[t]); if (u) r.push((fem ? U1F : U1)[u]); } return r.join(' '); }
  function words(n) { if (n === 0) return 'ноль'; if (n === 1000000) return 'один миллион'; var th = Math.floor(n / 1000), r = n % 1000, p = []; if (th) p.push(w3(th, true) + ' ' + plural(th, 'тысяча', 'тысячи', 'тысяч')); if (r) p.push(w3(r, false)); return p.join(' '); }
  function pad3(n) { return ('00' + n).slice(-3); }

  var RAZ = ['единиц', 'десятков', 'сотен', 'единиц тысяч', 'десятков тысяч', 'сотен тысяч'];
  var RAZN = ['единицы', 'десятки', 'сотни', 'единицы тысяч', 'десятки тысяч', 'сотни тысяч'];
  function dig(n, p) { return Math.floor(n / Math.pow(10, p)) % 10; }
  function bigNum(L) {
    if (L === 1) return R(1000, 99999);
    if (L === 2) return R(100000, 999999);
    var d = [R(1, 9)]; for (var i = 0; i < 5; i++) d.push(Math.random() < 0.45 ? 0 : R(1, 9)); return +d.join('');
  }
  function numVariants(n) {
    var s = String(n), out = [];
    for (var i = 0; i < s.length - 1; i++) if (s[i] !== s[i + 1]) { var a = s.split(''); var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; if (a[0] !== '0') out.push(+a.join('')); }
    var th = Math.floor(n / 1000), r = n % 1000;
    if (r > 0 && r < 100) out.push(th * 1000 + r * 10);
    if (th < 100) out.push(th * 10000 + r);
    if (th >= 10) out.push(Math.floor(th / 10) * 1000 + r);
    out.push(n * 10, Math.floor(n / 10), r * 1000 + th, th * 1000 + th % 1000, n + 1, n + 10);
    var seen = {}; return shuffle(out.filter(function (x) { if (seen[x] || x === n || x < 1000 || x > 999999) return false; seen[x] = 1; return true; }));
  }
  function decomp(n) { var t = [], s = String(n); for (var i = 0; i < s.length; i++) { var d = +s[i]; if (d) t.push(d * Math.pow(10, s.length - 1 - i)); } return t; }

  var G = {};

  // 1. Числа до миллиона
  G.million_read = function (level) {
    var L = L3(level), n = bigNum(L), t = R(0, 4), th = Math.floor(n / 1000), r = n % 1000;
    if (t === 0) return { type: 'input', q: 'Запиши цифрами число:<br><b>' + words(n) + '</b>', c: n, why: 'Класс тысяч — <b>' + th + '</b>, класс единиц — <b>' + pad3(r) + '</b> (пустые разряды заполняем нулями). Получаем <b>' + fmt(n) + '</b>.' };
    if (t === 1) {
      var vs = numVariants(n).slice(0, 3);
      return one('Как читается число <b>' + fmt(n) + '</b>?', words(n), vs.map(words), 'Делим число на классы справа налево: <b>' + th + '</b> | <b>' + pad3(r) + '</b>. Сначала читаем класс тысяч и добавляем слово «тысяч(а/и)», потом класс единиц: <b>' + words(n) + '</b>.');
    }
    if (t === 2) {
      var len = String(n).length, p = R(0, len - 1), d = dig(n, p);
      return { type: 'input', q: 'Какая цифра стоит в разряде <b>' + RAZ[p] + '</b> в числе <b>' + fmt(n) + '</b>?', c: d, why: 'Считаем разряды справа налево: единицы, десятки, сотни, единицы тысяч, десятки тысяч, сотни тысяч. В разряде ' + RAZ[p] + ' стоит цифра <b>' + d + '</b>.' };
    }
    if (t === 3) {
      if (L === 1) { var h = Math.floor(n / 100); return { type: 'input', q: 'Сколько всего <b>сотен</b> в числе <b>' + fmt(n) + '</b>?', c: h, why: 'Чтобы узнать, сколько всего сотен, закрываем две последние цифры (десятки и единицы): ' + fmt(n) + ' → <b>' + h + '</b> сот.' }; }
      return { type: 'input', q: 'Сколько всего <b>тысяч</b> в числе <b>' + fmt(n) + '</b>?', c: th, why: 'Всего тысяч — это число, которое стоит в классе тысяч: закрываем три последние цифры. ' + fmt(n) + ' → <b>' + th + '</b> тыс.' };
    }
    var s = String(n), cand = [];
    for (var i = 0; i < s.length; i++) if (s[i] !== '0' && s.split(s[i]).length === 2) cand.push(s.length - 1 - i);
    if (!cand.length) return G.million_read(L);
    var pp = pick(cand), dd = dig(n, pp), wr = [];
    for (var j = 0; j < s.length; j++) if (j !== pp) wr.push(RAZN[j]);
    return one('Что обозначает цифра <b>' + dd + '</b> в числе <b>' + fmt(n) + '</b>?', RAZN[pp], shuffle(wr), 'Считаем разряды справа налево. Цифра ' + dd + ' стоит на ' + (pp + 1) + '-м месте справа — это <b>' + RAZN[pp] + '</b>.');
  };

  // 2. Разрядные слагаемые, сравнение, чётность
  G.million_compare = function (level) {
    var L = L3(level), t = R(0, 5), n = bigNum(L);
    if (t === 0) {
      var terms = decomp(n);
      return { type: 'input', q: 'Запиши число, которое равно сумме разрядных слагаемых:<br><b>' + terms.map(fmt).join(' + ') + '</b>', c: n, why: 'Ставим каждую цифру в свой разряд, пустые разряды заполняем нулями: <b>' + fmt(n) + '</b>.' };
    }
    if (t === 1) {
      var m, rr = Math.random();
      if (rr < 0.12) m = n; else if (rr < 0.5) { var v = numVariants(n); m = v.length ? v[0] : n + 1; } else { var p = R(0, String(n).length - 1); var d = dig(n, p); var nd = d === 9 ? 8 : d === 0 ? 1 : d + (R(0, 1) ? 1 : -1); m = n + (nd - d) * Math.pow(10, p); }
      if (m < 1000 || m > 999999) m = n;
      return signQ('Какой знак нужно поставить?<br><b>' + fmt(n) + ' ○ ' + fmt(m) + '</b>', n, m, (String(n).length !== String(m).length ? 'Больше то число, в котором больше цифр (разрядов).' : 'Сравниваем поразрядно, начиная со старшего разряда: первая несовпадающая цифра решает.') + ' Значит, ' + fmt(n) + ' ' + sign(n, m) + ' ' + fmt(m) + '.');
    }
    if (t === 2) {
      var set = {}, arr = [], base = n;
      while (arr.length < 4) { var x; var p2 = R(0, Math.min(4, String(base).length - 1)); x = base + R(-9, 9) * Math.pow(10, p2); if (x >= 1000 && x <= 999999 && !set[x]) { set[x] = 1; arr.push(x); } }
      var asc = R(0, 1) === 1, sorted = arr.slice().sort(function (a, b) { return asc ? a - b : b - a; });
      return { type: 'order', q: 'Расставь числа по <b>' + (asc ? 'возрастанию' : 'убыванию') + '</b> (' + (asc ? 'от меньшего к большему' : 'от большего к меньшему') + ').', items: sorted.map(fmt), why: 'Сравниваем числа поразрядно: ' + sorted.map(fmt).join(asc ? ' &lt; ' : ' &gt; ') + '.' };
    }
    if (t === 3) {
      var it = [], used = {}, ev = 0, od = 0;
      while (it.length < 5) { var y = bigNum(L); if (used[y]) continue; if (it.length === 4 && (ev === 0 || od === 0)) { y = ev === 0 ? y - y % 2 : y - y % 2 + 1; if (used[y] || y < 1000) continue; } used[y] = 1; var g = y % 2; if (g) od++; else ev++; it.push([fmt(y), g]); }
      return { type: 'sort', q: 'Разложи числа: чётные и нечётные.', groups: ['Чётные', 'Нечётные'], items: it, why: 'Смотрим только на последнюю цифру: 0, 2, 4, 6, 8 — число чётное; 1, 3, 5, 7, 9 — нечётное.' };
    }
    if (t === 4) {
      var even = n % 2 === 0, say = R(0, 1) === 1;
      return { type: 'tf', q: 'Верно ли, что число <b>' + fmt(n) + '</b> — ' + (say ? 'чётное' : 'нечётное') + '?', c: say === even, why: 'Последняя цифра — ' + (n % 10) + ', значит число <b>' + (even ? 'чётное' : 'нечётное') + '</b>.' };
    }
    var kind = R(0, 1), z = byL(L, [pick([1000, 10000, 9999, 99999, 5000, 20000]), pick([100000, 99999, 300000, 109999, 250000, 400999]), pick([999999, 500000, 100000, 709999, 990000, 300100])]);
    if (z === 999999) kind = 1;
    if (kind === 0 || z <= 1000) return { type: 'input', q: 'Какое число идёт <b>сразу за</b> числом <b>' + fmt(z) + '</b>?', c: z + 1, why: 'Следующее число на 1 больше: ' + fmt(z) + ' + 1 = <b>' + fmt(z + 1) + '</b>.' };
    return { type: 'input', q: 'Какое число стоит <b>перед</b> числом <b>' + fmt(z) + '</b>?', c: z - 1, why: 'Предыдущее число на 1 меньше: ' + fmt(z) + ' − 1 = <b>' + fmt(z - 1) + '</b>.' };
  };

  // 3. Больше/меньше на, в
  var UNITS_ACC = [[1, 'единицу', 'единицы', 'единиц'], [10, 'десяток', 'десятка', 'десятков'], [100, 'сотню', 'сотни', 'сотен'], [1000, 'тысячу', 'тысячи', 'тысяч'], [10000, 'десяток тысяч', 'десятка тысяч', 'десятков тысяч'], [100000, 'сотню тысяч', 'сотни тысяч', 'сотен тысяч']];
  G.more_less = function (level) {
    var L = L3(level), t = R(0, 4);
    if (t === 0) {
      var n = byL(L, [R(100, 999), R(1000, 99999), R(10000, 899999)]), up = R(0, 1) === 1;
      var ui = R(byL(L, [1, 2, 2]), byL(L, [2, 3, 5])), u = UNITS_ACC[ui], d = R(1, 9), k = d * u[0];
      if (!up && k > n) up = true;
      var res = up ? n + k : n - k;
      if (res > 999999) return G.more_less(L);
      return { type: 'input', q: 'Найди число, которое ' + (up ? '<b>больше</b>' : '<b>меньше</b>') + ' числа <b>' + fmt(n) + '</b> на <b>' + d + ' ' + plural(d, u[1], u[2], u[3]) + '</b>.', c: res, why: d + ' ' + plural(d, u[1], u[2], u[3]) + ' = ' + fmt(k) + '. ' + fmt(n) + (up ? ' + ' : ' − ') + fmt(k) + ' = <b>' + fmt(res) + '</b>.' };
    }
    if (t === 1) {
      var m = R(2, 9), up2 = R(0, 1) === 1, q = byL(L, [R(2, 99), R(100, 9999), R(1000, 11111)]), big = q * m;
      if (big > 100000) return G.more_less(L);
      if (up2) return { type: 'input', q: '<b>Увеличь</b> число <b>' + fmt(q) + '</b> в <b>' + raz(m) + '</b>.', c: big, why: 'Увеличить в ' + raz(m) + ' — значит умножить: ' + fmt(q) + ' · ' + m + ' = <b>' + fmt(big) + '</b>.' };
      return { type: 'input', q: '<b>Уменьши</b> число <b>' + fmt(big) + '</b> в <b>' + raz(m) + '</b>.', c: q, why: 'Уменьшить в ' + raz(m) + ' — значит разделить: ' + fmt(big) + ' : ' + m + ' = <b>' + fmt(q) + '</b>.' };
    }
    if (t === 2) {
      var a = byL(L, [R(2, 12), R(12, 99), R(100, 999)]), k2 = R(2, 9), mode = R(0, 3), c, wr, w, ex;
      if (mode === 0) { c = a * k2; wr = [a + k2, a * k2 + k2, a * (k2 + 1)]; w = 'Увеличь <b>' + a + '</b> в <b>' + raz(k2) + '</b>.'; ex = '«В ' + raz(k2) + ' больше» — умножаем: ' + a + ' · ' + k2 + ' = <b>' + c + '</b>.'; }
      else if (mode === 1) { c = a + k2; wr = [a * k2, a - k2, a + k2 + 1]; w = 'Увеличь <b>' + a + '</b> на <b>' + k2 + '</b>.'; ex = '«На ' + k2 + ' больше» — прибавляем: ' + a + ' + ' + k2 + ' = <b>' + c + '</b>.'; }
      else if (mode === 2) { var A = a * k2; c = a; wr = [A - k2, A * k2, a + 1]; w = 'Уменьши <b>' + A + '</b> в <b>' + raz(k2) + '</b>.'; ex = '«В ' + raz(k2) + ' меньше» — делим: ' + A + ' : ' + k2 + ' = <b>' + c + '</b>.'; }
      else { var B = a + k2 + 10; c = B - k2; wr = [B + k2, B - k2 - 1, (B % k2 === 0) ? B / k2 : B - 2 * k2]; w = 'Уменьши <b>' + B + '</b> на <b>' + k2 + '</b>.'; ex = '«На ' + k2 + ' меньше» — вычитаем: ' + B + ' − ' + k2 + ' = <b>' + c + '</b>.'; }
      return one(w, fmt(c), nums(wr), ex);
    }
    if (t === 3) {
      var b = byL(L, [R(10, 99), R(100, 9999), R(1000, 99999)]), a2 = b + byL(L, [R(5, 90), R(50, 5000), R(500, 90000)]);
      if (a2 > 999999) return G.more_less(L);
      return { type: 'input', q: 'На сколько число <b>' + fmt(a2) + '</b> больше числа <b>' + fmt(b) + '</b>?', c: a2 - b, why: 'Чтобы узнать, <b>на сколько</b> одно число больше другого, из большего вычитаем меньшее: ' + fmt(a2) + ' − ' + fmt(b) + ' = <b>' + fmt(a2 - b) + '</b>.' };
    }
    var k3 = R(2, 9), small = byL(L, [R(2, 11), R(10, 999), R(100, 11111)]), big3 = small * k3;
    if (big3 > 100000) return G.more_less(L);
    return { type: 'input', q: 'Во сколько раз число <b>' + fmt(big3) + '</b> больше числа <b>' + fmt(small) + '</b>?', c: k3, why: 'Чтобы узнать, <b>во сколько раз</b> одно число больше другого, большее делим на меньшее: ' + fmt(big3) + ' : ' + fmt(small) + ' = <b>' + k3 + '</b>.' };
  };

  // 4. Длина и масса
  var LEN = [['км', 'м', 1000], ['м', 'см', 100], ['м', 'дм', 10], ['дм', 'см', 10], ['см', 'мм', 10], ['м', 'мм', 1000], ['дм', 'мм', 100]];
  var MAS = [['т', 'кг', 1000], ['т', 'ц', 10], ['ц', 'кг', 100], ['кг', 'г', 1000]];
  function cq(a, b, u) { return (a ? fmt(a) + ' ' + u[0] : '') + (a && b ? ' ' : '') + (b ? fmt(b) + ' ' + u[1] : ''); }
  G.length_mass = function (level) {
    var L = L3(level), t = R(0, 4), u = pick(R(0, 1) ? LEN : MAS), f = u[2];
    if (t === 0) {
      if (L === 1) { var a = R(2, 9); return { type: 'input', q: '<b>' + a + ' ' + u[0] + ' = ? ' + u[1] + '</b>', c: a * f, why: '1 ' + u[0] + ' = ' + fmt(f) + ' ' + u[1] + ', значит ' + a + ' ' + u[0] + ' = ' + a + ' · ' + fmt(f) + ' = <b>' + fmt(a * f) + ' ' + u[1] + '</b>.' }; }
      if (L === 2 || R(0, 1)) { var a1 = R(1, Math.min(99, Math.floor(99999 / f))), b1 = R(1, f - 1), v = a1 * f + b1; return { type: 'input', q: '<b>' + cq(a1, b1, u) + ' = ? ' + u[1] + '</b>', c: v, why: a1 + ' ' + u[0] + ' = ' + fmt(a1 * f) + ' ' + u[1] + '; ' + fmt(a1 * f) + ' + ' + b1 + ' = <b>' + fmt(v) + ' ' + u[1] + '</b>.' }; }
      var a3 = R(2, Math.min(100, Math.floor(100000 / f))), N = a3 * f;
      return { type: 'input', q: '<b>' + fmt(N) + ' ' + u[1] + ' = ? ' + u[0] + '</b>', c: a3, why: '1 ' + u[0] + ' = ' + fmt(f) + ' ' + u[1] + ', поэтому делим: ' + fmt(N) + ' : ' + fmt(f) + ' = <b>' + a3 + ' ' + u[0] + '</b>.' };
    }
    if (t === 1) {
      var A = R(1, byL(L, [9, 30, 99])), B = R(1, f - 1), X = A * f + B, Y, rr = R(0, 3);
      if (f === 10) Y = rr === 0 ? X : rr === 1 ? A * 10 + B + R(1, 5) : rr === 2 ? A + B * 10 : X - 1;
      else Y = rr === 0 ? X : rr === 1 ? A * f + B * 10 : rr === 2 ? Number(String(A) + String(B)) : X + R(1, 9);
      if (Y <= 0 || Y > 999999) Y = X;
      return signQ('Сравни величины:<br><b>' + cq(A, B, u) + ' ○ ' + fmt(Y) + ' ' + u[1] + '</b>', X, Y, 'Переводим в ' + u[1] + ': ' + cq(A, B, u) + ' = ' + fmt(A * f) + ' + ' + B + ' = ' + fmt(X) + ' ' + u[1] + '. ' + fmt(X) + ' ' + sign(X, Y) + ' ' + fmt(Y) + '.');
    }
    if (t === 2) {
      var m = R(2, 9);
      if (R(0, 1)) {
        var a4 = R(1, byL(L, [5, 20, 99])), b4 = R(1, f - 1), v4 = a4 * f + b4;
        if (v4 * m > 100000) return G.length_mass(L);
        return { type: 'input', q: 'Умножь величину на число:<br><b>' + cq(a4, b4, u) + ' · ' + m + ' = ? ' + u[1] + '</b>', c: v4 * m, why: 'Переводим в ' + u[1] + ': ' + cq(a4, b4, u) + ' = ' + fmt(v4) + ' ' + u[1] + '. ' + fmt(v4) + ' · ' + m + ' = <b>' + fmt(v4 * m) + ' ' + u[1] + '</b>.' };
      }
      var qmin = Math.ceil(f / m), q = R(qmin, byL(L, [qmin + 30, Math.max(qmin + 30, 9 * f), Math.floor(99999 / m)])), tot = q * m, aa = Math.floor(tot / f), bb = tot % f;
      if (tot > 100000 || !aa) return G.length_mass(L);
      return { type: 'input', q: 'Раздели величину на число:<br><b>' + cq(aa, bb, u) + ' : ' + m + ' = ? ' + u[1] + '</b>', c: q, why: 'Переводим в ' + u[1] + ': ' + cq(aa, bb, u) + ' = ' + fmt(tot) + ' ' + u[1] + '. ' + fmt(tot) + ' : ' + m + ' = <b>' + fmt(q) + ' ' + u[1] + '</b>.' };
    }
    if (t === 3) {
      var truth = R(0, 1) === 1, shown = f;
      if (!truth) shown = pick([f * 10, f === 10 ? 100 : f / 10, f === 1000 ? 100 : 1000].filter(function (x) { return x !== f; }));
      return { type: 'tf', q: 'Верно ли: <b>1 ' + u[0] + ' = ' + fmt(shown) + ' ' + u[1] + '</b>?', c: shown === f, why: 'На самом деле <b>1 ' + u[0] + ' = ' + fmt(f) + ' ' + u[1] + '</b>.' };
    }
    var h = who();
    if (R(0, 1)) {
      var whole = R(byL(L, [2, 3, 5]), byL(L, [5, 9, 40])) * 1000 + R(1, 9) * 100, used = R(1, Math.floor(whole / 100) - 1) * 100;
      return { type: 'input', q: 'В мешке было <b>' + cq(Math.floor(whole / 1000), whole % 1000, ['кг', 'г']) + '</b> муки. ' + h.n + ' ' + h.v('испёк', 'испекла') + ' пироги и ' + h.v('потратил', 'потратила') + ' <b>' + cq(Math.floor(used / 1000), used % 1000, ['кг', 'г']) + '</b>. Сколько <b>граммов</b> муки осталось?', c: whole - used, why: 'Переводим в граммы: ' + fmt(whole) + ' г − ' + fmt(used) + ' г = <b>' + fmt(whole - used) + ' г</b>.' };
    }
    var parts = R(2, 9), each = R(byL(L, [5, 20, 50]), byL(L, [20, 99, 999])), total = parts * each;
    return { type: 'input', q: h.n + ' ' + h.v('разрезал', 'разрезала') + ' ленту длиной <b>' + cq(Math.floor(total / 100), total % 100, ['м', 'см']) + '</b> на ' + parts + ' ' + plural(parts, 'равную часть', 'равные части', 'равных частей') + '. Сколько <b>сантиметров</b> в каждой части?', c: each, why: 'Переводим в сантиметры: ' + fmt(total) + ' см. ' + fmt(total) + ' : ' + parts + ' = <b>' + fmt(each) + ' см</b>.' };
  };

  // 5. Время
  var TIM = [['ч', 'мин', 60], ['мин', 'с', 60], ['сут', 'ч', 24], ['нед', 'сут', 7], ['год', 'мес', 12], ['век', 'лет', 100]];
  function hm(t) { var h = Math.floor(t / 60), m = t % 60; return h + ':' + (m < 10 ? '0' : '') + m; }
  function dur(d) { var h = Math.floor(d / 60), m = d % 60; return (h ? h + ' ч' : '') + (h && m ? ' ' : '') + (m ? m + ' мин' : ''); }
  G.time = function (level) {
    var L = L3(level), t = R(0, 5);
    if (t === 0) {
      var u = pick(TIM), f = u[2];
      if (L === 1) { var a = R(2, 9); return { type: 'input', q: '<b>' + a + ' ' + u[0] + ' = ? ' + u[1] + '</b>', c: a * f, why: '1 ' + u[0] + ' = ' + f + ' ' + u[1] + ', значит ' + a + ' · ' + f + ' = <b>' + a * f + ' ' + u[1] + '</b>.' }; }
      if (L === 2) { var a2 = R(1, 9), b2 = R(1, f - 1); return { type: 'input', q: '<b>' + a2 + ' ' + u[0] + ' ' + b2 + ' ' + u[1] + ' = ? ' + u[1] + '</b>', c: a2 * f + b2, why: a2 + ' ' + u[0] + ' = ' + a2 * f + ' ' + u[1] + '; ' + a2 * f + ' + ' + b2 + ' = <b>' + (a2 * f + b2) + ' ' + u[1] + '</b>.' }; }
      var kind = R(0, 2);
      if (kind === 0) { var h = R(2, 27); return { type: 'input', q: '<b>' + h + ' ч = ? с</b>', c: h * 3600, why: '1 ч = 60 мин = 60 · 60 с = 3600 с. ' + h + ' · 3600 = <b>' + fmt(h * 3600) + ' с</b>.' }; }
      if (kind === 1) { var d = R(2, 30); return { type: 'input', q: '<b>' + d + ' сут = ? мин</b>', c: d * 1440, why: '1 сут = 24 ч = 24 · 60 мин = 1440 мин. ' + d + ' · 1440 = <b>' + fmt(d * 1440) + ' мин</b>.' }; }
      var a3 = R(2, 99), N = a3 * f; return { type: 'input', q: '<b>' + fmt(N) + ' ' + u[1] + ' = ? ' + u[0] + '</b>', c: a3, why: '1 ' + u[0] + ' = ' + f + ' ' + u[1] + ', делим: ' + fmt(N) + ' : ' + f + ' = <b>' + a3 + ' ' + u[0] + '</b>.' };
    }
    if (t === 1) {
      var y = byL(L, [R(2, 20) * 100 + pick([1, 15, 50, 99]), R(101, 2026), pick([R(1, 20) * 100, R(1, 2026)])]), c = Math.floor((y - 1) / 100) + 1;
      return { type: 'input', q: 'В каком веке был <b>' + y + '</b> год? (запиши номер века числом)', c: c, why: (y % 100 === 0 ? 'Год круглый: ' + y + '-й год — последний год ' + c + '-го века.' : 'Число полных сотен — ' + Math.floor(y / 100) + ', прибавляем 1: ' + Math.floor(y / 100) + ' + 1 = ' + c + '.') + ' Это <b>' + c + '</b> век.' };
    }
    if (t === 2 || t === 3) {
      var st = R(7, 16) * 60 + R(0, 11) * 5, du = byL(L, [R(2, 11) * 5, R(13, 40) * 5, R(14, 70) * 5]), en = st + du, H = who(), ev = pick(['спектакль в кукольном театре', 'урок рисования', 'кружок шахмат', 'конкурс тортов', 'футбольный матч', 'поход в музей шоколада']);
      if (t === 3 || L === 1 && R(0, 1)) return { type: 'input', q: 'Событие «' + ev + '» началось в <b>' + hm(st) + '</b> и закончилось в <b>' + hm(en) + '</b>. Сколько <b>минут</b> оно длилось?', c: du, why: 'От ' + hm(st) + ' до ' + hm(en) + ' прошло ' + dur(du) + (du >= 60 ? ' = ' + du + ' мин' : '') + '. Ответ: <b>' + du + '</b>.' };
      if (L === 3 && R(0, 1)) {
        var wrS = [st + 60, st - 10, en + du, st + 10];
        return one('Событие «' + ev + '» длилось <b>' + dur(du) + '</b> и закончилось в <b>' + hm(en) + '</b>. Во сколько оно началось?', hm(st), wrS.filter(function (x) { return x >= 0 && x < 1440; }).map(hm), 'Начало = окончание − продолжительность: ' + hm(en) + ' − ' + dur(du) + ' = <b>' + hm(st) + '</b>.');
      }
      var wr = [en + 60, en - 10, en + 10, en - 60, st - du];
      return one('Событие «' + ev + '» началось в <b>' + hm(st) + '</b> и длилось <b>' + dur(du) + '</b>. Во сколько оно закончилось?', hm(en), shuffle(wr.filter(function (x) { return x >= 0 && x < 1440 && x !== en; })).map(hm), 'Окончание = начало + продолжительность: ' + hm(st) + ' + ' + dur(du) + ' = <b>' + hm(en) + '</b> (60 минут — это 1 час).');
    }
    if (t === 4) {
      var vals = [], seen = {};
      while (vals.length < 4) { var mm = R(3, byL(L, [24, 30, 50])) * 5; if (!seen[mm]) { seen[mm] = 1; vals.push(mm); } }
      var srt = vals.slice().sort(function (a, b) { return a - b; });
      var show = function (x) { return (x >= 60 && R(0, 1)) ? dur(x) : x + ' мин'; }, labels = {};
      srt.forEach(function (x) { labels[x] = show(x); });
      return { type: 'order', q: 'Расставь промежутки времени от <b>самого короткого</b> к самому длинному.', items: srt.map(function (x) { return labels[x]; }), why: 'Переводим всё в минуты: ' + srt.map(function (x) { return labels[x] + ' = ' + x + ' мин'; }).join('; ') + '.' };
    }
    var F = [['В сутках 24 часа', true], ['В часе 60 минут', true], ['В минуте 60 секунд', true], ['В неделе 7 суток', true], ['В году 12 месяцев', true], ['В веке 100 лет', true], ['В сутках 12 часов', false], ['В часе 100 минут', false], ['В минуте 100 секунд', false], ['В неделе 5 суток', false], ['В году 10 месяцев', false], ['В веке 1000 лет', false], ['Полчаса — это 30 минут', true], ['Четверть часа — это 25 минут', false]];
    var fct = pick(F);
    return { type: 'tf', q: 'Верно ли: <b>' + fct[0] + '</b>?', c: fct[1], why: 'Запомни: 1 век = 100 лет, 1 год = 12 мес, 1 нед = 7 сут, 1 сут = 24 ч, 1 ч = 60 мин, 1 мин = 60 с. ' + (fct[1] ? 'Утверждение верное.' : 'Утверждение неверное.') };
  };

  // 6. Площадь и её единицы
  G.area_units = function (level) {
    var L = L3(level), t = R(0, 4), u = byL(L, ['см', pick(['см', 'дм', 'м']), 'м']);
    if (t === 0) {
      var a = byL(L, [R(2, 9), R(5, 30), R(20, 400)]), b = byL(L, [R(2, 9), R(2, 20), R(10, 250)]);
      if (a * b > 100000) return G.area_units(L);
      var OB = { 'см': [['прямоугольной коробки конфет', 'её'], ['прямоугольной плитки шоколада', 'её'], ['прямоугольного листа для рисования', 'его'], ['прямоугольной открытки', 'её']], 'дм': [['прямоугольного коврика у камина', 'его'], ['прямоугольного подноса для пирогов', 'его'], ['прямоугольной крыши пряничного домика', 'её']], 'м': [['прямоугольной грядки с клубникой', 'её'], ['прямоугольной площадки для игр', 'её'], ['прямоугольного катка', 'его'], ['прямоугольного сада Сладкограда', 'его']] }, ob = pick(OB[u]);
      return { type: 'input', q: 'Длина ' + ob[0] + ' — <b>' + a + ' ' + u + '</b>, ширина — <b>' + b + ' ' + u + '</b>. Найди ' + ob[1] + ' площадь (в кв. ' + u + ').', c: a * b, why: 'Площадь прямоугольника = длина · ширина: ' + a + ' · ' + b + ' = <b>' + fmt(a * b) + ' кв. ' + u + '</b>.' };
    }
    if (t === 1) {
      var a1 = byL(L, [R(2, 9), R(5, 30), R(20, 300)]), b1 = byL(L, [R(2, 9), R(2, 20), R(10, 99)]), S = a1 * b1;
      if (S > 100000) return G.area_units(L);
      return { type: 'input', q: 'Площадь прямоугольника <b>' + fmt(S) + ' кв. ' + u + '</b>, его ширина <b>' + b1 + ' ' + u + '</b>. Найди длину (в ' + u + ').', c: a1, why: 'Длина = площадь : ширина: ' + fmt(S) + ' : ' + b1 + ' = <b>' + a1 + ' ' + u + '</b>.' };
    }
    if (t === 2) {
      var k = L === 1 ? 0 : L === 2 ? R(0, 2) : R(0, 3);
      if (k === 0) { var x = R(2, 9); return { type: 'input', q: '<b>' + x + ' кв. дм = ? кв. см</b>', c: x * 100, why: '1 кв. дм = 10 см · 10 см = 100 кв. см. ' + x + ' · 100 = <b>' + x * 100 + ' кв. см</b>.' }; }
      if (k === 1) { var x1 = R(2, 99); return { type: 'input', q: '<b>' + x1 + ' кв. м = ? кв. дм</b>', c: x1 * 100, why: '1 кв. м = 10 дм · 10 дм = 100 кв. дм. ' + x1 + ' · 100 = <b>' + fmt(x1 * 100) + ' кв. дм</b>.' }; }
      if (k === 2) { var x2 = R(2, 99); return { type: 'input', q: '<b>' + fmt(x2 * 100) + ' кв. см = ? кв. дм</b>', c: x2, why: '100 кв. см = 1 кв. дм, поэтому делим на 100: ' + fmt(x2 * 100) + ' : 100 = <b>' + x2 + ' кв. дм</b>.' }; }
      var x3 = R(2, 10); return { type: 'input', q: '<b>' + x3 + ' кв. м = ? кв. см</b>', c: x3 * 10000, why: '1 кв. м = 100 см · 100 см = 10 000 кв. см. ' + x3 + ' · 10 000 = <b>' + fmt(x3 * 10000) + ' кв. см</b>.' };
    }
    if (t === 3) {
      var p = R(2, byL(L, [9, 15, 40])), q = R(2, byL(L, [9, 15, 40])), lab = function (n) { return fmt(n) + ' кв. ' + u; };
      return one('Найди <b>площадь</b> прямоугольника со сторонами <b>' + p + ' ' + u + '</b> и <b>' + q + ' ' + u + '</b>.', lab(p * q), [lab(2 * (p + q)), lab(p + q), lab(p * q * 2), lab(p * q + 1)], 'Площадь = длина · ширина = ' + p + ' · ' + q + ' = <b>' + lab(p * q) + '</b>. (' + 2 * (p + q) + ' ' + u + ' — это периметр, его не путаем!)');
    }
    var F = [['1 кв. дм = 100 кв. см', true], ['1 кв. м = 100 кв. дм', true], ['1 кв. м = 10 000 кв. см', true], ['1 кв. м = 100 кв. см', false], ['1 кв. дм = 10 кв. см', false], ['1 кв. м = 1000 кв. дм', false], ['Площадь квадрата со стороной 5 см — 20 кв. см', false], ['Площадь квадрата со стороной 6 см — 36 кв. см', true], ['Квадратный метр больше квадратного дециметра в 100 раз', true]];
    var f = pick(F);
    return { type: 'tf', q: 'Верно ли: <b>' + f[0] + '</b>?', c: f[1], why: '1 кв. дм = 100 кв. см, 1 кв. м = 100 кв. дм = 10 000 кв. см; площадь квадрата = сторона · сторона. ' + (f[1] ? 'Утверждение верное.' : 'Утверждение неверное.') };
  };

  // 7. Доли величины
  var PQ = [['часа', 'минут', 'мин', 60, [2, 3, 4, 5, 6, 10, 12], 'ч'], ['суток', 'часов', 'ч', 24, [2, 3, 4, 6, 8, 12], 'сут'], ['минуты', 'секунд', 'с', 60, [2, 3, 4, 5, 6, 10], 'мин'], ['килограмма', 'граммов', 'г', 1000, [2, 4, 5, 8, 10], 'кг'], ['тонны', 'килограммов', 'кг', 1000, [2, 4, 5, 10], 'т'], ['центнера', 'килограммов', 'кг', 100, [2, 4, 5, 10], 'ц'], ['метра', 'сантиметров', 'см', 100, [2, 4, 5, 10, 20], 'м'], ['километра', 'метров', 'м', 1000, [2, 4, 5, 8, 10], 'км'], ['дециметра', 'сантиметров', 'см', 10, [2, 5], 'дм'], ['года', 'месяцев', 'мес', 12, [2, 3, 4, 6], 'год']];
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  G.part_qty = function (level) {
    var L = L3(level), t = R(0, 3), P = pick(PQ), den = pick(P[4]), num = L === 1 ? 1 : R(1, den - 1);
    if (gcd(num, den) > 1) num = 1;
    var val = P[3] / den * num;
    if (t <= 1) return { type: 'input', q: 'Сколько <b>' + P[1] + '</b> в <b>' + num + '/' + den + '</b> ' + P[0] + '?', c: val, why: '1 ' + P[5] + ' = ' + fmt(P[3]) + ' ' + P[2] + '. Делим на ' + den + ' (одна доля): ' + fmt(P[3]) + ' : ' + den + ' = ' + P[3] / den + (num > 1 ? '; берём ' + num + ' доли: ' + P[3] / den + ' · ' + num + ' = ' + val : '') + '. Ответ: <b>' + val + ' ' + P[2] + '</b>.' };
    if (t === 2) {
      var other = val + pick([-1, 1]) * (P[3] / den > 1 ? P[3] / den : 1) * R(0, 1);
      if (other <= 0) other = val;
      var A = num + '/' + den + ' ' + P[0], B = fmt(other) + ' ' + P[2];
      var corr = val > other ? A : val < other ? B : 'поровну';
      return one('Что больше: <b>' + A + '</b> или <b>' + B + '</b>?', corr, [A, B, 'поровну'].filter(function (x) { return x !== corr; }), num + '/' + den + ' ' + P[0] + ' = ' + fmt(P[3]) + ' : ' + den + (num > 1 ? ' · ' + num : '') + ' = ' + val + ' ' + P[2] + '. Сравниваем ' + val + ' и ' + other + ': ' + (corr === 'поровну' ? 'они равны.' : 'больше <b>' + corr + '</b>.'));
    }
    var dd = pick(P[4]), part = P[3] / dd, wr = P[4].filter(function (x) { return x !== dd; }).map(function (x) { return '1/' + x; });
    if (wr.length < 2) wr.push('1/3', '1/10', '1/4');
    return one('Какую часть ' + P[0] + ' составляют <b>' + part + ' ' + P[2] + '</b>?', '1/' + dd, shuffle(wr).concat(['1/3', '1/7']), '1 ' + P[5] + ' = ' + fmt(P[3]) + ' ' + P[2] + '. ' + fmt(P[3]) + ' : ' + part + ' = ' + dd + ', значит это <b>1/' + dd + '</b> ' + P[0] + '.');
  };

  // 8. Умножение и деление на 10, 100, 1000 и круглые числа
  G.round_mul = function (level) {
    var L = L3(level), t = R(0, 3);
    if (t === 0) {
      var k = byL(L, [R(1, 2), R(1, 3), R(1, 3)]), p = Math.pow(10, k), a = byL(L, [R(2, 99), R(2, 999), R(11, 9999)]);
      if (a * p > 100000) return G.round_mul(L);
      if (R(0, 1)) return { type: 'input', q: 'Вычисли: <b>' + fmt(a) + ' · ' + fmt(p) + '</b>', c: a * p, why: 'Чтобы умножить на ' + fmt(p) + ', приписываем справа ' + k + ' ' + plural(k, 'нуль', 'нуля', 'нулей') + ': <b>' + fmt(a * p) + '</b>.' };
      return { type: 'input', q: 'Вычисли: <b>' + fmt(a * p) + ' : ' + fmt(p) + '</b>', c: a, why: 'Чтобы разделить на ' + fmt(p) + ', отбрасываем справа ' + k + ' ' + plural(k, 'нуль', 'нуля', 'нулей') + ': <b>' + fmt(a) + '</b>.' };
    }
    if (t === 1 || t === 3) {
      var x = byL(L, [R(2, 9), R(2, 99), R(11, 999)]), i = byL(L, [1, R(1, 2), R(1, 2)]), e = R(2, 9), j = byL(L, [0, R(0, 1), R(0, 2)]);
      var X = x * Math.pow(10, i), Y = e * Math.pow(10, j), P = X * Y;
      if (P > 100000) return G.round_mul(L);
      var why = 'Умножаем без нулей: ' + x + ' · ' + e + ' = ' + x * e + ', потом приписываем ' + (i + j) + ' ' + plural(i + j, 'нуль', 'нуля', 'нулей') + ': <b>' + fmt(P) + '</b>.';
      if (t === 1) return { type: 'input', q: 'Вычисли: <b>' + fmt(X) + ' · ' + fmt(Y) + '</b>', c: P, why: why };
      return one('Чему равно произведение <b>' + fmt(X) + ' · ' + fmt(Y) + '</b>?', fmt(P), nums([P * 10, P / 10, P * 100, P + Y]), why);
    }
    var e2 = R(2, 9), j2 = byL(L, [1, R(1, 2), R(1, 3)]), D = e2 * Math.pow(10, j2), q = byL(L, [R(2, 9), R(2, 99), R(11, 999)]), N = q * D;
    if (N > 100000) return G.round_mul(L);
    return { type: 'input', q: 'Вычисли: <b>' + fmt(N) + ' : ' + fmt(D) + '</b>', c: q, why: 'Делим сначала на ' + fmt(Math.pow(10, j2)) + ' (отбрасываем ' + j2 + ' ' + plural(j2, 'нуль', 'нуля', 'нулей') + '): ' + fmt(N / Math.pow(10, j2)) + ', затем на ' + e2 + ': ' + fmt(N / Math.pow(10, j2)) + ' : ' + e2 + ' = <b>' + fmt(q) + '</b>.' };
  };

  // 9. Деление с остатком
  var BOXES = [['орех', 'ореха', 'орехов', 'пакет', 'пакета', 'пакетов', 'пакеты', 'орехи'], ['леденец', 'леденца', 'леденцов', 'кулёк', 'кулька', 'кульков', 'кульки', 'леденцы'], ['пирожок', 'пирожка', 'пирожков', 'корзинку', 'корзинки', 'корзинок', 'корзинки', 'пирожки'], ['пряник', 'пряника', 'пряников', 'коробку', 'коробки', 'коробок', 'коробки', 'пряники'], ['кекс', 'кекса', 'кексов', 'поднос', 'подноса', 'подносов', 'подносы', 'кексы']];
  G.remainder = function (level) {
    var L = L3(level), d = R(byL(L, [2, 3, 4]), 9), q = byL(L, [R(2, 9), R(5, 30), R(11, 99)]), r = R(1, d - 1), a = d * q + r, t = R(0, 5);
    var chk = 'Проверка: ' + d + ' · ' + q + ' + ' + r + ' = ' + a + ', и остаток ' + r + ' &lt; ' + d + '.';
    if (t === 0) return { type: 'input', q: 'Выполни деление с остатком <b>' + a + ' : ' + d + '</b>. Чему равно <b>неполное частное</b>?', c: q, why: 'Ближайшее число, которое делится на ' + d + ' и не больше ' + a + ', — это ' + d * q + ' = ' + d + ' · ' + q + '. Неполное частное <b>' + q + '</b>, остаток ' + r + '. ' + chk };
    if (t === 1) return { type: 'input', q: 'Выполни деление с остатком <b>' + a + ' : ' + d + '</b>. Чему равен <b>остаток</b>?', c: r, why: d + ' · ' + q + ' = ' + d * q + '; ' + a + ' − ' + d * q + ' = <b>' + r + '</b>. ' + chk };
    if (t === 2) {
      var lab = function (x, y) { return x + ' ост. ' + y; };
      var wr = [lab(q - 1, r + d), lab(q + 1, r), lab(q, r + 1 < d ? r + 1 : r - 1), lab(q, d - r)];
      return one('Выбери верный ответ: <b>' + a + ' : ' + d + '</b> = ?', lab(q, r), wr.filter(function (s) { return s.indexOf('-') < 0 && !/ост\. 0$/.test(s); }), d + ' · ' + q + ' = ' + d * q + ', ' + a + ' − ' + d * q + ' = ' + r + '. Ответ: <b>' + lab(q, r) + '</b>. Остаток всегда меньше делителя! ' + chk);
    }
    if (t === 3) return { type: 'input', q: 'При делении неизвестного числа на <b>' + d + '</b> получилось неполное частное <b>' + q + '</b> и остаток <b>' + r + '</b>. Найди делимое.', c: a, why: 'Делимое = делитель · частное + остаток: ' + d + ' · ' + q + ' + ' + r + ' = <b>' + a + '</b>.' };
    if (t === 4) { var kk = R(1, d + 3); return { type: 'tf', q: 'Может ли при делении на <b>' + d + '</b> получиться остаток <b>' + kk + '</b>?', c: kk < d, why: 'Остаток всегда <b>меньше делителя</b>. При делении на ' + d + ' остаток может быть только от 0 до ' + (d - 1) + '. ' + (kk < d ? kk + ' &lt; ' + d + ' — может.' : kk + ' ≥ ' + d + ' — не может.') }; }
    var B = pick(BOXES), H = who(), mode = R(0, 2);
    var base = H.n + ' раскладывает <b>' + pn(a, B[0], B[1], B[2]) + '</b> поровну: по <b>' + d + '</b> штук' + plural(d, 'у', 'и', '') + ' в ' + B[6] + '. ';
    if (mode === 0) return { type: 'input', q: base + 'Сколько получится <b>полных</b> ' + B[5] + '?', c: q, why: a + ' : ' + d + ' = ' + q + ' (ост. ' + r + '). Полных — <b>' + q + '</b>. ' + chk };
    if (mode === 1) return { type: 'input', q: base + 'Сколько ' + B[2] + ' останется лишними?', c: r, why: a + ' : ' + d + ' = ' + q + ' (ост. ' + r + '). Останется <b>' + r + '</b>. ' + chk };
    return { type: 'input', q: base + 'Сколько понадобится ' + B[5] + ', чтобы уложить <b>все</b> ' + B[7] + '?', c: q + 1, why: a + ' : ' + d + ' = ' + q + ' (ост. ' + r + '). ' + q + ' полных, и для ' + r + ' оставшихся нужна ещё одна: ' + q + ' + 1 = <b>' + (q + 1) + '</b>.' };
  };

  // 10. Порядок действий
  function sm() { return R(2, 9); }
  function opsExpr(L) {
    var A = byL(L, [50, 900, 50000]), M = byL(L, [9, 99, 9999]), mn = byL(L, [2, 10, 100]), T = R(0, 7), a, b, c, d, k, e = {};
    if (T === 0) { a = R(1, A); b = R(mn, M); c = sm(); e = { s: a + ' + ' + b + ' · ' + c, v: a + b * c, first: b + ' · ' + c, other: [a + ' + ' + b], naive: (a + b) * c }; }
    else if (T === 1) { a = R(1, A / 2 | 0 || 1); b = R(1, A / 2 | 0 || 1); c = sm(); e = { s: '(' + a + ' + ' + b + ') · ' + c, v: (a + b) * c, first: a + ' + ' + b, other: [b + ' · ' + c], naive: a + b * c }; }
    else if (T === 2) { b = R(mn, M); c = sm(); a = b * c + R(0, A); e = { s: a + ' − ' + b + ' · ' + c, v: a - b * c, first: b + ' · ' + c, other: [a + ' − ' + b], naive: a >= b ? (a - b) * c : -1 }; }
    else if (T === 3) { a = R(mn, M); b = sm(); d = sm(); k = R(1, a * b); c = k * d; e = { s: a + ' · ' + b + ' − ' + c + ' : ' + d, v: a * b - k, first: a + ' · ' + b, other: [b + ' − ' + c, c + ' : ' + d], naive: -1, noOne: 1 }; }
    else if (T === 4) { c = sm(); k = R(2, M); b = R(1, A); a = b + k * c; d = R(1, A); e = { s: '(' + a + ' − ' + b + ') : ' + c + ' + ' + d, v: k + d, first: a + ' − ' + b, other: [c + ' + ' + d], naive: -1 }; }
    else if (T === 5) { d = sm(); k = R(2, M); c = R(1, A); b = c + k; a = R(1, A); e = { s: a + ' + (' + b + ' − ' + c + ') · ' + d, v: a + k * d, first: b + ' − ' + c, other: [a + ' + ' + b], naive: -1 }; }
    else if (T === 6) { var s = R(3, byL(L, [9, 20, 99])); b = R(1, s - 1); c = s - b; k = R(2, byL(L, [9, 50, 999])); a = k * s; d = sm(); e = { s: a + ' : (' + b + ' + ' + c + ') · ' + d, v: k * d, first: b + ' + ' + c, other: [c + ' · ' + d], naive: -1 }; }
    else { a = R(1, byL(L, [10, 100, 10000])); b = R(1, byL(L, [10, 100, 10000])); d = R(1, 20); c = d + sm(); e = { s: '(' + a + ' + ' + b + ') · (' + c + ' − ' + d + ')', v: (a + b) * (c - d), first: a + ' + ' + b, other: [b + ' · ' + c], naive: -1, noOne: 1 }; }
    e.s = e.s.replace(/\d{5,}/g, function (x) { return fmt(+x); });
    e.first = e.first.replace(/\d{5,}/g, function (x) { return fmt(+x); });
    e.other = e.other.map(function (o) { return o.replace(/\d{5,}/g, function (x) { return fmt(+x); }); });
    return e;
  }
  G.order_ops = function (level) {
    var L = L3(level), e, tries = 0;
    do { e = opsExpr(L); tries++; } while ((e.v < 0 || e.v > 100000) && tries < 50);
    var t = R(0, 9);
    var rule = 'Порядок: сначала действия в скобках, потом умножение и деление (слева направо), потом сложение и вычитание (слева направо).';
    if (t < 6) return { type: 'input', q: 'Найди значение выражения:<br><b>' + e.s + '</b>', c: e.v, why: rule + ' Первым выполняем <b>' + e.first + '</b>. Значение выражения: <b>' + fmt(e.v) + '</b>.' };
    if (t < 8) {
      while (e.noOne || e.v < 0 || e.v > 100000) e = opsExpr(L);
      var pairs = [], tok = e.s.replace(/[()]/g, '').split(' ');
      for (var ti = 0; ti + 2 < tok.length; ti += 2) pairs.push(tok[ti] + ' ' + tok[ti + 1] + ' ' + tok[ti + 2]);
      return one('Какое действие в выражении <b>' + e.s + '</b> нужно выполнить <b>первым</b>?', e.first, pairs.filter(function (p) { return p !== e.first; }).concat(['любое — порядок не важен']), rule + ' Значит, первым — <b>' + e.first + '</b>.');
    }
    if (false) return one('Какое действие в выражении <b>' + e.s + '</b> нужно выполнить <b>первым</b>?', e.first, e.other, rule + ' Значит, первым — <b>' + e.first + '</b>.');
    var wrong = e.naive >= 0 && e.naive !== e.v && e.naive <= 999999 ? e.naive : e.v + pick([10, 1, 100]);
    var showV = R(0, 1) ? e.v : wrong;
    return { type: 'tf', q: 'Верно ли, что <b>' + e.s + ' = ' + fmt(showV) + '</b>?', c: showV === e.v, why: rule + ' Первым выполняем ' + e.first + '. Правильное значение: <b>' + fmt(e.v) + '</b>.' };
  };

  // 11. Свойства действий и удобный счёт
  G.props = function (level) {
    var L = L3(level), t = R(0, 5);
    if (t === 0) {
      var pr = pick([[25, 4], [4, 25], [125, 8], [8, 125], [50, 2], [2, 50], [20, 5], [5, 20], [250, 4]]), k = byL(L, [R(2, 9), R(11, 99), R(101, 999)]), m = pr[0] * pr[1];
      if (k * m > 100000) k = Math.floor(100000 / m) - R(0, 9);
      return { type: 'input', q: 'Вычисли удобным способом:<br><b>' + pr[0] + ' · ' + k + ' · ' + pr[1] + '</b>', c: pr[0] * pr[1] * k, why: 'Переставим множители (переместительное и сочетательное свойства): (' + pr[0] + ' · ' + pr[1] + ') · ' + k + ' = ' + m + ' · ' + k + ' = <b>' + fmt(m * k) + '</b>.' };
    }
    if (t === 1) {
      var R10 = byL(L, [R(3, 9) * 10, 100, 1000]), a = R(byL(L, [11, 11, 101]), R10 - byL(L, [11, 11, 101])), c = R10 - a, b = byL(L, [R(11, 99), R(11, 999), R(101, 9999)]);
      return { type: 'input', q: 'Вычисли удобным способом:<br><b>' + a + ' + ' + fmt(b) + ' + ' + c + '</b>', c: a + b + c, why: 'Сгруппируем слагаемые, которые дают круглое число: (' + a + ' + ' + c + ') + ' + fmt(b) + ' = ' + R10 + ' + ' + fmt(b) + ' = <b>' + fmt(a + b + c) + '</b>.' };
    }
    if (t === 2) {
      var tot = byL(L, [10, 100, pick([100, 1000])]), a2 = R(Math.max(2, Math.ceil(tot / 10)), tot - Math.max(2, Math.ceil(tot / 10))), b2 = tot - a2, k2 = byL(L, [R(2, 9), R(2, 99), R(2, 99)]), minus = L > 1 && R(0, 1);
      if (minus) { var big = a2 + tot; return { type: 'input', q: 'Вычисли удобным способом:<br><b>' + big + ' · ' + k2 + ' − ' + a2 + ' · ' + k2 + '</b>', c: tot * k2, why: 'Вынесем общий множитель (распределительное свойство): (' + big + ' − ' + a2 + ') · ' + k2 + ' = ' + tot + ' · ' + k2 + ' = <b>' + fmt(tot * k2) + '</b>.' }; }
      return { type: 'input', q: 'Вычисли удобным способом:<br><b>' + a2 + ' · ' + k2 + ' + ' + b2 + ' · ' + k2 + '</b>', c: tot * k2, why: 'Вынесем общий множитель (распределительное свойство): (' + a2 + ' + ' + b2 + ') · ' + k2 + ' = ' + tot + ' · ' + k2 + ' = <b>' + fmt(tot * k2) + '</b>.' };
    }
    if (t === 3) {
      var base = byL(L, [pick([9, 11]), pick([99, 101]), pick([99, 101, 999])]), rnd = base % 10 === 9 ? base + 1 : base - 1, n = byL(L, [R(2, 9), R(11, 99), R(11, 99)]), res = n * base;
      return { type: 'input', q: 'Вычисли удобным способом:<br><b>' + n + ' · ' + base + '</b>', c: res, why: base + ' = ' + rnd + (base > rnd ? ' + 1' : ' − 1') + ', значит ' + n + ' · ' + base + ' = ' + n + ' · ' + rnd + (base > rnd ? ' + ' : ' − ') + n + ' = ' + fmt(n * rnd) + (base > rnd ? ' + ' : ' − ') + n + ' = <b>' + fmt(res) + '</b>.' };
    }
    if (t === 4) {
      var x = R(2, 99), y = R(2, 99), z = R(2, 9), kind = R(0, 2), PROPS = ['переместительное', 'сочетательное', 'распределительное'];
      var ex = [x + ' + ' + y + ' = ' + y + ' + ' + x, '(' + x + ' + ' + y + ') + ' + z + ' = ' + x + ' + (' + y + ' + ' + z + ')', '(' + x + ' + ' + y + ') · ' + z + ' = ' + x + ' · ' + z + ' + ' + y + ' · ' + z];
      if (R(0, 1)) ex = [x + ' · ' + y + ' = ' + y + ' · ' + x, '(' + x + ' · ' + y + ') · ' + z + ' = ' + x + ' · (' + y + ' · ' + z + ')', z + ' · (' + x + ' − ' + y + ') = ' + z + ' · ' + x + ' − ' + z + ' · ' + y];
      if (x === y) return G.props(L);
      var EXPL = ['от перестановки слагаемых (множителей) результат не меняется', 'соседние слагаемые (множители) можно группировать как удобно', 'можно умножить на каждое число в скобках и результаты сложить (вычесть)'];
      return one('Какое свойство записано?<br><b>' + ex[kind] + '</b>', PROPS[kind], PROPS.filter(function (p) { return p !== PROPS[kind]; }), 'Это <b>' + PROPS[kind] + '</b> свойство: ' + EXPL[kind] + '.');
    }
    var p1 = R(2, 9), p2 = R(11, 30), p3 = R(2, 9), ok = R(0, 1) === 1;
    var right = p1 + ' · (' + p2 + ' + ' + p3 + ') = ' + p1 + ' · ' + p2 + ' + ' + p1 + ' · ' + p3, bad = p1 + ' · (' + p2 + ' + ' + p3 + ') = ' + p1 + ' · ' + p2 + ' + ' + p3;
    return { type: 'tf', q: 'Верно ли равенство?<br><b>' + (ok ? right : bad) + '</b>', c: ok, why: 'Распределительное свойство: на ' + p1 + ' умножают <b>каждое</b> слагаемое в скобках. ' + p1 + ' · ' + (p2 + p3) + ' = ' + p1 * (p2 + p3) + (ok ? ', и справа тоже ' + (p1 * p2 + p1 * p3) + ' — верно.' : ', а справа ' + (p1 * p2 + p3) + ' — неверно.') };
  };

  // 12. Движение
  var MOVERS = [
    { how: 'на велосипеде', go: ['ехал', 'ехала'], did: ['проехал', 'проехала'], m: 'kmh', v: [[8, 20], [10, 25], [12, 30]] },
    { how: 'на самокате', go: ['ехал', 'ехала'], did: ['проехал', 'проехала'], m: 'kmh', v: [[5, 15], [8, 20], [10, 24]] },
    { how: 'на поезде «Карамелька»', go: ['ехал', 'ехала'], did: ['проехал', 'проехала'], m: 'kmh', v: [[40, 90], [50, 120], [60, 150]] },
    { how: 'на воздушном шаре', go: ['летел', 'летела'], did: ['пролетел', 'пролетела'], m: 'kmh', v: [[10, 30], [20, 60], [30, 90]] },
    { how: 'на самолёте «Леденец»', go: ['летел', 'летела'], did: ['пролетел', 'пролетела'], m: 'kmh', v: [[100, 300], [200, 600], [300, 900]] },
    { how: 'пешком', go: ['шёл', 'шла'], did: ['прошёл', 'прошла'], m: 'mmin', v: [[40, 90], [50, 100], [60, 120]] },
    { how: 'бегом', go: ['бежал', 'бежала'], did: ['пробежал', 'пробежала'], m: 'mmin', v: [[100, 200], [120, 250], [150, 300]] },
    { how: 'на роликах', go: ['катился', 'катилась'], did: ['проехал', 'проехала'], m: 'ms', v: [[2, 6], [3, 8], [3, 10]] }
  ];
  var MODE = { kmh: { su: 'км', vu: 'км/ч', tw: hrs, tg: 'часов', t: [[2, 4], [2, 8], [2, 12]] }, mmin: { su: 'м', vu: 'м/мин', tw: mins, tg: 'минут', t: [[2, 10], [5, 30], [10, 60]] }, ms: { su: 'м', vu: 'м/с', tw: secs, tg: 'секунд', t: [[10, 30], [10, 60], [20, 99]] } };
  G.motion = function (level) {
    var L = L3(level), M = pick(MOVERS), md = MODE[M.m], H = who(), vr = M.v[L - 1], tr = md.t[L - 1], v = R(vr[0], vr[1]), t = R(tr[0], tr[1]), s = v * t, k = R(0, 4);
    var g = function (a) { return H.v(a[0], a[1]); };
    if (k === 0) return { type: 'input', q: H.n + ' ' + g(M.go) + ' ' + M.how + ' со скоростью <b>' + v + ' ' + md.vu + '</b>. Какое расстояние ' + (H.f ? 'она' : 'он') + ' ' + g(M.did) + ' за <b>' + md.tw(t) + '</b>? (в ' + md.su + ')', c: s, why: 'Расстояние = скорость · время: s = v · t = ' + v + ' · ' + t + ' = <b>' + fmt(s) + ' ' + md.su + '</b>.' };
    if (k === 1) return { type: 'input', q: H.n + ' ' + g(M.did) + ' ' + M.how + ' <b>' + fmt(s) + ' ' + md.su + '</b> за <b>' + md.tw(t) + '</b>, двигаясь с одинаковой скоростью. С какой скоростью ' + (H.f ? 'она' : 'он') + ' ' + g(M.go) + '? (в ' + md.vu + ')', c: v, why: 'Скорость = расстояние : время: v = s : t = ' + fmt(s) + ' : ' + t + ' = <b>' + v + ' ' + md.vu + '</b>.' };
    if (k === 2) return { type: 'input', q: H.n + ' ' + g(M.go) + ' ' + M.how + ' со скоростью <b>' + v + ' ' + md.vu + '</b>. За сколько ' + md.tg + ' ' + (H.f ? 'она' : 'он') + ' ' + g(M.did) + ' <b>' + fmt(s) + ' ' + md.su + '</b>?', c: t, why: 'Время = расстояние : скорость: t = s : v = ' + fmt(s) + ' : ' + v + ' = <b>' + t + '</b>.' };
    if (k === 3 && L > 1) {
      var t2 = R(tr[0], tr[1]), v2 = R(vr[0], vr[1]), tot = s + v2 * t2;
      if (tot > 100000) return G.motion(L);
      return { type: 'input', q: 'Сначала ' + H.n + ' ' + g(M.go) + ' ' + M.how + ' <b>' + md.tw(t) + '</b> со скоростью <b>' + v + ' ' + md.vu + '</b>, а потом ещё <b>' + md.tw(t2) + '</b> со скоростью <b>' + v2 + ' ' + md.vu + '</b>. Какой путь ' + (H.f ? 'она' : 'он') + ' ' + g(M.did) + ' всего? (в ' + md.su + ')', c: tot, why: '1) ' + v + ' · ' + t + ' = ' + fmt(s) + ' ' + md.su + '; 2) ' + v2 + ' · ' + t2 + ' = ' + fmt(v2 * t2) + ' ' + md.su + '; 3) ' + fmt(s) + ' + ' + fmt(v2 * t2) + ' = <b>' + fmt(tot) + ' ' + md.su + '</b>.' };
    }
    var Q = [['Как найти <b>расстояние</b>, если известны скорость и время?', 'v · t', ['v : t', 't : v', 'v + t'], 'Расстояние = скорость · время.'], ['Как найти <b>время</b>, если известны расстояние и скорость?', 's : v', ['s · v', 'v : s', 's − v'], 'Время = расстояние : скорость.'], ['Как найти <b>скорость</b>, если известны расстояние и время?', 's : t', ['s · t', 't : s', 's − t'], 'Скорость = расстояние : время.']];
    var qq = pick(Q);
    return one(qq[0] + ' (s — расстояние, v — скорость, t — время)', qq[1], qq[2], qq[3] + ' Ответ: <b>' + qq[1] + '</b>.');
  };

  // 13. Встречное движение и движение в противоположных направлениях
  G.motion_two = function (level) {
    var L = L3(level), P = whoN(2), A = P[0], B = P[1], km = L === 3 ? R(0, 1) === 1 : false;
    var vu = km ? 'км/ч' : 'м/мин', su = km ? 'км' : 'м', tw = km ? hrs : mins, tg = km ? 'часов' : 'минут';
    var v1 = km ? R(8, 20) : R(byL(L, [40, 50, 50]), byL(L, [90, 120, 150])), v2 = km ? R(8, 20) : R(byL(L, [40, 50, 50]), byL(L, [90, 120, 150])), t = R(byL(L, [2, 3, 3]), byL(L, [6, 12, km ? 6 : 30])), vs = v1 + v2, d = vs * t, k = R(0, 4);
    var go = km ? 'выехали на велосипедах' : 'вышли';
    var meet = 'Из двух домиков навстречу друг другу одновременно ' + go + ' ' + A.n + ' и ' + B.n + '. Скорость ' + A.g + ' — <b>' + v1 + ' ' + vu + '</b>, скорость ' + B.g + ' — <b>' + v2 + ' ' + vu + '</b>. ';
    if (k === 0) return { type: 'input', q: meet + 'Они встретились через <b>' + tw(t) + '</b>. Какое расстояние между домиками? (в ' + su + ')', c: d, why: '1) Скорость сближения: ' + v1 + ' + ' + v2 + ' = ' + vs + ' ' + vu + '. 2) Расстояние: ' + vs + ' · ' + t + ' = <b>' + fmt(d) + ' ' + su + '</b>.' };
    if (k === 1) return { type: 'input', q: meet + 'Расстояние между домиками <b>' + fmt(d) + ' ' + su + '</b>. Через сколько ' + tg + ' они встретятся?', c: t, why: '1) Скорость сближения: ' + v1 + ' + ' + v2 + ' = ' + vs + ' ' + vu + '. 2) Время: ' + fmt(d) + ' : ' + vs + ' = <b>' + t + '</b>.' };
    if (k === 2) return { type: 'input', q: 'Из двух домиков, расстояние между которыми <b>' + fmt(d) + ' ' + su + '</b>, навстречу друг другу одновременно ' + go + ' ' + A.n + ' и ' + B.n + '. Они встретились через <b>' + tw(t) + '</b>. Скорость ' + A.g + ' — <b>' + v1 + ' ' + vu + '</b>. Какова скорость ' + B.g + '? (в ' + vu + ')', c: v2, why: '1) Скорость сближения: ' + fmt(d) + ' : ' + t + ' = ' + vs + ' ' + vu + '. 2) Скорость ' + B.g + ': ' + vs + ' − ' + v1 + ' = <b>' + v2 + ' ' + vu + '</b>.' };
    if (k === 3) {
      var d0 = L === 3 ? R(1, 9) * (km ? 1 : 100) : 0, res = d0 + d;
      return { type: 'input', q: (d0 ? 'Из двух домиков, расстояние между которыми <b>' + d0 + ' ' + su + '</b>,' : 'Из одного домика') + ' в <b>противоположных направлениях</b> одновременно ' + go + ' ' + A.n + ' и ' + B.n + '. Скорость ' + A.g + ' — <b>' + v1 + ' ' + vu + '</b>, скорость ' + B.g + ' — <b>' + v2 + ' ' + vu + '</b>. Какое расстояние будет между ними через <b>' + tw(t) + '</b>? (в ' + su + ')', c: res, why: '1) Скорость удаления: ' + v1 + ' + ' + v2 + ' = ' + vs + ' ' + vu + '. 2) За ' + tw(t) + ' они удалятся на ' + vs + ' · ' + t + ' = ' + fmt(d) + ' ' + su + '.' + (d0 ? ' 3) ' + d0 + ' + ' + fmt(d) + ' = ' + fmt(res) + ' ' + su + '.' : '') + ' Ответ: <b>' + fmt(res) + ' ' + su + '</b>.' };
    }
    var opp = R(0, 1) === 1;
    return one((opp ? 'Два друга идут в противоположные стороны' : 'Два друга идут навстречу друг другу') + ' со скоростями <b>' + v1 + ' ' + vu + '</b> и <b>' + v2 + ' ' + vu + '</b>. Чему равна скорость ' + (opp ? 'удаления' : 'сближения') + '?', vs + ' ' + vu, [Math.abs(v1 - v2) + ' ' + vu, v1 * v2 + ' ' + vu, vs * 2 + ' ' + vu], 'И при встречном движении, и при движении в противоположные стороны скорости <b>складывают</b>: ' + v1 + ' + ' + v2 + ' = <b>' + vs + ' ' + vu + '</b>.');
  };

  // 14. Работа
  var OBJ = [['пирожок', 'пирожка', 'пирожков'], ['пряник', 'пряника', 'пряников'], ['кекс', 'кекса', 'кексов'], ['эклер', 'эклера', 'эклеров'], ['леденец', 'леденца', 'леденцов'], ['бублик', 'бублика', 'бубликов'], ['рогалик', 'рогалика', 'рогаликов'], ['маффин', 'маффина', 'маффинов']];
  var WORK = [['печёт', 'испечёт', 'испёк', 'испекла', 'испекут'], ['лепит', 'слепит', 'слепил', 'слепила', 'слепят'], ['украшает', 'украсит', 'украсил', 'украсила', 'украсят'], ['упаковывает', 'упакует', 'упаковал', 'упаковала', 'упакуют']];
  G.work = function (level) {
    var L = L3(level), O = pick(OBJ), W = pick(WORK), P = whoN(2), H = P[0], H2 = P[1];
    var p = R(byL(L, [2, 10, 20]), byL(L, [10, 60, 500])), t = R(2, byL(L, [5, 9, 12])), A = p * t, k = R(0, 4);
    var o = function (n) { return pn(n, O[0], O[1], O[2]); };
    if (A > 100000) return G.work(L);
    if (k === 0) return { type: 'input', q: H.n + ' за 1 час ' + W[0] + ' <b>' + o(p) + '</b>. Сколько ' + O[2] + ' ' + W[1] + ' ' + H.n + ' за <b>' + hrs(t) + '</b>?', c: A, why: 'Объём работы = производительность · время: ' + p + ' · ' + t + ' = <b>' + fmt(A) + '</b>.' };
    if (k === 1) return { type: 'input', q: 'За <b>' + hrs(t) + '</b> ' + H.n + ' ' + H.v(W[2], W[3]) + ' <b>' + o(A) + '</b>, работая одинаково быстро. Сколько ' + O[2] + ' в час ' + W[0] + ' ' + H.n + '?', c: p, why: 'Производительность = объём работы : время: ' + fmt(A) + ' : ' + t + ' = <b>' + p + '</b> в час.' };
    if (k === 2) return { type: 'input', q: H.n + ' за 1 час ' + W[0] + ' <b>' + o(p) + '</b>. За сколько часов ' + H.n + ' ' + W[1] + ' <b>' + o(A) + '</b>?', c: t, why: 'Время = объём работы : производительность: ' + fmt(A) + ' : ' + p + ' = <b>' + t + '</b> ч.' };
    var p2 = R(byL(L, [2, 10, 20]), byL(L, [10, 60, 500])), ps = p + p2, A2 = ps * t;
    if (A2 > 100000) return G.work(L);
    if (k === 3) return { type: 'input', q: H.n + ' за час ' + W[0] + ' <b>' + o(p) + '</b>, а ' + H2.n + ' — <b>' + o(p2) + '</b>. Сколько ' + O[2] + ' они ' + W[4] + ' вместе за <b>' + hrs(t) + '</b>?', c: A2, why: '1) Вместе за час: ' + p + ' + ' + p2 + ' = ' + ps + '. 2) За ' + hrs(t) + ': ' + ps + ' · ' + t + ' = <b>' + fmt(A2) + '</b>.' };
    return { type: 'input', q: H.n + ' за час ' + W[0] + ' <b>' + o(p) + '</b>, а ' + H2.n + ' — <b>' + o(p2) + '</b>. За сколько часов они вместе сделают <b>' + o(A2) + '</b>?', c: t, why: '1) Вместе за час: ' + p + ' + ' + p2 + ' = ' + ps + '. 2) Время: ' + fmt(A2) + ' : ' + ps + ' = <b>' + t + '</b> ч.' };
  };

  // 15. Купля-продажа
  var GOODS = [['торт', 'торта', 'тортов', 1], ['кекс', 'кекса', 'кексов', 0], ['пряник', 'пряника', 'пряников', 0], ['батончик', 'батончика', 'батончиков', 0], ['круассан', 'круассана', 'круассанов', 0], ['пакет сока', 'пакета сока', 'пакетов сока', 0], ['набор фломастеров', 'набора фломастеров', 'наборов фломастеров', 1], ['блокнот', 'блокнота', 'блокнотов', 0], ['леденец', 'леденца', 'леденцов', 0], ['конструктор', 'конструктора', 'конструкторов', 1]];
  function priceOf(g, L) { return g[3] ? byL(L, [R(10, 40) * 5, R(30, 180) * 5, R(100, 900) * 5]) : byL(L, [R(2, 12) * 5, R(4, 30) * 5, R(6, 40) * 5]); }
  G.buy = function (level) {
    var L = L3(level), Gs = shuffle(GOODS), g1 = Gs[0], g2 = Gs[1], H = who(), k = R(0, 4);
    var p = priceOf(g1, L), n = R(2, 9), cost = p * n;
    var gp = function (g, x) { return pn(x, g[0], g[1], g[2]); };
    if (k === 0) return { type: 'input', q: H.n + ' ' + H.v('купил', 'купила') + ' <b>' + gp(g1, n) + '</b>. Один ' + g1[0] + ' стоит <b>' + rub(p) + '</b>. Сколько рублей стоит вся покупка?', c: cost, why: 'Стоимость = цена · количество: ' + p + ' · ' + n + ' = <b>' + fmt(cost) + ' руб.</b>' };
    if (k === 1) return { type: 'input', q: 'За <b>' + n + ' одинаковых ' + plural(n, g1[1], g1[1], g1[2]) + '</b> заплатили <b>' + rub(cost) + '</b>. Сколько рублей стоит один ' + g1[0] + '?', c: p, why: 'Цена = стоимость : количество: ' + fmt(cost) + ' : ' + n + ' = <b>' + p + ' руб.</b>' };
    if (k === 2) return { type: 'input', q: 'Один ' + g1[0] + ' стоит <b>' + rub(p) + '</b>. Сколько ' + g1[2] + ' можно купить на <b>' + rub(cost) + '</b>?', c: n, why: 'Количество = стоимость : цена: ' + fmt(cost) + ' : ' + p + ' = <b>' + n + '</b>.' };
    var p2 = priceOf(g2, L), n2 = R(2, 9), tot = cost + p2 * n2;
    if (k === 3 || L === 1) return { type: 'input', q: H.n + ' ' + H.v('купил', 'купила') + ' <b>' + gp(g1, n) + '</b> и <b>' + gp(g2, n2) + '</b>. ' + g1[0][0].toUpperCase() + g1[0].slice(1) + ' стоит <b>' + rub(p) + '</b>, ' + g2[0] + ' — <b>' + rub(p2) + '</b>. Сколько рублей стоит вся покупка?', c: tot, why: '1) ' + p + ' · ' + n + ' = ' + fmt(cost) + ' руб.; 2) ' + p2 + ' · ' + n2 + ' = ' + fmt(p2 * n2) + ' руб.; 3) ' + fmt(cost) + ' + ' + fmt(p2 * n2) + ' = <b>' + fmt(tot) + ' руб.</b>' };
    var bills = [100, 200, 500, 1000, 2000, 5000].filter(function (b) { return b > tot; });
    if (!bills.length) return G.buy(L);
    var bill = bills[R(0, Math.min(1, bills.length - 1))];
    return { type: 'input', q: H.n + ' ' + H.v('купил', 'купила') + ' <b>' + gp(g1, n) + '</b> по цене <b>' + rub(p) + '</b> и <b>' + gp(g2, n2) + '</b> по цене <b>' + rub(p2) + '</b> и ' + H.v('заплатил', 'заплатила') + ' купюрой <b>' + fmt(bill) + ' руб.</b> Сколько рублей сдачи ' + H.v('получил', 'получила') + ' ' + H.n + '?', c: bill - tot, why: '1) ' + p + ' · ' + n + ' = ' + fmt(cost) + '; 2) ' + p2 + ' · ' + n2 + ' = ' + fmt(p2 * n2) + '; 3) ' + fmt(cost) + ' + ' + fmt(p2 * n2) + ' = ' + fmt(tot) + ' руб.; 4) ' + fmt(bill) + ' − ' + fmt(tot) + ' = <b>' + fmt(bill - tot) + ' руб.</b>' };
  };

  // 16. Доля числа и число по доле
  var SWE = [['конфета', 'конфеты', 'конфет'], ['орех', 'ореха', 'орехов'], ['ягода', 'ягоды', 'ягод'], ['пряник', 'пряника', 'пряников'], ['леденец', 'леденца', 'леденцов'], ['вишенка', 'вишенки', 'вишенок'], ['мармеладка', 'мармеладки', 'мармеладок']];
  G.part_num = function (level) {
    var L = L3(level), b = R(2, byL(L, [5, 10, 10])), a = L === 1 ? 1 : R(1, b - 1), kpart = R(2, byL(L, [10, 30, 2000])), n = b * kpart, part = a * kpart, k = R(0, 4), S = pick(SWE), H = who();
    if (gcd(a, b) > 1) { a = 1; part = kpart; }
    var fr = a + '/' + b, sw = function (x) { return pn(x, S[0], S[1], S[2]); };
    if (n > 100000) return G.part_num(L);
    if (k === 0) return { type: 'input', q: 'Найди <b>' + fr + '</b> от числа <b>' + fmt(n) + '</b>.', c: part, why: 'Делим на знаменатель — находим одну долю: ' + fmt(n) + ' : ' + b + ' = ' + fmt(kpart) + (a > 1 ? '; умножаем на числитель: ' + fmt(kpart) + ' · ' + a + ' = ' + fmt(part) : '') + '. Ответ: <b>' + fmt(part) + '</b>.' };
    if (k === 1) return { type: 'input', q: '<b>' + fr + '</b> числа ' + (a > 1 ? 'равны' : 'равна') + ' <b>' + fmt(part) + '</b>. Найди всё число.', c: n, why: (a > 1 ? 'Одна доля: ' + fmt(part) + ' : ' + a + ' = ' + fmt(kpart) + '; ' : '') + 'всё число — это ' + pn(b, 'доля', 'доли', 'долей') + ': ' + fmt(kpart) + ' · ' + b + ' = <b>' + fmt(n) + '</b>.' };
    if (k === 2) return { type: 'input', q: 'В вазе — <b>' + sw(n) + '</b>. ' + H.n + ' ' + H.v('съел', 'съела') + ' <b>' + fr + '</b> всех ' + S[2] + '. Сколько ' + S[2] + ' ' + H.v('съел', 'съела') + ' ' + H.n + '?', c: part, why: fmt(n) + ' : ' + b + ' = ' + fmt(kpart) + (a > 1 ? ', ' + fmt(kpart) + ' · ' + a + ' = ' + fmt(part) : '') + '. Ответ: <b>' + fmt(part) + '</b>.' };
    if (k === 3 && L > 1) return { type: 'input', q: 'В вазе — <b>' + sw(n) + '</b>. ' + H.n + ' ' + H.v('съел', 'съела') + ' <b>' + fr + '</b> всех ' + S[2] + '. Сколько ' + S[2] + ' осталось в вазе?', c: n - part, why: '1) ' + fmt(n) + ' : ' + b + ' = ' + fmt(kpart) + (a > 1 ? '; 2) ' + fmt(kpart) + ' · ' + a + ' = ' + fmt(part) : '') + '; ' + (a > 1 ? '3' : '2') + ') ' + fmt(n) + ' − ' + fmt(part) + ' = <b>' + fmt(n - part) + '</b>.' };
    return { type: 'input', q: H.n + ' ' + H.v('съел', 'съела') + ' <b>' + fr + '</b> всех ' + S[2] + ' из вазы — это <b>' + sw(part) + '</b>. Сколько ' + S[2] + ' было в вазе?', c: n, why: (a > 1 ? 'Одна доля: ' + fmt(part) + ' : ' + a + ' = ' + fmt(kpart) + '; ' : 'Одна доля — ' + fmt(kpart) + '; ') + 'всего ' + pn(b, 'доля', 'доли', 'долей') + ': ' + fmt(kpart) + ' · ' + b + ' = <b>' + fmt(n) + '</b>.' };
  };

  // 17. Фигуры и тела
  function grid(W, H, a, b) {
    var rows = [];
    for (var y = 0; y < H; y++) { var r = ''; for (var x = 0; x < W; x++) r += (y < b && x >= W - a) ? '⬜' : '🟧'; rows.push(r); }
    return '<div style="line-height:1.05;font-size:22px;margin:6px 0">' + rows.join('<br>') + '</div>';
  }
  var BOD = { 'шар': ['мяч', 'арбуз', 'глобус', 'горошина', 'апельсин', 'клубок ниток'], 'куб': ['кубик сахара', 'игральный кубик', 'кубик Рубика', 'кубик льда'], 'цилиндр': ['консервная банка', 'бревно', 'свеча', 'батарейка', 'труба'], 'конус': ['вафельный рожок', 'праздничный колпак', 'дорожный конус'], 'пирамида': ['египетская пирамида', 'крыша башенки с четырьмя гранями'] };
  G.shapes = function (level) {
    var L = L3(level), k = R(0, 6);
    if (k === 0) {
      if (L === 1) { var W = R(3, 6), H = R(3, 5), a = R(1, W - 1), b = R(1, H - 1), S = W * H - a * b, per = R(0, 1); return per ? { type: 'input', q: 'Фигура составлена из клеток, сторона каждой клетки — 1 см. Найди <b>периметр</b> оранжевой фигуры (в см).' + grid(W, H, a, b), c: 2 * (W + H), why: 'Обходим фигуру по контуру. Вырез в углу не меняет периметр: можно «вытолкнуть» стороны выреза наружу и получить прямоугольник ' + W + ' × ' + H + '. P = (' + W + ' + ' + H + ') · 2 = <b>' + 2 * (W + H) + ' см</b>.' } : { type: 'input', q: 'Фигура составлена из клеток по 1 кв. см. Найди <b>площадь</b> оранжевой фигуры (в кв. см).' + grid(W, H, a, b), c: S, why: 'Весь прямоугольник: ' + W + ' · ' + H + ' = ' + W * H + ' кв. см; вырез: ' + a + ' · ' + b + ' = ' + a * b + ' кв. см. ' + W * H + ' − ' + a * b + ' = <b>' + S + ' кв. см</b>.' }; }
      var W2 = R(byL(L, [0, 6, 20]), byL(L, [0, 20, 99])), H2 = R(byL(L, [0, 5, 15]), byL(L, [0, 15, 80])), a2 = R(1, W2 - 1), b2 = R(1, H2 - 1), area = R(0, 1);
      var tx = 'Из прямоугольника <b>' + W2 + ' см × ' + H2 + ' см</b> вырезали в углу прямоугольник <b>' + a2 + ' см × ' + b2 + ' см</b>. ';
      if (area) return { type: 'input', q: tx + 'Найди <b>площадь</b> оставшейся фигуры (в кв. см).', c: W2 * H2 - a2 * b2, why: '1) ' + W2 + ' · ' + H2 + ' = ' + W2 * H2 + '; 2) ' + a2 + ' · ' + b2 + ' = ' + a2 * b2 + '; 3) ' + W2 * H2 + ' − ' + a2 * b2 + ' = <b>' + (W2 * H2 - a2 * b2) + ' кв. см</b>.' };
      return { type: 'input', q: tx + 'Найди <b>периметр</b> оставшейся фигуры (в см).', c: 2 * (W2 + H2), why: 'Когда вырезают угол, две стороны выреза заменяют два куска сторон такой же длины, поэтому периметр как у целого прямоугольника: (' + W2 + ' + ' + H2 + ') · 2 = <b>' + 2 * (W2 + H2) + ' см</b>.' };
    }
    if (k === 1) {
      var h = R(2, byL(L, [6, 20, 60])), cnt = L === 3 ? 3 : 2, ws = [], i;
      for (i = 0; i < cnt; i++) ws.push(R(2, byL(L, [8, 25, 90])));
      var sumW = ws.reduce(function (s, x) { return s + x; }, 0), ar = R(0, 1);
      var txt = 'Фигура составлена из ' + cnt + ' прямоугольников одинаковой высоты <b>' + h + ' см</b>, приставленных друг к другу боковыми сторонами в ряд. Их длины: <b>' + ws.join(' см, ') + ' см</b>. ';
      if (ar) return { type: 'input', q: txt + 'Найди <b>площадь</b> фигуры (в кв. см).', c: sumW * h, why: 'Площадь фигуры = сумма площадей частей: ' + ws.map(function (w) { return w + ' · ' + h; }).join(' + ') + ' = ' + ws.map(function (w) { return w * h; }).join(' + ') + ' = <b>' + sumW * h + ' кв. см</b>.' };
      return { type: 'input', q: txt + 'Найди <b>периметр</b> фигуры (в см).', c: 2 * (sumW + h), why: 'Вместе получился прямоугольник длиной ' + ws.join(' + ') + ' = ' + sumW + ' см и высотой ' + h + ' см. P = (' + sumW + ' + ' + h + ') · 2 = <b>' + 2 * (sumW + h) + ' см</b>.' };
    }
    if (k === 2) {
      var r = R(2, byL(L, [20, 99, 999])), obj = pick(['круглого торта', 'круглой пиццы', 'круглого леденца', 'клумбы', 'циферблата часов', 'круглого пруда']);
      if (R(0, 1)) return { type: 'input', q: 'Радиус ' + obj + ' — <b>' + r + ' см</b>. Чему равен его диаметр (в см)?', c: 2 * r, why: 'Диаметр равен двум радиусам: d = 2 · r = 2 · ' + r + ' = <b>' + 2 * r + ' см</b>.' };
      return { type: 'input', q: 'Диаметр ' + obj + ' — <b>' + 2 * r + ' см</b>. Чему равен его радиус (в см)?', c: r, why: 'Радиус — половина диаметра: r = d : 2 = ' + 2 * r + ' : 2 = <b>' + r + ' см</b>.' };
    }
    if (k === 3) {
      var D = [['Отрезок, который соединяет центр окружности с точкой на окружности, называется…', 'радиус', ['диаметр', 'сторона', 'периметр']], ['Отрезок, который проходит через центр и соединяет две точки окружности, называется…', 'диаметр', ['радиус', 'сторона', 'центр']], ['Часть плоскости, ограниченная окружностью, называется…', 'круг', ['шар', 'квадрат', 'радиус']], ['Чем рисуют окружность?', 'циркулем', ['линейкой', 'угольником', 'транспортиром']], ['Сколько радиусов помещается в диаметре?', '2', ['1', '3', '4']]];
      var dd = pick(D);
      return one(dd[0], dd[1], dd[2], 'Запомни: радиус — от центра до окружности, диаметр — через центр, d = 2 · r. Ответ: <b>' + dd[1] + '</b>.');
    }
    if (k === 4) {
      var keys = ['шар', 'куб', 'цилиндр'], items = [];
      keys.forEach(function (key, gi) { shuffle(BOD[key]).slice(0, 2).forEach(function (x) { items.push([x, gi]); }); });
      return { type: 'sort', q: 'На какое тело похож каждый предмет?', groups: ['Шар', 'Куб', 'Цилиндр'], items: shuffle(items), why: 'Шар — круглый со всех сторон; у куба 6 одинаковых квадратных граней; у цилиндра два круглых основания и гладкая боковая поверхность.' };
    }
    if (k === 5) {
      var names = Object.keys(BOD), body = pick(names), thing = pick(BOD[body]);
      return one('На какое геометрическое тело похож предмет: <b>' + thing + '</b>?', body, shuffle(names.filter(function (x) { return x !== body; })), thing[0].toUpperCase() + thing.slice(1) + ' похож(а) на <b>' + body + '</b>.');
    }
    var YES = ['А', 'Ш', 'Т', 'П', 'Н', 'Ж', 'О', 'Х', 'Е', 'Ф', 'М'], NO = ['Г', 'Я', 'Р', 'Ь', 'Б', 'Ю', 'Ц'], its = [];
    shuffle(YES).slice(0, 3).forEach(function (x) { its.push([x, 0]); }); shuffle(NO).slice(0, 2).forEach(function (x) { its.push([x, 1]); });
    return { type: 'sort', q: 'У каких печатных букв есть ось симметрии?', groups: ['Есть ось', 'Нет оси'], items: shuffle(its), why: 'Если букву можно перегнуть по прямой так, что половинки совпадут, у неё есть ось симметрии: ' + its.filter(function (x) { return !x[1]; }).map(function (x) { return x[0]; }).join(', ') + '. У букв ' + its.filter(function (x) { return x[1]; }).map(function (x) { return x[0]; }).join(', ') + ' половинки не совпадают.' };
  };

  // 18. Таблицы, диаграммы, логика
  G.data_logic = function (level) {
    var L = L3(level), k = R(0, 5);
    if (k <= 2) {
      var P = whoN(4), sc = byL(L, [1, pick([2, 5]), pick([10, 20, 50])]), cnt = shuffle([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 4);
      var tbl = '<table style="margin:6px auto;border-collapse:collapse">' + P.map(function (p, i) { return '<tr><td style="padding:2px 8px;text-align:left">' + p.n + '</td><td style="text-align:left">' + new Array(cnt[i] + 1).join('🍬') + '</td></tr>'; }).join('') + '</table>' + (sc > 1 ? '<div class="small">🍬 = ' + pn(sc, 'конфета', 'конфеты', 'конфет') + '</div>' : '<div class="small">🍬 = 1 конфета</div>');
      var head = 'Диаграмма: сколько конфет собрали сыщики.' + tbl;
      var i1 = R(0, 3), i2 = (i1 + R(1, 3)) % 4, q = R(0, 3);
      if (q === 0) return { type: 'input', q: head + 'Сколько конфет ' + P[i1].v('собрал', 'собрала') + ' <b>' + P[i1].n + '</b>?', c: cnt[i1] * sc, why: 'У ' + P[i1].g + ' на диаграмме ' + pn(cnt[i1], 'значок', 'значка', 'значков') + (sc > 1 ? ', каждый — ' + pn(sc, 'конфета', 'конфеты', 'конфет') + ': ' + cnt[i1] + ' · ' + sc + ' = ' : ' — это ') + '<b>' + cnt[i1] * sc + '</b>.' };
      if (q === 1) { var hi = cnt[i1] > cnt[i2] ? i1 : i2, lo = hi === i1 ? i2 : i1; return { type: 'input', q: head + 'На сколько конфет больше ' + P[hi].v('собрал', 'собрала') + ' <b>' + P[hi].n + '</b>, чем <b>' + P[lo].n + '</b>?', c: (cnt[hi] - cnt[lo]) * sc, why: P[hi].n + ': ' + cnt[hi] * sc + ', ' + P[lo].n + ': ' + cnt[lo] * sc + '. ' + cnt[hi] * sc + ' − ' + cnt[lo] * sc + ' = <b>' + (cnt[hi] - cnt[lo]) * sc + '</b>.' }; }
      if (q === 2) { var sum = cnt.reduce(function (s, x) { return s + x; }, 0); return { type: 'input', q: head + 'Сколько конфет собрали все сыщики <b>вместе</b>?', c: sum * sc, why: cnt.map(function (x) { return x * sc; }).join(' + ') + ' = <b>' + sum * sc + '</b>.' }; }
      var mx = 0; cnt.forEach(function (x, i) { if (x > cnt[mx]) mx = i; });
      var least = R(0, 1) === 1, mn = 0; cnt.forEach(function (x, i) { if (x < cnt[mn]) mn = i; });
      var ans = least ? mn : mx;
      return one(head + 'Кто собрал <b>' + (least ? 'меньше' : 'больше') + ' всех</b>?', P[ans].n, P.filter(function (p, i) { return i !== ans; }).map(function (p) { return p.n; }), 'Смотрим на ' + (least ? 'самый короткий' : 'самый длинный') + ' столбик: это <b>' + P[ans].n + '</b> (' + cnt[ans] * sc + ').');
    }
    if (k === 3) {
      var Gs = shuffle(GOODS).slice(0, 3), pr = Gs.map(function (g) { return priceOf(g, L); }), i3 = R(0, 2), i4 = (i3 + R(1, 2)) % 3, n1 = R(2, 5), n2 = R(2, 5), tot = pr[i3] * n1 + pr[i4] * n2;
      var tb = '<table style="margin:6px auto;border-collapse:collapse;border:1px solid #ccc"><tr><th style="padding:2px 8px">Товар</th><th style="padding:2px 8px">Цена, руб.</th></tr>' + Gs.map(function (g, i) { return '<tr><td style="padding:2px 8px">' + g[0] + '</td><td style="padding:2px 8px">' + pr[i] + '</td></tr>'; }).join('') + '</table>';
      return { type: 'input', q: 'Цены в лавке Сладкограда:' + tb + 'Сколько рублей стоят <b>' + pn(n1, Gs[i3][0], Gs[i3][1], Gs[i3][2]) + '</b> и <b>' + pn(n2, Gs[i4][0], Gs[i4][1], Gs[i4][2]) + '</b>?', c: tot, why: 'Берём цены из таблицы: ' + pr[i3] + ' · ' + n1 + ' = ' + pr[i3] * n1 + '; ' + pr[i4] + ' · ' + n2 + ' = ' + pr[i4] * n2 + '; ' + pr[i3] * n1 + ' + ' + pr[i4] * n2 + ' = <b>' + tot + '</b> руб.' };
    }
    if (k === 4) {
      var n = byL(L, [R(10, 99), R(100, 9999), R(1000, 99999)]), m = byL(L, [R(10, 99), R(100, 9999), R(1000, 99999)]), st = R(0, L === 3 ? 4 : 3), txt, c, ex;
      if (st === 0) { var dv = pick([2, 5, 10]); txt = 'Число ' + fmt(n) + ' делится на ' + dv + ' без остатка'; c = n % dv === 0; ex = 'Последняя цифра — ' + n % 10 + '. ' + (dv === 2 ? 'На 2 делятся числа, оканчивающиеся на 0, 2, 4, 6, 8.' : dv === 5 ? 'На 5 делятся числа, оканчивающиеся на 0 или 5.' : 'На 10 делятся числа, оканчивающиеся на 0.'); }
      else if (st === 1) { if (m === n) m++; txt = 'Число ' + fmt(n) + ' больше числа ' + fmt(m); c = n > m; ex = fmt(n) + ' ' + sign(n, m) + ' ' + fmt(m) + '.'; }
      else if (st === 2) { var d = R(1, 9); txt = 'Число ' + fmt(n) + ' оканчивается цифрой ' + d; c = n % 10 === d; ex = 'Последняя цифра числа — ' + n % 10 + '.'; }
      else if (st === 3) { var ln = String(n).length, sh = R(0, 1) ? ln : ln + pick([-1, 1]); txt = 'Число ' + fmt(n) + ' — ' + sh + '-значное'; c = sh === ln; ex = 'В записи числа ' + String(n).length + ' цифр' + plural(String(n).length, 'а', 'ы', '') + '.'; }
      else { var ev = n % 2 === 0, big = n > m, orr = R(0, 1) === 1; txt = 'Число ' + fmt(n) + ' чётное ' + (orr ? '<b>или</b>' : '<b>и</b>') + ' больше ' + fmt(m); c = orr ? (ev || big) : (ev && big); ex = 'Чётное — ' + (ev ? 'да' : 'нет') + '; больше ' + fmt(m) + ' — ' + (big ? 'да' : 'нет') + '. ' + (orr ? 'Утверждение с «или» верно, если верна хотя бы одна часть.' : 'Утверждение с «и» верно, только если верны обе части.'); }
      return { type: 'tf', q: 'Истинно ли утверждение: «' + txt + '»?', c: c, why: ex + ' Утверждение <b>' + (c ? 'истинно' : 'ложно') + '</b>.' };
    }
    var Ps = whoN(3), IT = shuffle(['торт', 'пирог', 'кекс', 'пончик', 'эклер']).slice(0, 3), perm = shuffle([0, 1, 2]);
    var own = function (i) { return IT[perm[i]]; };
    var clue1 = Ps[0].n + ' не ' + Ps[0].v('ел', 'ела') + ' ни ' + own(1) + ', ни ' + own(2) + '.';
    var clue2 = Ps[1].n + ' не ' + Ps[1].v('ел', 'ела') + ' ' + own(2) + '.';
    var ask = R(0, 2);
    return one('Каждый съел одно лакомство: ' + Ps.map(function (p) { return p.n; }).join(', ') + ' — а лакомства были ' + IT.join(', ') + '. Улики: ' + clue1 + ' ' + clue2 + ' Что съел' + Ps[ask].v('', 'а') + ' <b>' + Ps[ask].n + '</b>?', own(ask), IT.filter(function (x) { return x !== own(ask); }), 'Из первой улики: ' + Ps[0].n + ' — ' + own(0) + '. Тогда ' + Ps[1].n + ' мог' + Ps[1].v('', 'ла') + ' съесть ' + own(1) + ' или ' + own(2) + ', но ' + own(2) + ' не ' + Ps[1].v('ел', 'ела') + ' — значит, ' + own(1) + '. ' + Ps[2].n + ' — ' + own(2) + '. Ответ: <b>' + own(ask) + '</b>.');
  };

  // ───────────────────────── уроки
  var units = [
    {
      id: 'million_read', title: 'Числа до миллиона', icon: '🔢', sub: 'Классы, разряды, чтение и запись', take: 8, gen: G.million_read,
      cards: [
        { t: 'Улика №1: классы', h: 'Большое число делим на группы по <b>3 цифры справа налево</b>. Это <b>классы</b>: правая тройка — класс <b>единиц</b>, следующая — класс <b>тысяч</b>.<br>Пример: <b>345 018</b> → 345 | 018.', tip: 'Делим число на тройки цифр справа налево.', pic: '🔢', k: 'класс единиц тысяч' },
        { t: 'Улика №2: разряды', h: 'В каждом классе три разряда: <b>единицы, десятки, сотни</b>. В числе 345 018: 3 — сотни тысяч, 4 — десятки тысяч, 5 — единицы тысяч, 0 — сотни, 1 — десятки, 8 — единицы.', tip: 'Ед., дес., сот. — и так в каждом классе.', pic: '🏠', k: 'разряды сотни тысяч' },
        { t: 'Улика №3: как читать', h: 'Читаем по классам слева: сначала класс тысяч со словом «тысяч», потом класс единиц.<br><b>207 040</b> — двести семь тысяч сорок. Нули вслух не называем.', tip: 'Сначала тысячи, потом единицы.', pic: '🗣️', k: 'чтение чисел' },
        { t: 'Улика №4: как записать', h: 'Слышим «тридцать тысяч пять». Класс тысяч — <b>30</b>, класс единиц — <b>5</b>, но в классе обязательно 3 цифры: <b>005</b>. Получаем <b>30 005</b>.', tip: 'Пустые разряды заполняем нулями.', pic: '✍️', k: 'запись чисел нули' },
        { t: 'Улика №5: сколько всего тысяч', h: 'Чтобы узнать, сколько <b>всего тысяч</b> в числе, закрой три последние цифры: в 345 018 всего <b>345</b> тысяч. Сколько всего сотен? Закрой две: <b>3450</b>.', tip: 'Всего тысяч — закрой 3 цифры справа.', pic: '🙈', k: 'всего тысяч сотен' },
        { t: 'Улика №6: миллион', h: 'Самое большое шестизначное число — <b>999 999</b>. Прибавим 1 — получим <b>1 000 000</b>, <b>миллион</b>: это тысяча тысяч.', tip: '1 000 000 = 1000 · 1000.', pic: '🏆', k: 'миллион' }
      ],
      quiz: [
        { type: 'input', q: 'Запиши цифрами: <b>двести четыре тысячи тридцать</b>', c: 204030, why: 'Класс тысяч — 204, класс единиц — 030. Получаем 204 030.' },
        { type: 'one', q: 'Как читается число <b>50 007</b>?', a: ['пятьдесят тысяч семь', 'пять тысяч семь', 'пятьсот тысяч семь', 'пятьдесят тысяч семьдесят'], c: 0, why: '50 | 007 — пятьдесят тысяч семь.' },
        { type: 'input', q: 'Какая цифра стоит в разряде <b>десятков тысяч</b> в числе <b>482 615</b>?', c: 8, why: 'Справа налево: 5 — ед., 1 — дес., 6 — сот., 2 — ед. тыс., 8 — дес. тыс.' },
        { type: 'input', q: 'Сколько всего <b>тысяч</b> в числе <b>736 400</b>?', c: 736, why: 'Закрываем три последние цифры: 736.' },
        { type: 'tf', q: 'В числе 100 000 шесть цифр.', c: true, why: '1, 0, 0, 0, 0, 0 — шесть цифр.' },
        { type: 'order', q: 'Расставь разряды от младшего к старшему.', items: ['единицы', 'десятки', 'сотни', 'единицы тысяч', 'десятки тысяч', 'сотни тысяч'], why: 'Разряды идут справа налево от единиц до сотен тысяч.' }
      ]
    },
    {
      id: 'million_compare', title: 'Разрядные слагаемые и сравнение', icon: '⚖️', sub: 'Раскладываем, сравниваем, упорядочиваем', take: 8, gen: G.million_compare,
      cards: [
        { t: 'Улика №1: разрядные слагаемые', h: 'Любое число можно разложить на <b>разрядные слагаемые</b>:<br><b>305 420 = 300 000 + 5 000 + 400 + 20</b>. Нули слагаемых не дают.', tip: 'Каждая ненулевая цифра — своё слагаемое.', pic: '🧩', k: 'разрядные слагаемые' },
        { t: 'Улика №2: больше цифр — больше число', h: 'Если в числах разное количество цифр, больше то, где цифр больше: <b>100 000 &gt; 99 999</b>.', tip: 'Шестизначное больше пятизначного.', pic: '📏', k: 'сравнение количества цифр' },
        { t: 'Улика №3: поразрядное сравнение', h: 'Если цифр поровну, сравниваем <b>слева направо</b>, пока цифры не разойдутся:<br>45 <b>3</b>12 и 45 <b>1</b>99: 3 &gt; 1, значит <b>45 312 &gt; 45 199</b>.', tip: 'Первая несовпадающая цифра решает.', pic: '🔍', k: 'поразрядное сравнение' },
        { t: 'Улика №4: упорядочить', h: '<b>По возрастанию</b> — от меньшего к большему, <b>по убыванию</b> — от большего к меньшему.<br>Пример: 12 040 &lt; 12 400 &lt; 14 020.', tip: 'Возрастание — вверх по лесенке.', pic: '🪜', k: 'возрастание убывание' },
        { t: 'Улика №5: чётные и нечётные', h: 'Чётность узнаём по <b>последней цифре</b>: 0, 2, 4, 6, 8 — <b>чётное</b>; 1, 3, 5, 7, 9 — <b>нечётное</b>. Число 507 312 — чётное (на конце 2).', tip: 'Смотри только на последнюю цифру.', pic: '🐾', k: 'чётные нечётные' }
      ],
      quiz: [
        { type: 'input', q: 'Запиши число: <b>400 000 + 60 000 + 300 + 9</b>', c: 460309, why: '4 сот. тыс., 6 дес. тыс., 0 ед. тыс., 3 сот., 0 дес., 9 ед. — 460 309.' },
        { type: 'one', q: 'Какой знак поставить: <b>87 905 ○ 87 950</b>?', a: ['&lt;', '&gt;', '='], c: 0, why: 'До десятков всё совпадает: 0 &lt; 5, значит 87 905 &lt; 87 950.' },
        { type: 'order', q: 'Расставь по возрастанию.', items: ['9 999', '10 001', '10 010', '10 100'], why: 'Четырёхзначное меньше пятизначных, дальше сравниваем поразрядно.' },
        { type: 'sort', q: 'Чётные и нечётные:', groups: ['Чётные', 'Нечётные'], items: [['45 670', 0], ['12 345', 1], ['100 002', 0], ['77 777', 1], ['30 008', 0]], why: 'Смотрим на последнюю цифру.' },
        { type: 'tf', q: '<b>500 000 + 7</b> = 500 007', c: true, why: 'Разряды с нулями заполняем нулями: 500 007.' },
        { type: 'input', q: 'Какое число идёт сразу за <b>99 999</b>?', c: 100000, why: '99 999 + 1 = 100 000.' }
      ]
    },
    {
      id: 'more_less', title: 'Больше и меньше: на и в', icon: '↕️', sub: 'Увеличить, уменьшить, сравнить', take: 8, gen: G.more_less,
      cards: [
        { t: 'Улика №1: «на» — плюс или минус', h: '<b>Больше на</b> — прибавляем, <b>меньше на</b> — вычитаем.<br>Число на 300 больше 4 500: <b>4 500 + 300 = 4 800</b>.', tip: '«На» — сложение или вычитание.', pic: '➕', k: 'больше на меньше на' },
        { t: 'Улика №2: «в» — умножаем или делим', h: '<b>В 3 раза больше</b> — умножаем, <b>в 3 раза меньше</b> — делим.<br>Увеличь 240 в 3 раза: <b>240 · 3 = 720</b>.', tip: '«В … раз» — умножение или деление.', pic: '✖️', k: 'в раз больше меньше' },
        { t: 'Улика №3: на разрядные единицы', h: 'Число, которое больше 52 300 на <b>4 тысячи</b>: прибавляем 4 000 — <b>56 300</b>. Меняется только цифра в разряде тысяч.', tip: '«На 4 тысячи» = на 4 000.', pic: '🎯', k: 'разрядные единицы' },
        { t: 'Улика №4: на сколько больше', h: 'Вопрос «<b>на сколько</b> больше?» — вычитаем: 900 − 600 = <b>300</b>.<br>Вопрос «<b>во сколько раз</b> больше?» — делим: 900 : 300 = <b>3</b>.', tip: 'На сколько — вычитание; во сколько раз — деление.', pic: '🔎', k: 'на сколько во сколько раз' }
      ],
      quiz: [
        { type: 'input', q: 'Увеличь <b>3 500</b> на <b>700</b>.', c: 4200, why: '3 500 + 700 = 4 200.' },
        { type: 'input', q: 'Уменьши <b>4 800</b> в <b>6 раз</b>.', c: 800, why: '4 800 : 6 = 800.' },
        { type: 'one', q: 'Увеличь <b>25</b> в <b>4 раза</b>.', a: ['100', '29', '21', '125'], c: 0, why: '«В 4 раза больше» — умножаем: 25 · 4 = 100.' },
        { type: 'input', q: 'На сколько <b>12 000</b> больше <b>9 000</b>?', c: 3000, why: '12 000 − 9 000 = 3 000.' },
        { type: 'input', q: 'Во сколько раз <b>56</b> больше <b>8</b>?', c: 7, why: '56 : 8 = 7.' },
        { type: 'tf', q: 'Число, которое на 2 сотни тысяч больше 340 000, — это 540 000.', c: true, why: '2 сотни тысяч = 200 000; 340 000 + 200 000 = 540 000.' }
      ]
    },
    {
      id: 'length_mass', title: 'Длина и масса', icon: '📏', sub: 'мм, см, дм, м, км; г, кг, ц, т', take: 8, gen: G.length_mass,
      cards: [
        { t: 'Улика №1: единицы длины', h: '<b>1 см = 10 мм</b>, <b>1 дм = 10 см</b>, <b>1 м = 10 дм = 100 см</b>, <b>1 км = 1000 м</b>.<br>Пример: 3 м 25 см = 300 + 25 = <b>325 см</b>.', tip: '1 км = 1000 м, 1 м = 100 см.', pic: '📏', k: 'длина мм см дм м км' },
        { t: 'Улика №2: единицы массы', h: '<b>1 кг = 1000 г</b>, <b>1 ц = 100 кг</b>, <b>1 т = 10 ц = 1000 кг</b>.<br>Пример: 2 т 40 кг = 2 000 + 40 = <b>2 040 кг</b>.', tip: '1 т = 1000 кг, 1 ц = 100 кг.', pic: '⚖️', k: 'масса г кг ц т' },
        { t: 'Улика №3: из крупных в мелкие', h: 'Переводим в мелкие единицы — <b>умножаем</b>: 7 км = 7 · 1000 = <b>7 000 м</b>.<br>Из мелких в крупные — <b>делим</b>: 4 000 г = <b>4 кг</b>.', tip: 'В мелкие — умножаем, в крупные — делим.', pic: '🔄', k: 'перевод единиц' },
        { t: 'Улика №4: сравнение величин', h: 'Сначала переводим в <b>одинаковые единицы</b>, потом сравниваем.<br>5 м 3 см и 530 см: 5 м 3 см = 503 см, а 503 &lt; 530.', tip: 'Сравниваем только в одинаковых единицах.', pic: '🔍', k: 'сравнение величин' },
        { t: 'Улика №5: величину на число', h: 'Умножим 3 кг 200 г на 4: 3 кг 200 г = 3 200 г; 3 200 · 4 = <b>12 800 г</b> = 12 кг 800 г.<br>Делим так же: 6 м 30 см : 3 = 630 : 3 = <b>210 см</b>.', tip: 'Переведи в мелкие единицы, потом считай.', pic: '🧮', k: 'умножение величины' }
      ],
      quiz: [
        { type: 'input', q: '<b>4 км 50 м = ? м</b>', c: 4050, why: '4 км = 4 000 м; 4 000 + 50 = 4 050 м.' },
        { type: 'input', q: '<b>3 т = ? кг</b>', c: 3000, why: '1 т = 1000 кг; 3 · 1000 = 3 000.' },
        { type: 'one', q: 'Сравни: <b>2 ц ○ 180 кг</b>', a: ['&gt;', '&lt;', '='], c: 0, why: '2 ц = 200 кг; 200 &gt; 180.' },
        { type: 'tf', q: '1 м = 1000 мм', c: true, why: '1 м = 100 см, 1 см = 10 мм, значит 1 м = 1000 мм.' },
        { type: 'input', q: '<b>2 кг 300 г · 3 = ? г</b>', c: 6900, why: '2 кг 300 г = 2 300 г; 2 300 · 3 = 6 900 г.' },
        { type: 'input', q: 'Бобёр разрезал бревно длиной <b>8 м</b> на 4 равные части. Сколько сантиметров в каждой части?', c: 200, why: '8 м = 800 см; 800 : 4 = 200 см.' }
      ]
    },
    {
      id: 'time', title: 'Время', icon: '⏰', sub: 'От секунды до века, время событий', take: 8, gen: G.time,
      cards: [
        { t: 'Улика №1: единицы времени', h: '<b>1 мин = 60 с</b>, <b>1 ч = 60 мин</b>, <b>1 сут = 24 ч</b>, <b>1 нед = 7 сут</b>, <b>1 год = 12 мес</b>, <b>1 век = 100 лет</b>.', tip: '60, 60, 24, 7, 12, 100.', pic: '⏰', k: 'единицы времени' },
        { t: 'Улика №2: перевод', h: '2 ч 15 мин = 2 · 60 + 15 = <b>135 мин</b>.<br>Будь осторожен: в часе <b>60</b>, а не 100 минут!', tip: 'Час — это 60 минут, не 100.', pic: '🔄', k: 'перевод часов в минуты' },
        { t: 'Улика №3: века', h: 'Век — 100 лет. 1–100 годы — I век, 101–200 — II век… <b>1812</b> год: полных сотен 18, прибавляем 1 — <b>XIX (19) век</b>. Но 1900 год — ещё 19 век!', tip: 'Номер века = сотни + 1 (если год не круглый).', pic: '📜', k: 'век год' },
        { t: 'Улика №4: время окончания', h: '<b>Окончание = начало + продолжительность.</b><br>Кино началось в 10:40 и шло 1 ч 30 мин: 10:40 + 1 ч = 11:40, + 30 мин = <b>12:10</b>.', tip: 'Начало + длительность = конец.', pic: '🎬', k: 'время события окончание' },
        { t: 'Улика №5: продолжительность и начало', h: '<b>Продолжительность = окончание − начало.</b> С 9:15 до 10:05 прошло <b>50 мин</b>.<br><b>Начало = окончание − продолжительность.</b>', tip: 'Конец − начало = сколько длилось.', pic: '⏳', k: 'продолжительность начало' }
      ],
      quiz: [
        { type: 'input', q: '<b>3 ч 20 мин = ? мин</b>', c: 200, why: '3 · 60 = 180; 180 + 20 = 200 мин.' },
        { type: 'input', q: '<b>2 сут = ? ч</b>', c: 48, why: '2 · 24 = 48 ч.' },
        { type: 'input', q: 'В каком веке был <b>1703</b> год?', c: 18, why: '17 полных сотен + 1 = 18 век.' },
        { type: 'one', q: 'Спектакль начался в <b>18:30</b> и длился <b>1 ч 45 мин</b>. Когда он закончился?', a: ['20:15', '19:75', '20:45', '19:15'], c: 0, why: '18:30 + 1 ч = 19:30; + 45 мин = 20:15.' },
        { type: 'tf', q: 'В неделе 7 суток, а в сутках 24 часа.', c: true, why: 'Так и есть.' },
        { type: 'order', q: 'От самого короткого к самому длинному:', items: ['1 мин', '100 с', '1 ч', '1 сут', '1 нед'], why: '60 с &lt; 100 с &lt; 3600 с; сутки длиннее часа, неделя — суток.' }
      ]
    },
    {
      id: 'area_units', title: 'Площадь', icon: '🟩', sub: 'Кв. см, кв. дм, кв. м', take: 8, gen: G.area_units,
      cards: [
        { t: 'Улика №1: что такое площадь', h: '<b>Площадь</b> — сколько места занимает фигура на плоскости. Её меряют квадратиками: <b>1 кв. см</b> — квадрат со стороной 1 см.', tip: 'Площадь меряют квадратами.', pic: '🟩', k: 'площадь квадратный сантиметр' },
        { t: 'Улика №2: площадь прямоугольника', h: '<b>S = длина · ширина.</b><br>Шоколадка 8 см на 5 см: S = 8 · 5 = <b>40 кв. см</b>.<br>Квадрат: S = сторона · сторона.', tip: 'S = a · b.', pic: '🍫', k: 'площадь прямоугольника' },
        { t: 'Улика №3: единицы площади', h: '<b>1 кв. дм = 100 кв. см</b> (10 · 10).<br><b>1 кв. м = 100 кв. дм = 10 000 кв. см</b>.<br>Пример: 3 кв. м = <b>300 кв. дм</b>.', tip: 'Соседние единицы площади — в 100 раз.', pic: '📐', k: 'единицы площади' },
        { t: 'Улика №4: найди сторону', h: 'Если известны площадь и одна сторона, вторую находим делением: S = 48 кв. см, ширина 6 см → длина <b>48 : 6 = 8 см</b>.', tip: 'Сторона = площадь : другая сторона.', pic: '🔍', k: 'найти сторону' },
        { t: 'Улика №5: не путай с периметром', h: '<b>Периметр</b> — длина забора вокруг (в см), <b>площадь</b> — сколько места внутри (в кв. см). У прямоугольника 5 × 3: P = 16 см, S = 15 кв. см.', tip: 'Периметр — вокруг, площадь — внутри.', pic: '🚧', k: 'периметр площадь разница' }
      ],
      quiz: [
        { type: 'input', q: 'Найди площадь прямоугольника 9 см × 7 см (в кв. см).', c: 63, why: '9 · 7 = 63 кв. см.' },
        { type: 'input', q: '<b>6 кв. дм = ? кв. см</b>', c: 600, why: '1 кв. дм = 100 кв. см; 6 · 100 = 600.' },
        { type: 'input', q: 'Площадь грядки 56 кв. м, ширина 7 м. Какова её длина (в м)?', c: 8, why: '56 : 7 = 8 м.' },
        { type: 'tf', q: '1 кв. м = 100 кв. см', c: false, why: '1 кв. м = 10 000 кв. см.' },
        { type: 'one', q: 'Площадь квадрата со стороной 4 см?', a: ['16 кв. см', '16 см', '8 кв. см', '12 кв. см'], c: 0, why: '4 · 4 = 16 кв. см.' },
        { type: 'input', q: '<b>2 кв. м = ? кв. дм</b>', c: 200, why: '1 кв. м = 100 кв. дм; 2 · 100 = 200.' }
      ]
    },
    {
      id: 'part_qty', title: 'Доли величин', icon: '🥧', sub: 'Полчаса, четверть килограмма', take: 8, gen: G.part_qty,
      cards: [
        { t: 'Улика №1: доля величины', h: 'Чтобы найти <b>долю</b> величины, переведи её в мелкие единицы и раздели на знаменатель.<br><b>1/4 ч</b> = 60 : 4 = <b>15 мин</b>.', tip: 'Переведи и раздели на знаменатель.', pic: '🥧', k: 'доля величины' },
        { t: 'Улика №2: знаменитые доли', h: '1/2 ч = <b>30 мин</b>, 1/4 ч = <b>15 мин</b>.<br>1/2 кг = <b>500 г</b>, 1/4 кг = <b>250 г</b>.<br>1/2 м = <b>50 см</b>, 1/4 м = <b>25 см</b>.', tip: 'Полчаса = 30 мин, четверть кг = 250 г.', pic: '⭐', k: 'половина четверть' },
        { t: 'Улика №3: несколько долей', h: '<b>3/4 ч</b>: одна доля 60 : 4 = 15 мин, три доли — 15 · 3 = <b>45 мин</b>.', tip: 'Делим на знаменатель, умножаем на числитель.', pic: '🧮', k: 'несколько долей' },
        { t: 'Улика №4: какая это доля', h: '20 мин — какая часть часа? 60 : 20 = 3, значит 20 мин — это <b>1/3 ч</b>.', tip: 'Целое : часть = знаменатель.', pic: '🔍', k: 'какая доля' }
      ],
      quiz: [
        { type: 'input', q: 'Сколько минут в <b>1/3</b> часа?', c: 20, why: '60 : 3 = 20 мин.' },
        { type: 'input', q: 'Сколько граммов в <b>3/4</b> килограмма?', c: 750, why: '1000 : 4 = 250; 250 · 3 = 750 г.' },
        { type: 'input', q: 'Сколько сантиметров в <b>1/5</b> метра?', c: 20, why: '100 : 5 = 20 см.' },
        { type: 'one', q: 'Что больше: <b>1/2 суток</b> или <b>10 ч</b>?', a: ['1/2 суток', '10 ч', 'поровну'], c: 0, why: '1/2 суток = 12 ч; 12 &gt; 10.' },
        { type: 'tf', q: '1/4 тонны = 250 кг', c: true, why: '1000 : 4 = 250 кг.' },
        { type: 'one', q: 'Какую часть минуты составляют 15 секунд?', a: ['1/4', '1/3', '1/2', '1/6'], c: 0, why: '60 : 15 = 4, это 1/4 минуты.' }
      ]
    },
    {
      id: 'round_mul', title: 'Умножение и деление на круглые числа', icon: '0️⃣', sub: 'На 10, 100, 1000 и не только', take: 8, gen: G.round_mul,
      cards: [
        { t: 'Улика №1: на 10, 100, 1000', h: 'Умножить на 10, 100, 1000 — приписать справа 1, 2, 3 нуля: <b>45 · 100 = 4 500</b>.<br>Разделить — отбросить столько же нулей: <b>7 000 : 1000 = 7</b>.', tip: 'Умножаем — приписываем нули, делим — отбрасываем.', pic: '0️⃣', k: 'умножение на 10 100 1000' },
        { t: 'Улика №2: на круглое число', h: '<b>23 · 30</b>: сначала 23 · 3 = 69, потом приписываем нуль — <b>690</b>.<br>Так как 30 = 3 · 10.', tip: 'Умножь без нулей, потом допиши нули.', pic: '🎯', k: 'умножение на круглое' },
        { t: 'Улика №3: круглое на круглое', h: '<b>400 · 60</b>: 4 · 6 = 24, нулей всего 2 + 1 = 3 → <b>24 000</b>.<br>Посчитай нули в <b>обоих</b> множителях!', tip: 'Нули обоих множителей складываем.', pic: '🔢', k: 'круглое на круглое' },
        { t: 'Улика №4: деление на круглое', h: '<b>4 800 : 60</b>: сначала разделим на 10 → 480, потом на 6 → <b>80</b>.<br>Проверка: 80 · 60 = 4 800.', tip: 'Дели на 10, потом на однозначное.', pic: '➗', k: 'деление на круглое' },
        { t: 'Улика №5: ловушка с нулём', h: '<b>250 · 40</b>: 25 · 4 = 100, плюс два нуля → <b>10 000</b>. Нули из 100 тоже остаются — не теряй их!', tip: 'Нули в произведении не теряем.', pic: '⚠️', k: 'ловушка нули' }
      ],
      quiz: [
        { type: 'input', q: 'Вычисли: <b>36 · 100</b>', c: 3600, why: 'Приписываем 2 нуля: 3 600.' },
        { type: 'input', q: 'Вычисли: <b>52 000 : 1000</b>', c: 52, why: 'Отбрасываем 3 нуля: 52.' },
        { type: 'input', q: 'Вычисли: <b>70 · 800</b>', c: 56000, why: '7 · 8 = 56, нулей 3 → 56 000.' },
        { type: 'input', q: 'Вычисли: <b>3 600 : 90</b>', c: 40, why: '3 600 : 10 = 360; 360 : 9 = 40.' },
        { type: 'one', q: 'Чему равно <b>250 · 40</b>?', a: ['10 000', '1 000', '100 000', '8 000'], c: 0, why: '25 · 4 = 100, плюс 2 нуля: 10 000.' },
        { type: 'tf', q: '120 · 30 = 3 600', c: true, why: '12 · 3 = 36, плюс 2 нуля: 3 600.' }
      ]
    },
    {
      id: 'remainder', title: 'Деление с остатком', icon: '🧺', sub: 'Неполное частное и остаток', take: 8, gen: G.remainder,
      cards: [
        { t: 'Улика №1: что-то осталось', h: '23 ореха разложили по 5 в пакет: вышло <b>4 пакета</b>, и <b>3 ореха</b> осталось.<br>Пишут: <b>23 : 5 = 4 (ост. 3)</b>.', tip: 'Делимое : делитель = неполное частное (ост.)', pic: '🧺', k: 'деление с остатком' },
        { t: 'Улика №2: как найти', h: 'Ищем самое большое число, которое <b>не больше</b> делимого и делится на делитель. 38 : 7 → 35 = 7 · 5. Значит частное <b>5</b>, остаток 38 − 35 = <b>3</b>.', tip: 'Ближайшее меньшее, которое делится.', pic: '🔍', k: 'неполное частное' },
        { t: 'Улика №3: главное правило', h: 'Остаток всегда <b>меньше делителя</b>! При делении на 6 остаток может быть 0, 1, 2, 3, 4 или 5. Если остаток вышел больше — частное можно увеличить.', tip: 'Остаток < делителя.', pic: '⚠️', k: 'остаток меньше делителя' },
        { t: 'Улика №4: проверка', h: '<b>делитель · частное + остаток = делимое</b>.<br>38 : 7 = 5 (ост. 3): 7 · 5 + 3 = 38 ✔', tip: 'Проверка: делитель · частное + остаток.', pic: '✅', k: 'проверка деления с остатком' },
        { t: 'Улика №5: хитрая задача', h: '26 пирожков, в коробку — по 8. Полных коробок <b>3</b> (ост. 2). А чтобы уложить <b>все</b>, нужна ещё одна: <b>4</b> коробки.', tip: 'Для всех — прибавь одну коробку под остаток.', pic: '📦', k: 'задача на остаток' }
      ],
      quiz: [
        { type: 'input', q: 'Найди неполное частное: <b>47 : 6</b>', c: 7, why: '6 · 7 = 42 ≤ 47, 6 · 8 = 48 &gt; 47. Частное 7, остаток 5.' },
        { type: 'input', q: 'Найди остаток: <b>59 : 8</b>', c: 3, why: '8 · 7 = 56; 59 − 56 = 3.' },
        { type: 'one', q: '<b>34 : 4</b> = ?', a: ['8 ост. 2', '7 ост. 6', '9 ост. 2', '8 ост. 3'], c: 0, why: '4 · 8 = 32; 34 − 32 = 2. Ответ «7 ост. 6» неверен: остаток 6 больше делителя 4.' },
        { type: 'input', q: 'Делитель 9, неполное частное 6, остаток 4. Найди делимое.', c: 58, why: '9 · 6 + 4 = 58.' },
        { type: 'tf', q: 'При делении на 5 может получиться остаток 5.', c: false, why: 'Остаток меньше делителя: от 0 до 4.' },
        { type: 'input', q: 'Енот раскладывает 30 кексов по 4 на поднос. Сколько подносов нужно, чтобы уложить все кексы?', c: 8, why: '30 : 4 = 7 (ост. 2). Нужен ещё поднос для 2 кексов: 7 + 1 = 8.' }
      ]
    },
    {
      id: 'order_ops', title: 'Порядок действий', icon: '🚦', sub: 'Скобки, умножение, сложение', take: 8, gen: G.order_ops,
      cards: [
        { t: 'Улика №1: светофор действий', h: '1) Действия <b>в скобках</b>. 2) <b>Умножение и деление</b> слева направо. 3) <b>Сложение и вычитание</b> слева направо.', tip: 'Скобки → · и : → + и −.', pic: '🚦', k: 'порядок действий правило' },
        { t: 'Улика №2: без скобок', h: '<b>40 + 6 · 5</b>: сначала 6 · 5 = 30, потом 40 + 30 = <b>70</b>.<br>Ловушка: (40 + 6) · 5 = 230 — это другое выражение!', tip: 'Умножение раньше сложения.', pic: '⚠️', k: 'без скобок умножение раньше' },
        { t: 'Улика №3: со скобками', h: '<b>(40 + 6) · 5</b>: скобки первыми: 46, потом 46 · 5 = <b>230</b>.', tip: 'Скобки — всегда первые.', pic: '🎯', k: 'со скобками' },
        { t: 'Улика №4: одного уровня — слева направо', h: '<b>48 : 6 · 2</b>: идём слева направо: 48 : 6 = 8, 8 · 2 = <b>16</b>.<br><b>90 − 30 + 5</b> = 60 + 5 = <b>65</b>.', tip: 'Одинаковые по силе — слева направо.', pic: '➡️', k: 'слева направо' },
        { t: 'Улика №5: расставь номера', h: 'Перед вычислением подпиши над знаками номера действий:<br>700 −<sup>3</sup> 120 :<sup>1</sup> 4 ·<sup>2</sup> 5 → 120 : 4 = 30, 30 · 5 = 150, 700 − 150 = <b>550</b>.', tip: 'Сначала пронумеруй, потом считай.', pic: '🔢', k: 'номера действий' }
      ],
      quiz: [
        { type: 'input', q: 'Найди значение: <b>35 + 5 · 7</b>', c: 70, why: '5 · 7 = 35; 35 + 35 = 70.' },
        { type: 'input', q: 'Найди значение: <b>(35 + 5) · 7</b>', c: 280, why: '35 + 5 = 40; 40 · 7 = 280.' },
        { type: 'input', q: 'Найди значение: <b>100 − 36 : 4 · 3</b>', c: 73, why: '36 : 4 = 9; 9 · 3 = 27; 100 − 27 = 73.' },
        { type: 'one', q: 'Что выполняют первым в <b>800 − 60 · (12 − 4)</b>?', a: ['12 − 4', '60 · 12', '800 − 60'], c: 0, why: 'Сначала действие в скобках: 12 − 4.' },
        { type: 'tf', q: '20 + 30 : 10 = 5', c: false, why: 'Деление первым: 30 : 10 = 3; 20 + 3 = 23.' },
        { type: 'input', q: 'Найди значение: <b>(1 200 − 400) : 8 + 50</b>', c: 150, why: '1 200 − 400 = 800; 800 : 8 = 100; 100 + 50 = 150.' }
      ]
    },
    {
      id: 'props', title: 'Свойства действий и удобный счёт', icon: '🪄', sub: 'Переставляй и группируй с умом', take: 8, gen: G.props,
      cards: [
        { t: 'Улика №1: переместительное свойство', h: 'От перестановки слагаемых (множителей) результат не меняется:<br><b>a + b = b + a</b>, <b>a · b = b · a</b>.<br>4 · 37 · 25 = 37 · (4 · 25).', tip: 'Переставлять можно.', pic: '🔄', k: 'переместительное свойство' },
        { t: 'Улика №2: сочетательное свойство', h: 'Соседние слагаемые (множители) можно группировать:<br><b>(a + b) + c = a + (b + c)</b>.<br>38 + 75 + 62 = (38 + 62) + 75 = 100 + 75 = <b>175</b>.', tip: 'Ищи пары, дающие круглое число.', pic: '🤝', k: 'сочетательное свойство' },
        { t: 'Улика №3: распределительное свойство', h: '<b>(a + b) · c = a · c + b · c</b>.<br>23 · 7 + 77 · 7 = (23 + 77) · 7 = 100 · 7 = <b>700</b>.', tip: 'Общий множитель можно вынести за скобки.', pic: '🎁', k: 'распределительное свойство' },
        { t: 'Улика №4: волшебные пары', h: 'Запомни: <b>25 · 4 = 100</b>, <b>125 · 8 = 1000</b>, <b>50 · 2 = 100</b>, <b>20 · 5 = 100</b>.<br>25 · 19 · 4 = 100 · 19 = <b>1 900</b>.', tip: '25·4, 125·8, 50·2, 20·5.', pic: '✨', k: 'удобные пары множителей' },
        { t: 'Улика №5: умножение на 99', h: '<b>36 · 99</b> = 36 · 100 − 36 = 3 600 − 36 = <b>3 564</b>.<br><b>36 · 101</b> = 3 600 + 36 = <b>3 636</b>.', tip: '99 = 100 − 1, 101 = 100 + 1.', pic: '🧙', k: 'умножение на 99 101' }
      ],
      quiz: [
        { type: 'input', q: 'Вычисли удобно: <b>25 · 17 · 4</b>', c: 1700, why: '25 · 4 = 100; 100 · 17 = 1 700.' },
        { type: 'input', q: 'Вычисли удобно: <b>46 + 89 + 54</b>', c: 189, why: '46 + 54 = 100; 100 + 89 = 189.' },
        { type: 'input', q: 'Вычисли удобно: <b>64 · 9 + 36 · 9</b>', c: 900, why: '(64 + 36) · 9 = 100 · 9 = 900.' },
        { type: 'input', q: 'Вычисли удобно: <b>125 · 6 · 8</b>', c: 6000, why: '125 · 8 = 1000; 1000 · 6 = 6 000.' },
        { type: 'one', q: 'Какое свойство: <b>(7 + 8) · 4 = 7 · 4 + 8 · 4</b>?', a: ['распределительное', 'переместительное', 'сочетательное'], c: 0, why: 'Умножаем каждое слагаемое на 4 — распределительное свойство.' },
        { type: 'tf', q: '15 · (10 + 2) = 15 · 10 + 2', c: false, why: 'Надо 15 · 10 + 15 · 2 = 180, а 15 · 10 + 2 = 152.' }
      ]
    },
    {
      id: 'motion', title: 'Задачи на движение', icon: '🚲', sub: 'Скорость, время, расстояние', take: 8, gen: G.motion,
      cards: [
        { t: 'Улика №1: три величины', h: '<b>Скорость (v)</b> — какое расстояние проходят за единицу времени: км/ч, м/мин, м/с.<br><b>Время (t)</b> — сколько двигались. <b>Расстояние (s)</b> — какой путь прошли.', tip: 'v — скорость, t — время, s — расстояние.', pic: '🚲', k: 'скорость время расстояние' },
        { t: 'Улика №2: найти расстояние', h: '<b>s = v · t</b>.<br>Енот ехал 3 ч со скоростью 12 км/ч: s = 12 · 3 = <b>36 км</b>.', tip: 'Расстояние = скорость · время.', pic: '🛣️', k: 'найти расстояние' },
        { t: 'Улика №3: найти скорость', h: '<b>v = s : t</b>.<br>Лиса прошла 360 м за 4 мин: v = 360 : 4 = <b>90 м/мин</b>.', tip: 'Скорость = расстояние : время.', pic: '💨', k: 'найти скорость' },
        { t: 'Улика №4: найти время', h: '<b>t = s : v</b>.<br>Поезд проехал 240 км со скоростью 60 км/ч: t = 240 : 60 = <b>4 ч</b>.', tip: 'Время = расстояние : скорость.', pic: '⏱️', k: 'найти время' },
        { t: 'Улика №5: следи за единицами', h: 'Если скорость в <b>км/ч</b>, время — в часах, расстояние — в км. Если скорость в <b>м/мин</b> — время в минутах, путь в метрах.', tip: 'Единицы должны «дружить».', pic: '🧭', k: 'единицы скорости' }
      ],
      quiz: [
        { type: 'input', q: 'Ёжик шёл 5 мин со скоростью 70 м/мин. Какое расстояние он прошёл (в м)?', c: 350, why: 's = 70 · 5 = 350 м.' },
        { type: 'input', q: 'Поезд проехал 320 км за 4 ч. С какой скоростью он ехал (в км/ч)?', c: 80, why: 'v = 320 : 4 = 80 км/ч.' },
        { type: 'input', q: 'Сова летит со скоростью 40 км/ч. За сколько часов она пролетит 120 км?', c: 3, why: 't = 120 : 40 = 3 ч.' },
        { type: 'one', q: 'Как найти время?', a: ['s : v', 's · v', 'v : s'], c: 0, why: 'Время = расстояние : скорость.' },
        { type: 'input', q: 'Белочка ехала 2 ч со скоростью 15 км/ч, а потом 3 ч со скоростью 10 км/ч. Какой путь она проехала (в км)?', c: 60, why: '15 · 2 = 30; 10 · 3 = 30; 30 + 30 = 60 км.' },
        { type: 'tf', q: 'Скорость 5 м/с означает, что за 1 секунду проходят 5 метров.', c: true, why: 'Так и есть: метров за секунду.' }
      ]
    },
    {
      id: 'motion_two', title: 'Навстречу и в разные стороны', icon: '🤝', sub: 'Встречное движение и удаление', take: 8, gen: G.motion_two,
      cards: [
        { t: 'Улика №1: скорость сближения', h: 'Двое идут <b>навстречу</b> друг другу — каждую минуту расстояние сокращается на сумму их скоростей. <b>v сбл. = v₁ + v₂</b>.<br>60 м/мин и 70 м/мин → 130 м/мин.', tip: 'Навстречу — скорости складываем.', pic: '🤝', k: 'скорость сближения' },
        { t: 'Улика №2: расстояние до встречи', h: '<b>s = (v₁ + v₂) · t</b>.<br>Встретились через 4 мин при скоростях 60 и 70 м/мин: (60 + 70) · 4 = <b>520 м</b>.', tip: 'Сумма скоростей · время встречи.', pic: '🏠', k: 'встречное движение расстояние' },
        { t: 'Улика №3: время встречи', h: '<b>t = s : (v₁ + v₂)</b>.<br>Между домами 900 м, скорости 80 и 70 м/мин: 900 : 150 = <b>6 мин</b>.', tip: 'Расстояние : скорость сближения.', pic: '⏱️', k: 'время встречи' },
        { t: 'Улика №4: в противоположные стороны', h: 'Из одной точки в <b>разные стороны</b> — расстояние растёт на сумму скоростей: <b>v уд. = v₁ + v₂</b>.<br>За 3 ч при 12 и 15 км/ч: (12 + 15) · 3 = <b>81 км</b>.', tip: 'В разные стороны — тоже складываем.', pic: '↔️', k: 'противоположные направления удаление' },
        { t: 'Улика №5: найти скорость второго', h: 'Расстояние 560 м, встретились через 4 мин, скорость первого 60 м/мин. 1) 560 : 4 = 140 — скорость сближения; 2) 140 − 60 = <b>80 м/мин</b>.', tip: 'Скорость второго = v сбл. − v первого.', pic: '🔍', k: 'скорость второго' }
      ],
      quiz: [
        { type: 'input', q: 'Енот и Лиса вышли навстречу друг другу со скоростями 50 м/мин и 60 м/мин и встретились через 6 мин. Каково было расстояние между ними (в м)?', c: 660, why: '50 + 60 = 110; 110 · 6 = 660 м.' },
        { type: 'input', q: 'Между домиками 800 м. Два друга идут навстречу со скоростями 90 и 70 м/мин. Через сколько минут они встретятся?', c: 5, why: '90 + 70 = 160; 800 : 160 = 5 мин.' },
        { type: 'input', q: 'Из одной точки в противоположные стороны выехали два велосипедиста со скоростями 14 и 16 км/ч. Какое расстояние будет между ними через 2 ч (в км)?', c: 60, why: '14 + 16 = 30; 30 · 2 = 60 км.' },
        { type: 'one', q: 'Скорости 40 и 30 м/мин, движение навстречу. Скорость сближения?', a: ['70 м/мин', '10 м/мин', '1200 м/мин'], c: 0, why: 'При встречном движении скорости складывают: 40 + 30 = 70.' },
        { type: 'input', q: 'Расстояние 450 м, встретились через 3 мин, скорость Белочки 70 м/мин. Какова скорость Ёжика (в м/мин)?', c: 80, why: '450 : 3 = 150; 150 − 70 = 80 м/мин.' },
        { type: 'tf', q: 'При движении в противоположных направлениях скорость удаления равна сумме скоростей.', c: true, why: 'Каждый уходит в свою сторону, расстояние растёт на v₁ + v₂.' }
      ]
    },
    {
      id: 'work', title: 'Задачи на работу', icon: '🧁', sub: 'Производительность, время, объём', take: 8, gen: G.work,
      cards: [
        { t: 'Улика №1: производительность', h: '<b>Производительность</b> — сколько работы делают за единицу времени. Бобёр печёт <b>12 пряников в час</b> — это его производительность.', tip: 'Производительность = работа за 1 час.', pic: '🧁', k: 'производительность' },
        { t: 'Улика №2: объём работы', h: '<b>Работа = производительность · время.</b><br>12 пряников в час · 5 ч = <b>60 пряников</b>.', tip: 'A = p · t (как s = v · t).', pic: '📦', k: 'объём работы' },
        { t: 'Улика №3: найти производительность и время', h: 'Производительность = работа : время: 60 : 5 = <b>12</b> в час.<br>Время = работа : производительность: 60 : 12 = <b>5 ч</b>.', tip: 'Деление — чтобы найти p или t.', pic: '⏱️', k: 'найти время работы' },
        { t: 'Улика №4: работаем вместе', h: 'Если работают вдвоём, их производительности <b>складываются</b>. Енот — 8 кексов в час, Лиса — 7: вместе <b>15</b> в час, за 4 ч — 15 · 4 = <b>60 кексов</b>.', tip: 'Вместе — сложи производительности.', pic: '🤝', k: 'совместная работа' }
      ],
      quiz: [
        { type: 'input', q: 'Ёжик за час лепит 9 пирожков. Сколько пирожков он слепит за 6 часов?', c: 54, why: '9 · 6 = 54.' },
        { type: 'input', q: 'Автомат за 8 часов упаковал 640 леденцов. Сколько леденцов в час он упаковывает?', c: 80, why: '640 : 8 = 80.' },
        { type: 'input', q: 'Барсук печёт 15 кексов в час. За сколько часов он испечёт 90 кексов?', c: 6, why: '90 : 15 = 6 ч.' },
        { type: 'input', q: 'Енот делает 7 эклеров в час, Лиса — 8. Сколько эклеров они сделают вместе за 3 часа?', c: 45, why: '7 + 8 = 15; 15 · 3 = 45.' },
        { type: 'one', q: 'Как найти время работы?', a: ['работа : производительность', 'работа · производительность', 'производительность : работа'], c: 0, why: 'Время = объём работы : производительность.' },
        { type: 'tf', q: 'Если двое работают вместе, их производительности складываются.', c: true, why: 'За час каждый делает свою часть — вместе получается сумма.' }
      ]
    },
    {
      id: 'buy', title: 'Покупки', icon: '🛒', sub: 'Цена, количество, стоимость', take: 8, gen: G.buy,
      cards: [
        { t: 'Улика №1: три величины', h: '<b>Цена</b> — сколько стоит одна вещь. <b>Количество</b> — сколько вещей купили. <b>Стоимость</b> — сколько стоит вся покупка.', tip: 'Цена — за одну, стоимость — за все.', pic: '🛒', k: 'цена количество стоимость' },
        { t: 'Улика №2: найти стоимость', h: '<b>Стоимость = цена · количество.</b><br>4 торта по 250 руб.: 250 · 4 = <b>1 000 руб.</b>', tip: 'С = ц · к.', pic: '🎂', k: 'найти стоимость' },
        { t: 'Улика №3: найти цену и количество', h: 'Цена = стоимость : количество: 600 : 3 = <b>200 руб.</b><br>Количество = стоимость : цена: 600 : 200 = <b>3 шт.</b>', tip: 'Цену и количество находим делением.', pic: '🔍', k: 'найти цену количество' },
        { t: 'Улика №4: сдача', h: 'Купили 3 кекса по 40 руб. и сок за 70 руб., дали 500 руб.<br>1) 40 · 3 = 120; 2) 120 + 70 = 190; 3) 500 − 190 = <b>310 руб.</b> сдачи.', tip: 'Сдача = сколько дали − стоимость.', pic: '💰', k: 'сдача' }
      ],
      quiz: [
        { type: 'input', q: 'Белочка купила 6 пряников по 35 рублей. Сколько рублей стоит покупка?', c: 210, why: '35 · 6 = 210 руб.' },
        { type: 'input', q: 'За 5 одинаковых тортов заплатили 2 000 рублей. Сколько стоит один торт?', c: 400, why: '2 000 : 5 = 400 руб.' },
        { type: 'input', q: 'Блокнот стоит 45 рублей. Сколько блокнотов можно купить на 270 рублей?', c: 6, why: '270 : 45 = 6.' },
        { type: 'input', q: 'Енот купил 2 торта по 300 рублей и 3 кекса по 50 рублей. Сколько стоит покупка?', c: 750, why: '300 · 2 = 600; 50 · 3 = 150; 600 + 150 = 750 руб.' },
        { type: 'input', q: 'Лиса купила 4 батончика по 60 рублей и заплатила 500 рублей. Сколько рублей сдачи она получила?', c: 260, why: '60 · 4 = 240; 500 − 240 = 260 руб.' },
        { type: 'tf', q: 'Стоимость = цена : количество.', c: false, why: 'Стоимость = цена · количество.' }
      ]
    },
    {
      id: 'part_num', title: 'Доля числа и число по доле', icon: '🍰', sub: 'Половина, треть, три четверти', take: 8, gen: G.part_num,
      cards: [
        { t: 'Улика №1: доля числа', h: 'Чтобы найти <b>1/4</b> от 32, делим на 4: <b>32 : 4 = 8</b>.<br>Знаменатель показывает, на сколько равных частей делим.', tip: 'Одна доля = число : знаменатель.', pic: '🍰', k: 'доля числа' },
        { t: 'Улика №2: несколько долей', h: '<b>3/4</b> от 32: одна доля 32 : 4 = 8, три доли — 8 · 3 = <b>24</b>.', tip: 'Дели на знаменатель, умножай на числитель.', pic: '🧮', k: 'несколько долей числа' },
        { t: 'Улика №3: число по его доле', h: '<b>1/5</b> числа равна 7. Всё число — 5 таких долей: <b>7 · 5 = 35</b>.', tip: 'Число = доля · знаменатель.', pic: '🔍', k: 'число по доле' },
        { t: 'Улика №4: число по нескольким долям', h: '<b>2/3</b> числа равны 18. Одна доля 18 : 2 = 9, всё число 9 · 3 = <b>27</b>.', tip: 'Дели на числитель, умножай на знаменатель.', pic: '🧩', k: 'число по нескольким долям' },
        { t: 'Улика №5: сколько осталось', h: 'В вазе 40 конфет, Енот съел 1/4. Съел 40 : 4 = 10, осталось 40 − 10 = <b>30</b>.', tip: 'Осталось = всё − съеденная доля.', pic: '🍬', k: 'задача на долю осталось' }
      ],
      quiz: [
        { type: 'input', q: 'Найди <b>1/6</b> от 48.', c: 8, why: '48 : 6 = 8.' },
        { type: 'input', q: 'Найди <b>2/5</b> от 45.', c: 18, why: '45 : 5 = 9; 9 · 2 = 18.' },
        { type: 'input', q: '<b>1/7</b> числа равна 9. Найди число.', c: 63, why: '9 · 7 = 63.' },
        { type: 'input', q: '<b>3/4</b> числа равны 27. Найди число.', c: 36, why: '27 : 3 = 9; 9 · 4 = 36.' },
        { type: 'input', q: 'В вазе 60 орехов. Белочка съела 1/3 всех орехов. Сколько орехов осталось?', c: 40, why: '60 : 3 = 20; 60 − 20 = 40.' },
        { type: 'tf', q: '1/2 от 100 больше, чем 1/3 от 100.', c: true, why: '50 &gt; 33 с остатком: чем больше знаменатель, тем меньше доля.' }
      ]
    },
    {
      id: 'shapes', title: 'Фигуры и тела', icon: '🔷', sub: 'Составные фигуры, круг, симметрия, тела', take: 8, gen: G.shapes,
      cards: [
        { t: 'Улика №1: составная фигура', h: 'Фигуру из нескольких прямоугольников делим на части. <b>Площадь</b> = сумма площадей частей.<br>Части 4 × 3 и 2 × 5: 12 + 10 = <b>22 кв. см</b>.', tip: 'Раздели на прямоугольники и сложи площади.', pic: '🧱', k: 'площадь составной фигуры' },
        { t: 'Улика №2: вырезали уголок', h: 'Из прямоугольника 8 × 6 вырезали угол 3 × 2. Площадь: 48 − 6 = <b>42 кв. см</b>. А периметр не изменился: (8 + 6) · 2 = <b>28 см</b>!', tip: 'Вырез в углу не меняет периметр.', pic: '✂️', k: 'периметр вырез угла' },
        { t: 'Улика №3: окружность и круг', h: '<b>Окружность</b> — замкнутая линия, все точки которой на одном расстоянии от центра. <b>Круг</b> — часть плоскости внутри окружности. Рисуют циркулем.', tip: 'Окружность — линия, круг — «блин».', pic: '⭕', k: 'окружность круг циркуль' },
        { t: 'Улика №4: радиус и диаметр', h: '<b>Радиус</b> — от центра до окружности. <b>Диаметр</b> — через центр от края до края.<br><b>d = 2 · r</b>: радиус 7 см → диаметр 14 см.', tip: 'Диаметр = 2 радиуса.', pic: '🍕', k: 'радиус диаметр' },
        { t: 'Улика №5: тела', h: '<b>Шар</b> — мяч, <b>куб</b> — кубик сахара, <b>цилиндр</b> — банка, <b>конус</b> — вафельный рожок, <b>пирамида</b> — как в Египте.', tip: 'Шар, куб, цилиндр, конус, пирамида.', pic: '🧊', k: 'шар куб цилиндр конус пирамида' },
        { t: 'Улика №6: симметрия', h: 'Фигура <b>симметрична</b>, если её можно перегнуть по прямой (оси) так, что половинки совпадут. У буквы <b>Ш</b> ось есть, у буквы <b>Г</b> — нет.', tip: 'Перегни — половинки совпали?', pic: '🦋', k: 'симметрия ось' }
      ],
      quiz: [
        { type: 'input', q: 'Из прямоугольника 10 см × 7 см вырезали в углу квадрат 3 см × 3 см. Найди площадь оставшейся фигуры (в кв. см).', c: 61, why: '10 · 7 = 70; 3 · 3 = 9; 70 − 9 = 61.' },
        { type: 'input', q: 'Из прямоугольника 10 см × 7 см вырезали в углу квадрат 3 см × 3 см. Найди периметр оставшейся фигуры (в см).', c: 34, why: 'Периметр как у целого прямоугольника: (10 + 7) · 2 = 34 см.' },
        { type: 'input', q: 'Радиус круглого торта 12 см. Чему равен диаметр (в см)?', c: 24, why: 'd = 2 · 12 = 24 см.' },
        { type: 'one', q: 'На какое тело похож вафельный рожок?', a: ['конус', 'цилиндр', 'шар', 'пирамида'], c: 0, why: 'У рожка круглое основание и одна вершина — это конус.' },
        { type: 'sort', q: 'Есть ли у буквы ось симметрии?', groups: ['Есть ось', 'Нет оси'], items: [['А', 0], ['Г', 1], ['Н', 0], ['Я', 1], ['О', 0]], why: 'А, Н, О можно перегнуть пополам; Г и Я — нельзя.' },
        { type: 'tf', q: 'Диаметр в 2 раза меньше радиуса.', c: false, why: 'Наоборот: диаметр в 2 раза больше радиуса.' }
      ]
    },
    {
      id: 'data_logic', title: 'Таблицы, диаграммы, логика', icon: '📊', sub: 'Читаем данные и проверяем утверждения', take: 8, gen: G.data_logic,
      cards: [
        { t: 'Улика №1: таблица', h: 'В <b>таблице</b> данные стоят в строках и столбцах. Найди нужную строку и нужный столбец — на пересечении ответ.<br>Цена торта в таблице 300 руб.: 2 торта — <b>600 руб.</b>', tip: 'Строка + столбец = нужная клетка.', pic: '📋', k: 'таблица' },
        { t: 'Улика №2: столбчатая диаграмма', h: 'На <b>диаграмме</b> длина столбика показывает число. Смотри на <b>условный знак</b>: если 🍬 = 5 конфет, то 🍬🍬🍬 = <b>15 конфет</b>.', tip: 'Сначала прочитай, сколько стоит один значок.', pic: '📊', k: 'диаграмма' },
        { t: 'Улика №3: истинно или ложно', h: '<b>Утверждение</b> бывает истинным (верным) или ложным. «Число 40 чётное» — <b>истинно</b>. «Число 40 больше 50» — <b>ложно</b>.', tip: 'Проверь утверждение по фактам.', pic: '⚖️', k: 'истинность утверждений' },
        { t: 'Улика №4: «и» и «или»', h: 'С союзом <b>«и»</b> утверждение истинно, только если верны <b>обе</b> части. С союзом <b>«или»</b> — если верна <b>хотя бы одна</b>.<br>«12 чётное и больше 20» — ложно.', tip: '«И» — обе части, «или» — хотя бы одна.', pic: '🔗', k: 'и или логика' },
        { t: 'Улика №5: метод исключения', h: 'Если сыщик знает, кто <b>не</b> мог съесть торт, — остаётся тот, кто мог. Вычёркивай невозможные варианты, и ответ найдётся!', tip: 'Вычёркивай лишнее — останется ответ.', pic: '🕵️', k: 'логическая задача исключение' }
      ],
      quiz: [
        { type: 'input', q: 'Диаграмма (🍬 = 5 конфет):<br>Енот: 🍬🍬🍬🍬<br>Лиса: 🍬🍬<br>Сколько конфет собрал Енот?', c: 20, why: '4 значка · 5 = 20.' },
        { type: 'input', q: 'Диаграмма (🍬 = 5 конфет):<br>Енот: 🍬🍬🍬🍬<br>Лиса: 🍬🍬<br>На сколько больше конфет у Енота, чем у Лисы?', c: 10, why: '20 − 10 = 10.' },
        { type: 'input', q: '<table><tr><th>Товар</th><th>Цена, руб.</th></tr><tr><td>кекс</td><td>40</td></tr><tr><td>сок</td><td>60</td></tr></table>Сколько стоят 3 кекса и 1 сок?', c: 180, why: '40 · 3 = 120; 120 + 60 = 180.' },
        { type: 'tf', q: 'Утверждение «Число 135 делится на 5» истинно.', c: true, why: 'Оканчивается на 5 — делится на 5.' },
        { type: 'tf', q: 'Утверждение «Число 18 нечётное или больше 10» истинно.', c: true, why: '18 больше 10 — одна часть верна, с «или» этого достаточно.' },
        { type: 'one', q: 'Енот, Лиса и Ёжик съели торт, кекс и пирог. Енот не ел ни торт, ни кекс. Лиса не ела торт. Кто съел торт?', a: ['Ёжик', 'Енот', 'Лиса'], c: 0, why: 'Енот — пирог; Лиса не ела торт — значит кекс; торт съел Ёжик.' }
      ]
    }
  ];

  window.SUBJECTS.math4 = {
    id: 'math4',
    name: 'Математика 4 класс',
    short: 'Вся программа 4 класса',
    icon: '📐',
    color: '#3D8BFD',
    intro: 'Сыщик, в Сладкограде новое большое дело: <b>вся математика 4 класса</b>! Огромные числа, скорость, время, доли, фигуры и хитрые задачи — разгадаем каждую улику вместе с напарником-котом.',
    hello: '{n}, лупа наготове! Раскроем дело о больших числах? 🔍',
    search: false,
    units: units
  };
})();
