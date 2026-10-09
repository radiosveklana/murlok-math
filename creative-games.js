/* creative-games.js — игры креативного мышления: «Необычное применение», «Что будет, если…», «Соедини несоединимое»,
   «Кубики историй», «Дорисуй». Ответы открытые — правильных и неправильных нет: считаем идеи, хвалим за количество,
   разнообразие и необычность. Идеи сохраняются (S.ideas), родитель видит их в своём разделе. */
'use strict';
const Creative = (() => {
  const P = () => ((window.SUBJECTS || {}).creative || {}).prompts || {};
  const back = () => { const b = $('.back', app); b.dataset.go = 'subject'; b.dataset.arg = 'creative'; };
  const keep = (mode, prompt, items) => { S.ideas = S.ideas || []; S.ideas.unshift({ mode, prompt, items: items.slice(0, 30), d: today() }); S.ideas = S.ideas.slice(0, 60); S.agames = S.agames || {}; S.agames['cr_' + mode] = Math.min(1, ((S.agames['cr_' + mode] || 0) + 0.2)); save(); };
  const reward = (n, mode) => { const c = Math.min(12, n), xp = Math.min(40, n * 4); award(c, xp); if (n >= 10) awardGems(1, 'за целый фонтан идей!'); if (window.Coach) Coach.track('a:creative', Math.min(1, n / 8)); acadTask('creative', { mistakes: n >= 5 ? 0 : 1 }); SND.win(); if (n >= 8) confetti(30); };
  const MODES = { uses: '📎 Необычное применение', whatif: '🤔 Что будет, если…', combine: '🧩 Соедини несоединимое', story: '🎲 Кубики историй', draw: '✏️ Дорисуй' };

  /* ---------- общий экран «много идей за 2 минуты» ---------- */
  function ideaRound(mode, title, promptHTML, promptText, secs = 120) {
    const ideas = []; let left = secs, tid = null, over = false;
    app.innerHTML = `${topbar(MODES[mode], 'subject')}<div class="page idea"><div class="idea-prompt">${promptHTML}</div><div class="idea-bar"><span>💡 Идей: <b id="icnt">0</b></span><span>⏱ <b id="itime">${secs}</b> с</span></div>
      <div class="fr-add"><input id="iin" class="nmi" placeholder="Напиши идею и нажми ＋" maxlength="80" autocomplete="off"><button class="btn pink" id="iadd">＋</button></div>
      <div class="idea-list" id="ilist"></div><div class="row-btns" style="justify-content:center"><button class="btn mint" id="idone">✔ Готово</button></div><p class="small center">Тут нет неправильных ответов! Чем больше и необычнее идеи — тем лучше. Можно и смешные 😸</p></div>`;
    back(); cleanups.push(() => clearInterval(tid));
    const add = () => { if (over) return; const v = $('#iin').value.trim(); if (v.length < 2) return; if (ideas.some(x => x.toLowerCase() === v.toLowerCase())) { toast('Такая идея уже есть — придумай другую 🙂'); return; } ideas.push(v); $('#iin').value = ''; $('#icnt').textContent = ideas.length; $('#ilist').insertAdjacentHTML('afterbegin', `<div class="idea-it">💡 ${esc(v)}</div>`); SND.ok(); if (ideas.length % 3 === 0) say(pick(['Мур, отличная идея!', 'Ещё-ещё!', 'Вот это фантазия!'])); $('#iin').focus(); };
    $('#iadd').addEventListener('click', add); $('#iin').addEventListener('keydown', e => { if (e.key === 'Enter') add(); });
    const finish = () => {
      if (over) return; over = true; clearInterval(tid); keep(mode, promptText, ideas); reward(ideas.length, mode);
      $('.idea').innerHTML = `<div class="center g-result"><div class="big-emoji">${ideas.length >= 10 ? '🏆' : ideas.length >= 5 ? '🌟' : '💡'}</div><h2>${ideas.length} ${plural(ideas.length, 'идея', 'идеи', 'идей')}!</h2><p>${ideas.length >= 10 ? 'Настоящий фонтан идей! Учёные говорят: чем больше идей, тем больше среди них гениальных.' : ideas.length >= 5 ? 'Отлично! Попробуй в следующий раз придумать ещё больше — и самые неожиданные.' : 'Хорошее начало! Секрет — не останавливаться и записывать даже «глупые» идеи.'}</p><div class="idea-list">${ideas.map(x => `<div class="idea-it">💡 ${esc(x)}</div>`).join('')}</div><div class="row-btns"><button class="btn big pink" id="iag">Ещё задание</button><button class="btn" data-go="subject" data-arg="creative">К предмету</button></div></div>`;
      $('#iag').addEventListener('click', () => go('ideas', mode));
    };
    $('#idone').addEventListener('click', finish);
    tid = setInterval(() => { left--; const t = $('#itime'); if (t) t.textContent = left; if (left <= 0) finish(); }, 1000);
    $('#iin').focus();
  }
  SCREENS.ideas = mode => {
    const p = P();
    if (mode === 'uses' && p.uses && p.uses.length) { const o = pick(p.uses); return ideaRound('uses', 'uses', `<div class="big-emoji">${o.emoji}</div><h2>${o.obj}</h2><p>Придумай как можно больше <b>необычных</b> способов использовать этот предмет!</p>`, o.obj); }
    if (mode === 'whatif' && p.whatif && p.whatif.length) { const q = pick(p.whatif); return ideaRound('whatif', 'whatif', `<div class="big-emoji">🤔</div><h2>${q}</h2><p>Придумай как можно больше последствий — весёлых, полезных, неожиданных!</p>`, q); }
    if (mode === 'combine' && p.combine && p.combine.length) { const [x, y] = pick(p.combine); return ideaRound('combine', 'combine', `<div class="big-emoji">🧩</div><h2>${x} + ${y}</h2><p>Изобрети вещь, которая соединяет одно и другое. Чем она полезна? Придумай несколько вариантов и функций!</p>`, x + ' + ' + y); }
    if (mode === 'story') return storyDice();
    if (mode === 'draw') return drawGame();
    // меню
    app.innerHTML = `${topbar('💡 Игры с идеями', 'subject')}<div class="page"><p class="center">Тренируем фантазию! Здесь нет неправильных ответов — котик считает идеи и радуется самым необычным.</p><div class="rp-list">${Object.entries(MODES).map(([k, n]) => `<button class="rp-card" data-m="${k}"><span class="ri">${n.split(' ')[0]}</span><b>${n.slice(n.indexOf(' ') + 1)}</b><small>${(S.ideas || []).filter(x => x.mode === k).length ? 'сыграно: ' + (S.ideas || []).filter(x => x.mode === k).length : 'новое!'}</small></button>`).join('')}</div>
      ${(S.ideas || []).length ? `<h3>Мои идеи</h3><div class="idea-list">${S.ideas.slice(0, 10).map(x => `<div class="idea-it"><b>${esc(x.prompt)}</b><small>${x.items.length ? esc(x.items.slice(0, 4).join(' · ')) + (x.items.length > 4 ? '…' : '') : ''}</small></div>`).join('')}</div>` : ''}</div>`;
    back(); $$('[data-m]').forEach(b => b.addEventListener('click', () => { SND.tap(); go('ideas', b.dataset.m); }));
  };

  /* ---------- кубики историй ---------- */
  function storyDice() {
    const st = P().story || {}, nm = x => typeof x === 'string' ? x : ((x.emoji ? x.emoji + ' ' : '') + x.name);
    const roll = () => ({ hero: pick(st.heroes || ['Котик']), place: pick(st.places || ['Сладкоград']), item: pick(st.items || ['волшебная лупа']), problem: pick(st.problems || ['пропал торт']) });
    let r = roll();
    const draw = () => {
      app.innerHTML = `${topbar(MODES.story, 'subject')}<div class="page idea"><div class="dice-row">${[['🦸 Герой', r.hero], ['🗺️ Место', r.place], ['🪄 Предмет', r.item], ['⚡ Проблема', r.problem]].map(([l, v]) => `<div class="die"><small>${l}</small><b>${nm(v)}</b></div>`).join('')}</div>
        <div class="row-btns" style="justify-content:center"><button class="btn" id="sroll">🎲 Бросить кубики</button></div>
        <p class="small center">План истории: <b>герой → цель → препятствие → помощь → финал</b>. Напиши историю или расскажи её вслух маме или котику!</p>
        <textarea id="stext" class="story-in" maxlength="2000" placeholder="Жил-был…"></textarea><div class="row-btns" style="justify-content:center"><button class="btn mint" id="ssave">✔ Сохранить историю</button></div></div>`;
      back();
      $('#sroll').addEventListener('click', () => { r = roll(); M.sfx('bounce'); draw(); });
      $('#ssave').addEventListener('click', () => {
        const t = $('#stext').value.trim(), words = t.split(/\s+/).filter(Boolean).length; if (words < 15) { toast('Напиши хотя бы несколько предложений — 15 слов и больше 🙂'); return; }
        keep('story', [r.hero, r.place, r.item, r.problem].map(nm).join(' · '), [t]); reward(Math.min(12, Math.round(words / 10) + 3), 'story');
        app.querySelector('.idea').innerHTML = `<div class="center g-result"><div class="big-emoji">📖</div><h2>История готова!</h2><p>${words} ${plural(words, 'слово', 'слова', 'слов')}. Настоящий писатель! Прочитай её кому-нибудь вслух.</p><div class="story-show">${esc(t)}</div><div class="row-btns"><button class="btn big pink" id="sag">Новая история</button></div></div>`;
        $('#sag').addEventListener('click', () => go('ideas', 'story'));
      });
    };
    draw();
  }

  /* ---------- дорисуй ---------- */
  function drawGame() {
    const prompts = P().draw || ['Круг — что это может быть?'], q = pick(prompts);
    app.innerHTML = `${topbar(MODES.draw, 'subject')}<div class="page idea"><div class="idea-prompt"><h2>${q}</h2><p>Дорисуй пальцем и придумай название!</p></div>
      <canvas id="dcv" class="draw-cv" width="900" height="900"></canvas>
      <div class="draw-tools">${['#3B2A4A', '#FF5E92', '#3D8BFD', '#2FB37A', '#FFC93C', '#7B5CD6', '#FF8A3D'].map((c, i) => `<button class="dcol ${i ? '' : 'on'}" data-c="${c}" style="background:${c}"></button>`).join('')}<button class="btn sm" id="dclr">🧽</button></div>
      <div class="fr-add"><input id="dname" class="nmi" placeholder="Как называется рисунок?" maxlength="40" autocomplete="off"><button class="btn mint" id="dsave">✔ Готово</button></div></div>`;
    back();
    const cv = $('#dcv'), g = cv.getContext('2d'); let col = '#3B2A4A', drawing = false, strokes = 0;
    const base = () => { g.fillStyle = '#fff'; g.fillRect(0, 0, 900, 900); g.strokeStyle = '#B9C2D6'; g.lineWidth = 10; g.setLineDash([]); g.beginPath();
      if (/круг|кольц|овал/i.test(q)) g.arc(450, 450, 170, 0, Math.PI * 2); else if (/квадрат|прямоуг/i.test(q)) g.rect(300, 300, 300, 300); else if (/треуг/i.test(q)) { g.moveTo(450, 260); g.lineTo(640, 600); g.lineTo(260, 600); g.closePath(); } else if (/волн|линия|загогул/i.test(q)) { g.moveTo(150, 450); g.bezierCurveTo(300, 250, 600, 650, 750, 450); } else { g.arc(450, 450, 60, 0, Math.PI * 2); }
      g.stroke(); };
    base();
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 900, (e.clientY - r.top) / r.height * 900]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); drawing = true; strokes++; const [x, y] = pos(e); g.strokeStyle = col; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x, y); try { cv.setPointerCapture(e.pointerId); } catch (er) { } });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const [x, y] = pos(e); g.lineTo(x, y); g.stroke(); });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drawing = false; }));
    $$('.dcol').forEach(b => b.addEventListener('click', () => { col = b.dataset.c; $$('.dcol').forEach(x => x.classList.toggle('on', x === b)); }));
    $('#dclr').addEventListener('click', () => { base(); strokes = 0; });
    $('#dsave').addEventListener('click', () => {
      if (strokes < 3) { toast('Дорисуй ещё немножко 🙂'); return; }
      const name = $('#dname').value.trim() || 'Без названия'; keep('draw', q, [name]); reward(6, 'draw');
      g.fillStyle = '#3B2A4A'; g.font = '700 44px Nunito, sans-serif'; g.textAlign = 'center'; g.fillText('«' + name + '»', 450, 860, 820);
      cv.toBlob(b => { if (b && window.Photo) Photo.view(b, null, true); });
    });
  }

  /* ---------- подключение ---------- */
  const s = (window.SUBJECTS || {}).creative;
  if (s) s.extras = [{ id: 'ideas', icon: '💡', name: 'Игры с идеями', run: () => go('ideas'), badge: () => { const n = (S.ideas || []).length; return n ? 'сыграно: ' + n : ''; }, prog: () => { const a = S.agames || {}; return ['uses', 'whatif', 'combine', 'story', 'draw'].reduce((t, k) => t + (a['cr_' + k] || 0), 0) / 5; } }];
  { const par = SCREENS.parents; SCREENS.parents = arg => { par(arg); const pg = $('.page.parents', app), rs = pg && $('#reset', pg); if (!rs || !(S.ideas || []).length) return; rs.insertAdjacentHTML('beforebegin', `<div class="card"><h3>💡 Идеи и истории ребёнка</h3><p class="small">В «Креативном мышлении» нет правильных ответов — вот что придумал ребёнок. Можно обсудить и похвалить за самые необычные идеи!</p><div class="idea-list">${S.ideas.slice(0, 8).map(x => `<div class="idea-it"><b>${esc(x.prompt)}</b><small>${esc(x.items.join(' · ').slice(0, 300))}</small></div>`).join('')}</div></div>`); }; }
  if (!NO_FLOAT.includes('ideas')) NO_FLOAT.push('ideas');
  return { MODES };
})();
window.Creative = Creative;
