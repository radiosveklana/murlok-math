/* accounts.js — личные кабинеты (v24): родитель (почта + код, согласие по 152-ФЗ), ребёнок (семейный код + картинка-ПИН),
   приоритеты родителя и опрос ребёнка, рефералы, начисления/восстановление от админа, переезд на murlok.tech-wave.ru.
   Облачная копия и друзья — только у детей, привязанных к кабинету родителя (с согласием). */
'use strict';
const Accounts = (() => {
  const HOME = 'https://murlok.tech-wave.ru/';
  const PK = 'murlok-parent', AK = 'murlok-acc:' + KEY, RK = 'murlok-ref';
  const ls = { get: k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
  const parent = () => ls.get(PK), child = () => ls.get(AK);
  const linked = () => !!(child() && child().token);
  const PICS = ['🐱', '🐶', '🦊', '🐼', '🦄', '🐸', '🍩', '🍓', '⭐', '🚀', '🌈', '🎈'];
  const PRIOS = [['mul', '✖️ Умножение и деление'], ['eq', '📦 Уравнения'], ['math4', '📐 Вся математика 4 класса'], ['read', '⚡ Скорочтение'], ['think', '🧠 Логика и мышление'], ['talk', '💬 Общение'], ['safety', '🛡️ Безопасность'], ['obzh', '⛑️ ОБЖ'], ['world', '🌍 Окружающий мир'], ['space', '🚀 Космос'], ['body', '🫀 Тело и здоровье'], ['creative', '💡 Креативность'], ['stories', '🌟 Мотивация']];
  async function api(p, body, tok) { const r = await fetch(CLOUD + '/acc/' + p, { method: body ? 'POST' : 'GET', headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(tok ? { authorization: 'Bearer ' + tok } : {}) }, body: body ? JSON.stringify(body) : undefined }); const d = await r.json().catch(() => ({})); if (!r.ok) throw Object.assign(new Error(d.error || r.status), { code: d.error, d }); return d; }

  /* ---------- реферальная метка из ссылки и переезд с github.io ---------- */
  try { const q = new URLSearchParams(location.search), ref = q.get('ref'); if (ref) { ls.set(RK, ref.toUpperCase().slice(0, 8)); history.replaceState(null, '', location.pathname + location.hash); } } catch (e) { }
  try { const m = location.hash.match(/restore=([A-Z0-9]{8})/); if (m && !S.kid) { history.replaceState(null, '', location.pathname); cloudRestore(m[1]).catch(() => { }); } } catch (e) { }
  if (/github\.io$/.test(location.hostname)) setTimeout(() => {
    if ($('.modal')) return; const m = modal(`<div class="big-emoji">🏡✨</div><h2>Мы переехали!</h2><p>«Мурлок и Ко» теперь живёт по новому адресу: <b>murlok.tech-wave.ru</b>. Там появятся личные кабинеты, и прогресс будет надёжно храниться на российском сервере.</p><p>Весь твой прогресс переедет вместе с тобой 🐾</p><div class="row-btns"><button class="btn pink" id="mvgo">Переехать</button><button class="btn" data-close>Позже</button></div>`);
    $('#mvgo', m.el).addEventListener('click', async () => { $('#mvgo', m.el).textContent = 'Собираем вещи…'; let code = ''; if (S.kid) { code = cloudCode(); cloudDirty = true; await fetch('https://level.tech-wave.ru/murlok-api/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, data: { ...S, chatLog: [] } }) }).catch(() => { }); } location.href = HOME + (code ? '#restore=' + code : ''); });
  }, 2500);

  /* ---------- облако и друзья — только для детей из кабинета (согласие родителя) ---------- */
  const cp = cloudPush; cloudPush = function () { if (!linked()) return; return cp.apply(this, arguments); };
  const ac = linked; window.accLinked = ac;

  /* ---------- первый экран: вход для взрослого и для ребёнка с семейным кодом ---------- */
  { const h = SCREENS.hello; SCREENS.hello = arg => { h(arg); const pg = $('.page', app) || app; pg.insertAdjacentHTML('afterbegin', `<div class="acc-entry"><button class="btn" id="aparent">👨‍👩‍👧 Я взрослый: вход и регистрация</button><button class="btn" id="achild">🧒 У меня есть семейный код</button><a class="link small" href="about/">Что это за игра? Рассказ для родителей</a></div>`); $('#aparent').addEventListener('click', () => go('pauth')); $('#achild').addEventListener('click', () => go('clogin')); }; }

  /* ---------- вход родителя ---------- */
  SCREENS.pauth = arg => {
    const gateNext = /^gate:/.test(arg || '') ? arg.slice(5) : '';
    if (parent() && !gateNext) return go('pcab');
    app.innerHTML = `${topbar('👨‍👩‍👧 Вход для взрослых', S.kid ? 'home' : 'hello')}<div class="page acc"><div class="card"><h2>Личный кабинет родителя</h2><p class="small">Кабинет нужен, чтобы прогресс ребёнка хранился в облаке и переносился между устройствами, были доступны друзья, отчёты и подстройка программы. Вход — по почте, без пароля.</p>
      <div id="st1"><input id="aem" class="nmi" type="email" placeholder="Ваша почта" autocomplete="email" value="${esc((parent() || {}).email || '')}">${gateNext ? '<p class="small">Пришлём код на почту взрослого — так ребёнок не откроет раздел сам.</p>' : ''}<button class="btn pink big" id="asend">Получить код на почту</button></div>
      <div id="st2" hidden><p>Мы отправили 6-значный код на <b id="aemail"></b>. Проверьте папку «Спам», если письма нет.</p><input id="acode" class="nmi" inputmode="numeric" maxlength="6" placeholder="Код из письма" autocomplete="one-time-code">
        <div id="acons" hidden><label class="tgl"><input type="checkbox" id="ac1"> Я — родитель (законный представитель) ребёнка и даю <a href="/consent.html" target="_blank" rel="noopener">согласие на обработку персональных данных</a> ребёнка и моих</label><label class="tgl"><input type="checkbox" id="ac2"> Я ознакомлен(а) с <a href="/privacy.html" target="_blank" rel="noopener">Политикой обработки персональных данных</a>, включая передачу текста сообщений нейросети для ответов котика</label></div>
        <button class="btn pink big" id="averify">Войти</button><button class="link" id="aback">Изменить почту</button></div>
      <div id="aerr" class="small err"></div></div></div>`;
    let email = '', isNew = false; const err = t => { $('#aerr').textContent = t || ''; };
    $('#asend').addEventListener('click', async () => { email = $('#aem').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return err('Проверьте адрес почты'); $('#asend').disabled = true; err('');
      try { const r = await api('start', { email, ref: ls.get(RK) }); isNew = r.isNew; $('#st1').hidden = true; $('#st2').hidden = false; $('#aemail').textContent = email; $('#acons').hidden = !isNew; $('#acode').focus(); }
      catch (e) { err({ slow: 'Слишком много попыток — попробуйте через час', mail: 'Не удалось отправить письмо, попробуйте позже', email: 'Проверьте адрес почты' }[e.code] || 'Нет связи с сервером'); } $('#asend').disabled = false; });
    $('#aback').addEventListener('click', () => { $('#st1').hidden = false; $('#st2').hidden = true; });
    $('#averify').addEventListener('click', async () => { const code = $('#acode').value.trim(); if (!/^\d{6}$/.test(code)) return err('Код — 6 цифр'); if (isNew && !($('#ac1').checked && $('#ac2').checked)) return err('Чтобы зарегистрироваться, нужно согласие (обе галочки)');
      try { const r = await api('verify', { email, code, consent: isNew ? true : undefined }); ls.set(PK, { token: r.token, email }); SND.win(); unlock(); if (S.kid && !S.pin) go('pinset', gateNext || 'pcab'); else if (gateNext) go(gateNext); else go('pcab', 'new'); }
      catch (e) { err({ code: 'Неверный код' + (e.d && e.d.left != null ? ` (осталось попыток: ${e.d.left})` : ''), expired: 'Код устарел — запросите новый', tries: 'Слишком много попыток — запросите новый код', consent: 'Нужно согласие' }[e.code] || 'Не получилось войти'); } });
  };

  /* ---------- кабинет родителя ---------- */
  const picHTML = id => `<div class="pinpick" id="${id}">${PICS.map((p, i) => `<button type="button" class="pp" data-i="${i}">${p}</button>`).join('')}</div><div class="small">Выберите 3 картинки по порядку — это ПИН ребёнка: <b class="pinshow">—</b></div>`;
  const bindPick = el => { const sel = []; $$('.pp', el).forEach(b => b.addEventListener('click', () => { if (sel.length >= 3) sel.length = 0; sel.push(+b.dataset.i); $('.pinshow', el.parentElement).textContent = sel.map(i => PICS[i]).join(' ') || '—'; SND.tap(); })); return () => sel.slice(); };
  const share = (url, title) => { if (navigator.share) navigator.share({ title, url }).catch(() => { }); else { navigator.clipboard && navigator.clipboard.writeText(url); toast('Ссылка скопирована'); } };
  SCREENS.pcab = async arg => {
    const P = parent(); if (!P) return go('pauth'); if (!adultOk()) return gate('pcab');
    app.innerHTML = `${topbar('👨‍👩‍👧 Личный кабинет', 'parents')}<div class="page acc"><p class="center small">Загрузка…</p></div>`;
    let F; try { F = (await api('family', null, P.token)).family; } catch (e) { if (e.code === 'auth') { ls.set(PK, null); return go('pauth'); } $('.acc').innerHTML = '<div class="card"><p>Нет связи с сервером.</p></div>'; return; }
    if (curScreen !== 'pcab') return;
    const here = S.kid && !linked(), refUrl = c => HOME + 'r/' + c;
    $('.acc').innerHTML = `
      <div class="acc-who"><span>Вы вошли как <b>${esc(F.email)}</b></span><button class="btn sm" id="aout2">🚪 Выйти</button></div>
      <div class="card"><h2>Семья ${esc(F.email)}</h2><p>Семейный код для входа детей на других устройствах: <span class="ccode">${F.code}</span></p><p class="small">Ребёнок на новом устройстве нажимает «У меня есть семейный код», выбирает себя и вводит свою картинку-ПИН.</p></div>
      ${here ? `<div class="card hl"><h3>📲 Прогресс на этом устройстве</h3><p><b>${esc(S.kid)}</b>, котик ${esc(S.name)}: ⭐ ${S.xp} опыта, дел ${S.cases}. Привязать его к кабинету, чтобы он сохранялся в облаке?</p>${picHTML('pk0')}<button class="btn pink" id="linkhere">Привязать к кабинету</button></div>` : ''}
      <div class="card"><h3>Дети</h3>${F.children.length ? F.children.map(k => `<div class="kid-row"><div class="kr-cat">${catSVG({ fur: FURS[k.fur] ? k.fur : 'ginger', wear: k.wear || {}, smile: true })}</div><div class="kr-info"><b>${esc(k.name)}</b><small>⭐ ${k.xp} · дел ${k.cases} · ${k.minutesWeek} мин за неделю · ${k.lastSeen ? 'был(а) ' + new Date(k.lastSeen).toLocaleDateString('ru-RU') : 'ещё не занимался(ась)'}</small><small>${k.hasPin ? '🔐 картинка-ПИН есть' : '⚠️ без ПИН'} ${k.survey ? '· опрос пройден' : ''}</small>${k.ref ? `<small>Ссылка ребёнка для друзей: переходы ${k.ref.visits}, регистрации ${k.ref.regs} <button class="link" data-share="${refUrl(k.ref.code)}">поделиться</button></small>` : ''}</div><button class="btn sm" data-pin="${k.id}">ПИН</button></div>`).join('') : '<p class="small">Пока никого. Добавьте ребёнка ниже.</p>'}
        <details ${F.children.length ? '' : 'open'}><summary>➕ Добавить ребёнка</summary><input id="kname" class="nmi" placeholder="Имя ребёнка" maxlength="20">${picHTML('pk1')}<button class="btn pink" id="kadd">Добавить</button></details></div>
      <div class="card"><h3>🎯 Приоритетные направления</h3><p class="small">Котик-тренер будет чаще предлагать эти темы и ставить их выше в Академии.</p><div class="prio">${PRIOS.map(([id, n]) => `<label class="chip ${F.priorities.includes(id) ? 'on' : ''}"><input type="checkbox" value="${id}" ${F.priorities.includes(id) ? 'checked' : ''} hidden>${n}</label>`).join('')}</div><button class="btn" id="psave">Сохранить приоритеты</button></div>
      <div class="card"><h3>🔗 Реферальные ссылки</h3><p>Ваша ссылка: <code>${refUrl(F.ref.code)}</code> <button class="btn sm" data-share="${refUrl(F.ref.code)}">Поделиться</button></p><p class="small">Переходы: <b>${F.ref.visits}</b> · регистрации: <b>${F.ref.regs}</b>. Регистрация по ссылке не делает людей друзьями в игре — это только счётчик.</p></div>
      <div class="card"><h3>📄 Данные и согласие</h3><p class="small">Согласие от ${new Date(F.consent.at).toLocaleDateString('ru-RU')} (редакция ${F.consent.ver}). <a href="/privacy.html" target="_blank">Политика</a> · <a href="/consent.html" target="_blank">Согласие</a></p><div class="row-btns"><button class="btn" id="aexp">⬇️ Выгрузить все данные</button><button class="btn danger" id="adel">Удалить аккаунт и данные</button><button class="btn" id="aout">🚪 Выйти из кабинета</button></div></div>`;
    $$('[data-share]').forEach(b => b.addEventListener('click', () => share(b.dataset.share, 'Мурлок и Ко — тренажёр для детей')));
    $$('.prio .chip').forEach(l => l.addEventListener('click', e => { e.preventDefault(); const i = $('input', l); i.checked = !i.checked; l.classList.toggle('on', i.checked); }));
    $('#psave').addEventListener('click', async () => { const list = $$('.prio input:checked').map(i => i.value); await api('priorities', { list }, P.token).catch(() => { }); S.prio = list; save(); toast('Приоритеты сохранены'); });
    const g1 = $('#pk1') ? bindPick($('#pk1')) : null, g0 = $('#pk0') ? bindPick($('#pk0')) : null;
    const addKid = async (name, pin, linkHere) => {
      if (name.length < 2) return toast('Имя — хотя бы 2 буквы'); if (pin.length !== 3) return toast('Выберите 3 картинки для ПИН');
      try { const r = await api('child', { name, pin, cloudCode: linkHere ? cloudCode() : undefined, cat: linkHere ? S.name : '' }, P.token);
        if (linkHere) { ls.set(AK, { token: r.token, childId: r.child.id, familyCode: F.code, name }); S.cloudCode = r.child.cloudCode; save(); cloudDirty = true; cloudPush(); toast('Прогресс привязан и сохраняется в облаке ☁️'); }
        else toast(`${name} добавлен(а). На устройстве ребёнка: «У меня есть семейный код» → ${F.code}`); SND.win(); go('pcab'); }
      catch (e) { toast('Не получилось: ' + (e.code || 'ошибка')); } };
    $('#kadd') && $('#kadd').addEventListener('click', () => addKid($('#kname').value.trim(), g1(), false));
    $('#linkhere') && $('#linkhere').addEventListener('click', () => addKid(S.kid, g0(), true));
    $$('[data-pin]').forEach(b => b.addEventListener('click', () => { const m = modal(`<h2>Новая картинка-ПИН</h2>${picHTML('pk2')}<div class="row-btns"><button class="btn pink" id="pinok">Сохранить</button><button class="btn" data-close>Отмена</button></div>`); const g = bindPick($('#pk2', m.el)); $('#pinok', m.el).addEventListener('click', async () => { const pin = g(); if (pin.length !== 3) return toast('Выберите 3 картинки'); await api('child/' + b.dataset.pin + '/pin', { pin }, P.token).catch(() => { }); m.close(); toast('ПИН обновлён'); }); }));
    $('#aexp').addEventListener('click', async () => { const r = await fetch(CLOUD + '/acc/export', { headers: { authorization: 'Bearer ' + P.token } }); const blob = await r.blob(), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'murlok-family-data.json'; a.click(); });
    $('#adel').addEventListener('click', () => { const m = modal(`<h2>Удалить аккаунт?</h2><p>Будут удалены кабинет, дети и весь их облачный прогресс. Это нельзя отменить. Согласие будет отозвано.</p><input id="dconf" class="nmi" placeholder="Напишите УДАЛИТЬ"><div class="row-btns"><button class="btn danger" id="dgo">Удалить</button><button class="btn" data-close>Отмена</button></div>`); $('#dgo', m.el).addEventListener('click', async () => { if ($('#dconf', m.el).value.trim() !== 'УДАЛИТЬ') return toast('Напишите УДАЛИТЬ'); await api('revoke', { confirm: 'УДАЛИТЬ' }, P.token).catch(() => { }); ls.set(PK, null); ls.set(AK, null); m.close(); toast('Аккаунт и данные удалены'); go('home'); }); });
    $$('#aout, #aout2').forEach(b => b.addEventListener('click', () => parentOut()));
    if (arg === 'new' && !F.priorities.length) setTimeout(() => toast('Отметьте приоритетные направления — котик подстроит программу'), 800);
  };

  /* ---------- вход ребёнка на новом устройстве ---------- */
  SCREENS.clogin = () => {
    app.innerHTML = `${topbar('🧒 Вход по семейному коду', 'hello')}<div class="page acc"><div class="card center" id="cl1"><div class="big-emoji">🔑</div><p>Попроси у мамы или папы <b>семейный код</b> (он есть в их личном кабинете).</p><input id="fcode" class="nmi" maxlength="6" placeholder="Семейный код" style="text-align:center;letter-spacing:4px;text-transform:uppercase"><button class="btn pink big" id="fgo">Дальше</button></div><div id="cl2"></div></div>`;
    $('#fgo').addEventListener('click', async () => { const fc = $('#fcode').value.trim().toUpperCase(); if (fc.length !== 6) return toast('Код — 6 символов');
      let L; try { L = (await api('child/list', { familyCode: fc })).kids; } catch (e) { return toast(e.code === 'nf' ? 'Такого кода нет' : e.code === 'slow' ? 'Слишком много попыток' : 'Нет связи'); }
      $('#cl1').hidden = true; $('#cl2').innerHTML = `<div class="card center"><h3>Кто ты?</h3><div class="profs">${L.map(k => `<button class="prof" data-k="${k.id}"><span class="pc">${catSVG({ fur: FURS[k.fur] ? k.fur : 'ginger', wear: k.wear || {}, smile: true })}</span><b>${esc(k.name)}</b></button>`).join('')}</div></div>`;
      $$('[data-k]').forEach(b => b.addEventListener('click', () => { const kid = L.find(k => k.id === b.dataset.k); $('#cl2').innerHTML = `<div class="card center"><h3>${esc(kid.name)}, выбери свои 3 картинки</h3>${picHTML('pkc')}<button class="btn pink big" id="cgo">Войти</button></div>`; const g = bindPick($('#pkc'));
        $('#cgo').addEventListener('click', async () => { const pin = g(); if (kid.hasPin && pin.length !== 3) return toast('Выбери 3 картинки');
          try { const r = await api('child/login', { familyCode: fc, childId: kid.id, pin }); ls.set(AK, { token: r.token, childId: kid.id, familyCode: fc, name: r.name, needSurvey: r.needSurvey }); SND.win(); toast('Загружаем твой прогресс…'); cloudRestore(r.cloudCode).catch(() => { S.kid = r.name; S.cloudCode = r.cloudCode; save(); go('hello'); }); }
          catch (e) { SND.bad(); toast(e.code === 'pin' ? 'Не те картинки — попробуй ещё' : e.code === 'slow' ? 'Много попыток — попробуй позже' : 'Не получилось'); } }); })); });
  };

  /* ---------- опрос ребёнка: подстройка программы ---------- */
  const SURVEY = [
    { k: 'like', q: 'Что тебе нравится больше всего?', multi: true, a: ['🧮 Решать задачи', '🎲 Играть в игры', '📖 Читать истории', '🎨 Рисовать и придумывать', '🐾 Животные и природа', '🚀 Космос и наука', '💬 Общаться с друзьями'] },
    { k: 'mode', q: 'Как тебе интереснее учиться?', a: ['🎮 Через игры', '🕵️ Расследовать дела', '📚 Сначала разобраться в учебнике', '⚡ Быстро и на время'] },
    { k: 'hard', q: 'Что пока даётся труднее?', multi: true, a: ['✖️ Умножение и деление', '📦 Уравнения', '🚗 Задачи', '📏 Величины', '⚡ Быстро читать', '🙈 Ничего, всё легко'] },
    { k: 'me', q: 'Какой ты сыщик?', a: ['🦁 Смелый — люблю сложное', '🐢 Спокойный — люблю разбираться', '🦊 Хитрый — люблю загадки', '🐝 Трудолюбивый — люблю много решать'] },
    { k: 'time', q: 'Сколько хочешь заниматься в день?', a: ['10 минут', '20 минут', '30 минут', 'Сколько захочется'] },
    { k: 'dream', q: 'Кем хочешь стать или что научиться делать?', a: ['🧪 Учёным или изобретателем', '🩺 Врачом или спасателем', '🎨 Художником или писателем', '🏆 Спортсменом', '🚀 Космонавтом', '💻 Программистом', '🤔 Пока не знаю'] },
  ];
  SCREENS.survey = () => {
    const ans = {}; let i = 0;
    app.innerHTML = `${topbar('🐾 Познакомимся поближе', 'home')}<div class="page acc"><div class="card" id="sv"></div></div>`;
    const draw = () => { const Q = SURVEY[i], sel = new Set(ans[Q.k] ? [].concat(ans[Q.k]) : []);
      $('#sv').innerHTML = `<div class="small">Вопрос ${i + 1} из ${SURVEY.length}</div><h2>${Q.q}</h2><div class="sv-opts">${Q.a.map(x => `<button class="opt case-opt ${sel.has(x) ? 'right' : ''}" data-v="${x}">${x}</button>`).join('')}</div>${Q.multi ? '<p class="small">Можно выбрать несколько</p>' : ''}<div class="row-btns"><button class="btn pink" id="svn">${i + 1 < SURVEY.length ? 'Дальше →' : 'Готово ✔'}</button></div>`;
      $$('#sv .opt').forEach(b => b.addEventListener('click', () => { if (Q.multi) { sel.has(b.dataset.v) ? sel.delete(b.dataset.v) : sel.add(b.dataset.v); ans[Q.k] = [...sel]; } else ans[Q.k] = b.dataset.v; SND.tap(); draw(); }));
      $('#svn').addEventListener('click', async () => { if (!ans[Q.k] || (Array.isArray(ans[Q.k]) && !ans[Q.k].length)) return toast('Выбери ответ 🙂'); if (++i < SURVEY.length) return draw();
        S.profile = ans; save(); const A2 = child(); if (A2) { A2.needSurvey = false; ls.set(AK, A2); api('survey', { answers: ans }, A2.token).catch(() => { }); } award(5, 15); confetti(30); SND.win(); toast('Спасибо! Котик подстроит задания под тебя 🐾'); go('home'); }); };
    draw();
  };

  /* ---------- главная: начисления от админа, опрос, напоминание о кабинете ---------- */
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); try {
    const A2 = child();
    if (A2 && A2.needSurvey && !sessionStorage.getItem('svAsked')) { sessionStorage.setItem('svAsked', 1); const trySv = n => { if (curScreen !== 'home') return; if ($('.modal')) { if (n < 20) setTimeout(() => trySv(n + 1), 1500); return; } go('survey'); }; setTimeout(() => trySv(0), 2500); } // ждём, пока закроются окна (подарки, дипломы)
    if (A2 && S.cloudCode) api('pending', { code: S.cloudCode }).then(d => { (d.items || []).forEach(it => { if (it.type === 'grant') { S.candies += it.candies || 0; S.totalCandies += it.candies || 0; S.gems = (S.gems || 0) + (it.gems || 0); save(); updCandy(); setTimeout(() => { modal(`<div class="big-emoji">🎁</div><h2>Подарок от команды!</h2><p>${it.candies ? `+${it.candies} 🍬 ` : ''}${it.gems ? `+${it.gems} 💎` : ''}</p>${it.note ? `<p>${esc(it.note)}</p>` : ''}<button class="btn pink" data-close>Спасибо!</button>`); confetti(40); }, 1500); } if (it.type === 'restore') cloudRestore(S.cloudCode).catch(() => { }); }); }).catch(() => { });
    if (!A2 && S.kid && !$('.acc-nudge', app)) { const t = $('.tiles', app); if (t && (S.xp > 50)) t.insertAdjacentHTML('beforebegin', `<div class="acc-nudge" data-go="pauth">☁️ Попроси маму или папу открыть <b>личный кабинет</b> — тогда прогресс будет храниться в облаке и появятся друзья!</div>`); }
  } catch (e) { console.warn(e); } return r; }; }
  /* ---------- раздел для взрослых: вход в кабинет ---------- */
  { const pr = SCREENS.parents; SCREENS.parents = arg => { pr(arg); const pg = $('.page.parents', app); if (!pg) return; const P = parent();
    pg.insertAdjacentHTML('afterbegin', `<div class="card acc-card"><h3>👨‍👩‍👧 Личный кабинет</h3>${P ? `<p>Вы вошли как <b>${esc(P.email)}</b>.</p><div class="row-btns"><button class="btn pink" data-go="pcab">Открыть кабинет</button><button class="btn" id="aout3">🚪 Выйти</button></div>` : `<p class="small">Регистрация родителя: облачное хранение прогресса, вход на любом устройстве, друзья, отчёты, подстройка программы. ${linked() ? '' : 'Сейчас прогресс хранится только на этом устройстве.'}</p><button class="btn pink" data-go="pauth">Войти или зарегистрироваться</button>`}</div>`); $('#aout3', pg)?.addEventListener('click', () => parentOut()); }; }
  /* ---------- друзья — только с кабинетом ---------- */
  { const fr = SCREENS.friends; if (fr) SCREENS.friends = arg => { if (!linked()) { app.innerHTML = `${topbar('🤝 Друзья')}<div class="page"><div class="card center"><div class="big-emoji">🔐</div><h2>Друзья — вместе со взрослым</h2><p>Чтобы ходить в гости и дружить, попроси маму или папу открыть <b>личный кабинет</b> и привязать твой прогресс. Так безопаснее!</p><button class="btn pink" data-go="pauth">Для взрослых: открыть кабинет</button></div></div>`; return; } return fr(arg); }; }
  /* ---------- подстройка: приоритеты родителя и интересы ребёнка поднимают предметы в Академии ---------- */
  const LIKE2SUBJ = { '🐾 Животные и природа': ['world'], '🚀 Космос и наука': ['space', 'body'], '📖 Читать истории': ['stories', 'read'], '🎨 Рисовать и придумывать': ['creative'], '💬 Общаться с друзьями': ['talk'], '🧮 Решать задачи': ['think'], '🎲 Играть в игры': ['think', 'creative'] };
  function wanted() { const w = new Set(S.prio || []); [].concat((S.profile || {}).like || []).forEach(x => (LIKE2SUBJ[x] || []).forEach(id => w.add(id))); return w; }
  { const ah = SCREENS.academy; SCREENS.academy = arg => { ah(arg); const W = wanted(), grid = $('.acad-grid', app); if (!grid || !W.size) return;
    $$('.acad-card[data-s]', grid).filter(c => W.has(c.dataset.s)).reverse().forEach(c => { c.classList.add('fav'); if (!$('.favb', c)) c.insertAdjacentHTML('beforeend', '<span class="favb">⭐ для тебя</span>'); grid.prepend(c); }); }; }
  if (linked() && !sessionStorage.getItem('childMe')) { sessionStorage.setItem('childMe', 1); api('child/me', null, child().token).then(d => { S.prio = d.priorities || []; if (d.survey && !S.profile) S.profile = d.survey; save(); }).catch(e => { if (e.code === 'auth') ls.set(AK, null); }); }
  /* ---------- выход: родитель — из кабинета, ребёнок — со своего профиля на этом устройстве ---------- */
  async function parentOut() { const P = parent(); if (P) await api('logout', {}, P.token).catch(() => { }); ls.set(PK, null); toast('Вы вышли из кабинета'); go(S.kid ? 'home' : 'hello'); }
  function childOut() {
    if (!linked()) { toast('Сначала взрослый привяжет прогресс к кабинету — иначе он потеряется'); return; }
    const m = modal(`<div class="big-emoji">🚪</div><h2>Выйти из игры?</h2><p>Прогресс <b>${esc(S.kid)}</b> сохранится в облаке. Вернуться можно по семейному коду и картинке-ПИН.</p><div class="row-btns"><button class="btn pink" id="cout">Сохранить и выйти</button><button class="btn" data-close>Остаться</button></div>`);
    $('#cout', m.el).addEventListener('click', async () => { $('#cout', m.el).disabled = true; $('#cout', m.el).textContent = 'Сохраняем…';
      try { const r = await fetch(CLOUD + '/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: cloudCode(), data: { ...S, chatLog: [] } }) }); if (!r.ok) throw 0; }
      catch (e) { $('#cout', m.el).disabled = false; $('#cout', m.el).textContent = 'Сохранить и выйти'; toast('Нет связи — прогресс не сохранился, попробуй позже'); return; }
      ls.set(AK, null); try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); });
  }
  /* ---------- замок раздела для взрослых ----------
     Есть ПИН → только ПИН (5 ошибок — пауза 10 минут). Нет ПИНа или забыли → код из почты родителя, затем новый ПИН.
     Ребёнку не пройти: у него нет ни ПИНа, ни доступа к маминой почте. Ушли из раздела — замок снова закрыт. */
  const ADULT = new Set(['parents', 'pcab', 'pauth', 'agate', 'pinset']);
  let adultUntil = 0;
  const devOpen = () => location.hostname === 'localhost' && !S.pin && !localStorage.getItem('murlok-strict-gate'); // автотесты на своём компьютере
  const adultOk = () => devOpen() || Date.now() < adultUntil;
  const unlock = () => { adultUntil = Date.now() + 20 * 60 * 1000; };
  { const g0 = go; go = function (name) { if (!ADULT.has(name)) adultUntil = 0; return g0.apply(this, arguments); }; }
  const gate = next => go('agate', next || 'parents');
  SCREENS.agate = next => {
    next = next || 'parents'; if (adultOk()) return go(next);
    const back = S.kid ? 'home' : 'hello', lock = S.pinLock || {}, waitMin = Math.ceil(((lock.until || 0) - Date.now()) / 60000);
    if (!S.pin) {
      app.innerHTML = `${topbar('🔐 Для взрослых', back)}<div class="page acc"><div class="card center"><div class="big-emoji">🔐</div><h2>Раздел для взрослых</h2><p>Здесь отчёты, настройки и личный кабинет. Чтобы ребёнок не зашёл сюда сам, подтвердите, что вы взрослый: пришлём код на вашу почту. Потом придумаете ПИН — дальше будете входить по нему.</p><button class="btn pink big" id="gmail">📧 Получить код на почту</button><p class="small">Ребёнок? Позови маму или папу 🐾</p></div></div>`;
      $('#gmail').addEventListener('click', () => go('pauth', 'gate:' + next)); return;
    }
    app.innerHTML = `${topbar('🔐 Для взрослых', back)}<div class="page center acc"><div class="big-emoji">🔐</div><h2>Раздел для взрослых</h2><p>Введите ПИН</p><input id="pinin" class="nmi" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" style="text-align:center;max-width:220px"><div class="row-btns" style="justify-content:center"><button class="btn pink" id="pingo">Войти</button></div><p class="small err" id="pinerr">${waitMin > 0 ? `Слишком много попыток. Попробуйте через ${waitMin} мин.` : ''}</p><p class="small"><button class="link" id="pinforgot">Забыли ПИН? Войти по коду из почты</button></p></div>`;
    const tryIt = () => {
      const L = S.pinLock = S.pinLock || { n: 0, until: 0 };
      if (Date.now() < L.until) { $('#pinerr').textContent = `Слишком много попыток. Попробуйте через ${Math.ceil((L.until - Date.now()) / 60000)} мин.`; return; }
      if ($('#pinin').value.trim() === S.pin) { L.n = 0; save(); unlock(); go(next); return; }
      L.n++; if (L.n >= 5) { L.n = 0; L.until = Date.now() + 10 * 60 * 1000; } save();
      SND.bad(); shake($('#pinin')); $('#pinin').value = ''; $('#pinerr').textContent = L.until > Date.now() ? 'Слишком много попыток. Попробуйте через 10 мин.' : 'Неверный ПИН';
    };
    $('#pingo').addEventListener('click', tryIt); $('#pinin').addEventListener('keydown', e => { if (e.key === 'Enter') tryIt(); });
    $('#pinforgot').addEventListener('click', () => go('pauth', 'gate:' + next));
  };
  SCREENS.pinset = next => {
    next = next || 'parents'; if (!adultOk()) return gate(next);
    app.innerHTML = `${topbar('🔐 ПИН для взрослых', 'home')}<div class="page center acc"><div class="card"><div class="big-emoji">🔢</div><h2>Придумайте ПИН</h2><p class="small">4 цифры. По ним вы будете входить в раздел для взрослых на этом устройстве. Не показывайте их ребёнку. Забудете — войдёте снова по коду из почты.</p><input id="pin1" class="nmi" type="password" inputmode="numeric" maxlength="4" placeholder="ПИН" autocomplete="off" style="text-align:center;max-width:220px"><input id="pin2" class="nmi" type="password" inputmode="numeric" maxlength="4" placeholder="Ещё раз" autocomplete="off" style="text-align:center;max-width:220px"><p class="small err" id="perr"></p><button class="btn pink big" id="pinok">Сохранить</button></div></div>`;
    $('#pinok').addEventListener('click', () => { const a = $('#pin1').value.trim(), b = $('#pin2').value.trim();
      if (!/^\d{4}$/.test(a)) { $('#perr').textContent = 'Нужно ровно 4 цифры'; return; } if (/^(\d)\1{3}$|^(1234|4321|0123)$/.test(a)) { $('#perr').textContent = 'Слишком простой ПИН — ребёнок угадает'; return; }
      if (a !== b) { $('#perr').textContent = 'ПИНы не совпадают'; return; }
      S.pin = a; S.pinLock = { n: 0, until: 0 }; save(); SND.win(); toast('ПИН сохранён'); go(next); });
  };
  { const os = openSettings; openSettings = function () { const r = os.apply(this, arguments); const L = $$('.modal .set-list').pop(); if (L && !$('#set-adult', L)) {
    L.insertAdjacentHTML('beforeend', `${linked() ? '<button class="set-row" id="set-out"><span>🚪</span><b>Выйти из игры</b><i class="arr">›</i></button>' : ''}${parent() ? '<button class="set-row" id="set-pout"><span>🔓</span><b>Выйти из кабинета взрослого</b><i class="arr">›</i></button>' : ''}<button class="set-row adult" id="set-adult"><span>👨‍👩‍👧</span><b>Для взрослых</b><i class="arr">›</i></button>`);
    const close = () => $$('.modal').forEach(x => x.remove());
    $('#set-adult', L).addEventListener('click', () => { close(); gate('parents'); });
    $('#set-out', L)?.addEventListener('click', () => { close(); childOut(); });
    $('#set-pout', L)?.addEventListener('click', () => { close(); parentOut(); });
  } return r; }; }
  ['pauth', 'pcab', 'clogin', 'survey', 'agate', 'pinset'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { parent, child, linked, api, SURVEY, gate, adultOk, parentOut, childOut };
})();
window.Accounts = Accounts;
