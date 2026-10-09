/* academy.js — «Академия сыщика»: общий движок предметов (космос, безопасность, энциклопедия, мышление, скорочтение).
   Учебник (карточки, котик читает вслух) → тренажёр (типы вопросов) → разбор ошибок (повторения по Лейтнеру).
   Математика этим файлом не затрагивается. */
'use strict';
window.SUBJECTS = window.SUBJECTS || {};
const ACAD_ORDER = ['world', 'space', 'body', 'health', 'stories', 'safety', 'obzh', 'talk', 'think', 'creative', 'read', 'teen'];
const BOX_DAYS = [0, 1, 3, 7];
const acad = id => { S.acad = S.acad || {}; const a = S.acad[id] = S.acad[id] || {}; a.read = a.read || {}; a.best = a.best || {}; a.box = a.box || {}; return a; };
function mergeExtra() { if (mergeExtra.done) return; mergeExtra.done = true; Object.entries(window.QUIZ_EXTRA || {}).forEach(([sid, units]) => { const sb = window.SUBJECTS[sid]; if (!sb) return; Object.entries(units).forEach(([uid, qs]) => { const u = sb.units.find(x => x.id === uid); if (u && Array.isArray(qs)) u.quiz.push(...qs); }); }); }
const subj = id => { mergeExtra(); return window.SUBJECTS[id]; };
const daysSince = d => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
function dueMistakes(id) { const a = acad(id), out = []; Object.entries(a.box).forEach(([qid, [b, d]]) => { if (daysSince(d) >= BOX_DAYS[b]) out.push(qid); }); return out; }
function findQ(id, qid) { const [uid, n] = qid.split('#'), u = subj(id).units.find(x => x.id === uid), gq = acad(id).gq || {}; if (u && gq[qid]) return { u, q: gq[qid], qid }; return u && u.quiz[+n] ? { u, q: u.quiz[+n], qid } : null; }
const genLv = (id, uid) => ((S.prefs.genLv = S.prefs.genLv || {})[id + ':' + uid] || 1);
/* прогресс предмета: учебник + тренажёр; у предметов с упражнениями и играми (скорочтение, общение, игры Академии) они — половина прогресса */
function subjProgress(id) {
  const s = subj(id), a = acad(id), n = s.units.length, theory = n ? s.units.reduce((t, u) => t + (a.read[u.id] ? 0.4 : 0) + Math.min(3, a.best[u.id] || 0) / 3 * 0.6, 0) / n : 0;
  const ex = (s.extras || []).filter(e => e.prog).map(e => { try { return Math.max(0, Math.min(1, e.prog())); } catch (er) { return 0; } });
  return Math.round((ex.length ? theory * 0.5 + ex.reduce((x, y) => x + y, 0) / ex.length * 0.5 : theory) * 100);
}
function acadTask(id, res) { S.st[id] = S.st[id] || { done: 0, perfect: 0 }; taskDone(id, res, { academy: true }); }

