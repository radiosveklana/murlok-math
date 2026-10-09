// node tools/validate-content.js content/space.js — проверка схемы предмета Академии
const fs = require('fs'), path = require('path'), vm = require('vm');
const files = process.argv.slice(2); let bad = 0;
const err = (f, m) => { bad++; console.log('✘ ' + f + ': ' + m); };
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
}
process.exit(bad ? 1 : 0);
