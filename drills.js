/* drills.js — новые темы в старых разделах:
   «Быстрые лапки»: режимы ➗ деление по таблице, ×10/100/1000, ➕➖ в уме (на минуту, как блиц);
   «Ошибки Енота»: ошибки в делении столбиком и в сложении/вычитании (найди, где Енот ошибся). */
'use strict';
const Drills = (() => {
  const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const MODES = {
    div: { icon: '➗', name: 'Деление по таблице', gen: () => { const b = R(2, 9), q = R(2, 10); return { t: `${b * q} : ${b}`, a: q }; } },
    round: { icon: '🔟', name: '×10, ×100, ×1000 и :', gen: () => { const k = [10, 100, 1000][R(0, 2)], n = R(2, 99); return Math.random() < 0.5 ? { t: `${n} · ${k}`, a: n * k } : { t: `${n * k} : ${k}`, a: n }; } },
    addsub: { icon: '➕', name: 'Сложение и вычитание в уме', gen: () => { const a = R(11, 99), b = R(11, 99); return Math.random() < 0.5 ? { t: `${a} + ${b}`, a: a + b } : { t: `${Math.max(a, b)} − ${Math.min(a, b)}`, a: Math.max(a, b) - Math.min(a, b) }; } },
    mixall: { icon: '🌀', name: 'Всё вперемешку', gen: () => MODES[['div', 'round', 'addsub'][R(0, 2)]].gen() },
  };
  const best = () => (S.drillBest = S.drillBest || {});
  SCREENS.drill = mode => {
    const M2 = MODES[mode]; if (!M2) return go('blitz');
    let score = 0, left = 60, cur = M2.gen(), buf = '', tid = null, over = false;
    app.innerHTML = `${topbar(M2.icon + ' ' + M2.name, 'blitz')}<div class="page"><div class="blitz-box center"><div class="pill big">⏱ <b id="dt">60</b> с · ✔ <b id="ds">0</b> · 🏆 ${best()[mode] || 0}</div><div class="ask-eq big-n"><span id="dq">${cur.t}</span> = <span class="inp" id="dv">?</span></div>${numpad(true)}</div></div>`;
    const draw = () => { $('#dq').textContent = cur.t; $('#dv').textContent = buf || '?'; };
    const end = () => {
      if (over) return; over = true; clearInterval(tid); keyHandler = null; const rec = score > (best()[mode] || 0); if (rec) best()[mode] = score; S.st.blitz.games++; markDay(1); save();
      award(Math.min(15, Math.ceil(score / 2)), score * 2); if (window.Coach) Coach.track('blitz', Math.min(1, score / 25)); if (score >= 25) awardGems(1, 'за молниеносные лапки!');
      $('.blitz-box').innerHTML = `<div class="big-emoji">${score >= 20 ? '🏆' : score >= 10 ? '🥈' : '🐾'}</div><h2>${esc(S.kid)}, верных ответов: ${score}!</h2>${rec ? '<div class="perfect">Новый рекорд! 🎉</div>' : ''}<div class="row-btns"><button class="btn big pink" id="dag">Ещё раз</button><button class="btn" data-go="blitz">Другие режимы</button></div>`;
      $('#dag').addEventListener('click', () => go('drill', mode)); SND.win();
    };
    bindPad(app, { digit: x => { if (over || buf.length >= 6) return; buf += x; draw(); if (+buf === cur.a) { score++; $('#ds').textContent = score; SND.ok(); buf = ''; cur = M2.gen(); draw(); } else if (buf.length >= String(cur.a).length && +buf !== cur.a) { SND.bad(); setTimeout(() => { buf = ''; draw(); }, 250); } }, back: () => { buf = buf.slice(0, -1); draw(); }, ok: () => { if (+buf !== cur.a && buf) { SND.bad(); buf = ''; draw(); } } });
    tid = setInterval(() => { left--; const t = $('#dt'); if (t) t.textContent = left; if (left <= 0) end(); }, 1000); cleanups.push(() => clearInterval(tid));
  };
  { const bl = SCREENS.blitz; SCREENS.blitz = arg => { bl(arg); const pg = $('.page', app); if (!pg) return; pg.insertAdjacentHTML('afterbegin', `<div class="drill-modes"><b>Режимы:</b> <button class="chip on">✖️ Таблица умножения</button>${Object.entries(MODES).map(([k, m]) => `<button class="chip" data-go="drill" data-arg="${k}">${m.icon} ${m.name}${best()[k] ? ' · 🏆 ' + best()[k] : ''}</button>`).join('')}</div>`); }; }

  /* ---------- Ошибки Енота: деление и сложение/вычитание ---------- */
  function bugQ() {
    if (Math.random() < 0.5) { // деление: одна неверная цифра частного или остатка
      const P = Column.genDiv(R(1, 3)), wrongQ = Math.random() < 0.6, q = P.q, r = P.r;
      let wq = q, wr = r; if (wrongQ) { const s = String(q).split(''), i = R(0, s.length - 1); s[i] = String((+s[i] + R(1, 8)) % 10); if (s[0] === '0' && s.length > 1) s[0] = '1'; wq = +s.join(''); if (wq === q) wq = q + 1; } else { wr = r + P.b > 0 && r < P.b - 1 ? r + 1 : Math.max(0, r - 1); if (wr === r) wr = r + P.b; }
      const ok = Math.random() < 0.3; const showQ = ok ? q : wq, showR = ok ? r : wr;
      return { type: 'one', q: `🦝 Енот разделил столбиком: <b>${P.a} : ${P.b} = ${showQ}${showR ? ` (ост. ${showR})` : ''}</b>. Он прав?`, a: ['Да, всё верно', 'Ошибка в частном', 'Ошибка в остатке'], c: ok ? 0 : wrongQ ? 1 : 2, why: `Проверка: ${P.b} · ${q}${r ? ' + ' + r : ''} = ${P.a}. Правильно: <b>${P.a} : ${P.b} = ${q}${r ? ` (ост. ${r})` : ''}</b>.${!ok && !wrongQ && showR >= P.b ? ' Остаток не может быть больше делителя!' : ''}` };
    }
    const op = Math.random() < 0.5 ? '+' : '-', P = Column.genAdd(R(1, 3), op), res = P.res, s = String(res).split(''), i = R(0, s.length - 1); s[i] = String((+s[i] + (Math.random() < 0.5 ? 1 : 9)) % 10); let w = +s.join(''); if (w === res || String(w).length < String(res).length - 0) w = res + (op === '+' ? 10 : -10);
    const ok = Math.random() < 0.3, show = ok ? res : w;
    return { type: 'tf', q: `🦝 Енот посчитал столбиком: <b>${P.a} ${op === '+' ? '+' : '−'} ${P.b} = ${show}</b>. Это верно?`, c: ok, why: `${op === '+' ? `Проверка вычитанием: ${res} − ${P.b} = ${P.a}` : `Проверка сложением: ${res} + ${P.b} = ${P.a}`}. Правильно: <b>${res}</b>.${ok ? '' : ' Енот забыл про запомненную единицу или «занятый» десяток!'}` };
  }
  SCREENS.bugs2 = () => {
    const N = 8; let k = 0, ok = 0;
    app.innerHTML = `${topbar('🦝 Ошибки Енота: деление и сложение', 'bugs')}<div class="page"><div class="g-dots">${Array.from({ length: N }, () => '<i></i>').join('')}</div>${helperHTML('b2bub')}<div id="b2q"></div></div>`;
    $('#b2bub').innerHTML = 'Енот снова хвастается! Проверь его вычисления — найди, где он ошибся.';
    const ask = () => { const q = bugQ(), T = ACAD_Q[q.type]; window.__aq = q; $('#b2q').innerHTML = T.render(q) + '<div id="b2w"></div>';
      T.bind($('#b2q'), q, (r, why) => { $$('.g-dots i')[k].className = r ? 'ok' : 'bad'; if (r) { ok++; SND.ok(); } else SND.bad(); taskDone('bug', { mistakes: r ? 0 : 1 }); award(r ? 2 : 0, r ? 8 : 2); $('#b2w').innerHTML = `<p>${why}</p><button class="btn big pink" id="b2n">${k + 1 < N ? 'Дальше →' : 'Итоги 🏆'}</button>`; $('#b2n').addEventListener('click', () => { k++; k < N ? ask() : fin(); }); }); };
    const fin = () => { if (ok === N) awardGems(1, 'за то, что поймал(а) все ошибки Енота'); SND.win(); $('#b2q').innerHTML = `<div class="center g-result"><div class="big-emoji">${ok === N ? '🏆' : '🦝'}</div><h2>${ok} из ${N}!</h2><div class="row-btns"><button class="btn big pink" id="b2a">Ещё</button><button class="btn" data-go="bugs">К ошибкам Енота</button></div></div>`; $('#b2a').addEventListener('click', () => go('bugs2')); };
    ask();
  };
  { const bg = SCREENS.bugs; SCREENS.bugs = arg => { bg(arg); const pg = $('.page', app); if (pg) pg.insertAdjacentHTML('afterbegin', '<button class="btn mint bugs2-link" data-go="bugs2">➗➕ Новые ошибки Енота: деление и сложение →</button>'); }; }
  ['drill', 'bugs2'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { MODES, bugQ };
})();
window.Drills = Drills;
