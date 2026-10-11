/* housefun.js — v31: «живые» вещи в домике котика.
   Телескоп → космическая аркада, бассейн → котик плавает, микрофон → котик поёт смешные песенки,
   и у каждой вещи в каждой комнате — своё действие: котик подходит, что-то делает (≤ 2–3 с), звучит звук, котик говорит фразу.
   house.js вызывает HouseFun.act(id, X), где X — набор помощников комнаты (catMoveTo, parts, bump…). */
'use strict';
const HouseFun = (() => {
  const pk = a => a[Math.floor(Math.random() * a.length)];
  const snd = f => { try { f(); } catch (e) { } };
  const C5 = 523.25, fq = s => C5 * Math.pow(2, s / 12);

  /* ---------- песенки котика: [название, строчки, мелодия] ---------- */
  const MEL = [
    [[0, 1], [0, 1], [7, 1], [7, 1], [9, 1], [9, 1], [7, 2], [5, 1], [5, 1], [4, 1], [4, 1], [2, 1], [2, 1], [0, 2]], // «звёздочка»
    [[0, 1], [9, 1], [9, 1], [7, 1], [9, 1], [5, 1], [0, 1], [0, 1], [0, 1], [9, 1], [9, 1], [10, 1], [7, 1], [12, 2]], // «ёлочка»
    [[0, 1], [2, 1], [4, 1], [5, 1], [7, 1], [9, 1], [11, 1], [12, 2], [7, 1], [4, 1], [0, 2]], // гамма туда-сюда
    [[0, 1], [4, 1], [7, 1], [4, 1], [0, 1], [4, 1], [7, 2], [5, 1], [9, 1], [12, 1], [9, 1], [7, 2]], // прыг-скок
    [[9, 1], [4, 1], [9, 1], [4, 1], [9, 1], [8, 1], [8, 2], [8, 1], [4, 1], [8, 1], [4, 1], [8, 1], [9, 1], [9, 2]], // «кузнечик»
    [[0, 1], [3, 1], [5, 1], [6, 1], [7, 2], [10, 1], [7, 1], [5, 1], [3, 1], [0, 2]], // джаз
  ];
  const SONGS = [
    ['Сметанный рок', ['Я котик-сыщик, мур-мур-мур,', 'люблю сметану и ажур!'], 3],
    ['Песенка про хвостик', ['Хвостик вправо, хвостик влево —', 'я танцую, как королева!'], 0],
    ['Таблица умножения', ['Дважды два — четыре мышки,', 'трижды три — девять пышек!'], 2],
    ['Конфетный блюз', ['Ой, конфетка-карамелька,', 'ты мой сладкий друг-неделька!'], 5],
    ['Детективная', ['Тише, тише, лапки, тише —', 'вор крадётся где-то в нише!', 'Лупа есть, усы на месте — раскроем дело вместе!'], 4],
    ['Мурлыкальная', ['Мур-мур-мур и мяу-мяу,', 'я пою, а ты подпевай-ка!'], 0],
    ['Песня про рыбку', ['Рыбка плавает в пруду,', 'я за ней сейчас приду!'], 3],
    ['Уравнение-икс', ['Икс плюс пять равно восьми —', 'икс равен трём, пойми!'], 2],
    ['Пончиковая', ['Пончик круглый, пончик сладкий,', 'съем его я без оглядки!'], 1],
    ['Песня сыщика', ['Где улика? Вот улика!', 'Отпечаток лапки — вот так шика!'], 4],
    ['Колыбельная клубку', ['Спи, клубочек, баю-бай,', 'нитки ночью не теряй!'], 0],
    ['Тортик-твист', ['Крем, бисквит и вишня сверху —', 'тортик к празднику, к успеху!'], 3],
    ['Песня про сосиску', ['Утащу сосиску в норку,', 'а потом спою про горку!'], 5],
    ['Считалочка', ['Раз, два, три, четыре, пять —', 'вышел котик погулять!'], 1],
    ['Космический мяу', ['Я лечу к далёкой звёздке,', 'в скафандре и в мармеладной соске!'], 2],
    ['Дроби', ['Половинка пиццы — мне,', 'половинка — тоже мне!'], 3],
    ['Мармеладная', ['Мармеладный червячок', 'прыгнул прямо мне в бочок!'], 4],
    ['Песня про лапки', ['Лапки мягкие, как вата,', 'обнимаю всех ребят я!'], 0],
    ['Умножайка', ['Пятью пять — двадцать пять,', 'будем вместе мы считать!'], 2],
    ['Сырная серенада', ['Ах, сырок, ты мой сырок,', 'в нём дырочек — целый мешок!'], 5],
  ];
  const BRAVO = ['Браво! Спасибо, спасибо!', 'Мур-р! Я звезда эстрады!', 'Хочешь, спою ещё?', 'Это был мой новый хит!', 'Аплодисменты котику!'];
  /* сыграть мелодию: тоны + «мяу» в такт. Возвращает длительность в мс */
  function melody(mi, o = {}) {
    const m = MEL[mi % MEL.length], beat = o.beat || 0.19, type = o.type || 'triangle', sh = o.shift || 0;
    let t = 0; const seq = [];
    m.forEach(([s, d], i) => {
      const f = fq(s + sh), dur = d * beat;
      seq.push([f, dur * 0.95, t, type, o.vol || 0.12]);
      if (o.bass && i % 2 === 0) seq.push([f / 4, dur * 1.6, t, 'sine', 0.1]);
      if (o.meow && (i % 2 === 0 || d > 1)) { const at = t; setTimeout(() => snd(() => M.meow({ pitch: f / 560, dur: Math.max(0.2, dur * 0.9), shape: 'normal', vol: 0.28, force: true })), at * 1000); }
      t += dur;
    });
    snd(() => M.tone(seq));
    return Math.round(t * 1000);
  }
  function nextSong() { const i = (S.houseSong || 0) % SONGS.length; S.houseSong = i + 1; save(); return SONGS[(i * 7) % SONGS.length]; }

  /* ---------- факты ---------- */
  const ISS = ['МКС облетает Землю за полтора часа — космонавты видят 16 рассветов в сутки!', 'В невесомости космонавты спят в спальных мешках, пристёгнутых к стене.', 'МКС летит со скоростью почти 8 километров в секунду — от Москвы до Питера за минуту!', 'На МКС воду для питья очищают снова и снова — даже из влаги воздуха.', 'МКС размером с футбольное поле — это самый большой дом в космосе.', 'Первым человеком в космосе был Юрий Гагарин — 12 апреля 1961 года.'];
  const FACTS0 = ['Осьминог имеет три сердца и голубую кровь.', 'Улитка может спать три года подряд.', 'Мёд не портится тысячи лет.', 'Котики спят до 16 часов в сутки — как я!', 'Самое длинное слово в русском языке — больше 30 букв!'];
  const clean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  function acadFact(sid) {
    try {
      const SB = window.SUBJECTS || {}, ids = sid && SB[sid] ? [sid] : Object.keys(SB).filter(k => (SB[k].units || []).length);
      for (let t = 0; t < 8 && ids.length; t++) {
        const sb = SB[pk(ids)], u = pk(sb.units || []), c = u && pk(u.cards || []); if (!c || !c.h) continue;
        let h = clean(c.h); const ss = h.match(/[^.!?]+[.!?]+/g) || [h]; h = ss.slice(0, 2).join(' ').trim(); if (h.length > 260) h = h.slice(0, 257) + '…';
        return { icon: sb.icon || '📚', sub: sb.name || '', title: clean(c.t).replace(/^Улика\s*№?\s*\d+\s*[:.]\s*/i, ''), text: h };
      }
    } catch (e) { }
    return { icon: '📚', sub: '', title: 'Интересный факт', text: pk(FACTS0) };
  }
  function factModal(f, more) {
    const m = modal(`<div class="big-emoji">${f.icon}</div><p class="small">${f.sub ? 'Академия · ' + f.sub : 'Знаешь ли ты?'}</p><h2>${f.title}</h2><p>${f.text}</p><div class="row-btns">${more ? '<button class="btn pink" id="hfMore">Ещё факт</button>' : ''}<button class="btn" data-close>Спасибо!</button></div>`);
    const mb = $('#hfMore', m.el); if (mb) mb.addEventListener('click', () => { m.close(); SND.tap(); factModal(more(), more); });
    return m;
  }
  /* ---------- Зал славы: лучшие достижения ребёнка ---------- */
  function fameModal() {
    const st = S.st || {}, perf = ['mul', 'eq', 'bug'].reduce((s, k) => s + ((st[k] || {}).perfect || 0), 0);
    const rows = [
      ['🧮', 'Решено задач', solvedTotal()], ['📦', 'Уравнений', (st.eq || {}).done || 0], ['🔍', 'Раскрыто дел', S.cases || 0], ['⭐', 'Без единой ошибки', perf],
      ['🏅', 'Наград', (S.badges || []).length], ['💎', 'Кристаллов добыто', S.gemsTotal || 0], ['⚡', 'Рекорд блица', (st.blitz || {}).best || 0],
      ['🌌', 'Созвездий найдено', (S.starsSeen || []).length], ['🚀', 'Планет в аркаде', Object.keys(((S.trip || {}).ar || {}).done || {}).length], ['📅', 'Дней с котиком', (S.login || {}).day || 0],
    ].filter(r => r[2] > 0).slice(0, 8);
    let rk = ''; try { rk = typeof rank === 'function' ? rank().name : ''; } catch (e) { }
    modal(`<div class="big-emoji">🏆</div><h2>Зал славы${S.kid ? ': ' + esc_(S.kid) : ''}</h2>${rk ? `<p>Звание: <b>${rk}</b></p>` : ''}${rows.length ? `<div class="hf-fame">${rows.map(r => `<div><span>${r[0]}</span><b>${r[2]}</b><small>${r[1]}</small></div>`).join('')}</div>` : '<p>Здесь будут твои победы. Реши первую задачу!</p>'}<button class="btn pink" data-close>Ура!</button>`);
  }
  const esc_ = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- маленькие эффекты ---------- */
  function addEl(X, cls, css, html = '') { const d = document.createElement('div'); d.className = cls; d.style.cssText = css; d.innerHTML = html; X.roomEl.appendChild(d); return d; }
  function snow(X, n = 16, ch = ['❄️', '❅', '❆']) { for (let i = 0; i < n; i++) { const d = addEl(X, 'hf-snow', `left:${Math.random() * 96}%;animation-delay:${(Math.random() * 0.9).toFixed(2)}s;font-size:calc(var(--u) * ${(2 + Math.random() * 2.5).toFixed(1)})`, pk(ch)); setTimeout(() => d.remove(), 3200); } }
  function light(X, x) { const d = addEl(X, 'hf-light', `--lx:${x}%`); setTimeout(() => d.remove(), 2100); }
  function glow(X, ms = 1800) { X.b.classList.add('hf-glow'); setTimeout(() => X.b.classList.remove('hf-glow'), ms); }
  const fanfare = () => snd(() => M.tone([[523, 0.14, 0, 'square', 0.07], [659, 0.14, 0.15, 'square', 0.07], [784, 0.14, 0.3, 'square', 0.07], [1047, 0.5, 0.45, 'square', 0.08], [784, 0.12, 0.45, 'triangle', 0.06]]));
  const twinkle = () => snd(() => M.tone([1568, 2093, 1760, 2637, 2349, 3136].map((f, i) => [f, 0.3, i * 0.13, 'sine', 0.06])));
  const beep = (fs, type = 'square') => snd(() => M.tone(fs.map((f, i) => [f, 0.12, i * 0.15, type, 0.07])));
  function sitOn(X, k = 0.3, scale = 0.9) { const { g } = X; return X.catMoveTo(g.x, g.y + g.h * k, g.z + 1, { scale }); }

  /* ---------- космос: телескоп → аркада, карта звёзд ---------- */
  async function telescope(X) {
    const c = X.catEl(), { g } = X;
    await X.catMoveTo(Math.max(6, Math.min(94, g.x + (g.x < 60 ? 1 : -1) * (g.w * 0.45 + 6))), Math.min(g.y, 20), g.z + 1);
    c.classList.add('peek'); twinkle(); X.parts(X.b, ['✨', '⭐', '🌟', '💫', '🪐'], 12, 170); X.say(pk(['Смотрю в телескоп… Вижу звёзды!', 'Ого, вон там кольца Сатурна!', 'Вижу ракету! Она ждёт меня!']), 2500, { silent: true });
    await X.wait(1400); c.classList.remove('peek');
    return space(X);
  }
  async function space(X) {
    const T = window.SpaceTrip;
    if (T && T.open() && T.tickets() > 0) {
      X.catFace({ happy: true }); X.say('Полетели в космос! Три, два, один — пуск! 🚀', 3000, { silent: true }); snd(() => M.sfx('whoosh')); X.parts(X.catEl(), ['🚀', '🔥', '✨'], 8, 120);
      await X.wait(1200); if (curScreen === 'house') go('spacetrip'); return { noLine: 1, noBack: 1 };
    }
    const why = !T ? 'Ракета ещё в ремонте.' : !T.open() ? `Ракета ещё строится! Реши ещё ${T.NEED - solvedTotal()} ${plural(T.NEED - solvedTotal(), 'задачу', 'задачи', 'задач')} — и полетим в космос.` : `Для полёта нужен космический билет 🎫 — реши ещё ${T.toNext()} ${plural(T.toNext(), 'задачу', 'задачи', 'задач')}!`;
    X.catFace({ happy: true }); X.say(why + ' А пока посмотрим на звёзды?', 5000);
    setTimeout(() => {
      if (curScreen !== 'house' || $('.modal')) return;
      const m = modal(`<div class="big-emoji">🔭🚀</div><h2>Космическое путешествие</h2><p>${why}</p><div class="row-btns"><button class="btn pink" id="hfSky">🌌 Карта звёзд</button>${T && T.open() ? '<button class="btn" id="hfTrip">🚀 Аркада</button>' : ''}<button class="btn" data-close>Потом</button></div>`);
      $('#hfSky', m.el).addEventListener('click', () => { m.close(); go('starmap', 'house'); });
      const tb = $('#hfTrip', m.el); if (tb) tb.addEventListener('click', () => { m.close(); go('spacetrip'); });
    }, 900);
    return { noLine: 1 };
  }
  async function skymap(X) {
    const c = X.catEl(); await X.near(); c.classList.add('peek'); twinkle(); X.parts(X.b, ['✨', '⭐', '🌟'], 9, 150);
    await X.wait(850); c.classList.remove('peek'); if (curScreen === 'house' && !$('.modal')) go('starmap', 'house'); return { noLine: 1, noBack: 1 };
  }

  /* ---------- бассейн: котик плавает ---------- */
  async function swim(X) {
    const { g } = X, c = X.catEl(), wy = g.y + g.h * 0.2, W = Math.max(14, g.w * 0.95);
    const water = addEl(X, 'hf-water', `left:${g.x}%;bottom:${wy}%;width:${W}%;z-index:${g.z + 3}`);
    let iv = 0;
    try {
      await X.catMoveTo(g.x - W * 0.28, wy + 3, g.z + 2, { scale: 0.8 });
      c.classList.add('swimming'); c.style.bottom = (wy - 1) + '%'; snd(() => M.sfx('splash')); X.parts(water, ['💦', '💧', '💦'], 9, 170);
      const rip = () => { const r = document.createElement('i'); r.className = 'hf-ripple'; r.style.left = (parseFloat(c.style.left) - (g.x - W / 2)) / W * 100 + '%'; water.appendChild(r); setTimeout(() => r.remove(), 1200); };
      rip(); iv = setInterval(() => { rip(); snd(() => M.tone([[300 + Math.random() * 200, 0.08, 0, 'sine', 0.08, 700]])); }, 380);
      for (const dx of [0.28, -0.12]) { c.style.left = (g.x + W * dx) + '%'; c.classList.toggle('flip', dx < 0); await X.wait(780); }
      clearInterval(iv); iv = 0; c.classList.remove('swimming', 'flip'); snd(() => M.sfx('splash'));
      await X.catMoveTo(Math.min(94, g.x + W / 2 + 8), g.y, g.z + 1, { scale: 1 });
      water.remove(); X.anim(c, 'shaking', 600); X.parts(c, ['💧', '💦'], 8, 160); await X.wait(600);
      X.bump('fun', 20); X.bump('clean', 35);
      return { line: pk(['Бултых! Я плаваю, как рыбка!', 'Вода тёплая-тёплая! Мур!', 'Смотри, я плыву кролем!', 'Буль-буль! Я котик-водолаз!']) };
    } finally { if (iv) clearInterval(iv); water.remove(); c.classList.remove('swimming'); }
  }

  /* ---------- музыка ---------- */
  async function sing(X) {
    const c = X.catEl(); await X.near(); const s = nextSong();
    X.catFace({ happy: true }); c.classList.add('singing');
    const dur = melody(s[2], { meow: true, bass: true }), n = s[1].length;
    s[1].forEach((ln, i) => setTimeout(() => X.say(`${i ? '' : `🎤 «${s[0]}» — `}🎵 ${ln}`, Math.max(2200, dur / n + 600), { silent: true }), i * dur / n));
    const iv = setInterval(() => X.parts(c, ['🎵', '🎶', '♪', '🎤'], 2, 130), 420);
    try { await X.wait(dur + 200); } finally { clearInterval(iv); c.classList.remove('singing'); }
    X.anim(c, 'm-happy', 700); X.parts(c, ['👏', '💖', '⭐'], 6, 150); X.bump('fun', 10); await X.wait(700);
    return { line: pk(BRAVO) };
  }
  const play = (o, chars = ['🎵', '🎶']) => async X => { const c = X.catEl(); await X.near(); c.classList.add('playing'); const d = melody(Math.floor(Math.random() * MEL.length), o); const iv = setInterval(() => X.parts(X.b, chars, 2, 110), 450); await X.wait(Math.min(d, 2600)); clearInterval(iv); c.classList.remove('playing'); X.bump('fun', 5); };
  async function disco(X) { const c = X.catEl(); await X.near(); c.classList.add('singing'); glow(X, 2400); X.b.classList.add('spinning'); light(X, X.g.x); snd(() => M.sfx('drum')); melody(3, { type: 'square', vol: 0.06, beat: 0.16 }); X.parts(X.b, ['✨', '💜', '💙', '💖'], 12, 200); await X.wait(2300); X.b.classList.remove('spinning'); c.classList.remove('singing'); X.bump('fun', 8); }

  /* ---------- общие действия ---------- */
  const rest = (k = 0.3, rock) => async X => { await sitOn(X, k, 0.85); X.catFace({ happy: true }); if (rock) { X.b.classList.add('rocking'); X.catEl().classList.add('rocking'); } snd(() => M.purr(2)); X.parts(X.catEl(), ['💤', '💗'], 4, 90); await X.wait(2000); X.b.classList.remove('rocking'); X.bump('energy', 6); };
  const hug = async X => { await X.near(); X.anim(X.catEl(), 'm-happy', 700); snd(() => M.purr(1.5)); hearts(X.catEl(), 4); await X.wait(1300); X.bump('fun', 6); };
  const sniff = (chars = ['🌸', '🦋', '🌼']) => async X => { await X.near(); X.anim(X.catEl(), 'm-happy', 600); X.parts(X.b, chars, 7, 120); await X.wait(900); if (Math.random() < 0.5) { snd(() => M.tone([[900, 0.08, 0, 'sine', 0.12, 1400], [500, 0.25, 0.12, 'triangle', 0.14, 220]])); X.say('Апчхи! Ой, пыльца!', 1800, { silent: true }); } await X.wait(700); };
  const glide = async X => { const { g, b } = X, c = X.catEl(), to = g.x < 50 ? 82 : 18; await X.catMoveTo(g.x, g.y + g.h * 0.25, g.z + 1); c.classList.add('skating'); b.style.transition = 'left 1.4s ease-in-out'; b.style.left = to + '%'; c.style.left = to + '%'; snd(() => M.sfx('whoosh')); X.parts(c, ['💨', '✨'], 5, 80); await X.wait(1450); b.style.transition = ''; c.classList.remove('skating'); const p = X.place.find(q => q.id === X.id); if (p) { p.x = to; save(); } X.bump('fun', 8); };
  const sound = (fn, chars, cls = 'boing', ms = 1200) => async X => { X.anim(X.b, cls, 900); fn(X); if (chars) X.parts(X.b, chars, 8, 130); await X.wait(ms); };
  const factAct = (sid, chars = ['📖', '✨', '💡']) => async X => { await X.near(); X.catEl().classList.add('peek'); X.parts(X.b, chars, 6, 110); snd(() => M.tone([[700, 0.1, 0, 'sine', 0.08, 1100], [900, 0.1, 0.25, 'sine', 0.08, 1300]])); await X.wait(1000); X.catEl().classList.remove('peek'); const more = () => acadFact(sid); setTimeout(() => { if (curScreen === 'house' && !$('.modal')) factModal(more(), more); }, 500); return { line: pk(['Вот что я вычитал!', 'Сейчас расскажу интересное!', 'Мур! Слушай факт!']) }; };
  const fameAct = async X => { await X.near(); glow(X); fanfare(); X.parts(X.b, ['🏆', '⭐', '✨'], 10, 160); await X.wait(1200); setTimeout(() => { if (curScreen === 'house' && !$('.modal')) fameModal(); }, 300); return { line: pk(['Смотри, сколько у тебя побед!', 'Это всё — твои достижения!', 'Ты настоящая звезда!']) }; };

  const ACT = {
    // космос
    fx_scope: telescope, fx_tscope: telescope, telescope2: telescope, scope: telescope,
    fx_starmap: skymap, galaxy: skymap,
    fx_window: async X => { await X.near(); X.catEl().classList.add('peek'); twinkle(); X.parts(X.b, ['🌍', '✨', '🛰️'], 7, 140); await X.wait(1200); X.catEl().classList.remove('peek'); const f = pk(ISS); setTimeout(() => { if (curScreen !== 'house' || $('.modal')) return; const m = modal(`<div class="big-emoji">🛰️🌍</div><p class="small">Знаешь ли ты?</p><h2>Вид из иллюминатора</h2><p>${f}</p><div class="row-btns"><button class="btn pink" id="hfSky">🌌 Звёздное небо</button><button class="btn" data-close>Здорово!</button></div>`); $('#hfSky', m.el).addEventListener('click', () => { m.close(); go('starmap', 'house'); }); }, 400); return { line: 'Смотри, Земля такая красивая!' }; },
    fx_panel: async X => { await X.near(); const c = X.catEl(); c.classList.add('playing'); for (const n of ['3', '2', '1']) { X.say(`${n}…`, 900, { silent: true }); beep([n === '1' ? 880 : 660]); await X.wait(550); } c.classList.remove('playing'); X.say('Пуск! 🚀', 1500, { silent: true }); snd(() => M.sfx('whoosh')); X.parts(X.b, ['🚀', '🔥', '💨', '✨'], 10, 160); await X.wait(700); return space(X); },
    // бассейн
    fx_pool: swim,
    fx_ring: async X => { await X.near(); X.anim(X.b, 'floaty', 1800); snd(() => M.sfx('splash')); X.parts(X.b, ['💦', '💧', '🛟'], 8, 140); X.anim(X.catEl(), 'm-happy', 700); await X.wait(1300); X.bump('fun', 6); },
    // музыка
    fx_mic: sing,
    fx_notes: async X => { X.b.classList.add('hf-glow'); const d = melody(2, { type: 'sine', vol: 0.12 }); const iv = setInterval(() => X.parts(X.b, ['🎵', '🎶', '♪'], 2, 140), 350); await X.wait(Math.min(d, 2400)); clearInterval(iv); X.b.classList.remove('hf-glow'); },
    piano: play({ type: 'triangle', bass: true }), harp: play({ type: 'sine', beat: 0.14, shift: 12 }, ['🎵', '✨']), violin: play({ type: 'sawtooth', vol: 0.05, beat: 0.22 }, ['🎻', '🎵']), sax: play({ type: 'square', vol: 0.06, shift: -12 }, ['🎷', '🎶']),
    disco, mirrorball: disco,
    // гостиная, свет
    fx_lamp: async X => { light(X, X.g.x); glow(X); snd(() => M.tone([[1200, 0.04, 0, 'square', 0.08], [1800, 0.05, 0.05, 'square', 0.06]])); X.catFace({ happy: true }); X.anim(X.catEl(), 'm-happy', 600); await X.wait(1500); },
    chandelier: async X => { light(X, X.g.x); glow(X); twinkle(); await X.wait(1500); },
    lights: async X => { glow(X, 2000); twinkle(); X.parts(X.b, ['✨', '💡', '⭐'], 8, 150); await X.wait(1500); },
    lantern: async X => { glow(X, 2000); X.parts(X.b, ['✨', '🌟'], 5, 90); snd(() => M.trill()); await X.wait(1300); },
    lighthouse: async X => { glow(X, 2200); light(X, X.g.x); snd(() => M.tone([[220, 0.8, 0, 'sine', 0.12], [220, 0.8, 1, 'sine', 0.12]])); await X.wait(1800); },
    fireplace: async X => { await X.near(); X.catFace({ happy: true }); snd(() => { M.sfx('fire'); M.purr(2); }); X.parts(X.b, ['🔥', '✨'], 8, 90); await X.wait(1900); X.bump('energy', 5); },
    clock: async X => { snd(() => M.tone([0, 1, 2, 3].map(i => [i % 2 ? 1800 : 1400, 0.03, i * 0.45, 'square', 0.08]))); X.anim(X.b, 'boing', 600); await X.wait(1600); const d = new Date(); return { line: `Тик-так! Сейчас ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} — отличное время решать примеры!` }; },
    // мебель для отдыха
    lamp2: rest(0.3), rug: rest(0.05), beanbag: rest(0.3), chair: rest(0.35), armchair: rest(0.35), sofa2: rest(0.3), hammock: rest(0.4, true),
    catwheel: async X => { const { g } = X, c = X.catEl(); await X.catMoveTo(g.x, g.y + g.h * 0.08, g.z + 1, { scale: 0.75 }); X.b.classList.add('spinning'); c.classList.add('walking'); snd(() => M.tone([0, 1, 2, 3, 4, 5].map(i => [160, 0.05, i * 0.3, 'sine', 0.1, 80]))); await X.wait(2000); X.b.classList.remove('spinning'); c.classList.remove('walking'); X.bump('fun', 12); },
    pic: async X => { await X.near(); X.catEl().classList.add('peek'); hearts(X.catEl(), 3); await X.wait(1300); X.catEl().classList.remove('peek'); },
    vase: sniff(['🌸', '🌷']), plant: sniff(['🌿', '🍃']),
    bookcase: factAct(), books: factAct(), fx_shelf: factAct(), magicbook: factAct(null, ['📕', '✨', '🪄']), spellbook: factAct(null, ['📖', '✨', '🪄']),
    fx_globe: async X => { X.b.classList.add('spinning'); snd(() => M.sfx('whoosh')); await X.wait(900); X.b.classList.remove('spinning'); return factAct('world', ['🌍', '🗺️', '✨'])(X); },
    trophy: fameAct, fx_cup: fameAct, fx_stars: fameAct, statue: fameAct, goldcat: fameAct,
    // ванная
    fx_duck: sound(() => snd(() => M.tone([[1400, 0.12, 0, 'square', 0.08, 900], [1500, 0.12, 0.2, 'square', 0.08, 950]])), ['🫧', '🦆', '💦'], 'hop'),
    fx_soap: async X => { X.anim(X.b, 'boing', 600); snd(() => M.sfx('bubbles')); X.parts(X.b, ['🫧', '🫧', '🫧', '✨'], 14, 220); await X.wait(1300); },
    bubbles: async X => { await X.near(); snd(() => M.sfx('bubbles')); X.parts(X.b, ['🫧', '🫧', '✨'], 14, 220); X.anim(X.catEl(), 'm-happy', 700); await X.wait(1400); X.bump('fun', 6); },
    // кабинет сыщика
    fx_map: async X => { await X.near(); X.catEl().classList.add('peek'); X.parts(X.b, ['🔍', '❓', '👣'], 7, 140); snd(() => M.sfx('mystery')); await X.wait(1500); X.catEl().classList.remove('peek'); return { line: pk(['Вот Сладкоград. Где же спрятался вор?', 'Следы ведут к кондитерской!', 'Отметим на карте новую улику!']) }; },
    fx_desk: async X => { await X.near(); X.parts(X.b, ['📁', '🗂️', '🔍'], 6, 120); snd(() => M.sfx('pop')); await X.wait(1200); return { line: S.cases ? `Здесь все наши раскрытые дела — уже ${S.cases}!` : 'Картотека пока пустая — раскроем первое дело?' }; },
    detectiveboard: async X => { await X.near(); X.catEl().classList.add('peek'); snd(() => M.sfx('mystery')); X.parts(X.b, ['📌', '🧵', '❓'], 7, 140); await X.wait(1500); X.catEl().classList.remove('peek'); return { line: `Красная ниточка ведёт к разгадке! Раскрыто дел: ${S.cases || 0}.` }; },
    fingerprint: async X => { await X.near(); X.parts(X.b, ['🔍', '🐾'], 7, 120); snd(() => M.sfx('shutter')); await X.wait(1200); },
    walkie: sound(() => beep([1200, 900, 1200]), ['📡', '💬'], 'boing', 1300),
    safe2: async X => { await X.near(); beep([300, 400, 500], 'sine'); await X.wait(600); snd(() => M.sfx('pop')); X.parts(X.b, ['✨', '🔐', '💰'], 7, 120); await X.wait(900); },
    // сад и природа
    fx_house: async X => { const { g } = X, c = X.catEl(); await X.catMoveTo(g.x, g.y + g.h * 0.08, g.z - 1, { scale: 0.6 }); X.catFace({ happy: true }); snd(() => M.purr(2)); X.parts(X.b, ['💤', '🏡'], 4, 80); await X.wait(1800); X.bump('energy', 6); return { line: pk(['Это мой летний домик! Тут уютно.', 'Я спрятался! Найдёшь меня?']) }; },
    fx_tulip: sniff(['🌷', '🦋', '🌸']), sunflower: sniff(['🌻', '🐝']), rainbowtree: sniff(['🌸', '🌸', '🦋']), palm: sniff(['🥥', '🌴']), cactus: async X => { await X.near(); X.anim(X.catEl(), 'shaking', 500); snd(() => M.meow({ shape: 'question' })); await X.wait(900); return { line: 'Ой, колючий! Я лучше посмотрю издалека.' }; }, mushroom: sniff(['🍄', '✨']), pond: sniff(['🐸', '🪷', '💧']),
    // каток и зима
    fx_skates: async X => { const c = X.catEl(), { g } = X; await X.catMoveTo(g.x, Math.min(g.y + 2, 18), g.z + 1); c.classList.add('skating'); snd(() => M.sfx('whoosh')); snow(X, 8, ['❄️', '✨']); for (const [x, y] of [[80, 14], [55, 22], [22, 10]]) { c.style.left = x + '%'; c.style.bottom = y + '%'; c.classList.toggle('flip', x < 50); X.parts(c, ['❄️', '✨'], 2, 60); await X.wait(720); } c.classList.remove('skating', 'flip'); X.bump('fun', 15); return { line: pk(['Вжух! Кручу двойной кошачий тулуп!', 'Я фигурист! Смотри, как кружусь!', 'Скольжу, как по маслу!']) }; },
    fx_flake: async X => { snow(X, 22); twinkle(); X.anim(X.catEl(), 'm-happy', 700); await X.wait(1600); },
    snowglobe: async X => { X.b.classList.add('rocking'); snow(X, 14); snd(() => M.sfx('magic')); await X.wait(1500); X.b.classList.remove('rocking'); },
    skis: glide, sled: glide, skate: glide, scooter: glide, racecar: glide, surf: rest(0.3, true),
    igloo: async X => { const { g } = X; await X.catMoveTo(g.x, g.y + g.h * 0.05, g.z - 1, { scale: 0.6 }); snow(X, 8); await X.wait(1500); },
    penguin: sound(() => snd(() => M.chirp()), ['❄️', '🐟'], 'hop'),
    scarfrack: async X => { await X.near(); X.catEl().classList.add('flip'); X.parts(X.catEl(), ['🧣', '✨'], 4, 80); await X.wait(1300); X.catEl().classList.remove('flip'); },
    // фабрика
    fx_mixer: async X => { await X.near(); X.b.classList.add('rocking'); snd(() => M.tone([0, 1, 2, 3, 4, 5, 6].map(i => [180 + (i % 2) * 40, 0.15, i * 0.2, 'sawtooth', 0.04]))); X.parts(X.b, ['🍰', '🎂', '🧁', '🍓'], 10, 150); await X.wait(1600); X.b.classList.remove('rocking'); return { line: pk(['Мешаем крем — получится торт!', 'Тортик готов! Кому кусочек?', 'Ванильно-шоколадный — мой любимый!']) }; },
    fx_belt: async X => {
      const { g } = X; await X.near(); const n = 5; snd(() => M.sfx('chug'));
      for (let i = 0; i < n; i++) { const d = addEl(X, 'hf-candy', `left:${g.x - g.w * 0.45}%;bottom:${g.y + g.h * 0.55}%;z-index:${g.z + 3}`, pk(['🍬', '🍭', '🍫', '🍡'])); setTimeout(() => { d.style.left = (g.x + g.w * 0.45) + '%'; }, 40 + i * 260); setTimeout(() => d.remove(), 1500 + i * 260); }
      await X.wait(1800);
      const F = S.factory && S.factory.d === today() ? S.factory : (S.factory = { d: today(), n: 0 });
      if (F.n < 5) { F.n++; S.candies++; S.totalCandies = (S.totalCandies || 0) + 1; save(); updCandy(); snd(() => M.sfx('pop')); toast('<span class="tb">🍬</span><div>Конвейер выдал конфетку: <b>+1 🍬</b></div>'); return { line: F.n === 5 ? 'Последняя конфетка на сегодня! Завтра конвейер сделает новые.' : 'Конфетка едет прямо ко мне! Держи, это тебе!' }; }
      return { line: 'На сегодня конфетки закончились — завтра конвейер сделает новые!' };
    },
    // тронный зал
    fx_throne: async X => { await sitOn(X, 0.32, 0.85); const c = X.catEl(); X.catFace({ happy: true }); const cr = document.createElement('div'); cr.className = 'hf-crown'; cr.textContent = '👑'; c.appendChild(cr); fanfare(); X.parts(c, ['✨', '⭐', '💛'], 10, 150); await X.wait(2100); cr.remove(); return { line: pk(['Его величество Котик-сыщик!', 'Объявляю сегодня днём пятёрок!', 'Королевский указ: всем по конфетке!']) }; },
    fx_banner: async X => { X.b.classList.add('rocking'); fanfare(); X.parts(X.b, ['✨', '⭐'], 6, 110); await X.wait(1400); X.b.classList.remove('rocking'); },
    // игрушки
    slide: async X => { const { g } = X, c = X.catEl(); await X.catMoveTo(g.x - g.w * 0.3, g.y + g.h * 0.75, g.z + 1, { scale: 0.85 }); c.classList.add('skating'); c.style.left = (g.x + g.w * 0.4) + '%'; c.style.bottom = g.y + '%'; snd(() => M.tone([[900, 0.7, 0, 'sine', 0.12, 250]])); await X.wait(800); c.classList.remove('skating'); X.bump('fun', 10); },
    trampoline: async X => { await sitOn(X, 0.45, 0.85); const c = X.catEl(); c.classList.add('playing'); snd(() => M.sfx('bounce')); await X.wait(1800); c.classList.remove('playing'); X.bump('fun', 10); },
    swing: rest(0.3, true),
    blocks: sound(X => { snd(() => M.tone([0, 1, 2, 3].map(i => [300 + i * 80, 0.06, i * 0.2, 'square', 0.08]))); }, ['🧱', '🏰']),
    puzzle: sound(() => snd(() => M.sfx('pop')), ['🧩', '✨']), lego: sound(() => snd(() => M.tone([0, 1, 2].map(i => [600, 0.05, i * 0.18, 'square', 0.08]))), ['🧱', '🔧']),
    robot: async X => { X.b.classList.add('rocking'); beep([440, 660, 550, 880]); X.parts(X.b, ['⚙️', '💡', '🤖'], 6, 120); await X.wait(1400); X.b.classList.remove('rocking'); return { line: 'Бип-буп! Робот говорит: дважды два — четыре!' }; },
    console: async X => { await X.near(); beep([523, 659, 784, 1047, 784, 1047]); X.catEl().classList.add('playing'); X.parts(X.b, ['👾', '⭐', '🕹️'], 7, 130); await X.wait(1500); X.catEl().classList.remove('playing'); X.bump('fun', 8); },
    dino: sound(() => snd(() => M.tone([[110, 0.7, 0, 'sawtooth', 0.1, 70]])), ['🦖', '💥'], 'boing', 1100),
    yoyo: sound(() => snd(() => M.sfx('boing')), ['🪀'], 'floaty', 1400),
    teddy: hug, plush: hug, rainbowfox: hug, panda: hug,
    // питомцы
    kitten: sound(() => snd(() => M.kitten()), ['💕', '🐾'], 'hop'), puppy: sound(() => snd(() => M.tone([[500, 0.1, 0, 'sawtooth', 0.08, 300], [500, 0.1, 0.25, 'sawtooth', 0.08, 300]])), ['🐾', '💕'], 'hop'),
    owlet: sound(() => snd(() => M.tone([[400, 0.25, 0, 'sine', 0.12, 350], [380, 0.4, 0.35, 'sine', 0.12, 300]])), ['🌙', '📚'], 'hop'), owl: null,
    piggy: sound(() => snd(() => M.tone([[300, 0.12, 0, 'sawtooth', 0.07, 200], [320, 0.12, 0.18, 'sawtooth', 0.07, 210]])), ['🪙', '💕'], 'hop'),
    hedgehog: sound(() => snd(() => M.tone([0, 1, 2].map(i => [2200, 0.04, i * 0.12, 'square', 0.04]))), ['🍎', '🍂'], 'hop'),
    crab: async X => { const p0 = X.b.style.left; X.b.style.transition = 'left .4s'; for (const d of [6, -6, 0]) { X.b.style.left = (X.g.x + d) + '%'; snd(() => M.tone([[1500, 0.03, 0, 'square', 0.05]])); await X.wait(420); } X.b.style.transition = ''; X.b.style.left = p0; },
    shell: async X => { await X.near(); X.catEl().classList.add('peek'); snd(() => M.sfx('whoosh')); await X.wait(1400); X.catEl().classList.remove('peek'); return { line: 'Шшш… Я слышу море!' }; },
    aquarium2: async X => { await X.near(); snd(() => M.sfx('bubbles')); X.parts(X.b, ['🫧', '🐠', '🐟'], 7, 120); snd(() => M.trill()); await X.wait(1500); },
    // волшебство и космос
    wand: sound(() => snd(() => M.sfx('magic')), ['✨', '🪄', '⭐', '💫'], 'boing', 1200),
    magichat: async X => { X.anim(X.b, 'boing', 600); snd(() => M.sfx('magic')); X.parts(X.b, ['🐰', '✨', '🕊️'], 6, 120); await X.wait(1200); },
    potion: sound(() => snd(() => M.sfx('bubbles')), ['🫧', '💜', '💚', '✨'], 'rocking', 1300),
    comet: sound(() => snd(() => M.sfx('whoosh')), ['☄️', '✨', '⭐'], 'floaty', 1400), comet2: null,
    astronaut: async X => { await X.near(); X.anim(X.catEl(), 'm-happy', 700); snd(() => M.sfx('magic')); X.parts(X.catEl(), ['⭐', '🪐', '✨'], 6, 120); await X.wait(1600); },
    satellite: sound(() => beep([1000, 1300, 1000, 1300], 'sine'), ['📡', '✨'], 'floaty', 1400),
    confetti: async X => { snd(() => M.sfx('pop')); confetti(25); await X.wait(900); },
    partyhat: async X => { await X.near(); fanfare(); confetti(15); X.anim(X.catEl(), 'm-happy', 700); await X.wait(1200); X.bump('fun', 6); },
    balloonarch: sound(() => snd(() => M.sfx('boing')), ['🎈', '🎉'], 'floaty', 1400), garland: sound(() => snd(() => M.trill()), ['🎏', '✨'], 'rocking', 1200),
  };
  ACT.owl = ACT.owlet; ACT.comet2 = ACT.comet;
  // вещи, которые в house.js уже умеют своё (пианино/гитара/барабан и т.д.), остаются там; здесь — только перечисленные выше
  const has = id => !!ACT[id];
  async function act(id, X) { return (await ACT[id](X)) || {}; }
  return { has, act, SONGS, MEL, melody, acadFact, fameModal, ACT };
})();
window.HouseFun = HouseFun;
