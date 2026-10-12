// node tools/validate-content.js content/space.js — проверка схемы предмета Академии
const fs = require('fs'), path = require('path'), vm = require('vm');
const files = process.argv.slice(2); let bad = 0;
const err = (f, m) => { bad++; console.log('✘ ' + f + ': ' + m); };
/* «задачи на счёт» в предметах Академии запрещены (кроме математики, school:true и уроков/предметов с calcOk:true).
   Детектор isCalcQ/calcAllowed берём из academy.js (блок между метками CALCQ) — один источник правды с движком. */
const ROOT = path.resolve(__dirname, '..');
const { isCalcQ, calcAllowed } = new Function(fs.readFileSync(path.join(ROOT, 'academy.js'), 'utf8').match(/\/\*CALCQ[\s\S]*?\/\*\/CALCQ\*\//)[0] + '; return { isCalcQ, calcAllowed };')();
/* ложные срабатывания эвристики: фрагмент текста вопроса (q или story). Настоящую задачу на счёт сюда не добавлять — перенести в math4 */
const ALLOW_CALC = [];
const allowed = q => ALLOW_CALC.some(t => String(q.q || q.story || '').includes(t));
const GEN_CALC_N = 200; // сколько задач генератора проверять на каждом уровне
const calcMsg = q => 'задача на счёт в предмете Академии (isCalcQ) — перепиши в вопрос на знание или перенеси в math4: «' + String(q.q || q.story || '').replace(/<[^>]+>/g, ' ').slice(0, 90) + '»';
/* флаги calcOk уроков/предметов — для банков QUIZ_EXTRA, которые проверяются отдельно от файла предмета */
const META = (() => { const c = { window: {} }; c.window.SUBJECTS = {}; for (const f of fs.readdirSync(path.join(ROOT, 'content')).filter(x => /\.js$/.test(x))) { try { vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'), c, { filename: f }); } catch (e) { } } return c.window.SUBJECTS; })();
const metaAllowed = (sid, uid) => { const s = META[sid] || { id: sid }; return calcAllowed(s, (s.units || []).find(u => u.id === uid)); };
for (const f of files) {
  const ctx = { window: {} }; ctx.window.SUBJECTS = {};
  try { vm.runInNewContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f }); } catch (e) { err(f, 'синтаксис: ' + e.message); continue; }
  for (const [id, s] of Object.entries(ctx.window.SUBJECTS)) {
    const P = f + ' [' + id + ']';
    ['id', 'name', 'short', 'icon', 'color', 'intro'].forEach(k => { if (!s[k]) err(P, 'нет поля ' + k); });
    if (s.id !== id) err(P, 'id не совпадает с ключом');
    if (!Array.isArray(s.units) || !s.units.length) { err(P, 'нет units'); continue; }
    const ids = new Set(); let nq = 0, nc = 0;
    s.units.forEach((u, ui) => {
      const U = P + ' unit#' + ui + ' ' + (u.id || '?');
      ['id', 'title', 'icon'].forEach(k => { if (!u[k]) err(U, 'нет поля ' + k); });
      if (/[#:*]/.test(u.id || '')) err(U, 'id не должен содержать # : *');
      if (ids.has(u.id)) err(U, 'повтор id'); ids.add(u.id);
      if (!Array.isArray(u.cards) || u.cards.length < 3) err(U, 'карточек меньше 3');
      (u.cards || []).forEach((c, ci) => { if (!c.t || !c.h) err(U, 'карточка ' + ci + ' без t/h'); if (c.h && c.h.replace(/<[^>]+>/g, '').length > 700) err(U, 'карточка ' + ci + ' длиннее 700 знаков'); nc++; });
      if (!Array.isArray(u.quiz) || u.quiz.length < 6) err(U, 'вопросов меньше 6');
      if (!calcAllowed(s, u)) {
        (u.quiz || []).forEach((q, qi) => { if (isCalcQ(q) && !allowed(q)) err(U + ' q' + qi + ' (' + q.type + ')', calcMsg(q)); });
        if (typeof u.gen === 'function') { let n = 0, ex = null; for (const lv of [1, 2, 3]) for (let t = 0; t < GEN_CALC_N; t++) { let q; try { q = u.gen(lv); } catch (e) { break; } if (isCalcQ(q) && !allowed(q)) { n++; ex = ex || q; } } if (n) err(U + ' gen', n + ' из ' + GEN_CALC_N * 3 + ' — ' + calcMsg(ex)); }
      }
      if (typeof u.gen === 'function') { for (const lv of [1, 2, 3]) for (let t = 0; t < 40; t++) { let q; try { q = u.gen(lv); } catch (e) { err(U, 'gen упал: ' + e.message); break; } if (!q || !q.type) { err(U, 'gen вернул пусто'); break; } u.quiz.push(q); } }
      (u.quiz || []).forEach((q, qi) => {
        const Q = U + ' q' + qi + ' (' + q.type + ')'; nq++;
        if (!q.why && q.type !== 'case') err(Q, 'нет why');
        switch (q.type) {
          case 'one': if (!q.q || !Array.isArray(q.a) || q.a.length < 2 || !(q.c >= 0 && q.c < q.a.length)) err(Q, 'нужно q, a[], c-индекс'); break;
          case 'tf': if (!q.q || typeof q.c !== 'boolean') err(Q, 'нужно q и c: true/false'); break;
          case 'order': if (!q.q || !Array.isArray(q.items) || q.items.length < 3 || q.items.length > 8) err(Q, 'нужно q и 3–8 items'); break;
          case 'case': if (!q.story || !Array.isArray(q.a) || q.a.length < 2 || !q.a.some(o => o.ok === true) || q.a.some(o => !o.t || !o.why)) err(Q, 'нужно story и a[{t,ok,why}] с хотя бы одним ok:true'); break;
          case 'sort': if (!q.q || !Array.isArray(q.groups) || q.groups.length < 2 || q.groups.length > 3 || !Array.isArray(q.items) || q.items.some(it => !Array.isArray(it) || !(it[1] >= 0 && it[1] < q.groups.length))) err(Q, 'нужно q, 2–3 groups, items [[текст, индекс]]'); break;
          case 'input': if (!q.q || !/^\d{1,6}$/.test(String(q.c))) err(Q, 'нужно q и c — целое число'); break;
          default: err(Q, 'неизвестный тип');
        }
      });
    });
    console.log('✔ ' + P + ': уроков ' + s.units.length + ', карточек ' + nc + ', вопросов ' + nq);
  }
  /* банки дополнительных вопросов (content/extra/q-*.js): window.QUIZ_EXTRA[предмет][урок] = [вопросы] */
  for (const [sid, units] of Object.entries(ctx.window.QUIZ_EXTRA || {})) {
    let nq = 0;
    for (const [uid, qs] of Object.entries(units || {})) {
      if (!Array.isArray(qs)) { err(f, 'QUIZ_EXTRA.' + sid + '.' + uid + ' — не массив'); continue; }
      const ok = metaAllowed(sid, uid);
      qs.forEach((q, qi) => { nq++; const e = checkQ(q) || (!ok && isCalcQ(q) && !allowed(q) ? calcMsg(q) : ''); if (e) err(f + ' [' + sid + '.' + uid + '] q' + qi + ' (' + q.type + ')', e); });
    }
    console.log('✔ ' + f + ' [доп. вопросы ' + sid + ']: ' + nq);
  }
}
function checkQ(q) {
  if (!q || !q.type) return 'нет type';
  if (!q.why && q.type !== 'case') return 'нет why';
  switch (q.type) {
    case 'one': return (!q.q || !Array.isArray(q.a) || q.a.length < 2 || !(q.c >= 0 && q.c < q.a.length)) ? 'нужно q, a[], c-индекс' : '';
    case 'tf': return (!q.q || typeof q.c !== 'boolean') ? 'нужно q и c: true/false' : '';
    case 'order': return (!q.q || !Array.isArray(q.items) || q.items.length < 3 || q.items.length > 8) ? 'нужно q и 3–8 items' : '';
    case 'case': return (!q.story || !Array.isArray(q.a) || q.a.length < 2 || !q.a.some(o => o.ok === true) || q.a.some(o => !o.t || !o.why)) ? 'нужно story и a[{t,ok,why}] с хотя бы одним ok:true' : '';
    case 'sort': return (!q.q || !Array.isArray(q.groups) || q.groups.length < 2 || q.groups.length > 3 || !Array.isArray(q.items) || q.items.some(it => !Array.isArray(it) || !(it[1] >= 0 && it[1] < q.groups.length))) ? 'нужно q, 2–3 groups, items [[текст, индекс]]' : '';
    case 'input': return (!q.q || !/^\d{1,6}$/.test(String(q.c))) ? 'нужно q и c — целое число' : '';
    default: return 'неизвестный тип';
  }
}
process.exit(bad ? 1 : 0);