/* ================= хаб ================= */
['alesson', 'aquiz', 'asearch'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
SCREENS.academy = () => {
  const list = ACAD_ORDER.filter(subj);
  app.innerHTML = `${topbar('Академия сыщика')}<div class="page"><p class="center">Настоящий сыщик знает не только математику! Выбирай предмет: учебник, тренажёр и разбор ошибок — как в Школе сыщика.</p>
    <div class="acad-grid">${list.map(id => { const s = subj(id), p = subjProgress(id), due = dueMistakes(id).length; return `<button class="acad-card" data-s="${id}" style="--c:${s.color}"><span class="ai">${s.icon}</span><b>${s.name}</b><small>${s.short}</small><span class="bar"><i style="width:${p}%"></i></span><span class="ap">${p}%${due ? ` · 🔁 ${due}` : ''}</span></button>`; }).join('')}
    ${ACAD_ORDER.filter(x => !subj(x)).map(x => `<div class="acad-card soon"><span class="ai">${{ safety: '🛡️', teen: '📘', think: '🧠', read: '⚡' }[x] || '✨'}</span><b>${{ safety: 'Безопасность', teen: 'Энциклопедия подростка', think: 'Критическое мышление', read: 'Скорочтение' }[x] || ''}</b><small>Скоро!</small></div>`).join('')}</div></div>`;
  $$('.acad-card[data-s]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('subject', b.dataset.s); }));
};

/* ================= предмет ================= */
/* картинки Академии: иллюстрации и настоящие фото (content/extra/art.js); нет картинки — остаётся эмодзи */
const ART = k => (window.ACAD_ART || {})[k];
function artFig(k, pic) { const a = ART(k); if (!a) return pic ? `<div class="card-pic">${pic}</div>` : '';
  return `<figure class="art-fig ${a.cr ? 'photo' : ''}"><img src="${a.f}" alt="${esc(a.alt || '')}" loading="lazy" decoding="async" onerror="this.parentNode.remove()">${a.cr ? `<figcaption>${esc(a.alt || '')}<small>${esc(a.cr)}</small></figcaption>` : ''}</figure>`; }
function artCover(id, u) { const a = ART(id + '/cover:' + u.id); return a ? `<span class="ui ui-art"><img src="${a.f}" alt="" loading="lazy" decoding="async"><i>${u.icon}</i></span>` : `<span class="ui">${u.icon}</span>`; }
SCREENS.subject = id => {
  const s = subj(id); if (!s) return go('academy'); const a = acad(id), due = dueMistakes(id).length;
  const anyRead = s.units.some(u => a.read[u.id]);
  app.innerHTML = `${topbar(s.icon + ' ' + s.name, id === 'math4' ? 'school' : 'academy')}<div class="page subj" style="--c:${s.color}">
    <div class="subj-intro">${s.intro}</div>
    <div class="row-btns">${due ? `<button class="btn pink" id="rev">🔁 Разбор ошибок (${due})</button>` : ''}${anyRead ? '<button class="btn" id="mix">🎲 Смешанная тренировка <small class="xbadge">🍬×2</small></button>' : ''}${s.search ? '<button class="btn" id="srch">🔎 Найти ответ</button>' : ''}${(s.extras || []).map(e => { let r = ''; try { r = e.badge ? e.badge() : ''; } catch (er) { } return `<button class="btn" data-x="${e.id}">${e.icon} ${e.name}${r ? ` <small class="xbadge">${r}</small>` : ''}</button>`; }).join('')}</div>
    <div class="units">${s.units.map((u, i) => { const st = a.best[u.id] || 0; return `<div class="unit ${a.read[u.id] ? 'read' : ''}">${artCover(id, u)}<div class="ut"><b>${i + 1}. ${u.title}</b><small>${u.sub || ''}</small><span class="stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span></div><div class="ub"><button class="btn sm" data-l="${u.id}">📖 Учебник${a.read[u.id] ? ' ✔' : ''}</button>${u.quiz && u.quiz.length ? `<button class="btn sm pink" data-q="${u.id}">🎯 Тренажёр</button>` : ''}</div></div>`; }).join('')}</div></div>`;
  $$('[data-l]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('alesson', id + ':' + b.dataset.l); }));
  $$('[data-q]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('aquiz', id + ':' + b.dataset.q); }));
  $('#rev')?.addEventListener('click', () => { SND.tap(); go('aquiz', id + ':*review'); });
  $('#mix')?.addEventListener('click', () => { SND.tap(); go('aquiz', id + ':*mix'); });
  $('#srch')?.addEventListener('click', () => { SND.tap(); go('asearch', id); });
  $$('[data-x]', app).forEach(b => b.addEventListener('click', () => { SND.tap(); const e = s.extras.find(x => x.id === b.dataset.x); e.run(); }));
  if (s.hello) setTimeout(() => curScreen === 'subject' && say(s.hello, 0, { prio: 0, silent: true }), 900);
};

/* озвучка карточек: заранее записанный голос (voice/a, tools/gen-acad-voice.js) — мгновенно и офлайн; иначе — сервер */
let ACAD_VOICE = null, cardAudio = null;
const cardText = c => (c.t + '. ' + c.h + (c.tip ? '. ' + c.tip : '')).replace(/<br\s*\/?>/gi, '. ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function readCard(c) {
  const t = cardText(c);
  return (ACAD_VOICE || (ACAD_VOICE = fetch('voice/a/index.json').then(r => r.json()).then(a => new Set(a)).catch(() => new Set()))).then(set => {
    const k = window.Lines.key(t);
    if (!set.has(k) || !S.sound || S.voice === false) return speakRemote(t);
    if (cardAudio) { cardAudio.pause(); cardAudio = null; } if (typeof stopRemote === 'function') stopRemote(); M.hush();
    return new Promise(res => { const a = cardAudio = new Audio('voice/a/' + k + '.mp3'); a.onended = () => { Music.setDuck(false); res(true); }; a.onerror = () => { Music.setDuck(false); speakRemote(t).then(res); }; Music.setDuck(true); a.play().then(() => M.setBusy(a.duration || 8, 2)).catch(() => { Music.setDuck(false); speakRemote(t).then(res); }); cleanups.push(() => { a.pause(); Music.setDuck(false); }); });
  });
}

/* ================= учебник: карточки ================= */
SCREENS.alesson = arg => {
  const [id, uid, start] = String(arg).split(':'), s = subj(id), u = s && s.units.find(x => x.id === uid); if (!u) return go('academy');
  let i = Math.min(u.cards.length - 1, Math.max(0, +start || 0)); const tm = window.Coach ? Coach.lessonTimer(u.cards.length) : null;
  app.innerHTML = `${topbar(u.icon + ' ' + u.title, 'subject')}<div class="page lesson acad-lesson" style="--c:${s.color}"><div class="slide" id="slide"></div>
    <div class="slide-nav"><button class="btn" id="prev">←</button><div class="dots">${u.cards.map(() => '<i></i>').join('')}</div><button class="btn pink" id="next">Дальше →</button></div></div>`;
  $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = id;
  const draw = () => {
    const c = u.cards[i];
    $('#slide').innerHTML = `<div class="slide-head"><div class="mini-cat">${myCat({ cls: 'mini' })}</div><h2>${c.t}</h2></div>${artFig(id + '/' + uid + ':' + i, c.pic)}<div class="story">${c.h}</div>${c.tip ? `<div class="rule">💡 ${c.tip}</div>` : ''}<div class="row-btns"><button class="btn sm ghost" id="readit">🔊 Прочитай мне</button></div>`;
    $$('.dots i').forEach((d, k) => d.classList.toggle('on', k === i));
    $('#prev').style.visibility = i ? 'visible' : 'hidden';
    $('#next').textContent = i < u.cards.length - 1 ? 'Дальше →' : (u.quiz && u.quiz.length ? '🎯 К тренажёру!' : '✔ Понятно!');
    const k = i; if (tm) tm.show(i, $('#slide').textContent);
    $('#readit').addEventListener('click', () => { wakeAudio && wakeAudio(); readCard(c).then(ok => { if (ok && tm) tm.heard(k); }); catMood('happy', 800); });
  };
  $('#prev').addEventListener('click', () => { if (i > 0) { i--; SND.tap(); draw(); } });
  $('#next').addEventListener('click', () => {
    SND.tap(); if (i < u.cards.length - 1) { i++; draw(); return; }
    const a = acad(id), nextScr = () => go(u.quiz && u.quiz.length ? 'aquiz' : 'subject', u.quiz && u.quiz.length ? id + ':' + u.id : id);
    a.read[u.id] = true; save();
    if (!tm) return nextScr();
    Coach.finishLesson('a:' + id + ':' + u.id, tm, shuffle((u.quiz || []).filter(q => q.type === 'one' || q.type === 'tf')).slice(0, 2), nextScr, { c: 2, xp: 5 });
  });
  draw();
};

/* ================= тренажёр ================= */
SCREENS.aquiz = arg => {
  const [id, uid] = String(arg).split(':'), s = subj(id); if (!s) return go('academy');
  const a = acad(id); let items = [];
  if (uid === '*review') items = dueMistakes(id).map(q => findQ(id, q)).filter(Boolean);
  else if (uid === '*mix') { const seen = a.seen = a.seen || {}; items = shuffle(s.units.filter(u => a.read[u.id] && u.quiz).flatMap(u => u.quiz.map((q, n) => ({ u, q, qid: u.id + '#' + n })))).sort((x, y) => (seen[x.qid] || 0) - (seen[y.qid] || 0)).slice(0, 10); }
  else if ((s.units.find(x => x.id === uid) || {}).gen) { const u = s.units.find(x => x.id === uid), lv = genLv(id, uid), seen = a.seen = a.seen || {}; const st = shuffle(u.quiz.map((q, n) => ({ u, q, qid: u.id + '#' + n }))).sort((x, y) => (seen[x.qid] || 0) - (seen[y.qid] || 0)).slice(0, 2); items = shuffle(Array.from({ length: (u.take || 8) - st.length }, (_, i) => { let q; try { q = u.gen(lv); } catch (e) { q = null; } return q ? { u, q, qid: u.id + '#g' + Date.now().toString(36) + i, gen: true } : null; }).filter(Boolean).concat(st)); } // темы с генератором: задачи не повторяются
  else { const u = s.units.find(x => x.id === uid); if (!u) return go('subject', id); const seen = a.seen = a.seen || {}; items = shuffle(u.quiz.map((q, n) => ({ u, q, qid: u.id + '#' + n }))).sort((x, y) => (seen[x.qid] || 0) - (seen[y.qid] || 0)).slice(0, u.take || 8); } // сначала — вопросы, которые ребёнок видел реже всего: без повторов, пока не пройдены все
  if (!items.length) { toast('Пока нечего повторять — всё выучено! 🎉'); return go('subject', id); }
  const title = uid === '*review' ? '🔁 Разбор ошибок' : uid === '*mix' ? '🎲 Тренировка' : '🎯 ' + items[0].u.title;
  let k = 0, ok = 0;
  app.innerHTML = `${topbar(title, 'subject')}<div class="page aquiz" style="--c:${s.color}"><div class="g-head"><div class="g-dots">${items.map(() => '<i></i>').join('')}</div><div class="pill">⭐ <b id="qsc">0</b></div></div>${helperHTML('qbub')}<div id="qarea"></div><div id="qafter" class="after"></div></div>`;
  $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = id;
  { const gu = s.units.find(x => x.id === uid); if (gu && gu.gen) { $('.g-head', app).insertAdjacentHTML('afterend', `<div class="seg genlv">${['🌱 Лёгкий', '🔥 Средний', '🏔️ Сложный'].map((n, i) => `<button data-v="${i + 1}" class="${genLv(id, uid) === i + 1 ? 'on' : ''}">${n}</button>`).join('')}</div>`); $$('.genlv button', app).forEach(b => b.addEventListener('click', () => { S.prefs.genLv[id + ':' + uid] = +b.dataset.v; save(); go('aquiz', arg); })); } }
  const bub = h => { const b = $('#qbub'); b.innerHTML = h; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); };
  function done(right, why) {
    { const sq = a.seen = a.seen || {}; sq[items[k].qid] = (sq[items[k].qid] || 0) + 1; }
    const it = items[k], dot = $$('.g-dots i')[k]; dot.className = right ? 'ok' : 'bad';
    if (right) { ok++; $('#qsc').textContent = ok; SND.ok(); award(uid === '*mix' ? 2 : 1, uid === '*mix' ? 5 : 3); if (a.box[it.qid]) { const nb = a.box[it.qid][0] + 1; if (nb >= BOX_DAYS.length) { delete a.box[it.qid]; if (a.gq) delete a.gq[it.qid]; window.Coach && Coach.cured(); } else a.box[it.qid] = [nb, today()]; } }
    else { SND.bad(); a.box[it.qid] = [0, today()]; if (it.gen) { a.gq = a.gq || {}; a.gq[it.qid] = it.q; const ks = Object.keys(a.gq); if (ks.length > 40) ks.slice(0, ks.length - 40).forEach(k => { delete a.gq[k]; delete a.box[k]; }); } }
    save();
    bub(`${right ? '<div class="fb">✔ Верно!</div>' : '<div class="fb bad">Не совсем.</div>'}${why || ''}`);
    $('#qafter').innerHTML = `<button class="btn big pink" id="qn">${k + 1 < items.length ? 'Дальше →' : 'Итоги 🏆'}</button>`;
    $('#qn').addEventListener('click', () => { $('#qafter').innerHTML = ''; k++; k < items.length ? show() : finish(); });
  }
  function show() {
    const it = items[k], q = it.q, area = $('#qarea'); window.__aq = q; window.__aqGen = !!it.gen;
    bub(q.hint || pick(['Подумай как сыщик 🔍', 'Не спеши — прочитай внимательно!', 'Ты справишься, {n}!'.replace('{n}', esc(S.kid || 'сыщик'))]));
    area.innerHTML = `<div class="q-unit">${it.u.icon} ${it.u.title}</div>` + (ACAD_Q[q.type] || ACAD_Q.one).render(q);
    (ACAD_Q[q.type] || ACAD_Q.one).bind(area, q, done);
  }
  function finish() {
    const n = items.length, stars = ok === n ? 3 : ok >= n * 0.7 ? 2 : ok >= n * 0.4 ? 1 : 0;
    if (uid !== '*review' && uid !== '*mix') { a.best[uid] = Math.max(a.best[uid] || 0, stars); }
    save(); acadTask(id, { mistakes: n - ok }); if (uid === '*mix' && ok >= n * 0.8) award(5, 10); { const gu = s.units.find(x => x.id === uid); if (gu && gu.gen && genLv(id, uid) === 3 && ok === n) awardGems(1, 'за сложный уровень без ошибок'); } // смешанная тренировка труднее — награда больше
    if (window.Coach && id !== 'teen') { if (uid !== '*review' && uid !== '*mix') Coach.track('a:' + id + ':' + uid, ok / n); Coach.track('a:' + id, ok / n); } if (ok === n && n >= 5) awardGems(1, 'за тренажёр без ошибок'); SND.win(); if (stars >= 2) confetti(30);
    $('#qarea').innerHTML = `<div class="center g-result"><div class="big-emoji">${['🐾', '🥉', '🥈', '🏆'][stars]}</div><h2>${esc(S.kid)}, ${ok} из ${n}!</h2><div class="stars big">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>${n - ok ? `<p>Ошибки попали в <b>🔁 Разбор ошибок</b> — повторим их завтра, и они запомнятся навсегда.</p>` : '<p>Без единой ошибки!</p>'}<div class="row-btns"><button class="btn big pink" id="again">Ещё раз</button><button class="btn" id="tosubj">К предмету</button></div></div>`;
    $('#again').addEventListener('click', () => go('aquiz', arg)); $('#tosubj').addEventListener('click', () => go('subject', id));
    say(stars >= 2 ? pick(PH.done) : pick(PH.cheerBad));
  }
  show();
};

/* ================= типы вопросов ================= */
const ACAD_Q = {
  one: {
    render: q => `<div class="q-text">${q.q}</div><div class="opts">${shuffle(q.a.map((t, i) => ({ t, i }))).map(o => `<button class="opt wide" data-i="${o.i}">${o.t}</button>`).join('')}</div>`,
    bind: (el, q, done) => { let d = false; $$('.opt', el).forEach(b => b.addEventListener('click', () => { if (d) return; d = true; const r = +b.dataset.i === q.c; b.classList.add(r ? 'right' : 'wrong'); $(`.opt[data-i="${q.c}"]`, el).classList.add('right'); done(r, q.why); })); },
  },
  tf: {
    render: q => `<div class="q-text">${q.q}</div><div class="opts"><button class="opt" data-v="1">✅ Правда</button><button class="opt" data-v="0">❌ Неправда</button></div>`,
    bind: (el, q, done) => { let d = false; $$('.opt', el).forEach(b => b.addEventListener('click', () => { if (d) return; d = true; const r = (b.dataset.v === '1') === !!q.c; b.classList.add(r ? 'right' : 'wrong'); done(r, q.why); })); },
  },
  order: {
    render: q => `<div class="q-text">${q.q}</div><div class="ord-ans" id="oa"></div><div class="ord-pool">${shuffle(q.items.map((t, i) => ({ t, i }))).map(o => `<button class="ord" data-i="${o.i}">${o.t}</button>`).join('')}</div><div class="row-btns"><button class="btn sm" id="ores">↺ Заново</button><button class="btn pink" id="ochk" disabled>Проверить</button></div>`,
    bind: (el, q, done) => {
      const seq = [], oa = $('#oa', el);
      const upd = () => { oa.innerHTML = seq.map((i, n) => `<span class="ord-in">${n + 1}. ${q.items[i]}</span>`).join('') || '<span class="small">Нажимай по порядку 👇</span>'; $('#ochk', el).disabled = seq.length !== q.items.length; };
      $$('.ord', el).forEach(b => b.addEventListener('click', () => { if (b.disabled) return; seq.push(+b.dataset.i); b.disabled = true; SND.tap(); upd(); }));
      $('#ores', el).addEventListener('click', () => { seq.length = 0; $$('.ord', el).forEach(b => b.disabled = false); upd(); });
      $('#ochk', el).addEventListener('click', () => { const r = seq.every((v, n) => v === n); oa.innerHTML = q.items.map((t, n) => `<span class="ord-in ${seq[n] === n ? 'ok' : 'no'}">${n + 1}. ${t}</span>`).join(''); $('#ochk', el).remove(); $('#ores', el).remove(); done(r, (r ? '' : 'Правильный порядок показан выше. ') + (q.why || '')); });
      upd();
    },
  },
  case: { // ситуация: что ты сделаешь? (у каждого варианта — разбор)
    render: q => `<div class="q-case">${q.story}</div><div class="q-text">${q.q || 'Что ты сделаешь?'}</div><div class="opts">${shuffle(q.a.map((o, i) => ({ o, i }))).map(x => `<button class="opt wide case-opt" data-i="${x.i}">${x.o.t}</button>`).join('')}</div>`,
    bind: (el, q, done) => { let d = false; $$('.opt', el).forEach(b => b.addEventListener('click', () => { if (d) return; d = true; const o = q.a[+b.dataset.i], r = o.ok === true; b.classList.add(r ? 'right' : o.ok === 'mid' ? 'mid' : 'wrong'); q.a.forEach((x, i) => { if (x.ok === true) $(`.opt[data-i="${i}"]`, el).classList.add('right'); }); done(r, `${o.why || ''}${q.why ? '<div class="rule">📏 ' + q.why + '</div>' : ''}`); })); },
  },
  sort: { // разложить по группам: нажимай на карточку — она переключает группу
    render: q => `<div class="q-text">${q.q}</div><div class="sort-legend">${q.groups.map((g, i) => `<span class="sg g${i}">${g}</span>`).join('')}</div><div class="sort-list">${q.items.map((it, i) => `<button class="sort-it" data-i="${i}" data-g="-1"><span>${it[0]}</span><i>?</i></button>`).join('')}</div><button class="btn pink" id="schk">Проверить</button>`,
    bind: (el, q, done) => {
      $$('.sort-it', el).forEach(b => b.addEventListener('click', () => { if (b.classList.contains('lock')) return; const g = (+b.dataset.g + 1) % q.groups.length; b.dataset.g = g; b.className = 'sort-it g' + g; $('i', b).textContent = q.groups[g]; SND.tap(); }));
      $('#schk', el).addEventListener('click', () => { if ($$('.sort-it', el).some(b => b.dataset.g === '-1')) { toast('Разложи все карточки 🙂'); return; } let all = true; $$('.sort-it', el).forEach(b => { const right = +b.dataset.g === q.items[+b.dataset.i][1]; all = all && right; b.classList.add('lock', right ? 'ok' : 'no'); if (!right) $('i', b).textContent = '→ ' + q.groups[q.items[+b.dataset.i][1]]; }); $('#schk', el).remove(); done(all, q.why); });
    },
  },
  input: {
    render: q => `<div class="q-text">${q.q}</div><div class="ask-eq"><span class="inp" id="qin">?</span></div>${numpad(true)}`,
    bind: (el, q, done) => { let buf = '', d = false; bindPad(el, { digit: x => { if (buf.length < 6) { buf += x; $('#qin', el).textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#qin', el).textContent = buf || '?'; }, ok: () => { if (d || !buf) return; d = true; keyHandler = null; const r = String(q.c) === buf; $('#qin', el).classList.toggle('bad', !r); if (!r) $('#qin', el).textContent = buf + ' → ' + q.c; done(r, q.why); } }); },
  },
};

/* ================= поиск ответа (для энциклопедии и др.) ================= */
SCREENS.asearch = id => {
  const s = subj(id); if (!s) return go('academy');
  app.innerHTML = `${topbar('🔎 Найти ответ', 'subject')}<div class="page"><input id="sq" class="nmi" placeholder="Например: почему…" autocomplete="off"><div id="sres" class="sres"></div></div>`;
  $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = id;
  const all = s.units.flatMap(u => u.cards.map((c, i) => ({ u, c, i })));
  const nk = t => String(t).toLowerCase().replace(/ё/g, 'е').replace(/<[^>]+>/g, ' ');
  const run = () => {
    const w = nk($('#sq').value).split(/\s+/).filter(x => x.length > 2);
    const hits = w.length ? all.map(x => ({ x, sc: w.reduce((t, k) => t + (nk(x.c.t).includes(k) ? 3 : 0) + (nk(x.c.h).includes(k) ? 1 : 0) + ((x.c.k || '').includes(k) ? 2 : 0), 0) })).filter(h => h.sc).sort((p, q) => q.sc - p.sc).slice(0, 8) : [];
    $('#sres').innerHTML = hits.length ? hits.map(h => `<button class="sres-it" data-u="${h.x.u.id}" data-i="${h.x.i}"><b>${h.x.u.icon} ${h.x.c.t}</b><small>${nk(h.x.c.h).slice(0, 110)}…</small></button>`).join('') : `<p class="small center">${w.length ? 'Не нашлось. Попробуй другие слова — или спроси маму, папу или котика в «Поболтать».' : 'Напиши, что хочешь узнать.'}</p>`;
    $$('.sres-it').forEach(b => b.addEventListener('click', () => go('alesson', id + ':' + b.dataset.u + ':' + b.dataset.i)));
  };
  $('#sq').addEventListener('input', run); run(); $('#sq').focus();
};
