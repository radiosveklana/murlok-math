/* family.js (v30) — семья и друзья: «Успехи» (таблица недели), «Вызовы» (дуэли на одном и том же задании) и «Челленджи».
   Безопасность: всё только для детей из кабинета семьи; видны только имя, котик и наряд; никакой переписки —
   только готовые игры, шаблоны челленджей и награды. Сервер — /acc/social, /acc/duel, /acc/chal (токен ребёнка),
   /acc/fam/* (токен взрослого). Одинаковое задание у обоих игроков — через общее «зерно» случайности (withSeed). */
'use strict';
const Family = (() => {
  const kidTok = () => { const c = window.Accounts && Accounts.child(); return c && c.token; };
  const api = (p, body) => Accounts.api(p, body, kidTok());
  const papi = (p, body) => Accounts.api(p, body, (Accounts.parent() || {}).token);
  const linked = () => !!(window.Accounts && Accounts.linked());
  const girl = n => /[аяь]$/i.test(n || '');
  const furSafe = f => (FURS[f] ? f : 'ginger');
  const ava = (p, cls = '') => `<span class="fm-ava ${cls}">${catSVG({ fur: furSafe(p.fur), wear: p.wear || {}, smile: true })}</span>`;

  /* ---------- одинаковая случайность для обоих игроков ---------- */
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function withSeed(seed, fn) { if (seed == null) return fn(); const orig = Math.random, prev = withSeed.run; Math.random = rng(seed); withSeed.run = {}; try { return fn(); } finally { Math.random = orig; withSeed.run = prev; } } // без зерна — обычный Math.random; withSeed.run — своя «память без повторов» на один прогон (генераторы не смотрят в общую историю, иначе у двух игроков разные задания)
  window.withSeed = withSeed;

  /* ---------- учёт за день: опыт и задания Академии (для таблицы недели и челленджей) ---------- */
  const day = () => { S.daily = S.daily || {}; const t = today(); if (!S.daily[t]) { S.daily[t] = { x: 0, t: 0, a: 0 }; const keys = Object.keys(S.daily).sort(); keys.slice(0, -35).forEach(k => delete S.daily[k]); } return S.daily[t]; };
  { const aw = award; award = function (c, xp) { try { if (+xp > 0) day().x += +xp; } catch (e) { } return aw.apply(this, arguments); }; }
  { const td = taskDone; taskDone = function (kind, res, meta) { try { const d = day(); d.t++; if (meta && meta.academy) d.a++; } catch (e) { } return td.apply(this, arguments); }; }

  /* ---------- игры для вызовов ---------- */
  const GAMES = { schulte4: { icon: '🔢', name: 'Таблица Шульте 4×4', short: 'Шульте 4×4' }, schulte5: { icon: '🔢', name: 'Таблица Шульте 5×5', short: 'Шульте 5×5' }, paws: { icon: '⚡', name: 'Быстрые лапки: умножение за 60 секунд', short: 'Быстрые лапки' }, topic: { icon: '🎯', name: 'Блиц по теме', short: 'Блиц по теме' } };
  const units = () => ((((window.SUBJECTS || {}).math4 || {}).units) || []).filter(u => typeof u.gen === 'function');
  const unitName = id => { const u = units().find(x => x.id === id); return u ? `${u.icon} ${u.title}` : 'тема'; };
  const gameName = d => d.game === 'topic' ? `${GAMES.topic.name}: ${unitName(d.topic)}` : (GAMES[d.game] || {}).name || d.game;
  const resText = (game, r) => !r ? '—' : /^schulte/.test(game) ? `${(+r.time).toFixed(1)} с${r.errs ? ` · ошибок ${r.errs}` : ''}` : game === 'paws' ? `${r.score} верных${r.errs ? ` · ошибок ${r.errs}` : ''}` : `${r.score} из 10 · ${Math.round(r.time)} с`;
  const pawsList = seed => withSeed(seed, () => { const L = []; let last = null; while (L.length < 160) { const f = [2 + Math.floor(Math.random() * 8), 2 + Math.floor(Math.random() * 8)]; if (last && f[0] === last[0] && f[1] === last[1]) continue; L.push(f); last = f; } return L; });
  const topicQs = (id, seed) => { const u = units().find(x => x.id === id); if (!u) return []; return withSeed(seed, () => { const out = []; for (let t = 0; t < 80 && out.length < 10; t++) { let q = null; try { q = u.gen(2); } catch (e) { } if (q && ACAD_Q[q.type]) out.push(q); } return out; }); };

  function playSchulte(box, n, seed, done) {
    const N = n * n, cells = withSeed(seed, () => shuffle(Array.from({ length: N }, (_, i) => i + 1))); let next = 1, t0 = 0, errs = 0, iv = null;
    box.innerHTML = `<p class="center small">Смотри в центр и находи числа по порядку. Время пойдёт с первого нажатия!</p><div class="center"><b>Найди: <span id="nx" class="big-n">1</span></b> · ⏱ <span id="tm">0.0</span> с</div><div class="schulte" style="--n:${n}">${cells.map(v => `<button class="sc" data-v="${v}">${v}</button>`).join('')}<i class="sc-dot"></i></div>`;
    cleanups.push(() => clearInterval(iv));
    $$('.sc', box).forEach(b => b.addEventListener('click', () => {
      if (next > N) return;
      if (!t0) { t0 = Date.now(); iv = setInterval(() => { const tm = $('#tm'); if (tm) tm.textContent = ((Date.now() - t0) / 1000).toFixed(1); }, 100); }
      if (+b.dataset.v !== next) { errs++; SND.bad(); shake(b); return; }
      b.classList.add('done'); SND.tap(); next++; $('#nx').textContent = next <= N ? next : '✔';
      if (next > N) { clearInterval(iv); const sec = Math.round((Date.now() - t0) / 100) / 10; done({ time: sec, errs, score: N }); }
    }));
  }
  function playPaws(box, seed, done) {
    const L = pawsList(seed); let i = 0, score = 0, errs = 0, buf = '', lock = false, over = false;
    box.innerHTML = `<div class="timer"><i id="tb"></i></div><div class="bz-score">✔ <b id="sc">0</b></div><div class="bz-q" id="q"></div>${numpad(false)}`;
    const q = $('#q', box), f = () => L[i % L.length], draw = () => { q.innerHTML = `${f()[0]} × ${f()[1]} = <span class="inp">${buf || '?'}</span>`; }; draw();
    const t0 = Date.now(), iv = setInterval(() => { const left = 60 - (Date.now() - t0) / 1000; const tb = $('#tb'); if (tb) tb.style.width = Math.max(0, left / 60 * 100) + '%'; if (left <= 0) end(); }, 100);
    cleanups.push(() => clearInterval(iv));
    const end = () => { if (over) return; over = true; clearInterval(iv); keyHandler = null; done({ score, errs, time: 60 }); };
    bindPad(box, { digit: d => { if (lock || over) return; buf += d; draw(); const ans = String(f()[0] * f()[1]); if (buf.length < ans.length) return;
      if (buf === ans) { score++; $('#sc').textContent = score; SND.tap(); i++; buf = ''; draw(); }
      else { lock = true; errs++; SND.bad(); q.innerHTML = `${f()[0]} × ${f()[1]} = <span class="inp bad">${ans}</span>`; setTimeout(() => { lock = false; i++; buf = ''; if (!over) draw(); }, 1100); } }, back: () => { buf = buf.slice(0, -1); draw(); } });
  }
  function playTopic(box, id, seed, done) {
    const qs = topicQs(id, seed); if (!qs.length) { box.innerHTML = '<p class="center">Эта тема пока недоступна 🙈</p>'; return; }
    let k = 0, ok = 0; const t0 = Date.now();
    const ask = () => { const q = qs[k], T = ACAD_Q[q.type];
      box.innerHTML = `<div class="g-dots">${qs.map((_, j) => `<i class="${j < k ? 'ok' : ''}"></i>`).join('')}</div><div class="center small">⏱ время идёт — отвечай быстро и точно!</div><div id="dq">${withSeed(seed + k + 1, () => T.render(q))}</div>`;
      T.bind($('#dq', box), q, r => { if (r) { ok++; SND.ok(); } else SND.bad(); const dots = $$('.g-dots i', box); if (dots[k]) dots[k].className = r ? 'ok' : 'bad'; keyHandler = null;
        setTimeout(() => { if (!$('#dq', box)) return; k++; if (k < qs.length) ask(); else done({ score: ok, time: Math.round((Date.now() - t0) / 100) / 10, errs: qs.length - ok }); }, r ? 500 : 1300); });
    };
    ask();
  }

  /* ---------- общие кусочки ---------- */
  let duelCache = {};
  const lockedHTML = title => `${topbar(title)}<div class="page"><div class="card center"><div class="big-emoji">🔐</div><h2>Вместе со взрослым</h2><p>Таблица успехов, вызовы и челленджи появятся, когда мама или папа откроют <b>личный кабинет</b> и привяжут твой прогресс. Так безопаснее!</p><p class="small">Взрослому: «Для взрослых» → «Кабинет» → <b>«Привязать прогресс этого устройства»</b>.</p><button class="btn pink" data-go="agate" data-arg="pcab">👨‍👩‍👧 Взрослому: привязать игру к семье</button></div></div>`;
  const giveReward = (r, why) => { if (!r) return; if (r.candies) award(r.candies, 0); if (r.gems) awardGems(r.gems, why); if (r.badge) { S.chalBadges = S.chalBadges || []; S.chalBadges.push({ b: r.badge, name: r.name || why || '', at: Date.now() }); save(); } };
  const plain = s => String(s || '').replace(/<[^>]+>/g, '');

  /* ---------- экран «Успехи»: таблица / вызовы / челленджи ---------- */
  const TABS = [['top', '📊 Таблица'], ['duels', '⚔️ Вызовы'], ['chal', '🎯 Челленджи']];
  let scope = 'family';
  SCREENS.board = async tab => {
    tab = TABS.some(t => t[0] === tab) ? tab : 'top';
    if (!linked()) { app.innerHTML = lockedHTML('🏆 Успехи и вызовы'); return; }
    app.innerHTML = `${topbar('🏆 Успехи')}<div class="seg tabs fm-tabs">${TABS.map(([id, n]) => `<button data-t="${id}" class="${id === tab ? 'on' : ''}">${n}</button>`).join('')}</div><div class="page fm" id="fmp"><p class="center small">Загрузка…</p></div>`;
    $$('.fm-tabs button').forEach(b => b.addEventListener('click', () => { SND.tap(); go(b.dataset.t === 'top' ? 'board' : b.dataset.t === 'duels' ? 'duels' : 'chal'); }));
    const box = $('#fmp');
    try { await ({ top: drawTop, duels: drawDuels, chal: drawChal })[tab](box); }
    catch (e) { if ($('#fmp')) $('#fmp').innerHTML = `<div class="card center"><div class="big-emoji">☁️</div><p>${e.code === 'auth' ? 'Нужно войти заново по семейному коду.' : 'Не получилось связаться с сервером. Проверь интернет.'}</p><button class="btn pink" data-go="board">Ещё раз</button></div>`; }
  };
  SCREENS.duels = () => SCREENS.board('duels');
  SCREENS.chal = () => SCREENS.board('chal');

  async function drawTop(box) {
    const d = await api('social/board'); if (!$('#fmp')) return;
    const rows = d[scope] || [], medal = p => ['🥇', '🥈', '🥉'][p - 1] || p, sch = r => [4, 5, 3].map(n => r.schulte && r.schulte[n] ? `${n}×${n}: ${r.schulte[n]} с` : '').find(Boolean) || '—';
    box.innerHTML = `<div class="seg fm-scope"><button data-s="family" class="${scope === 'family' ? 'on' : ''}">👨‍👩‍👧 Семья</button><button data-s="friends" class="${scope === 'friends' ? 'on' : ''}">🤝 Друзья</button></div>
      <p class="center small">Неделя с ${new Date(d.from).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · места — по опыту за неделю</p>
      ${rows.length > 1 ? `<div class="fm-board">${rows.map(r => `<div class="fm-row ${r.me ? 'me' : ''}"><span class="fm-place">${medal(r.place)}</span>${ava(r)}<div class="fm-who"><b>${esc(r.name)}${r.me ? ' (ты)' : ''}${r.adult ? ' <span class="fm-adl">взрослый</span>' : ''}</b><small>котик ${esc(r.cat)}</small></div><div class="fm-xp">⭐ ${r.xp}<small>опыта</small></div>
        <div class="fm-stats"><span title="задач за неделю">🧮 ${r.tasks}</span><span title="дней подряд">🔥 ${r.streak}</span><span title="лучшее время Шульте">🔢 ${sch(r)}</span><span title="звёзды Академии">★ ${r.stars}</span>${r.wins ? `<span title="побед в вызовах">⚔️ ${r.wins}</span>` : ''}</div>${!r.me ? `<button class="btn sm pink fm-ch" data-duel="${r.id}">⚔️ Вызов</button>` : ''}</div>`).join('')}</div>`
        : `<div class="card center"><div class="big-emoji">${scope === 'family' ? '👨‍👩‍👧' : '🤝'}</div><p>${scope === 'family' ? 'В семье пока только ты. Когда взрослые добавят брата или сестру в кабинете — вы появитесь в таблице вместе!' : 'Друзей пока нет. Обменяйся кодами с другом в разделе «Друзья» — а взрослые разрешат дружбу.'}</p>${scope === 'friends' ? '<button class="btn" data-go="friends">🤝 К друзьям</button>' : ''}</div>`}
      <p class="small center">🧮 задачи за неделю · 🔥 дней подряд · 🔢 лучшее время в таблице Шульте · ★ звёзды Академии</p>`;
    $$('.fm-scope button', box).forEach(b => b.addEventListener('click', () => { scope = b.dataset.s; SND.tap(); drawTop(box).catch(() => { }); }));
    $$('[data-duel]', box).forEach(b => b.addEventListener('click', () => { const p = rows.find(r => r.id === b.dataset.duel); pickGame(p); }));
  }

  /* ---------- вызовы ---------- */
  async function people() { const d = await api('social/people'); return [...(d.family || []).map(p => ({ ...p, fam: true })), ...(d.friends || [])]; }
  function pickGame(p, pre) {
    const m = modal(`<h2>⚔️ Вызов: ${esc(p.name)}</h2><p class="small">Вы оба пройдёте <b>одно и то же</b> задание. Ты — первым, а ${esc(p.name)} получит вызов в игре. Победитель получит 🍬!</p>
      <div class="fm-games">${Object.entries(GAMES).map(([id, g]) => `<button class="btn ${pre === id ? 'pink' : ''}" data-g="${id}">${g.icon} ${g.name}</button>`).join('')}</div><div id="fmtop"></div><button class="btn" data-close>Отмена</button>`);
    $$('[data-g]', m.el).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.g !== 'topic') { m.close(); start(p, b.dataset.g); return; }
      $('#fmtop', m.el).innerHTML = `<h3>Выбери тему</h3><div class="fm-topics">${units().map(u => `<button class="chip" data-u="${u.id}">${u.icon} ${u.title}</button>`).join('')}</div>`;
      $$('[data-u]', m.el).forEach(x => x.addEventListener('click', () => { m.close(); start(p, 'topic', x.dataset.u); }));
    }));
  }
  async function start(p, game, topic) {
    try { const r = await api('duel/new', { to: p.id, game, topic }); duelCache[r.duel.id] = r.duel; SND.tap(); go('duelplay', r.duel.id); }
    catch (e) { toast(e.code === 'notfriend' ? 'Вызвать можно только семью и друзей' : e.code === 'many' ? 'На сегодня вызовов хватит — завтра можно ещё 🙂' : 'Не получилось. Проверь интернет.'); }
  }
  function openChallengeFor(game) { // «Вызов другу» из игр: Шульте и Быстрые лапки
    people().then(L => {
      if (!L.length) { toast('Пока некого вызвать: добавь друзей или попроси взрослых добавить семью'); return; }
      const m = modal(`<h2>⚔️ Кого вызовем?</h2><div class="fm-people">${L.map(p => `<button class="fm-person" data-p="${p.id}">${ava(p)}<b>${esc(p.name)}</b><small>${p.adult ? '🧑 взрослый' : p.fam ? '👨‍👩‍👧 семья' : '🤝 друг'}</small></button>`).join('')}</div><button class="btn" data-close>Отмена</button>`);
      $$('[data-p]', m.el).forEach(b => b.addEventListener('click', () => { m.close(); const p = L.find(x => x.id === b.dataset.p); game ? start(p, game) : pickGame(p); }));
    }).catch(() => toast('Не получилось связаться с сервером'));
  }
  async function claimDuels(list) {
    for (const d of list.filter(x => x.done && !x.claimed)) {
      try { const r = await api('duel/' + d.id + '/claim', {}); d.claimed = true; giveReward({ candies: r.candies }); toast(`<span class="tb">${d.result === 'win' ? '🏆' : d.result === 'draw' ? '🤝' : '🎖️'}</span><div>${d.result === 'win' ? 'Победа над ' + esc(d.other.name) + '!' : d.result === 'draw' ? 'Ничья с ' + esc(d.other.name) + '!' : 'Вызов с ' + esc(d.other.name) + ' — за смелость!'} +${r.candies} 🍬</div>`); } catch (e) { }
    }
  }
  async function drawDuels(box) {
    const [d, L] = await Promise.all([api('duel/list'), people().catch(() => [])]); if (!$('#fmp')) return;
    const dl = (x, act) => `<div class="fm-duel ${x.result || ''}">${ava(x.other)}<div class="fm-who"><b>${x.icon} ${esc(plain(gameName(x)))}</b><small>${x.iStarted ? 'ты вызвал' + (girl(S.kid) ? 'а' : '') : 'тебя вызвал' + (girl(x.other.name) ? 'а' : '')} ${x.iStarted ? esc(x.other.name) : esc(x.other.name)}</small>
      <small>Ты: <b>${resText(x.game, x.mine)}</b> · ${esc(x.other.name)}: <b>${x.theirs ? resText(x.game, x.theirs) : 'ещё не играл' + (girl(x.other.name) ? 'а' : '')}</b></small></div>${act || (x.result ? `<span class="fm-res">${x.result === 'win' ? '🏆' : x.result === 'draw' ? '🤝' : '💪'}</span>` : '<span class="fm-res">⏳</span>')}</div>`;
    box.innerHTML = `${d.incoming.length ? `<div class="card hl"><h3>📨 Тебе бросили вызов!</h3>${d.incoming.map(x => dl(x, `<button class="btn sm pink" data-play="${x.id}">Принять!</button>`)).join('')}</div>` : ''}
      <div class="card"><h3>⚔️ Бросить вызов</h3>${L.length ? `<div class="fm-people">${L.map(p => `<button class="fm-person" data-p="${p.id}">${ava(p)}<b>${esc(p.name)}</b><small>${p.adult ? '🧑 взрослый' : p.fam ? '👨‍👩‍👧 семья' : '🤝 друг'}</small></button>`).join('')}</div><p class="small">Игры: таблица Шульте, Быстрые лапки или блиц по теме из Школы сыщика. Вы проходите одно и то же задание — кто лучше?</p>` : '<p class="small">Вызвать можно семью и друзей. Пока никого нет — добавь друзей в разделе «Друзья».</p><button class="btn" data-go="friends">🤝 К друзьям</button>'}</div>
      ${d.waiting.length ? `<div class="card"><h3>⏳ Ждём соперника</h3>${d.waiting.map(x => dl(x)).join('')}</div>` : ''}
      ${d.done.length ? `<div class="card"><h3>📜 История вызовов</h3>${d.done.map(x => dl(x)).join('')}</div>` : ''}`;
    $$('[data-play]', box).forEach(b => b.addEventListener('click', () => { duelCache[b.dataset.play] = d.incoming.find(x => x.id === b.dataset.play); SND.tap(); go('duelplay', b.dataset.play); }));
    $$('[data-p]', box).forEach(b => b.addEventListener('click', () => pickGame(L.find(x => x.id === b.dataset.p))));
    claimDuels(d.done);
  }

  SCREENS.duelplay = async id => {
    app.innerHTML = `${topbar('⚔️ Вызов', 'duels')}<div class="page duelp"><div id="dbox" class="center"><p>Загрузка…</p></div></div>`;
    let d = duelCache[id];
    if (!d) { try { d = (await api('duel/' + id)).duel; } catch (e) { if ($('#dbox')) $('#dbox').innerHTML = '<p>Вызов не найден.</p><button class="btn" data-go="duels">К вызовам</button>'; return; } }
    const box = $('#dbox'); if (!box) return; // пока грузили — ушли на другой экран
    if (d.mine) return showResult(box, d);
    box.innerHTML = `<div class="fm-vs">${ava({ fur: S.fur, wear: S.wear })}<b>VS</b>${ava(d.other)}</div><h2>${d.icon} ${esc(plain(gameName(d)))}</h2>
      <p>${d.theirs ? `${esc(d.other.name)} уже сыграл${girl(d.other.name) ? 'а' : ''}: <b>${resText(d.game, d.theirs)}</b>. Сможешь лучше?` : `Ты играешь первым${girl(S.kid) ? '(ой)' : ''}. Потом ${esc(d.other.name)} пройдёт <b>то же самое</b> задание.`}</p>
      <p class="small">${/^schulte/.test(d.game) ? 'Побеждает тот, кто быстрее. Каждая ошибка — +1 секунда.' : d.game === 'paws' ? 'За 60 секунд — как можно больше верных ответов.' : '10 заданий: побеждает тот, у кого больше верных, а при равенстве — кто быстрее.'} Попытка одна!</p>
      <button class="btn big pink" id="dgo">Старт!</button>`;
    $('#dgo').addEventListener('click', () => {
      const area = document.createElement('div'); box.innerHTML = ''; box.appendChild(area); box.classList.remove('center');
      const fin = async res => {
        box.innerHTML = '<p class="center">Отправляем результат…</p>';
        try { const r = await api("duel/" + d.id + "/result", res); d = r.duel; duelCache[d.id] = d; }
        catch (e) { d = { ...d, mine: res }; if (e.code !== 'played') toast('Нет связи — результат не отправился'); }
        if (document.body.contains(box)) showResult(box, d);
      };
      if (/^schulte/.test(d.game)) playSchulte(area, d.game === 'schulte5' ? 5 : 4, d.seed, fin);
      else if (d.game === 'paws') playPaws(area, d.seed, fin);
      else playTopic(area, d.topic, d.seed, fin);
    });
  };
  function showResult(box, d) {
    box.classList.add('center');
    const head = d.done ? (d.result === 'win' ? '🏆 Победа!' : d.result === 'draw' ? '🤝 Ничья!' : '💪 В этот раз победил' + (girl(d.other.name) ? 'а' : '') + ' ' + esc(d.other.name)) : '📨 Вызов отправлен!';
    box.innerHTML = `<div class="big-emoji">${d.done ? (d.result === 'win' ? '🏆' : d.result === 'draw' ? '🤝' : '🐾') : '⏳'}</div><h2>${head}</h2>
      <div class="fm-score"><div class="${d.result === 'win' ? 'win' : ''}">${ava({ fur: S.fur, wear: S.wear })}<b>Ты</b><span>${resText(d.game, d.mine)}</span></div><div class="${d.result === 'lose' ? 'win' : ''}">${ava(d.other)}<b>${esc(d.other.name)}</b><span>${d.theirs ? resText(d.game, d.theirs) : 'ещё не играл' + (girl(d.other.name) ? 'а' : '')}</span></div></div>
      <p>${d.done ? (d.result === 'lose' ? 'Отличная попытка! Тренируйся — и в следующий раз победа будет твоей.' : 'Здорово сыграно!') : `${esc(d.other.name)} увидит вызов в игре. Результат появится во вкладке «Вызовы».`}</p>
      <div class="row-btns"><button class="btn pink" data-go="duels">К вызовам</button><button class="btn" data-go="home">Домой</button></div>`;
    if (d.done) { SND.win(); if (d.result === 'win') confetti(40); claimDuels([d]); }
  }

  /* ---------- челленджи ---------- */
  const unitOf = c => c.metric === 'activeDays' ? (c.kind === 'family' ? 'дней' : 'дней') : c.metric === 'streak10' ? 'дней подряд' : c.metric === 'xp' ? 'опыта' : c.metric === 'acad' ? 'заданий' : 'задач';
  const rewardTxt = r => `${r.candies ? r.candies + ' 🍬 ' : ''}${r.gems ? '+' + r.gems + ' 💎 ' : ''}${r.badge ? '+ значок ' + r.badge : ''}`;
  const chalCard = c => `<div class="fm-chal ${c.complete ? 'done' : ''}"><div class="fm-ch-h"><span class="fm-ch-i">${c.icon}</span><div><b>${esc(c.name)}</b><small>${c.kind === 'family' ? '👨‍👩‍👧 семейный' : c.kind === 'friends' ? (c.mode === 'race' ? '🏁 гонка с друзьями' : '🤝 с друзьями') : '🙋 личный'} · ${c.ended ? 'закончился' : 'осталось ' + c.daysLeft + ' ' + plural(c.daysLeft, 'день', 'дня', 'дней')}</small></div></div>
    <div class="bar mint"><i style="width:${Math.min(100, Math.round(c.progress / c.goal * 100))}%"></i></div><div class="small">${c.mode === 'race' ? 'У тебя' : c.kind === 'solo' ? 'Готово' : 'Вместе'}: <b>${Math.min(c.progress, c.goal)} из ${c.goal}</b> ${unitOf(c)} · награда: ${rewardTxt(c.reward)}</div>
    ${c.members && c.members.length ? `<div class="fm-mem">${c.members.map(x => `<span class="${x.me ? 'me' : ''}">${ava(x, 'sm')}${esc(x.name)}: ${x.value}</span>`).join('')}</div>` : ''}
    ${c.claimable ? `<button class="btn pink" data-claim="${c.id}">🎁 Забрать награду</button>` : c.claimed ? '<div class="small">✅ Награда получена</div>' : c.kidsOnly ? '<div class="small">🧑 Вы помогаете детям: награду за семейный челлендж получают дети</div>' : ''}</div>`;
  async function drawChal(box) {
    const [d, L] = await Promise.all([api('chal/list'), people().catch(() => [])]); if (!$('#fmp')) return;
    const solo = d.templates.filter(t => t.kind === 'solo'), fr = d.templates.filter(t => t.kind === 'friends'), busy = new Set(d.active.filter(c => !c.ended).map(c => c.tpl));
    box.innerHTML = `${d.active.length ? `<h3>🎯 Мои челленджи</h3>${d.active.map(chalCard).join('')}` : '<div class="card center"><div class="big-emoji">🎯</div><p>Челленджей пока нет. Выбери свой — или позови друзей!</p></div>'}
      <div class="card"><h3>🙋 Личный челлендж</h3>${solo.map(t => `<div class="fm-tpl"><span>${t.icon}</span><div><b>${t.name}</b><small>${t.days} дней · ${rewardTxt(t.reward)}</small></div><button class="btn sm ${busy.has(t.id) ? '' : 'pink'}" data-solo="${t.id}" ${busy.has(t.id) ? 'disabled' : ''}>${busy.has(t.id) ? 'идёт' : 'Начать'}</button></div>`).join('')}</div>
      <div class="card"><h3>🤝 С друзьями и семьёй</h3>${L.length ? fr.map(t => `<div class="fm-tpl"><span>${t.icon}</span><div><b>${t.name}</b><small>${t.mode === 'race' ? 'кто первым дойдёт до цели' : 'общая цель на всех'} · ${rewardTxt(t.reward)}</small></div><button class="btn sm pink" data-fr="${t.id}">Позвать</button></div>`).join('') : '<p class="small">Добавь друзей — и устраивайте гонки!</p>'}<p class="small">👨‍👩‍👧 Семейные челленджи создают взрослые в личном кабинете.</p></div>
      ${d.past.length ? `<h3>📜 Прошедшие</h3>${d.past.map(chalCard).join('')}` : ''}
      ${(S.chalBadges || []).length ? `<div class="card"><h3>🏅 Мои значки челленджей</h3><div class="fm-badges">${S.chalBadges.slice(-30).map(b => `<span title="${esc(b.name)}">${b.b}</span>`).join('')}</div></div>` : ''}`;
    $$('[data-solo]', box).forEach(b => b.addEventListener('click', async () => { try { await api('chal/start', { tpl: b.dataset.solo }); SND.win(); toast('🎯 Челлендж начался! Удачи!'); drawChal(box); } catch (e) { toast(e.code === 'many' ? 'Можно не больше трёх личных челленджей сразу' : 'Не получилось'); } }));
    $$('[data-fr]', box).forEach(b => b.addEventListener('click', () => {
      const t = fr.find(x => x.id === b.dataset.fr), sel = new Set();
      const m = modal(`<h2>${t.icon} ${t.name}</h2><p class="small">Кого позовём? Челлендж появится у них автоматически.</p><div class="fm-people">${L.map(p => `<button class="fm-person" data-p="${p.id}">${ava(p)}<b>${esc(p.name)}</b><small>${p.adult ? '🧑 взрослый' : p.fam ? '👨‍👩‍👧 семья' : '🤝 друг'}</small></button>`).join('')}</div><div class="row-btns"><button class="btn pink" id="frgo">Начать!</button><button class="btn" data-close>Отмена</button></div>`);
      $$('[data-p]', m.el).forEach(x => x.addEventListener('click', () => { sel.has(x.dataset.p) ? sel.delete(x.dataset.p) : sel.add(x.dataset.p); x.classList.toggle('on', sel.has(x.dataset.p)); SND.tap(); }));
      $('#frgo', m.el).addEventListener('click', async () => { if (!sel.size) return toast('Выбери хотя бы одного'); try { await api('chal/start', { tpl: t.id, with: [...sel] }); m.close(); SND.win(); confetti(20); toast('🏁 Поехали! Челлендж начался'); drawChal(box); } catch (e) { toast(e.code === 'many' ? 'Сейчас уже идут два твоих челленджа с друзьями' : 'Не получилось'); } });
    }));
    $$('[data-claim]', box).forEach(b => b.addEventListener('click', async () => { b.disabled = true; try { const r = await api('chal/' + b.dataset.claim + '/claim', {}); giveReward(r, 'за челлендж «' + r.name + '»'); SND.win(); confetti(40); modal(`<div class="big-emoji">${r.badge || '🎁'}</div><h2>Челлендж пройден!</h2><p>«${esc(r.name)}»</p><p><b>+${r.candies} 🍬</b>${r.gems ? ` <b>+${r.gems} 💎</b>` : ''}${r.badge ? `<br>Новый значок: ${r.badge}` : ''}</p><button class="btn pink" data-close>Ура!</button>`); drawChal(box); } catch (e) { b.disabled = false; toast('Не получилось'); } }));
  }

  /* ---------- главная: плитка, значок новостей и приглашение принять вызов ---------- */
  let news = null, newsAt = 0;
  const shown = () => { try { return JSON.parse(sessionStorage.getItem('duelShown') || '[]'); } catch (e) { return []; } };
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try {
    const fr = $('.t-friends', app) || $('.t-diploma', app) || $('.t-shop', app);
    if (fr && !$('.t-board', app)) fr.insertAdjacentHTML('afterend', `<button class="tile t-board" data-go="board"><span class="ti">🏆</span><b>Успехи и вызовы</b><small>Таблица недели, вызовы, челленджи</small><span class="tbadge" id="fmbadge" hidden></span></button>`);
    if (!linked()) return r;
    const paint = n => { const b = $('#fmbadge'); const c = n.incoming.length + n.unclaimedDuels + n.claimableChals; if (b && c) { b.hidden = false; b.textContent = c; } };
    let offer = n => { const L = n.incoming.filter(d => !shown().includes(d.id)); if (!L.length) return; const d = L[0];
      const tryIt = k => { if (curScreen !== 'home') return; if ($('.modal')) { if (k < 20) setTimeout(() => tryIt(k + 1), 1500); return; }
        try { sessionStorage.setItem('duelShown', JSON.stringify([...shown(), d.id])); } catch (e) { }
        const m = modal(`<div class="fm-vs">${ava(d.other)}<b>⚔️</b>${ava({ fur: S.fur, wear: S.wear })}</div><h2>${esc(d.other.name)} бросил${girl(d.other.name) ? 'а' : ''} тебе вызов!</h2><p>${d.icon} <b>${esc(plain(gameName(d)))}</b></p>${d.theirs ? `<p>Результат: <b>${resText(d.game, d.theirs)}</b>. Сможешь лучше?</p>` : ''}<div class="row-btns"><button class="btn pink" id="dacc">Принять вызов!</button><button class="btn" data-close>Позже</button></div>`);
        $('#dacc', m.el).addEventListener('click', () => { duelCache[d.id] = d; m.close(); go('duelplay', d.id); }); M.meow({ shape: 'happy' }); };
      setTimeout(() => tryIt(0), 3000); };
    // котик сам напоминает о вызове, который уже видели, но ещё не приняли (раз в 20 минут, чтобы не надоедать)
    const remind = n => { const L = n.incoming.filter(d => shown().includes(d.id)); if (!L.length) return; let at = 0; try { at = +sessionStorage.getItem('duelRemindAt') || 0; } catch (e) { } if (Date.now() - at < 20 * 6e4) return;
      setTimeout(() => { if (curScreen !== 'home' || $('.modal')) return; const d = L[0]; try { sessionStorage.setItem('duelRemindAt', Date.now()); } catch (e) { } say(`⚔️ ${esc(d.other.name)} ждёт твой ответ на вызов «${esc(plain(gameName(d)))}»! Загляни в «Успехи и вызовы» 🏆`, 0, { prio: 1 }); }, 6000); };
    const offer0 = offer; offer = n => { offer0(n); remind(n); };
    if (news && Date.now() - newsAt < 60000) { paint(news); offer(news); }
    else api('social/news').then(n => { news = n; newsAt = Date.now(); if (curScreen === 'home') { paint(n); offer(n); } }).catch(() => { });
  } catch (e) { console.warn(e); } return r; }; }
  { const g0 = go; go = function (name) { if (['board', 'duels', 'chal', 'duelplay'].includes(name)) news = null; return g0.apply(this, arguments); }; }

  /* ---------- «Друзья»: ссылка на таблицу успехов и вызовы ---------- */
  { const fr = SCREENS.friends; if (fr) SCREENS.friends = arg => { const r = fr(arg); Promise.resolve(r).then(() => { const pg = $('.page.friends', app); if (curScreen === 'friends' && pg && !$('#fr-board', pg) && $('.fr-me', pg)) pg.insertAdjacentHTML('afterbegin', `<button class="btn mint fm-link" id="fr-board" data-go="board">🏆 Успехи семьи и друзей · ⚔️ вызовы · 🎯 челленджи →</button>`); }).catch(() => { }); return r; }; }

  /* ---------- «Вызов другу» прямо из игр: Шульте и Быстрые лапки ---------- */
  { const sc = SCREENS.schulte; if (sc) SCREENS.schulte = n => { sc(n); if (!linked()) return; const pg = $('.page', app); if (pg) pg.insertAdjacentHTML('beforeend', `<div class="center"><button class="btn sm fm-link" id="sch-duel">⚔️ Вызвать друга на ${(+n || 3) >= 5 ? '5×5' : '4×4'}</button></div>`); $('#sch-duel')?.addEventListener('click', () => openChallengeFor((+n || 3) >= 5 ? 'schulte5' : 'schulte4')); }; }
  { const bl = SCREENS.blitz; if (bl) SCREENS.blitz = arg => { bl(arg); if (!linked()) return; const pg = $('.page', app); if (pg && !$('#bz-duel', pg)) { pg.insertAdjacentHTML('beforeend', '<div class="center"><button class="btn sm fm-link" id="bz-duel">⚔️ Вызвать друга: кто больше за 60 секунд?</button></div>'); $('#bz-duel').addEventListener('click', () => openChallengeFor('paws')); } }; }

  /* ---------- значки челленджей в «Моих наградах» ---------- */
  { const dp = SCREENS.diplomas; if (dp) SCREENS.diplomas = arg => { dp(arg); const pg = $('.page.diplomas', app), B = S.chalBadges || []; if (pg && B.length) pg.insertAdjacentHTML('beforeend', `<h3>🎯 Значки челленджей <small>(${B.length})</small></h3><div class="fm-badges">${B.slice(-40).map(b => `<span title="${esc(b.name)}">${b.b}</span>`).join('')}</div>`); }; }

  /* ---------- кабинет взрослого: успехи семьи, челленджи, друзья детей ---------- */
  async function cabinet(el) {
    if (!el) return;
    let d, fr; try { [d, fr] = await Promise.all([papi('fam/social'), papi('fam/friends').catch(() => ({ kids: [] }))]); } catch (e) { el.innerHTML = ''; return; }
    if (!document.body.contains(el)) return; if (!d || !d.board || !Array.isArray(d.chals)) { el.innerHTML = ''; return; } fr = fr && Array.isArray(fr.kids) ? fr : { kids: [] };
    const sch = r => [4, 5, 3].map(n => r.schulte && r.schulte[n] ? `${n}×${n}: ${r.schulte[n]} с` : '').find(Boolean) || '—';
    const famC = d.chals.filter(c => c.kind === 'family'), kidC = d.chals.filter(c => c.kind !== 'family'), act = new Set(famC.map(c => c.tpl));
    el.innerHTML = `<div class="card"><h3>📊 Успехи за неделю</h3>${d.board.rows.length ? `<table class="fm-tbl"><tr><th>Ребёнок</th><th>⭐ опыт</th><th>🧮 задачи</th><th>🔥 дней подряд</th><th>🔢 Шульте</th><th>★</th></tr>${d.board.rows.map(r => `<tr><td>${esc(r.name)}${r.adult ? ' <small>(взрослый)</small>' : ''}</td><td>${r.xp}</td><td>${r.tasks}</td><td>${r.streak}</td><td>${sch(r)}</td><td>${r.stars}</td></tr>`).join('')}</table><p class="small">Вызовов сыграно за неделю: <b>${d.duelsWeek}</b>. Дети видят такую же таблицу — только имена и котиков.</p>` : '<p class="small">Добавьте детей — и здесь появится таблица.</p>'}</div>
      <div class="card"><h3>🎯 Челленджи</h3>${famC.length ? famC.map(c => `<div class="fm-tpl"><span>${c.icon}</span><div><b>${esc(c.name)}</b><small>${Math.min(c.progress, c.goal)} из ${c.goal} · до ${new Date(c.end).toLocaleDateString('ru-RU')}${c.complete ? ' · ✅ цель достигнута' : ''}</small><div class="bar mint"><i style="width:${Math.min(100, Math.round(c.progress / c.goal * 100))}%"></i></div></div><button class="btn sm" data-crm="${c.id}">Убрать</button></div>`).join('') : '<p class="small">Семейных челленджей пока нет.</p>'}
        ${kidC.length ? `<p class="small"><b>Дети сами начали:</b> ${kidC.map(c => `${c.icon} ${esc(c.name)} (${Math.min(c.progress, c.goal)}/${c.goal})`).join(' · ')}</p>` : ''}
        <details ${famC.length ? '' : 'open'}><summary>➕ Создать семейный челлендж</summary><p class="small">Общая цель на всех детей семьи на 7 дней. Когда цель достигнута, каждый ребёнок получает награду.</p>${d.templates.map(t => `<div class="fm-tpl"><span>${t.icon}</span><div><b>${t.name}</b><small>${rewardTxt(t.reward)} каждому</small></div><button class="btn sm pink" data-cadd="${t.id}" ${act.has(t.id) ? 'disabled' : ''}>${act.has(t.id) ? 'идёт' : 'Создать'}</button></div>`).join('')}</details></div>
      <div class="card"><h3>🤝 Друзья детей</h3><p class="small">Дети одной семьи дружат автоматически. С детьми из других семей — только после обмена кодами и Вашего разрешения (и разрешения взрослых другой семьи). Переписки в игре нет.</p>${fr.kids.map(k => `<div class="fm-frk"><b>${esc(k.name)}</b>${(k.requests || []).map(x => `<div class="fr-req"><span>🐾 Хочет дружить: котик <b>${esc(x.cat)}</b>${x.kid ? ' (' + esc(x.kid) + ')' : ''}</span><span><button class="btn sm mint" data-fok="${k.id}|${x.pub}">Разрешить</button> <button class="btn sm" data-fno="${k.id}|${x.pub}">Отклонить</button></span></div>`).join('')}${(k.waiting || []).map(x => `<div class="small">⏳ ${esc(x.cat)}${x.kid ? ' (' + esc(x.kid) + ')' : ''} — ждём разрешения взрослых другой семьи</div>`).join('')}<div class="small">Друзья: ${(k.friends || []).length ? k.friends.map(x => `${esc(x.cat)}${x.kid ? ' (' + esc(x.kid) + ')' : ''} <button class="link" data-fno="${k.id}|${x.pub}">убрать</button>`).join(', ') : 'пока нет'}</div></div>`).join('') || '<p class="small">Детей пока нет.</p>'}</div>`;
    $$('[data-cadd]', el).forEach(b => b.addEventListener('click', async () => { try { await papi('fam/chal', { tpl: b.dataset.cadd }); toast('Челлендж создан — дети увидят его в игре'); cabinet(el); } catch (e) { toast(e.code === 'many' ? 'Не больше трёх семейных челленджей одновременно' : 'Не получилось'); } }));
    $$('[data-crm]', el).forEach(b => b.addEventListener('click', async () => { await papi('fam/chal/' + b.dataset.crm + '/remove', {}).catch(() => { }); cabinet(el); }));
    const fset = (v, ok) => { const [childId, pub] = v.split('|'); return papi('fam/friends', { childId, pub, ok }).then(() => { toast(ok ? 'Дружба разрешена' : 'Готово'); cabinet(el); }).catch(() => toast('Не получилось')); };
    $$('[data-fok]', el).forEach(b => b.addEventListener('click', () => fset(b.dataset.fok, true)));
    $$('[data-fno]', el).forEach(b => b.addEventListener('click', () => fset(b.dataset.fno, false)));
  }

  /* ---------- раздел для взрослых (отчёт): семья, успехи и челленджи ---------- */
  { const pr = SCREENS.parents; if (pr) SCREENS.parents = arg => { pr(arg); const pg = $('.page.parents', app), anchor = pg && $('#reset', pg); if (!anchor || (!Accounts.parent() && !linked())) return;
    anchor.insertAdjacentHTML('beforebegin', '<div class="card" id="fmrep"><h3>👨‍👩‍👧 Семья: успехи и челленджи</h3><div class="small">Загружаем…</div></div>');
    const el = $('#fmrep'), P = Accounts.parent();
    const rowsHTML = rows => rows.length ? `<table class="fm-tbl"><tr><th></th><th>⭐ опыт за неделю</th><th>🧮 задачи</th><th>🔥</th></tr>${rows.map(r => `<tr><td>${esc(r.name)}</td><td>${r.xp}</td><td>${r.tasks}</td><td>${r.streak}</td></tr>`).join('')}</table>` : '';
    const chalHTML = L => L.length ? `<p class="small"><b>Челленджи:</b> ${L.map(c => `${c.icon} ${esc(c.name)} — ${Math.min(c.progress, c.goal)}/${c.goal}${c.complete ? ' ✅' : ''}`).join(' · ')}</p>` : '<p class="small">Активных челленджей нет.</p>';
    const done = h => { if (document.body.contains(el)) el.innerHTML = '<h3>👨‍👩‍👧 Семья: успехи и челленджи</h3>' + h; };
    if (P) Promise.all([papi('fam/social'), papi('family')]).then(([s, f]) => done(`<p class="small">Взрослые в семье: ${f.family.adults.map(a => esc(a.name || a.email) + (a.role === 'owner' ? ' (владелец)' : '')).join(', ')}</p>${rowsHTML(s.board.rows)}${chalHTML(s.chals)}<p class="small">Вызовов за неделю: ${s.duelsWeek}. Управление — в <button class="link" data-go="pcab">личном кабинете</button>.</p>`)).catch(() => done('<p class="small">Нет связи с сервером.</p>'));
    else Promise.all([api('social/board'), api('chal/list')]).then(([b, c]) => done(`${rowsHTML(b.family)}${chalHTML(c.active)}<p class="small">Чтобы создавать семейные челленджи и одобрять друзей, войдите в <button class="link" data-go="pauth">личный кабинет</button>.</p>`)).catch(() => done('<p class="small">Нет связи с сервером.</p>'));
  }; }

  /* ---------- стили ---------- */
  if (!document.getElementById('family-css')) { const st = document.createElement('style'); st.id = 'family-css'; st.textContent = `
    .fm-tabs{margin:10px 12px 0;flex-wrap:nowrap}.fm-tabs button{padding:9px 6px;flex:1 1 0;font-size:14px}.fm-scope{margin-bottom:8px}.fm .card.hl{border:2px solid var(--pink)}
    .fm-ava{display:inline-block;width:48px;height:48px;flex:0 0 48px}.fm-ava svg{width:100%;height:100%}.fm-ava.sm{width:26px;height:26px;flex-basis:26px;vertical-align:middle}
    .fm-board{display:flex;flex-direction:column;gap:8px}.fm-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;background:#fff;border-radius:16px;padding:10px 12px;box-shadow:var(--sh)}
    .fm-row.me{outline:3px solid var(--pink);background:#FFF6FA}.fm-place{font-size:24px;min-width:32px;text-align:center;font-weight:900}
    .fm-who{flex:1 1 120px;min-width:0;display:flex;flex-direction:column}.fm-who b{overflow-wrap:anywhere}.fm-who small{color:var(--muted)}
    .fm-xp{font-weight:900;font-size:18px;text-align:right;display:flex;flex-direction:column}.fm-xp small{font-size:11px;color:var(--muted);font-weight:700}
    .fm-stats{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:6px;font-size:13px;font-weight:700}.fm-stats span{background:var(--pink-2);border-radius:10px;padding:3px 8px}
    .fm-ch{margin-left:auto}.fm-people{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin:8px 0}
    .fm-person{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border-radius:14px;padding:8px;box-shadow:var(--sh);border:2px solid transparent}.fm-person.on{border-color:var(--pink);background:#FFF0F6}.fm-person small{color:var(--muted);font-size:12px}
    .fm-games{display:flex;flex-direction:column;gap:8px;margin:10px 0}.fm-topics{display:flex;flex-wrap:wrap;max-height:40vh;overflow:auto}
    .fm-duel{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1e8ee}.fm-duel:last-child{border-bottom:0}.fm-res{font-size:26px}
    .fm-vs{display:flex;align-items:center;justify-content:center;gap:14px;font-weight:900;font-size:22px}.fm-vs .fm-ava{width:72px;height:72px;flex-basis:72px}
    .fm-score{display:flex;justify-content:center;gap:12px;margin:10px 0}.fm-score>div{display:flex;flex-direction:column;align-items:center;background:#fff;border-radius:16px;padding:10px 14px;box-shadow:var(--sh);min-width:120px}.fm-score>div.win{outline:3px solid #FFC94D}
    .fm-chal{background:#fff;border-radius:16px;padding:12px;box-shadow:var(--sh);margin-bottom:10px;display:flex;flex-direction:column;gap:6px}.fm-chal.done{background:#F2FFF8}
    .fm-ch-h{display:flex;gap:10px;align-items:center}.fm-ch-h small{display:block;color:var(--muted)}.fm-ch-i{font-size:30px}
    .fm-mem{display:flex;flex-wrap:wrap;gap:6px;font-size:13px}.fm-mem span{background:#F6F1FA;border-radius:10px;padding:2px 8px 2px 2px}.fm-mem span.me{background:var(--pink-2);font-weight:800}
    .fm-tpl{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1e8ee}.fm-tpl:last-child{border-bottom:0}.fm-tpl>span{font-size:26px}.fm-tpl>div{flex:1;min-width:0}.fm-tpl small{display:block;color:var(--muted)}
    .fm-badges{display:flex;flex-wrap:wrap;gap:6px;font-size:30px}.fm-link{margin:0 0 10px;width:100%}
    .fm-tbl{width:100%;border-collapse:collapse;font-size:14px}.fm-tbl th,.fm-tbl td{padding:5px 4px;border-bottom:1px solid #f1e8ee;text-align:center}.fm-tbl td:first-child,.fm-tbl th:first-child{text-align:left}
    .fm-frk{padding:8px 0;border-bottom:1px solid #f1e8ee}.fm-adult{display:flex;align-items:center;gap:8px;padding:6px 0;flex-wrap:wrap}.fm-adult>span{flex:1;min-width:0;overflow-wrap:anywhere}
    .fm-adl{display:inline-block;font-size:11px;font-weight:800;background:#E8F4FF;color:#2B6CB0;border-radius:8px;padding:1px 6px;vertical-align:middle}
    .fm-roles .chip{cursor:pointer}.fm-roles .chip.on{background:var(--pink);color:#fff}
    .acc-entry.fresh{background:#fff;border-radius:20px;padding:16px;box-shadow:var(--sh2);display:flex;flex-direction:column;gap:10px;margin-bottom:14px}.acc-entry.fresh .btn{width:100%}
    .acc-try{margin-top:6px;padding-top:10px;border-top:2px dashed #EADCE6;width:100%}.acc-try h3{margin:0 0 4px}.duelp .schulte{margin:10px auto}
  `; document.head.appendChild(st); }
  ['board', 'duels', 'chal', 'duelplay'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { withSeed, cabinet, openChallengeFor, pawsList, topicQs, GAMES };
})();
window.Family = Family;
