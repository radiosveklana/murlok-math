// v35: стресс-проверка генераторов математики 4 класса в node (без браузера): node tools/e2e/v35-gen.js [N]
// Каждый генератор на уровнях 1–3 по N раз (по умолчанию 500): ответ целый и ≥ 0, нет NaN/undefined, нет дублей вариантов,
// в разборе (why) есть ответ. Используется и из v35-math.js.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '../..');
function load() {
  const ctx = { window: {}, Math, Date, console }; ctx.window.SUBJECTS = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content/math4.js'), 'utf8'), ctx, { filename: 'math4.js' });
  return ctx.window.SUBJECTS.math4;
}
const strip = h => String(h == null ? '' : h).replace(/<[^>]+>/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ');
const digits = s => strip(s).replace(/(\d) (?=\d{3}(?!\d))/g, '$1');
function checkQ(q) {
  const errs = [];
  if (!q || !q.type) return ['пусто'];
  const all = JSON.stringify(q);
  if (/NaN|undefined|Infinity|null/.test(all)) errs.push('NaN/undefined');
  if (!q.why) errs.push('нет why');
  if (q.type === 'input') {
    if (!(typeof q.c === 'number' && Number.isInteger(q.c) && q.c >= 0 && q.c <= 999999)) errs.push('ответ не целый/вне 0…999999: ' + q.c);
    else if (!(' ' + digits(q.why) + ' ').match(new RegExp('(^|[^\\d])' + q.c + '([^\\d]|$)'))) errs.push('в why нет ответа ' + q.c);
  } else if (q.type === 'one') {
    if (!Array.isArray(q.a) || q.a.length < 2 || !(q.c >= 0 && q.c < q.a.length)) errs.push('варианты/индекс');
    else {
      if (new Set(q.a.map(String)).size !== q.a.length) errs.push('дубли вариантов: ' + q.a.join(' | '));
      const ans = digits(q.a[q.c]).trim();
      if (!digits(q.why).includes(ans)) errs.push('в why нет ответа «' + ans + '»');
    }
  } else if (q.type === 'tf') { if (typeof q.c !== 'boolean') errs.push('tf без boolean'); }
  else if (q.type === 'order') { if (!Array.isArray(q.items) || q.items.length < 3 || new Set(q.items).size !== q.items.length) errs.push('order: мало/дубли'); }
  else if (q.type === 'sort') { if (!Array.isArray(q.items) || q.items.length < 3) errs.push('sort'); }
  else errs.push('тип ' + q.type);
  return errs;
}
function run(N = 500, only) {
  const m4 = load(), report = {}; let bad = 0;
  m4.units.filter(u => typeof u.gen === 'function' && (!only || only.includes(u.id))).forEach(u => {
    const r = report[u.id] = { n: 0, err: 0, ex: [] };
    for (const lv of [1, 2, 3]) for (let i = 0; i < N; i++) {
      let q, e; try { q = u.gen(lv); e = checkQ(q); } catch (x) { e = ['упал: ' + x.message]; }
      r.n++; if (e.length) { r.err++; bad++; if (r.ex.length < 3) r.ex.push('L' + lv + ': ' + e.join('; ') + ' ← ' + strip(q && q.q).slice(0, 110)); }
    }
  });
  return { report, bad };
}
module.exports = { run, checkQ, load };
if (require.main === module) {
  const N = +process.argv[2] || 500, { report, bad } = run(N);
  Object.entries(report).forEach(([id, r]) => console.log((r.err ? 'V35GEN FAIL ' : 'V35GEN OK ') + id + ' ' + r.n + (r.err ? ' ошибок: ' + r.err + '\n   ' + r.ex.join('\n   ') : '')));
  console.log(bad ? 'V35GEN FAIL total ' + bad : 'V35GEN DONE');
  process.exit(bad ? 1 : 0);
}
