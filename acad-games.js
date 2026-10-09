/* acad-games.js — игры Академии: «Собери Солнечную систему» (космос), «Прогулка по городу» (безопасность),
   «Фейк или правда?» (критическое мышление). Подключаются кнопками на экранах предметов. */
'use strict';
const AcadGames = (() => {
  const back = (id) => { const b = $('.back', app); b.dataset.go = 'subject'; b.dataset.arg = id; };
  const best = (g, ok, n) => { S.agames = S.agames || {}; S.agames[g] = Math.max(S.agames[g] || 0, Math.round(ok / n * 100) / 100); save(); };
  const done = (subj, ok, n, gemIf) => { award(ok * (subj === 'space' ? 1 : 2), ok * 4); if (window.Coach) Coach.track('a:' + subj, ok / n); acadTask(subj, { mistakes: n - ok }); if (gemIf && ok === n) awardGems(1, 'за игру без ошибок'); SND.win(); if (ok === n) confetti(35); };
  const result = (box, ok, n, again, subj, extra = '') => { box.innerHTML = `<div class="center g-result"><div class="big-emoji">${ok === n ? '🏆' : ok >= n * 0.6 ? '🥈' : '🐾'}</div><h2>${esc(S.kid)}, ${ok} из ${n}!</h2>${extra}<div class="row-btns"><button class="btn big pink" id="agag">Ещё раз</button><button class="btn" data-go="subject" data-arg="${subj}">К предмету</button></div></div>`; $('#agag').addEventListener('click', () => go(again)); };

  /* ================= 🪐 Собери Солнечную систему ================= */
  const PLANETS = [
    { n: 'Меркурий', c: '#B5A79A', r: 9, clue: 'Самая маленькая планета и ближайшая к Солнцу' },
    { n: 'Венера', c: '#E8C67A', r: 13, clue: 'Самая горячая планета — жарче, чем Меркурий!' },
    { n: 'Земля', c: '#4C9BE8', r: 13, clue: 'Единственная планета, где есть жизнь и океаны воды' },
    { n: 'Марс', c: '#D2603A', r: 11, clue: 'Красная планета с самым высоким вулканом — Олимпом' },
    { n: 'Юпитер', c: '#D9A66B', r: 26, clue: 'Самая большая планета с Большим красным пятном' },
    { n: 'Сатурн', c: '#E6CB8A', r: 22, ring: true, clue: 'Планета с самыми красивыми яркими кольцами' },
    { n: 'Уран', c: '#8FD8E0', r: 17, clue: 'Ледяной гигант, который вращается «лёжа на боку»' },
    { n: 'Нептун', c: '#4B6FE0', r: 17, clue: 'Самая далёкая планета с сильнейшими ветрами' },
  ];
  const planetSVG = (p, s = 1) => { const R = p.r * s, W = (R + (p.ring ? R * 0.7 : 0)) * 2 + 4; return `<svg viewBox="${-W / 2} ${-R - 2} ${W} ${R * 2 + 4}" width="${W}" height="${R * 2 + 4}" aria-hidden="true">${p.ring ? `<ellipse rx="${R * 1.65}" ry="${R * 0.45}" fill="none" stroke="#C9A65A" stroke-width="${R * 0.18}"/>` : ''}<circle r="${R}" fill="${p.c}"/><circle r="${R}" fill="url(#pl-sh)"/><circle cx="${-R * 0.35}" cy="${-R * 0.35}" r="${R * 0.25}" fill="#fff" opacity=".35"/>${p.ring ? `<path d="M${-R * 1.65} 0 A${R * 1.65} ${R * 0.45} 0 0 0 ${R * 1.65} 0" fill="none" stroke="#C9A65A" stroke-width="${R * 0.18}"/>` : ''}</svg>`; };
  SCREENS.solar = () => {
    let next = 0, miss = 0, stage = 1, ok = 0; const order = shuffle(PLANETS.map((p, i) => i));
    app.innerHTML = `${topbar('🪐 Собери Солнечную систему', 'subject')}<div class="page solar"><svg width="0" height="0" style="position:absolute"><defs><radialGradient id="pl-sh" cx="35%" cy="35%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".35"/></radialGradient></defs></svg>
      <p class="center" id="sinfo">Расставь планеты по порядку от Солнца: нажимай на ту, что ближе всего!</p><div class="orbit" id="orb"><div class="sun">☀️</div>${PLANETS.map((_, i) => `<div class="slot" data-i="${i}"></div>`).join('')}</div><div class="pl-pool" id="pool">${order.map(i => `<button class="pl" data-i="${i}">${planetSVG(PLANETS[i], 0.9)}<small>${PLANETS[i].n}</small></button>`).join('')}</div><div id="sres"></div></div>`;
    back('space');
    $$('.pl').forEach(b => b.addEventListener('click', () => {
      if (stage !== 1 || b.disabled) return; const i = +b.dataset.i;
      if (i !== next) { miss++; SND.bad(); shake(b); toast(`${PLANETS[i].n} — не ${next + 1}-я от Солнца. Подумай ещё!`); return; }
      SND.ok(); b.disabled = true; b.classList.add('used'); $(`.slot[data-i="${i}"]`).innerHTML = planetSVG(PLANETS[i], 0.8) + `<small>${PLANETS[i].n}</small>`; $(`.slot[data-i="${i}"]`).classList.add('fill'); next++;
      if (next === PLANETS.length) { stage = 2; $('#sinfo').innerHTML = `Порядок собран${miss ? ` (ошибок: ${miss})` : ' без ошибок'}! А теперь — <b>угадай планету по улике</b>.`; setTimeout(riddles, 900); }
    }));
    const riddles = () => {
      const qs = shuffle(PLANETS).slice(0, 5); let k = 0;
      $('#pool').innerHTML = ''; const ask = () => {
        const q = qs[k], opts = shuffle([q, ...shuffle(PLANETS.filter(p => p !== q)).slice(0, 3)]);
        $('#sres').innerHTML = `<div class="q-case">🔎 Улика ${k + 1} из 5: <b>${q.clue}</b></div><div class="opts">${opts.map(p => `<button class="opt pl-opt" data-n="${p.n}">${planetSVG(p, 0.6)} ${p.n}</button>`).join('')}</div>`;
        $$('#sres .opt').forEach(b => b.addEventListener('click', () => { const r = b.dataset.n === q.n; b.classList.add(r ? 'right' : 'wrong'); $(`#sres .opt[data-n="${q.n}"]`).classList.add('right'); if (r) { ok++; SND.ok(); } else SND.bad(); $$('#sres .opt').forEach(x => { x.disabled = true; }); setTimeout(() => { k++; k < 5 ? ask() : fin(); }, 1100); }));
      }; ask();
    };
    const fin = () => { const score = ok + (miss === 0 ? 3 : miss <= 2 ? 2 : 1), n = 8; best('solar', score, n); done('space', score, n, true); result($('#sres'), score, n, 'solar', 'space', `<p>Порядок: ${miss ? 'ошибок ' + miss : 'без ошибок'} · улики: ${ok} из 5</p><p class="small">Запоминалка: «<b>М</b>ы <b>В</b>се <b>З</b>наем: <b>М</b>ама <b>Ю</b>ли <b>С</b>ела <b>У</b>тром <b>Н</b>а пилюли».</p>`); };
  };

  /* ================= 🚶 Прогулка по городу ================= */
  const WALK = [
    { at: '🏠 Подъезд', s: 'Ты выходишь из подъезда. Незнакомый дядя говорит: «Я друг твоей мамы, она попросила тебя забрать. Садись в машину!»', a: [['Не сяду. Скажу «Я вас не знаю!» и вернусь домой/позвоню маме', 1, 'Верно! Мама сама предупредила бы тебя. С незнакомцами никуда не идём, даже если они знают твоё имя.'], ['Сяду — он же знает маму', 0, 'Опасно! Мошенники могут назвать имя мамы. Без договорённости с родителями ни с кем не уезжаем.'], ['Спрошу, как зовут маму, и сяду', 0, 'Имя мамы можно узнать где угодно. Это не доказательство.']] },
    { at: '🚦 Перекрёсток', s: 'Светофор мигает зелёным, а автобус на той стороне уже подъезжает к остановке.', a: [['Подожду следующего зелёного', 1, 'Правильно! Автобус будет и следующий, а жизнь одна.'], ['Быстро перебегу, пока мигает', 0, 'Мигающий зелёный значит «скоро красный». Машины могут тронуться.'], ['Перейду там, где нет машин, не по переходу', 0, 'Только по переходу и на зелёный.']] },
    { at: '🛒 Магазин', s: 'На кассе ты замечаешь, что потерялся от взрослых в большом магазине.', a: [['Останусь на месте или подойду к кассиру/охраннику', 1, 'Да! Работники магазина помогут найти родителей. Из магазина не уходим.'], ['Пойду искать маму на улице', 0, 'На улице тебя найти сложнее. Оставайся в магазине и обратись к сотруднику.'], ['Попрошу любого прохожего отвести меня домой', 0, 'Лучше обратиться к работнику магазина в форме или к охраннику.']] },
    { at: '🌳 Парк', s: 'Мальчик старше тебя предлагает показать «секретное место с котятами» в дальней части парка.', a: [['Откажусь и останусь там, где люди', 1, 'Верно! Никуда не уходим с малознакомыми, особенно в безлюдные места.'], ['Пойду — котята же!', 0, 'Это может быть уловкой. Котят можно посмотреть вместе со взрослыми.'], ['Пойду, но ненадолго', 0, 'Даже ненадолго опасно. Расскажи взрослым об этом предложении.']] },
    { at: '🏞️ Пруд', s: 'Весна, на пруду ещё лёд. Друзья зовут прокатиться по льду до середины.', a: [['Не пойду и отговорю друзей', 1, 'Правильно! Весенний лёд тонкий и опасный.'], ['Пойду, если лёд толстый у берега', 0, 'У берега лёд может быть толще, чем в середине. Весной на лёд не выходим.'], ['Пойду первым и проверю', 0, 'Проверять лёд собой — очень опасно.']] },
    { at: '📱 Телефон', s: 'Приходит сообщение: «Ты выиграл телефон! Пришли код из СМС, чтобы получить приз».', a: [['Не отвечу и покажу родителям', 1, 'Да! Коды из СМС — секрет. Это мошенники.'], ['Пришлю код — приз же!', 0, 'Так мошенники крадут аккаунты и деньги. Коды никому не сообщаем.'], ['Спрошу у них, правда ли это', 0, 'Мошенники всегда скажут «правда». Лучше показать взрослому.']] },
    { at: '🏫 Школьный двор', s: 'Одноклассники смеются над новенькой и отбирают её рюкзак.', a: [['Позову учителя и поддержу новенькую', 1, 'Так поступают настоящие друзья! Свидетель может остановить травлю.'], ['Посмеюсь вместе со всеми', 0, 'Это делает травлю сильнее. Новенькой очень больно.'], ['Пройду мимо, это не моё дело', 0, 'Молчание помогает обидчикам. Сказать взрослому — правильно.']] },
    { at: '🔑 Дома один', s: 'Ты дома один. Звонят в дверь: «Откройте, это проверка газа!»', a: [['Не открою, позвоню родителям', 1, 'Верно! Дверь никому не открываем, когда дома один, даже «мастерам».'], ['Открою — это же газ', 0, 'Настоящие проверки договариваются со взрослыми заранее.'], ['Скажу, что дома никого нет из взрослых', 0, 'Не говорим, что дома один. Можно сказать «Мама сейчас не может подойти» и позвонить ей.']] },
  ];
  SCREENS.citywalk = () => {
    const pool = WALK.concat(window.EXTRA_WALK || []), seenW = (S.agSeen = S.agSeen || {}).walk = S.agSeen.walk || {}, path = shuffle(pool).sort((x, y) => (seenW[x.at] || 0) - (seenW[y.at] || 0)).slice(0, 6); path.forEach(w => { seenW[w.at] = (seenW[w.at] || 0) + 1; }); save(); let k = 0, hearts = 0;
    app.innerHTML = `${topbar('🚶 Прогулка по городу', 'subject')}<div class="page walk"><div class="walk-map">${path.map((p, i) => `<span class="ws" data-i="${i}">${p.at.split(' ')[0]}</span>`).join('<i class="wl"></i>')}<div class="walk-cat" id="wcat">${myCat({ smile: true })}</div></div><div class="pill center-pill">🛡️ Безопасных решений: <b id="wh">0</b></div><div id="wq"></div></div>`;
    back('safety');
    const moveCat = () => { const s = $(`.ws[data-i="${k}"]`); if (s) { const m = $('.walk-map').getBoundingClientRect(), r = s.getBoundingClientRect(); $('#wcat').style.left = (r.left - m.left + r.width / 2) + 'px'; } $$('.ws').forEach((x, i) => x.classList.toggle('now', i === k)); };
    const ask = () => {
      moveCat(); const p = path[k], opts = shuffle(p.a.map((o, i) => ({ o, i })));
      $('#wq').innerHTML = `<h3>${p.at}</h3><div class="q-case">${p.s}</div><div class="opts">${opts.map(x => `<button class="opt wide case-opt" data-i="${x.i}">${x.o[0]}</button>`).join('')}</div><div id="wwhy"></div>`;
      $$('#wq .opt').forEach(b => b.addEventListener('click', () => {
        const o = p.a[+b.dataset.i], r = o[1] === 1; $$('#wq .opt').forEach(x => { x.disabled = true; if (p.a[+x.dataset.i][1] === 1) x.classList.add('right'); }); if (!r) b.classList.add('wrong');
        if (r) { hearts++; SND.ok(); } else SND.bad(); $('#wh').textContent = hearts; $(`.ws[data-i="${k}"]`).classList.add(r ? 'ok' : 'no');
        $('#wwhy').innerHTML = `<div class="${r ? 'fb' : 'fb bad'}">${r ? '✔ Безопасно!' : 'Стоп!'}</div><p>${o[2]}</p><button class="btn big pink" id="wn">${k + 1 < path.length ? 'Идём дальше →' : 'Домой 🏠'}</button>`;
        $('#wn').addEventListener('click', () => { k++; k < path.length ? ask() : fin(); });
      }));
    };
    const fin = () => { best('citywalk', hearts, path.length); done('safety', hearts, path.length, true); result($('#wq'), hearts, path.length, 'citywalk', 'safety', `<p>${hearts === path.length ? 'Ты прошёл весь город безопасно!' : 'Повтори правила — и прогулка станет совсем безопасной.'}</p><p class="small">Если что-то случилось — <b>112</b>. Поговорить: детский телефон доверия <b>8-800-2000-122</b>.</p>`); };
    ask(); window.addEventListener('resize', moveCat); cleanups.push(() => window.removeEventListener('resize', moveCat));
  };

  /* ================= 📰 Фейк или правда? ================= */
  const CLAIMS = [
    ['Осьминог может открыть банку с закрученной крышкой', 1, 'Правда: учёные видели это в аквариумах.'],
    ['Учёные доказали: кто ест морковку, видит в темноте, как кошка', 0, 'Фейк. Морковь полезна для глаз, но ночного зрения не даёт. «Учёные доказали» без ссылки — тревожный знак.'],
    ['На Луне нет воздуха, поэтому там тихо — звук не передаётся', 1, 'Правда: звуку нужен воздух или другая среда.'],
    ['ШОК!!! Завтра отменят все уроки навсегда! Перешли всем!', 0, 'Фейк: капслок, «ШОК» и «перешли всем» — признаки фейка. Новости проверяем на официальных сайтах.'],
    ['Гепард бегает быстрее 100 км/ч на короткой дистанции', 1, 'Правда: это самое быстрое животное на суше.'],
    ['Летучие мыши совсем слепые', 0, 'Фейк-миф: летучие мыши видят, а в темноте ещё и пользуются эхолокацией.'],
    ['Этот чудо-браслет за один день делает любого отличником', 0, 'Фейк: обещание «за один день» и «любого» — уловка рекламы.'],
    ['Вода на Земле может быть твёрдой, жидкой и газом', 1, 'Правда: лёд, вода и пар.'],
    ['Одна девочка написала в чате, что пчёлы делают молоко', 0, 'Фейк: пчёлы делают мёд. И «кто-то написал в чате» — не источник.'],
    ['Свет от Солнца летит до Земли около 8 минут', 1, 'Правда: примерно 8 минут 20 секунд.'],
    ['Фото кота размером со слона — значит, такие коты существуют', 0, 'Фейк: фото можно изменить или нарисовать нейросетью.'],
    ['Пингвины живут на Северном полюсе вместе с белыми медведями', 0, 'Фейк: пингвины живут в Южном полушарии, белые медведи — на севере.'],
    ['У человека в теле больше 200 костей', 1, 'Правда: у взрослого около 206 костей.'],
    ['Только сегодня! Бесплатно получи 1000 кристаллов — введи пароль от игры', 0, 'Фейк и мошенники: пароли никому не сообщаем.'],
    ['Растения выделяют кислород', 1, 'Правда: днём на свету растения выделяют кислород.'],
    ['Если плюнуть в колодец, вода в нём станет солёной', 0, 'Фейк: это просто поговорка, а не факт.'],
    ['Кит — это не рыба, а млекопитающее', 1, 'Правда: киты дышат воздухом и кормят детёнышей молоком.'],
    ['Мой друг сказал, что его брат видел дракона во дворе', 0, 'Фейк: «друг сказал, что брат видел» — пересказ без доказательств.'],
    ['Молния может ударить в одно и то же место дважды', 1, 'Правда: высокие здания получают удары молнии много раз в год.'],
    ['Новость без автора, даты и источника, зато с очень громким заголовком', 0, 'Фейк-признаки: нет автора, даты и источника. Такую новость надо проверить.'],
  ];
  SCREENS.fakenews = () => {
    const pool = CLAIMS.concat(window.EXTRA_CLAIMS || []), seenC = (S.agSeen = S.agSeen || {}).claims = S.agSeen.claims || {}, qs = shuffle(pool).sort((x, y) => (seenC[x[0]] || 0) - (seenC[y[0]] || 0)).slice(0, 10); qs.forEach(q => { seenC[q[0]] = (seenC[q[0]] || 0) + 1; }); save(); let k = 0, ok = 0, t0 = 0, tid = null;
    app.innerHTML = `${topbar('📰 Фейк или правда?', 'subject')}<div class="page fake"><div class="g-dots">${qs.map(() => '<i></i>').join('')}</div><p class="center small">Решай быстро, но с умом: на каждое утверждение — 12 секунд.</p><div id="fq"></div></div>`;
    back('think'); cleanups.push(() => clearInterval(tid));
    const ask = () => {
      const q = qs[k]; t0 = Date.now();
      $('#fq').innerHTML = `<div class="fake-card"><div class="fake-timer"><i id="ft"></i></div><div class="fake-text">«${q[0]}»</div></div><div class="opts"><button class="opt" data-v="1">✅ Правда</button><button class="opt" data-v="0">🚫 Фейк</button></div><div id="fwhy"></div>`;
      const pick = v => {
        clearInterval(tid); const r = v === q[1]; $$('#fq .opt').forEach(b => { b.disabled = true; if (+b.dataset.v === q[1]) b.classList.add('right'); else if (+b.dataset.v === v) b.classList.add('wrong'); });
        $$('.g-dots i')[k].className = r ? 'ok' : 'bad'; if (r) { ok++; SND.ok(); } else SND.bad();
        $('#fwhy').innerHTML = `<div class="${r ? 'fb' : 'fb bad'}">${v === -1 ? '⏰ Время вышло!' : r ? '✔ Верно!' : 'Не совсем.'}</div><p>${q[2]}</p><button class="btn big pink" id="fn">${k + 1 < qs.length ? 'Дальше →' : 'Итоги 🏆'}</button>`;
        $('#fn').addEventListener('click', () => { k++; k < qs.length ? ask() : fin(); });
      };
      $$('#fq .opt').forEach(b => b.addEventListener('click', () => pick(+b.dataset.v)));
      tid = setInterval(() => { const p = (Date.now() - t0) / 12000, el = $('#ft'); if (el) el.style.width = Math.max(0, 100 - p * 100) + '%'; if (p >= 1) pick(-1); }, 100);
    };
    const fin = () => { best('fakenews', ok, qs.length); done('think', ok, qs.length, true); result($('#fq'), ok, qs.length, 'fakenews', 'think', '<p class="small">Правило сыщика: <b>кто автор? когда? какие доказательства?</b> Громкий заголовок — повод проверить.</p>'); };
    ask();
  };

  const gb = g => (S.agames || {})[g], gbadge = g => () => gb(g) != null ? 'рекорд ' + Math.round(gb(g) * 100) + '%' : '';
  /* ================= 🌍 Помоги или навреди? ================= */
  SCREENS.helpharm = () => {
    const G = (((window.SUBJECTS || {}).world || {}).game || []).concat(window.EXTRA_HELPHARM || []); if (!G.length) return go('subject', 'world');
    const qs = shuffle(G).slice(0, 10); let k = 0, ok = 0;
    app.innerHTML = `${topbar('🌍 Помоги или навреди?', 'subject')}<div class="page fake"><div class="g-dots">${qs.map(() => '<i></i>').join('')}</div><div id="hq"></div></div>`; back('world');
    const fin = () => { best('helpharm', ok, qs.length); done('world', ok, qs.length, true); result($('#hq'), ok, qs.length, 'helpharm', 'world', '<p class="small">Каждое доброе дело делает мир чуточку лучше 💚</p>'); };
    const ask = () => {
      const q = qs[k];
      $('#hq').innerHTML = `<div class="fake-card"><div class="fake-text">${q.t}</div></div><div class="opts"><button class="opt" data-v="1">💚 Помогает</button><button class="opt" data-v="0">💔 Вредит</button></div><div id="hwhy"></div>`;
      $$('#hq .opt').forEach(b => b.addEventListener('click', () => {
        const r = (b.dataset.v === '1') === !!q.ok;
        $$('#hq .opt').forEach(x => { x.disabled = true; if ((x.dataset.v === '1') === !!q.ok) x.classList.add('right'); }); if (!r) b.classList.add('wrong');
        $$('.g-dots i')[k].className = r ? 'ok' : 'bad'; if (r) { ok++; SND.ok(); } else SND.bad();
        $('#hwhy').innerHTML = `<p>${q.why}</p><button class="btn big pink" id="hn">${k + 1 < qs.length ? 'Дальше →' : 'Итоги 🏆'}</button>`;
        $('#hn').addEventListener('click', () => { k++; k < qs.length ? ask() : fin(); });
      }));
    };
    ask();
  };
  /* ================= 🫀 Собери тело ================= */
  SCREENS.bodybuild = () => {
    const G = ((window.SUBJECTS || {}).body || {}).game || []; if (!G.length) return go('subject', 'body');
    const sys = [...new Set(G.map(x => x.system))], items = shuffle(G).slice(0, 10); let k = 0, ok = 0;
    app.innerHTML = `${topbar('🫀 Собери тело', 'subject')}<div class="page"><p class="center small">К какой системе органов это относится?</p><div class="g-dots">${items.map(() => '<i></i>').join('')}</div><div id="bq"></div></div>`; back('body');
    const fin = () => { best('bodybuild', ok, items.length); done('body', ok, items.length, true); result($('#bq'), ok, items.length, 'bodybuild', 'body'); };
    const ask = () => {
      const x = items[k];
      $('#bq').innerHTML = `<div class="fake-card"><div class="big-emoji">${x.emoji}</div><div class="fake-text">${x.organ}</div></div><div class="opts">${sys.map(s2 => `<button class="opt" data-s="${s2}">${s2}</button>`).join('')}</div><div id="bwhy"></div>`;
      $$('#bq .opt').forEach(b => b.addEventListener('click', () => {
        const r = b.dataset.s === x.system;
        $$('#bq .opt').forEach(y => { y.disabled = true; if (y.dataset.s === x.system) y.classList.add('right'); }); if (!r) b.classList.add('wrong');
        $$('.g-dots i')[k].className = r ? 'ok' : 'bad'; if (r) { ok++; SND.ok(); } else SND.bad();
        $('#bwhy').innerHTML = `<p>💡 ${x.fact}</p><button class="btn big pink" id="bn">${k + 1 < items.length ? 'Дальше →' : 'Итоги 🏆'}</button>`;
        $('#bn').addEventListener('click', () => { k++; k < items.length ? ask() : fin(); });
      }));
    };
    ask();
  };
  /* ================= 🧘 Практики с таймером (ЗОЖ) ================= */
  SCREENS.practice2 = id => {
    const P = ((window.SUBJECTS || {}).health || {}).practices || [], pr = P.find(x => x.id === id);
    if (!pr) {
      app.innerHTML = `${topbar('🧘 Практики', 'subject')}<div class="page"><p class="center">Короткие упражнения для спокойствия и бодрости. Котик подскажет каждый шаг.</p><div class="rp-list">${P.map(x => `<button class="rp-card" data-p="${x.id}"><span class="ri">${x.icon}</span><b>${x.title}</b><small>${x.minutes} мин</small><span class="stars">${(S.practices || {})[x.id] ? '✔ ' + S.practices[x.id] + ' раз' : ''}</span></button>`).join('')}</div></div>`;
      back('health'); $$('[data-p]').forEach(b => b.addEventListener('click', () => go('practice2', b.dataset.p))); return;
    }
    let i = -1, tid = null, left = 0, t0 = 0, paused = false;
    const ready = /[аяь]$/i.test(S.kid || '') ? 'Готова' : 'Готов';
    app.innerHTML = `${topbar(pr.icon + ' ' + pr.title, 'practice2')}<div class="page prac"><div class="prac-ring" id="pring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" class="pr-bg"/><circle cx="50" cy="50" r="45" class="pr-fg" id="pfg"/></svg><div class="prac-cat">${myCat({ smile: true })}</div></div><div class="prac-text" id="ptext">Устройся удобно. ${ready}?</div><div class="row-btns" style="justify-content:center"><button class="btn big pink" id="pgo">▶ Начать</button><button class="btn" id="ppause" hidden>⏸ Пауза</button><button class="btn" id="pnext" hidden>Дальше ⏭</button></div><p class="small center">Не спеши: делай каждый шаг спокойно. Можно поставить на паузу.</p></div>`;
    cleanups.push(() => clearTimeout(tid));
    const L = 2 * Math.PI * 45, fg = $('#pfg'); fg.style.strokeDasharray = L; fg.style.strokeDashoffset = L;
    const stepGo = () => {
      i++; if (!$('#ptext')) return;
      if (i >= pr.steps.length) {
        $('#ptext').innerHTML = '🌟 Готово! Как ты себя чувствуешь?'; $('#pring').className = 'prac-ring';
        S.practices = S.practices || {}; S.practices[pr.id] = (S.practices[pr.id] || 0) + 1; S.agames = S.agames || {}; S.agames.practices = Math.min(1, Object.keys(S.practices).length / (P.length || 1)); save();
        award(3, 8); if (window.Coach) Coach.track('a:health', 1); acadTask('health', { mistakes: 0 }); SND.win();
        $('#pgo').hidden = false; $('#pgo').textContent = 'Ещё раз'; $('#ppause').hidden = $('#pnext').hidden = true; return;
      }
      const s = pr.steps[i], dur = Math.max(6, Math.round(s.sec * 1.8)); $('#ptext').textContent = s.text; left = dur; // спокойный темп: шаг не короче 6 секунд
      fg.style.transition = 'none'; fg.style.strokeDashoffset = L; void fg.getBoundingClientRect(); fg.style.transition = `stroke-dashoffset ${dur}s linear`; fg.style.strokeDashoffset = 0;
      $('#pring').className = 'prac-ring ' + (/вдох/i.test(s.text) ? 'in' : /выдох/i.test(s.text) ? 'out' : '');
      tid = setTimeout(stepGo, dur * 1000); t0 = Date.now();
    };
    $('#pgo').addEventListener('click', () => { $('#pgo').hidden = true; $('#ppause').hidden = $('#pnext').hidden = false; i = -1; paused = false; stepGo(); });
    $('#ppause').addEventListener('click', () => {
      if (!paused) { paused = true; clearTimeout(tid); left = Math.max(1, left - (Date.now() - t0) / 1000); const cs = getComputedStyle(fg).strokeDashoffset; fg.style.transition = 'none'; fg.style.strokeDashoffset = cs; $('#ppause').textContent = '▶ Продолжить'; }
      else { paused = false; fg.style.transition = `stroke-dashoffset ${left}s linear`; fg.style.strokeDashoffset = 0; tid = setTimeout(stepGo, left * 1000); t0 = Date.now(); $('#ppause').textContent = '⏸ Пауза'; }
    });
    $('#pnext').addEventListener('click', () => { clearTimeout(tid); paused = false; $('#ppause').textContent = '⏸ Пауза'; stepGo(); });
  };

  const add = (id, x) => { const s = (window.SUBJECTS || {})[id]; if (s) s.extras = [...(s.extras || []).filter(e => e.id !== x.id), x]; };
  add('space', { id: 'solar', icon: '🪐', name: 'Собери Солнечную систему', run: () => go('solar'), badge: gbadge('solar'), prog: () => gb('solar') || 0 });
  add('safety', { id: 'citywalk', icon: '🚶', name: 'Прогулка по городу', run: () => go('citywalk'), badge: gbadge('citywalk'), prog: () => gb('citywalk') || 0 });
  add('think', { id: 'fakenews', icon: '📰', name: 'Фейк или правда?', run: () => go('fakenews'), badge: gbadge('fakenews'), prog: () => gb('fakenews') || 0 });
  add('world', { id: 'helpharm', icon: '💚', name: 'Помоги или навреди?', run: () => go('helpharm'), badge: gbadge('helpharm'), prog: () => gb('helpharm') || 0 });
  add('body', { id: 'bodybuild', icon: '🧩', name: 'Собери тело', run: () => go('bodybuild'), badge: gbadge('bodybuild'), prog: () => gb('bodybuild') || 0 });
  add('health', { id: 'practice2', icon: '🧘', name: 'Практики с таймером', run: () => go('practice2'), badge: () => { const n = Object.keys(S.practices || {}).length; return n ? 'освоено: ' + n : ''; }, prog: () => gb('practices') || 0 });
  ['solar', 'citywalk', 'fakenews', 'helpharm', 'bodybuild', 'practice2'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { PLANETS, get WALK() { return WALK.concat(window.EXTRA_WALK || []); }, CLAIMS };
})();
window.AcadGames = AcadGames;
