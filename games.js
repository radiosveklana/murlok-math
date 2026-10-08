/* games.js — «Детективные игры»: мини-игры на умножение, уравнения, проверку, прикидку и логику */
'use strict';
const GAMES = [
  { id: 'scales', icon: '⚖️', name: 'Волшебные весы', desc: 'Узнай, сколько весит коробка. Это и есть уравнение!', skill: 'Уравнения', kind: 'eq' },
  { id: 'interro', icon: '🕵️', name: 'Допрос свидетелей', desc: 'Кто ошибся в расчётах — тот врёт', skill: 'Проверка вычислений', kind: 'eq' },
  { id: 'color', icon: '🎨', name: 'Математическая раскраска', desc: 'Реши пример — раскрась клетку. Что же получится?', skill: 'Таблица и устный счёт', kind: 'mul' },
  { id: 'safe', icon: '🔐', name: 'Сейф вора', desc: 'Реши примеры — из ответов сложится код', skill: 'Умножение', kind: 'mul' },
  { id: 'estimate', icon: '🎯', name: 'Прикидка', desc: 'Какой ответ похож на правду?', skill: 'Прикидка и проверка', kind: 'mul' },
  { id: 'memo', icon: '🃏', name: 'Мемори', desc: 'Найди пары: пример и ответ', skill: 'Таблица умножения', kind: 'mul' },
  { id: 'chase', icon: '🏃', name: 'Погоня', desc: 'Отвечай быстро — догони вора!', skill: 'Скорость счёта', kind: 'mul' },
  { id: 'logic', icon: '🧩', name: 'Кто где был?', desc: 'Распутай алиби по уликам', skill: 'Логика', kind: 'bug' },
  { id: 'pattern', icon: '🔢', name: 'Закономерность', desc: 'Какое число следующее?', skill: 'Внимание и логика', kind: 'bug' },
];
const gBest = () => (S.gameBest = S.gameBest || {});
const gWho = () => { const a = pick(E.ANIMALS), P = window.Lines.PERSONA[a[1]] || {}; return { animal: a, f: P.g === 'f' }; };
const vf = (w, m, f) => w.f ? f : m;
const face = (a, cls = '', mood) => window.Chibi ? `<span class="pt chibi-pt ${cls}">${Chibi.chibiSVG(a[1], { mood })}</span>` : `<span class="pt ${cls}"><span class="pt-a">${a[0]}</span></span>`;


/* показания свидетеля: верный или ошибочный расчёт (умножение или уравнение) */
const MUL_T = [
  (w, a, b, v) => `Я ${vf(w, 'разложил', 'разложила')} ${b} коробок по ${a} конфет — всего ${v}!`,
  (w, a, b, v) => `Я ${vf(w, 'испёк', 'испекла')} ${b} противней по ${a} печений — получилось ${v}!`,
  (w, a, b, v) => `За ${b} дней я ${vf(w, 'прочитал', 'прочитала')} по ${a} страниц — это ${v} страниц!`,
  (w, a, b, v) => `Я ${vf(w, 'посадил', 'посадила')} ${b} рядов по ${a} цветков — всего ${v}!`,
  (w, a, b, v) => `Я ${vf(w, 'насчитал', 'насчитала')} ${b} вагонов по ${a} мест — это ${v} мест!`,
];
function gStatement(lie, eqMode, wIn) {
  const w = wIn || gWho();
  if (eqMode) {
    const eq = E.genEq(rnd(1, 2)); let xv = eq.x;
    const intOK = (n, x) => { if (n.k !== 'op') return true; const l = E.evalE(n.l, x), r = E.evalE(n.r, x), v = E.calc(l, n.op, r); return Number.isInteger(v) && v >= 0 && intOK(n.l, x) && intOK(n.r, x); };
    if (lie) { const c = shuffle([-3, -2, -1, 1, 2, 3, 4, 5, 6, 10, -10]).map(d => eq.x + d).filter(v => v > 0 && intOK(eq.lhs, v) && E.evalE(eq.lhs, v) !== eq.rhs); if (!c.length) return gStatement(lie, false, wIn); xv = c[0]; }
    const lhs = E.eqText(eq.lhs), ok = E.evalE(eq.lhs, xv);
    return { w, lie, text: `Я ${vf(w, 'решил', 'решила')} уравнение <b>${lhs} = ${eq.rhs}</b> и ${vf(w, 'получил', 'получила')} <b>x = ${xv}</b>.`, check: `Проверка: ${E.eqText(eq.lhs, xv)} = ${ok}${ok === eq.rhs ? ' ✔ верно' : ` ≠ ${eq.rhs} ✖`}` };
  }
  const big = S.st.mul.done > 15, a = big ? rnd(102, 489) : rnd(12, 98), b = rnd(3, 9), v = a * b;
  let shown = v; if (lie) { const cands = [v + 10, v - 10, E.mulDropCarry(a, b, 1), v + b, v - a, v + 100].filter(z => z > 0 && z !== v); shown = pick(cands); }
  return { w, lie, text: pick(MUL_T)(w, a, b, shown), check: `${a} × ${b} = ${v}${shown === v ? ' ✔ верно' : `, а не ${shown} ✖`}` };
}
/* задача дела «Математический допрос»: свидетели дают показания, нужно найти того, кто ошибся */
function mountCaseInterro(el, { eqMode, witnesses, onDone }) {
  const liar = rnd(0, 2), list = [0, 1, 2].map(i => gStatement(i === liar, eqMode, witnesses && witnesses[i] ? { animal: witnesses[i], f: (window.Lines.PERSONA[witnesses[i][1]] || {}).g === 'f' } : null));
  el.innerHTML = `<div class="task-title">🕵️ Математический допрос</div>${helperHTML('ibub')}<div class="wit-list">${list.map((s, i) => `<div class="wit" data-i="${i}">${face(s.w.animal, 'talking')}<div class="wit-t"><b>${s.w.animal[1]}:</b> «${s.text}»<div class="wit-c" hidden>${s.check}</div></div><button class="btn sm lie">🤥 Врёт!</button></div>`).join('')}</div>`;
  $('#ibub').innerHTML = `Свидетели рассказывают, что делали во время кражи. <b>Один из них ошибся в расчётах</b> — значит, его алиби фальшивое! Проверь каждого (можно на листочке ✏️).`;
  let mistakes = 0, done = false;
  $$('.wit', el).forEach(row => $('.lie', row).addEventListener('click', () => {
    if (done) return; const i = +row.dataset.i;
    if (i !== liar) { mistakes++; SND.bad(); row.classList.add('truth'); $('.wit-c', row).hidden = false; $('#ibub').innerHTML = `<div class="fb bad">У него всё сходится!</div>${list[i].check}. Проверь остальных.`; return; }
    done = true; SND.ok(); $$('.wit-c', el).forEach(c => c.hidden = false); row.classList.add('liar');
    $('.pt', row).outerHTML = face(list[liar].w.animal, 'angry', 'angry');
    $('#ibub').innerHTML = `<div class="fb">🔍 Попался на ошибке!</div>${list[liar].check}. А остальные свидетели рассказали кое-что важное…`;
    SND.win(); onDone && onDone({ mistakes, helped: false });
  }));
}

SCREENS.games = () => {
  const B = gBest();
  app.innerHTML = `${topbar('Детективные игры')}<div class="page"><p class="center">Мини-игры для настоящих сыщиков: каждая прокачивает свой навык. За победы — конфеты 🍬, а за весы и допрос засчитываются уравнения 📦</p>
    <div class="games-grid">${GAMES.map(g => `<button class="game-card" data-g="${g.id}"><span class="gi">${g.icon}</span><b>${g.name}</b><small>${g.desc}</small><span class="gs">🧠 ${g.skill}${B[g.id] ? ` · 🏆 ${B[g.id]}` : ''}</span></button>`).join('')}</div></div>`;
  $$('.game-card', app).forEach(b => b.addEventListener('click', () => { SND.tap(); go('game', b.dataset.g); }));
  say(pick(['Выбирай игру, {n}! Все они делают тебя сильнее в математике.', 'Весы — самый простой путь к уравнениям!', 'Допрос учит проверять ответы — как настоящий сыщик!']), 0, { silent: true });
};

/* общий каркас: раунды, счёт, награда */
function gameShell(g, rounds) {
  app.innerHTML = `${topbar(g.icon + ' ' + g.name, 'games')}<div class="page game-page"><div class="g-head"><div class="g-dots" id="gdots">${Array.from({ length: rounds }, () => '<i></i>').join('')}</div><div class="pill">⭐ <b id="gsc">0</b></div></div>${helperHTML('gbub')}<div id="garea"></div><div id="gafter" class="after"></div></div>`;
  const st = { r: 0, score: 0, mistakes: 0, rounds };
  st.say = h => { const b = $('#gbub'); if (b) { b.innerHTML = h; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } };
  st.mark = ok => { const d = $$('#gdots i')[st.r]; if (d) d.className = ok ? 'ok' : 'bad'; if (ok) { st.score++; $('#gsc').textContent = st.score; SND.ok(); } else { st.mistakes++; SND.bad(); } };
  st.next = (fn, ms = 1400) => { st.r++; setTimeout(() => { if (st.r >= rounds) finishGame(g, st); else fn(); }, ms); };
  st.nextBtn = fn => { $('#gafter').innerHTML = `<button class="btn big pink" id="gn">${st.r + 1 >= rounds ? 'Итоги 🏆' : 'Дальше →'}</button>`; $('#gn').addEventListener('click', () => { $('#gafter').innerHTML = ''; st.next(fn, 0); }); };
  return st;
}
function finishGame(g, st) {
  const B = gBest(), rec = st.score > (B[g.id] || 0); if (rec) B[g.id] = st.score;
  const c = st.score * (g.kind === 'eq' ? 2 : 1) + (st.score === st.rounds ? 3 : 0);
  if (g.kind !== 'eq' || g.id !== 'scales') taskDone(g.kind, { mistakes: st.mistakes, helped: false });
  award(c, st.score * 5); save(); SND.win(); confetti(st.score === st.rounds ? 45 : 20);
  $('#garea').innerHTML = `<div class="center g-result"><div class="big-emoji">${st.score === st.rounds ? '🏆' : st.score >= st.rounds / 2 ? '🥈' : '🐾'}</div><h2>${esc(S.kid)}, ${st.score} из ${st.rounds}!</h2>${rec ? '<div class="perfect">Новый рекорд! 🎉</div>' : ''}<div class="loot"><div>🍬 <b>+${c}</b><small>конфет</small></div><div>⭐ <b>+${st.score * 5}</b><small>опыта</small></div></div><div class="row-btns"><button class="btn big pink" id="again">Ещё раз!</button><button class="btn" data-go="games">Другие игры</button></div></div>`;
  $('#gafter').innerHTML = ''; $('#again').addEventListener('click', () => go('game', g.id));
  say(st.score === st.rounds ? pick(PH.done) : pick(PH.cheerOk));
}
SCREENS.game = id => { const g = GAMES.find(x => x.id === id) || GAMES[0]; GAME_FN[g.id](g); };

const GAME_FN = {

  /* 🎨 МАТЕМАТИЧЕСКАЯ РАСКРАСКА: выбери цвет-число и закрась клетки, где ответ равен этому числу */
  color(g) {
    const st = gameShell(g, 1); $('#gdots').innerHTML = '';
    const PICS = [
      { name: 'Сердечко', pal: { '.': '#DFF3FF', R: '#FF5E92', W: '#FFFFFF' }, px: ['.RR..RR.', 'RRRRRRRR', 'RRWRRRRR', 'RRRRRRRR', '.RRRRRR.', '..RRRR..', '...RR...', '........'] },
      { name: 'Котик', pal: { '.': '#E8F7EF', O: '#F6A65A', E: '#3B2A4A', P: '#FF9DBB' }, px: ['O......O', 'OO....OO', 'OOOOOOOO', 'OEOOOOEO', 'OOOPPOOO', 'OOOOOOOO', '.OOOOOO.', '........'] },
      { name: 'Капкейк', pal: { '.': '#FFF4E0', C: '#E6455A', W: '#FFFFFF', P: '#FF9DBB', B: '#9C6B45' }, px: ['...CC...', '..WWWW..', '.WWWWWW.', '.PPPPPP.', '.BBBBBB.', '.BPBPBP.', '..BBBB..', '........'] },
      { name: 'Звёздочка', pal: { '.': '#2E2950', Y: '#FFC93C', W: '#FFFFFF' }, px: ['...YY...', 'W..YY..W', 'YYYYYYYY', '.YYYYYY.', '..YYYY..', '.YY..YY.', 'YY....YY', 'W......W'] },
      { name: 'Рыбка', pal: { '.': '#CDEBFF', B: '#3D8BFD', E: '#3B2A4A', T: '#FFC93C' }, px: ['........', '...BBB..', '..BBBBBT', '.BEBBBTT', '..BBBBBT', '...BBB..', '........', '..T..T..'] },
      { name: 'Мороженое', pal: { '.': '#FFE9F2', P: '#FF9DBB', M: '#7FE0C1', K: '#E0A96D' }, px: ['..PPPP..', '.PPPPPP.', '.MMMMMM.', '.MMMMMM.', '..KKKK..', '..KKKK..', '...KK...', '...KK...'] },
    ];
    const pic = pick(PICS), letters = Object.keys(pic.pal);
    const hard = S.st.mul.done > 20;
    const pool = shuffle(hard ? [72, 84, 96, 108, 112, 126, 135, 144, 156, 168] : [24, 28, 32, 36, 42, 45, 48, 54, 56, 63, 64, 72]);
    const num = {}; letters.forEach((l, i) => { num[l] = pool[i]; });
    function expr(v) {
      const o = [];
      for (let a = 2; a <= 9; a++) if (v % a === 0 && v / a >= 2 && v / a <= (hard ? 99 : 9)) o.push(`${a} × ${v / a}`);
      const k = rnd(2, hard ? 4 : 6); o.push(`${v * k} : ${k}`);
      const d = rnd(4, 30); o.push(`${v - d} + ${d}`); o.push(`${v + d} − ${d}`);
      return pick(o.concat(o.filter(x => x.includes('×'))));
    }
    const cells = []; pic.px.forEach((row, y) => [...row].forEach((l, x) => cells.push({ l, e: expr(num[l]), done: false })));
    let sel = letters[1] || letters[0], mistakes = 0;
    st.say(`Выбери цвет с числом, а потом закрашивай клетки, где <b>ответ равен этому числу</b>. Посмотрим, что за картинка спряталась! 🎨`);
    const left = l => cells.filter(c => c.l === l && !c.done).length;
    const draw = () => {
      $('#garea').innerHTML = `<div class="palette">${letters.map(l => `<button class="pc ${l === sel ? 'on' : ''} ${left(l) ? '' : 'fin'}" data-l="${l}" style="--c:${pic.pal[l]}"><i></i><b>${num[l]}</b><small>${left(l) ? 'ещё ' + left(l) : '✔'}</small></button>`).join('')}</div>
        <div class="cgrid">${cells.map((c, i) => `<button class="ccell ${c.done ? 'f' : ''}" data-i="${i}" style="${c.done ? `background:${pic.pal[c.l]}` : ''}">${c.done ? '' : c.e}</button>`).join('')}</div>`;
      $$('.pc', app).forEach(b => b.addEventListener('click', () => { sel = b.dataset.l; SND.tap(); draw(); }));
      $$(".ccell", app).forEach(b => b.addEventListener('click', () => {
        const c = cells[+b.dataset.i]; if (c.done) return;
        if (c.l === sel) { c.done = true; b.classList.add('f', 'pop'); b.style.background = pic.pal[c.l]; b.textContent = ''; SND.tap(); M.haptic(8);
          const pcEl = $(`.pc[data-l="${sel}"] small`); if (pcEl) pcEl.textContent = left(sel) ? 'ещё ' + left(sel) : '✔';
          if (!left(sel)) { $(`.pc[data-l="${sel}"]`).classList.add('fin'); SND.ok(); const nx = letters.find(l => left(l)); if (nx) { sel = nx; setTimeout(draw, 300); } }
          if (cells.every(x => x.done)) finish();
        } else { mistakes++; SND.bad(); shake(b); const [p2, op, q2] = c.e.split(' '); const v = E.calc(+p2, { '×': '*', ':': '/', '+': '+', '−': '-' }[op], +q2); st.say(`<div class="fb bad">Не тот цвет!</div>${c.e} = <b>${v}</b>. Найди цвет с числом ${v}.`); if (op === '×') noteErr('tbl', factKey(+p2, +q2)); }
      }));
    };
    function finish() {
      st.say(`<div class="fb">🎉 Получилось: ${pic.name}!</div>Все примеры решены${mistakes ? '' : ' без единой ошибки'}!`);
      $('.cgrid').classList.add('reveal'); confetti(40); M.sfx('magic');
      if (!mistakes) awardGems(1, 'за раскраску без ошибок');
      setTimeout(() => { st.score = Math.max(4, 10 - mistakes); st.rounds = 10; st.r = 1; const keep = $('.cgrid').outerHTML; finishGame(g, st); $('#garea').insertAdjacentHTML('afterbegin', keep); }, 2200);
    }
    draw();
  },
  /* ⚖️ ВЕСЫ: уравнение как равновесие. Убираем одинаковое с обеих чаш, делим поровну. */
  scales(g) {
    const st = gameShell(g, 5);
    const lvl = () => S.st.eq.done < 4 ? 0 : S.st.eq.done < 12 ? 1 : 2;
    function round() {
      const t = Math.min(2, Math.max(0, rnd(0, lvl()))); const x = rnd(2, t === 2 ? 15 : 30), a = t === 0 ? 1 : rnd(2, t === 2 ? 5 : 6), b = t === 1 ? 0 : rnd(3, 25), c = a * x + b;
      let left = { a, b }, right = c, phase = b ? 'sub' : 'div';
      const boxes = n => Array.from({ length: n }, () => '<span class="box3">📦</span>').join('');
      const draw = (tilt = 0) => {
        $('#garea').innerHTML = `<div class="scales" style="--tilt:${tilt}deg"><div class="beam"><div class="pan l"><div class="pan-in">${boxes(left.a)}${left.b ? `<span class="wt">${left.b}</span>` : ''}</div></div><div class="pan r"><div class="pan-in"><span class="wt big">${right}</span></div></div></div><div class="pivot">▲</div></div>
          <div class="eqline">${left.a > 1 ? left.a + ' · ' : ''}<i class="x">x</i>${left.b ? ' + ' + left.b : ''} = ${right}</div><div id="sq"></div>`;
      };
      const ask = () => {
        draw();
        if (phase === 'sub') {
          st.say(`На левой чаше ${left.a > 1 ? left.a + ' одинаковые коробки' : 'коробка'} и гирька <b>${left.b}</b>, на правой — <b>${right}</b>. Весы в равновесии! Как оставить слева только коробки, чтобы равновесие не нарушилось?`);
          opts([[`Снять по ${left.b} с обеих чаш`, true], [`Снять ${left.b} только с левой чаши`, false, 'Если снять только с одной чаши, весы перекосятся!'], [`Добавить ${left.b} на правую чашу`, false, 'Так правая чаша станет ещё тяжелее!']], () => { right -= left.b; left.b = 0; phase = left.a > 1 ? 'div' : 'ans'; M.sfx('pop'); ask(); });
        } else if (phase === 'div') {
          st.say(`Отлично! Теперь <b>${left.a}</b> одинаковые коробки весят <b>${right}</b>. Как узнать вес одной коробки?`);
          opts([[`Разделить ${right} на ${left.a}`, true], [`Умножить ${right} на ${left.a}`, false, 'Одна коробка легче, чем все вместе, — значит, делим!'], [`Отнять ${left.a} от ${right}`, false, 'Коробки одинаковые — их вес делится поровну.']], () => { phase = 'ans'; M.sfx('pop'); ask(); });
        } else {
          st.say(left.a > 1 ? `Посчитай: <b>${right} : ${left.a}</b> = ? Сколько весит одна коробка?` : `Слева осталась одна коробка, справа <b>${right}</b>. Сколько весит коробка?`);
          $('#sq').innerHTML = `<div class="ask-eq"><i class="x">x</i> = <span class="inp" id="sin">?</span></div>${numpad(true)}`;
          let buf = ''; const box = $('#sq');
          bindPad(box, { digit: d => { if (buf.length < 4) { buf += d; $('#sin').textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#sin').textContent = buf || '?'; }, ok: () => {
            if (+buf === x) { st.mark(true); taskDone('eq', { mistakes: 0 }); box.innerHTML = `<div class="ask-eq win">📦 = ${x} ✔</div><p class="center">Ты решил${S.kid && /[аяь]$/i.test(S.kid) ? 'а' : ''} уравнение <b>${a > 1 ? a + ' · ' : ''}x${b ? ' + ' + b : ''} = ${c}</b>. Проверка: ${a > 1 ? a + ' · ' : ''}${x}${b ? ' + ' + b : ''} = ${c} ✔</p>`; st.nextBtn(round); }
            else { st.mark(false); buf = ''; $('#sin').textContent = '?'; draw(8); setTimeout(() => draw(), 600); st.say(`Не сходится. ${left.a > 1 ? `Подумай: ${left.a} · ? = ${right}` : 'Посмотри на правую чашу.'}`); }
          } });
        }
      };
      function opts(list, onOk) {
        $('#sq').innerHTML = `<div class="opts">${shuffle(list).map((o, i) => `<button class="opt wide" data-i="${list.indexOf(o)}">${o[0]}</button>`).join('')}</div>`;
        $$('#sq .opt').forEach(btn => btn.addEventListener('click', () => {
          const o = list[+btn.dataset.i];
          if (o[1]) { SND.ok(); btn.classList.add('right'); setTimeout(onOk, 500); }
          else { SND.bad(); btn.classList.add('wrong'); st.mistakes++; draw(o[0].includes('левой') ? -14 : 14); setTimeout(() => draw(), 900); st.say(`<div class="fb bad">${o[2]}</div>Попробуй другой способ.`); setTimeout(() => opts(list, onOk), 950); }
        }));
      }
      ask();
    }
    round();
  },

  /* 🕵️ ДОПРОС: трое свидетелей, один ошибся в расчётах — значит, врёт */
  interro(g) {
    const st = gameShell(g, 4);
    const statement = gStatement;
    function round() {
      const eqMode = st.r % 2 === 1, liar = rnd(0, 2), list = [0, 1, 2].map(i => statement(i === liar, eqMode));
      st.say(`Трое свидетелей дают показания. <b>Один из них ошибся в расчётах</b> — его словам верить нельзя! Проверь каждого (можно на листочке ✏️) и нажми «Врёт!».`);
      $('#garea').innerHTML = `<div class="wit-list">${list.map((s, i) => `<div class="wit" data-i="${i}">${face(s.w.animal, 'talking')}<div class="wit-t"><b>${s.w.animal[1]}:</b> «${s.text}»<div class="wit-c" hidden>${s.check}</div></div><button class="btn sm lie">🤥 Врёт!</button></div>`).join('')}</div>`;
      let done = false;
      $$('.wit', app).forEach(row => $('.lie', row).addEventListener('click', () => {
        if (done) return; done = true; const i = +row.dataset.i, ok = i === liar;
        st.mark(ok); $$('.wit-c', app).forEach(c => c.hidden = false);
        $$('.wit', app).forEach((r, k) => r.classList.add(k === liar ? 'liar' : 'truth'));
        $(`.wit[data-i="${liar}"] .pt`).outerHTML = face(list[liar].w.animal, 'angry', 'angry');
        st.say(ok ? `<div class="fb">🔍 Точно! ${list[liar].w.animal[1]} ошибся в расчётах.</div>Проверка — главное оружие сыщика!` : `<div class="fb bad">Не тот.</div>Посмотри проверку: врёт <b>${list[liar].w.animal[1]}</b>.`);
        st.nextBtn(round);
      }));
    }
    round();
  },

  /* 🔐 СЕЙФ: каждый ответ даёт цифру кода */
  safe(g) {
    const st = gameShell(g, 4); const code = [];
    const lv = S.st.mul.done > 15 ? 3 : 1;
    function round() {
      const [a, b] = lv === 3 ? [rnd(102, 389), rnd(3, 9)] : [rnd(13, 98), rnd(3, 9)], v = a * b; let tries = 0, buf = '';
      $('#garea').innerHTML = `<div class="safe ${code.length === 4 ? 'open' : ''}"><div class="safe-door"><div class="dial">${[0, 1, 2, 3].map(k => `<span class="dg ${code[k] != null ? 'on' : ''}">${code[k] ?? '?'}</span>`).join('')}</div><div class="safe-wheel">⚙️</div></div></div>
        <div class="ask-eq">${a} × ${b} = <span class="inp" id="sin">?</span></div>${numpad(true)}`;
      st.say(`Цифра №${st.r + 1} кода — это <b>последняя цифра ответа</b>. Посчитай ${a} × ${b} (можно столбиком на листочке ✏️).`);
      bindPad($('#garea'), { digit: d => { if (buf.length < 5) { buf += d; $('#sin').textContent = buf; } }, back: () => { buf = buf.slice(0, -1); $('#sin').textContent = buf || '?'; }, ok: () => {
        if (+buf === v) { st.mark(true); code.push(v % 10); M.sfx('pop'); $$('.dg')[st.r].textContent = v % 10; $$('.dg')[st.r].classList.add('on');
          if (code.length === 4) { setTimeout(() => { $('.safe').classList.add('open'); M.sfx('magic'); confetti(25); st.say(`🔓 Код <b>${code.join('')}</b> подошёл! Сейф открыт — внутри украденные конфеты!`); }, 400); }
          st.next(round, code.length === 4 ? 2200 : 900); }
        else { tries++; st.mistakes++; SND.bad(); M.sfx('drum'); buf = ''; $('#sin').textContent = '?'; st.say(tries < 2 ? '🚨 Сигнализация! Неверно. Посчитай ещё раз внимательно.' : `Ответ: ${a} × ${b} = <b>${v}</b>. Последняя цифра — ${v % 10}.`); if (tries >= 2) { code.push(v % 10); $$('#gdots i')[st.r].className = 'bad'; st.next(round, 1600); } }
      } });
    }
    round();
  },

  /* 🎯 ПРИКИДКА: найди ответ, похожий на правду (ловим ошибки сдвига и переноса) */
  estimate(g) {
    const st = gameShell(g, 6);
    const rnd10 = n => n < 100 ? Math.round(n / 10) * 10 : Math.round(n / 100) * 100;
    function round() {
      const a = rnd(23, 489), b = st.r < 3 ? rnd(3, 9) : rnd(12, 48), v = a * b;
      const wrong = new Set();
      if (b > 9) wrong.add(a * (b % 10) + a * Math.floor(b / 10)); // забыли сдвиг
      wrong.add(v * 10); wrong.add(Math.round(v / 10)); wrong.add(E.mulDropCarry(a, b % 10 || 2, 1) * (b > 9 ? 1 : 1));
      const opts = shuffle([v, ...shuffle([...wrong].filter(x => x !== v && x > 0)).slice(0, 2)]);
      st.say(`Не считай точно — прикинь! Какой ответ похож на правду: <b>${a} × ${b}</b>?`);
      $('#garea').innerHTML = `<div class="ask-eq">${a} × ${b} ≈ ?</div><div class="opts">${opts.map(o => `<button class="opt wide" data-v="${o}">${o}</button>`).join('')}</div>`;
      let done = false;
      $$('.opt', app).forEach(btn => btn.addEventListener('click', () => {
        if (done) return; done = true; const ok = +btn.dataset.v === v; st.mark(ok); btn.classList.add(ok ? 'right' : 'wrong'); $(`.opt[data-v="${v}"]`).classList.add('right');
        st.say(`${ok ? '<div class="fb">✔ Верно!</div>' : '<div class="fb bad">Не тот.</div>'}Прикидка: ${a} ≈ ${rnd10(a)}, ${b} ≈ ${rnd10(b)}, значит, примерно <b>${rnd10(a) * rnd10(b)}</b>. Точный ответ: ${v}.`);
        st.nextBtn(round);
      }));
    }
    round();
  },

  /* 🃏 МЕМОРИ: пары «пример — ответ» */
  memo(g) {
    const st = gameShell(g, 1); $('#gdots').innerHTML = '';
    const pool = []; for (let p = 3; p <= 9; p++) for (let q = p; q <= 9; q++) pool.push([p, q]);
    const weight = f => 1 + 3 * (S.facts[factKey(f[0], f[1])] || 0);
    const used = new Set(), facts = [];
    while (facts.length < 6) { const f = pool[Math.floor(Math.random() * pool.length)]; if (Math.random() * 4 > weight(f)) continue; if (used.has(f[0] * f[1])) continue; used.add(f[0] * f[1]); facts.push(f); }
    const cards = shuffle(facts.flatMap((f, i) => [{ i, t: `${f[0]} × ${f[1]}` }, { i, t: String(f[0] * f[1]) }]));
    let open = [], found = 0, moves = 0, lock = false;
    st.say('Найди пары: пример и его ответ. Запоминай, где что лежит! 🧠');
    $('#garea').innerHTML = `<div class="memo">${cards.map((c, k) => `<button class="mc" data-k="${k}"><span class="mf">🐾</span><span class="mb">${c.t}</span></button>`).join('')}</div><p class="center small">Ходов: <b id="mv">0</b></p>`;
    $$('.mc', app).forEach(btn => btn.addEventListener('click', () => {
      if (lock || btn.classList.contains('flip')) return; btn.classList.add('flip'); SND.tap(); open.push(btn);
      if (open.length === 2) {
        moves++; $('#mv').textContent = moves; lock = true;
        const [x, y] = open.map(b => cards[+b.dataset.k]);
        if (x.i === y.i) { setTimeout(() => { open.forEach(b => b.classList.add('done')); open = []; lock = false; found++; SND.ok(); if (found === 6) { st.score = Math.max(1, 10 - Math.max(0, moves - 8)); st.rounds = 10; st.r = 1; finishGame(g, st); } }, 350); }
        else { const f = facts[x.t.includes('×') ? x.i : y.i]; noteErr('tbl', factKey(f[0], f[1])); setTimeout(() => { open.forEach(b => b.classList.remove('flip')); open = []; lock = false; }, 900); }
      }
    }));
  },

  /* 🏃 ПОГОНЯ: верные ответы приближают к вору */
  chase(g) {
    const st = gameShell(g, 1); $('#gdots').innerHTML = '';
    let cat = 0, thief = 40, buf = '', f, done = false; const t0 = Date.now();
    const newF = () => { f = [rnd(3, 9), rnd(3, 9)]; if (Math.random() < 0.3) f = [rnd(11, 19), rnd(2, 5)]; };
    newF();
    $('#garea').innerHTML = `<div class="track"><span class="runner c" id="rc">🐱</span><span class="runner t" id="rt">${face(["🦝", "Енот Тимоша"], "", "happy")}</span><span class="finish">🏁</span></div><div class="ask-eq" id="cq"></div>${numpad(false)}`;
    st.say('Вор убегает с конфетами! Каждый верный ответ — рывок вперёд. Догони его до финиша!');
    const draw = () => { $('#rc').style.left = cat + '%'; $('#rt').style.left = thief + '%'; $('#cq').innerHTML = `${f[0]} × ${f[1]} = <span class="inp">${buf || '?'}</span>`; };
    draw();
    const iv = setInterval(() => { if (done) return; thief += 0.9; draw(); if (thief >= 92) end(false); }, 600); cleanups.push(() => clearInterval(iv));
    function end(win) { if (done) return; done = true; clearInterval(iv); keyHandler = null; st.score = win ? Math.max(3, 10 - Math.floor((Date.now() - t0) / 8000)) : Math.round(cat / 15); st.rounds = 10; st.r = 1; if (win) { M.sfx('whoosh'); say(pick(PH.bugFound)); } finishGame(g, st); }
    bindPad($('#garea'), { digit: d => {
      if (done) return; buf += d; draw(); const ans = String(f[0] * f[1]);
      if (buf.length >= ans.length) {
        if (buf === ans) { cat = Math.min(95, cat + 7); SND.tap(); M.sfx('bounce'); } else { thief = Math.min(95, thief + 4); SND.bad(); noteErr('tbl', factKey(f[0], f[1])); }
        buf = ''; newF(); draw(); if (cat >= thief - 3) end(true);
      }
    }, back: () => { buf = buf.slice(0, -1); draw(); } });
  },

  /* 🧩 КТО ГДЕ БЫЛ: логика исключения */
  logic(g) {
    const st = gameShell(g, 3);
    const PLACES = [['🍰', 'в кондитерской'], ['🌳', 'в парке'], ['📚', 'в библиотеке'], ['🎡', 'на ярмарке'], ['🏊', 'в бассейне']];
    function perms(n) { const out = []; const go_ = (a, r) => { if (!r.length) return out.push(a); r.forEach((x, i) => go_([...a, x], r.filter((_, k) => k !== i))); }; go_([], [...Array(n).keys()]); return out; }
    function round() {
      const n = st.r < 2 ? 3 : 4, who = shuffle(E.ANIMALS).slice(0, n), pl = shuffle(PLACES).slice(0, n), sol = shuffle([...Array(n).keys()]);
      const all = perms(n); let clues = [];
      const ok = (p, cs) => cs.every(c => c.pos ? p[c.a] === c.p : p[c.a] !== c.p);
      for (let t = 0; t < 200; t++) {
        const a = rnd(0, n - 1), pos = Math.random() < 0.25 && !clues.some(c => c.pos), p = pos ? sol[a] : pick([...Array(n).keys()].filter(x => x !== sol[a]));
        if (clues.some(c => c.a === a && c.p === p)) continue; clues.push({ a, p, pos });
        if (all.filter(x => ok(x, clues)).length === 1) break;
      }
      const grid = who.map(() => Array(n).fill(0));
      st.say('Узнай, кто где был вчера вечером. Читай улики и отмечай в таблице: нажми один раз — ✔, ещё раз — ✖.');
      $('#garea').innerHTML = `<div class="clue-list">${clues.map(c => `<div class="clue">🔎 ${who[c.a][1]} ${c.pos ? 'был(а)' : '<b>не</b> был(а)'} ${pl[c.p][1]} ${pl[c.p][0]}</div>`).join('')}</div>
        <div class="lgrid" style="--n:${n}"><span></span>${pl.map(p => `<span class="lh">${p[0]}</span>`).join('')}${who.map((w, i) => `<span class="lw">${face(w)}<small>${w[1].split(' ')[1]}</small></span>${pl.map((p, j) => `<button class="lc" data-i="${i}" data-j="${j}"></button>`).join('')}`).join('')}</div>
        <button class="btn big pink" id="lchk">Проверить 🔍</button>`;
      $$('.lc', app).forEach(c => c.addEventListener('click', () => { const i = +c.dataset.i, j = +c.dataset.j; grid[i][j] = (grid[i][j] + 1) % 3; c.textContent = ['', '✔', '✖'][grid[i][j]]; c.className = 'lc s' + grid[i][j]; SND.tap(); }));
      let tries = 0;
      $('#lchk').addEventListener('click', () => {
        const right = who.every((_, i) => grid[i].filter(v => v === 1).length === 1 && grid[i][sol[i]] === 1);
        if (right) { st.mark(true); st.say('<div class="fb">🔍 Всё сходится!</div>Ты распутал(а) алиби, как настоящий детектив!'); $('#lchk').remove(); st.nextBtn(round); }
        else { tries++; SND.bad(); shake($('.lgrid')); if (tries >= 2) { st.mark(false); st.say(`Ответ: ${who.map((w, i) => `${w[1].split(' ')[1]} — ${pl[sol[i]][0]}`).join(', ')}. Подсказка сыщика: начинай с уверенной улики, потом вычёркивай.`); $('#lchk').remove(); st.nextBtn(round); } else st.say('<div class="fb bad">Пока не сходится.</div>У каждого ровно одно место, и в каждом месте — один зверь. Проверь улики по одной.'); }
      });
    }
    round();
  },

  /* 🔢 ЗАКОНОМЕРНОСТЬ */
  pattern(g) {
    const st = gameShell(g, 6);
    function gen() {
      const t = rnd(0, 5), s = rnd(1, 12);
      if (t === 0) { const d = rnd(2, 9); return { seq: [0, 1, 2, 3, 4].map(i => s + d * i), next: s + d * 5, rule: `каждый раз прибавляем ${d}` }; }
      if (t === 1) { const d = rnd(2, 7), st0 = s + d * 6; return { seq: [0, 1, 2, 3, 4].map(i => st0 - d * i), next: st0 - d * 5, rule: `каждый раз отнимаем ${d}` }; }
      if (t === 2) { const k = pick([2, 3]), a = rnd(1, 4); return { seq: [0, 1, 2, 3].map(i => a * k ** i), next: a * k ** 4, rule: `каждый раз умножаем на ${k}` }; }
      if (t === 3) { return { seq: [0, 1, 2, 3, 4].map(i => s + i * (i + 1) / 2), next: s + 15, rule: 'прибавляем 1, 2, 3, 4, 5…' }; }
      if (t === 4) { const a = rnd(2, 6), b = rnd(1, 4); const q = [s]; for (let i = 1; i < 6; i++) q.push(q[i - 1] + (i % 2 ? a : -b)); return { seq: q.slice(0, 5), next: q[5], rule: `по очереди +${a} и −${b}` }; }
      const k = rnd(2, 9); return { seq: [1, 2, 3, 4, 5].map(i => k * i), next: k * 6, rule: `таблица умножения на ${k}` };
    }
    function round() {
      const p = gen(), opts = shuffle([p.next, p.next + rnd(1, 3), p.next - rnd(1, 3), p.next + 10].filter((v, i, a) => a.indexOf(v) === i && v >= 0)).slice(0, 4);
      if (!opts.includes(p.next)) opts[0] = p.next;
      st.say('Найди правило и продолжи ряд! 🔍');
      $('#garea').innerHTML = `<div class="seq">${p.seq.map(v => `<span>${v}</span>`).join('')}<span class="q">?</span></div><div class="opts">${shuffle(opts).map(o => `<button class="opt" data-v="${o}">${o}</button>`).join('')}</div>`;
      let done = false;
      $$('.opt', app).forEach(btn => btn.addEventListener('click', () => { if (done) return; done = true; const ok = +btn.dataset.v === p.next; st.mark(ok); btn.classList.add(ok ? 'right' : 'wrong'); $(`.opt[data-v="${p.next}"]`).classList.add('right'); $('.seq .q').textContent = p.next; st.say(`${ok ? '<div class="fb">✔ Верно!</div>' : '<div class="fb bad">Не то.</div>'}Правило: ${p.rule}.`); st.nextBtn(round); }));
    }
    round();
  },
};
