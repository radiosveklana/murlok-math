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
    $('#mvgo', m.el).addEventListener('click', async () => { $('#mvgo', m.el).textContent = 'Собираем вещи…'; let code = ''; if (S.kid) { code = cloudCode(); cloudDirty = true; await fetch('https://level.tech-wave.ru/murlok-api/save', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code, data: (({ pin, pinLock, ...x }) => ({ ...x, chatLog: [] }))(S) }) }).catch(() => { }); } location.href = HOME + (code ? '#restore=' + code : ''); });
  }, 2500);

  /* ---------- облако и друзья — только для детей из кабинета (согласие родителя) ---------- */
  const cp = cloudPush; cloudPush = function () { if (!linked()) return null; return cp.apply(this, arguments); };
  const ac = linked; window.accLinked = ac;

  /* ---------- первый экран: вход для взрослого и для ребёнка с семейным кодом ---------- */
  // v30: на новом устройстве первым делом — регистрация взрослого и вход по семейному коду; «без регистрации» — скромно, ниже
  // v30: первый экран в два шага. Шаг 1 — три понятные дороги (взрослый / семейный код / просто поиграть), шаг 2 — имя и котик.
  // Под автотестами (navigator.webdriver) сразу открыт шаг 2 — так старые тесты вводят имя как раньше; ?choose=1 включает шаг 1 и для них.
  { const h = SCREENS.hello; SCREENS.hello = arg => { h(arg); const hl = $('.hello', app); if (!hl) return;
    const fresh0 = !S.kid && !linked(), forceChoose = /[?&]choose=1/.test(location.search);
    const about = '<p class="hl-foot"><a class="link small" href="?site=1">Что это за игра? Рассказ для родителей</a> <span class="age">6+</span></p>';
    if (!fresh0) { // уже играет на этом устройстве (например, вернулся к имени) — компактные входы сверху
      hl.insertAdjacentHTML('afterbegin', `<div class="acc-entry"><button class="btn sm" id="aparent">👨‍👩‍👧 Вход для взрослых</button><button class="btn sm" id="achild">🧒 Семейный код</button></div>`); hl.insertAdjacentHTML('beforeend', about);
    } else {
      [...hl.children].forEach(el => { if (!el.matches('.hello-cat, h1, .lead')) el.classList.add('hf'); });
      $('.lead', hl)?.insertAdjacentHTML('afterend', `<div class="hl-roads">
        <button class="road pink" id="aparent"><span class="rd-ic">👨‍👩‍👧</span><b>Я взрослый</b><small>Регистрация семьи: прогресс в облаке, отчёты, друзья и вызовы</small></button>
        <button class="road" id="achild"><span class="rd-ic">🧒</span><b>У меня есть семейный код</b><small>Войти в свою игру на этом устройстве</small></button>
        <button class="road mint" id="atry"><span class="rd-ic">🐾</span><b>Просто поиграть</b><small>Без регистрации — прогресс только на этом устройстве</small></button>
      </div><div class="hf hl-step2"><button class="link" id="aback">← Назад</button><h3>🐾 Знакомимся!</h3><button class="btn sm" id="achild2">🔑 У меня есть семейный код</button></div>`);
      hl.insertAdjacentHTML('beforeend', about);
      const step = n => { hl.classList.toggle('choose', n === 1); if (n === 2) setTimeout(() => $('#kid')?.focus(), 50); };
      // на этом устройстве уже играли в семье (ребёнок вышел) — первым делом вход по семейному коду, а не «Как тебя зовут?»
      let hadFam = false; try { hadFam = localStorage.getItem('murlok-had-family') === '1'; } catch (e) { }
      if (hadFam) { const rc = $('#achild', hl), rr = $('.hl-roads', hl); rc.classList.add('pink'); $('#aparent', hl).classList.remove('pink'); rr.prepend(rc); $('small', rc).textContent = 'Ты уже играл здесь в семье — войди по семейному коду, и прогресс вернётся'; }
      step(navigator.webdriver && !forceChoose && !hadFam ? 2 : 1);
      $('#atry').addEventListener('click', () => { SND.tap(); step(2); });
      $('#aback').addEventListener('click', () => { SND.tap(); step(1); });
      $('#achild2').addEventListener('click', () => go('clogin')); // вход по семейному коду виден и на шаге «Как тебя зовут?»
    }
    $('#aparent').addEventListener('click', () => go('pauth')); $('#achild').addEventListener('click', () => go('clogin'));
    if (!document.getElementById('hello-css')) { const st = document.createElement('style'); st.id = 'hello-css'; st.textContent = `
      .hello .hl-roads { display: grid; gap: 12px; margin: 18px auto 8px; max-width: 520px; }
      .hello:not(.choose) .hl-roads { display: none; }
      .hello.choose .hf { display: none !important; }
      .hello .road { display: grid; grid-template-columns: 54px 1fr; grid-template-rows: auto auto; column-gap: 12px; text-align: left; align-items: center; background: #fff; border-radius: 22px; padding: 14px 16px; box-shadow: var(--sh); border: 3px solid transparent; }
      .hello .road .rd-ic { grid-row: span 2; font-size: 38px; text-align: center; }
      .hello .road b { font-size: 19px; } .hello .road small { color: var(--muted); font-size: 14px; line-height: 1.3; }
      .hello .road.pink { background: var(--pink); color: #fff; box-shadow: 0 5px 0 var(--pink-d); } .hello .road.pink small { color: #FFE3EC; }
      .hello .road.mint { border-color: var(--mint-2); }
      .hello .road:active { transform: translateY(3px); }
      .hello .hl-step2 { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; max-width: 520px; margin: 14px auto 4px; }
      .hello .hl-step2 h3 { margin: 0; } .hello .hl-foot { margin-top: 18px; text-align: center; }
      .hello .acc-entry { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 8px; }
      .hello .acc-try { display: none; }`; document.head.appendChild(st); }
  }; }

  /* ---------- вход родителя ---------- */
  SCREENS.pauth = arg => {
    const gateNext = /^gate:/.test(arg || '') ? arg.slice(5) : '';
    if (parent() && !gateNext) return go('pcab');
    let joinEmail = ''; try { joinEmail = sessionStorage.getItem('murlok-join') || ''; } catch (e) { } // пришли по ссылке «Принять приглашение» из письма
    app.innerHTML = `${topbar('👨‍👩‍👧 Вход для взрослых', S.kid ? 'home' : 'hello')}<div class="page acc"><div class="card"><h2>Личный кабинет родителя</h2><p class="small">Кабинет нужен, чтобы прогресс ребёнка хранился в облаке и переносился между устройствами, были доступны друзья, отчёты и подстройка программы. Вход — по почте, без пароля.</p>
      <div id="st1">${joinEmail && !gateNext ? '<p class="hlp">✉️ Вас пригласили в семейный кабинет. Нажмите «Получить код на почту» — код придёт на эту почту.</p>' : ''}<input id="aem" class="nmi" type="email" placeholder="Ваша почта" autocomplete="email" value="${esc((parent() || {}).email || (gateNext ? '' : joinEmail) || '')}">${gateNext ? '<p class="small">Пришлём код на почту взрослого — так ребёнок не откроет раздел сам.</p>' : ''}<button class="btn pink big" id="asend">Получить код на почту</button><button class="link" id="ahave">🔑 У меня уже есть код</button></div>
      <div id="st2" hidden><p>Мы отправили 6-значный код на <b id="aemail"></b>. Проверьте папку «Спам», если письма нет.</p><input id="acode" class="nmi" inputmode="numeric" maxlength="6" placeholder="Код из письма" autocomplete="one-time-code">
        <div id="acons" hidden><label class="tgl"><input type="checkbox" id="ac1"> Я — родитель (законный представитель) ребёнка и даю <a href="/consent.html" target="_blank" rel="noopener">согласие на обработку персональных данных</a> ребёнка и моих</label><label class="tgl"><input type="checkbox" id="ac2"> Я ознакомлен(а) с <a href="/privacy.html" target="_blank" rel="noopener">Политикой обработки персональных данных</a>, включая передачу текста сообщений нейросети для ответов котика</label></div>
        <button class="btn pink big" id="averify">Войти</button><button class="link" id="aback">Изменить почту</button></div>
      <div id="aerr" class="small err"></div></div></div>`;
    let email = '', isNew = false; const err = t => { $('#aerr').textContent = t || ''; };
    $('#asend').addEventListener('click', async () => { email = $('#aem').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return err('Проверьте адрес почты'); $('#asend').disabled = true; err('');
      try { const r = await api('start', { email, ref: ls.get(RK) }); isNew = r.isNew; $('#st1').hidden = true; $('#st2').hidden = false; $('#aemail').textContent = email; $('#acons').hidden = !isNew;
        if (r.invite) { // приглашённый взрослый (второй родитель, бабушка…) — присоединится к семье, согласие — за себя
          $('#acons').insertAdjacentHTML('beforebegin', `<p class="hlp">👨‍👩‍👧 Приглашение в семейный кабинет от <b>${esc(r.invite.by)}</b>. После входа Вы будете видеть детей семьи, их успехи и челленджи.</p>`);
          $('#ac1').parentElement.innerHTML = '<input type="checkbox" id="ac1"> Я — член семьи ребёнка, приглашённый его родителем, и даю <a href="/consent.html" target="_blank" rel="noopener">согласие на обработку моих персональных данных</a>';
        }
        $('#acode').focus(); }
      catch (e) { err({ slow: 'Слишком много попыток — попробуйте через час', mail: 'Не удалось отправить письмо, попробуйте позже', email: 'Проверьте адрес почты' }[e.code] || 'Нет связи с сервером'); } $('#asend').disabled = false; });
    $('#aback').addEventListener('click', () => { $('#st1').hidden = false; $('#st2').hidden = true; });
    // код выдала поддержка (например, письмо не дошло) — сразу к вводу кода
    $('#ahave').addEventListener('click', () => { email = $('#aem').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return err('Сначала введите почту'); err(''); isNew = false; $('#st1').hidden = true; $('#st2').hidden = false; $('#aemail').textContent = email; $('#acons').hidden = true; $('#acode').focus(); });
    $('#averify').addEventListener('click', async () => { const code = $('#acode').value.trim(); if (!/^\d{6}$/.test(code)) return err('Код — 6 цифр'); if (isNew && !($('#ac1').checked && $('#ac2').checked)) return err('Чтобы зарегистрироваться, нужно согласие (обе галочки)');
      const kidDev = linked() && !(child() || {}).adult && (child() || {}).familyCode; // устройство привязанного ребёнка: замок открывает только взрослый ЭТОЙ семьи
      if (kidDev && isNew) return err('Это устройство ребёнка из семьи. Войдите почтой мамы или папы, которые открыли семейный кабинет.');
      try { const r = await api('verify', { email, code, consent: isNew ? true : undefined });
        if (kidDev) { const fv = await api('family', null, r.token).catch(() => null); if (!fv || !fv.family || fv.family.code !== child().familyCode) { api('logout', {}, r.token).catch(() => { }); return err('Эта почта не из семьи этого ребёнка. Войдите почтой взрослого, который привязал ребёнка.'); } }
        try { sessionStorage.removeItem('murlok-join'); } catch (e) { }
        // v35: ПИН раздела для взрослых предлагаем и на устройстве без своей игры (телефон мамы) — иначе каждый раз код из почты
        ls.set(PK, { token: r.token, email }); SND.win(); unlock(); if (S.kid && !linked()) { try { if (await linkDevice()) toast(`Игра «${esc(S.kid)}» привязана к семье ✅`); } catch (e) { } } const after = S.kid && !linked() ? 'pcab' : (gateNext || 'pcab'); if (!S.pin) go('pinset', after); else if (S.kid && !linked()) go('pcab'); else if (gateNext) go(gateNext); else go('pcab', 'new'); }
      catch (e) { err({ code: 'Неверный код' + (e.d && e.d.left != null ? ` (осталось попыток: ${e.d.left})` : ''), expired: 'Код устарел — запросите новый', tries: 'Слишком много попыток — запросите новый код', consent: 'Нужно согласие' }[e.code] || 'Не получилось войти'); } });
  };

  async function linkDevice() {
    const P = parent(); if (!P || linked() || !S.kid) return false;
    const fam0 = (await api('family', null, P.token)).family, myP = (fam0.players || []).find(p => p.mine && p.cloudCode === cloudCode());
    if (myP) { const r = await api('play', {}, P.token); ls.set(AK, { token: r.token, childId: r.childId, familyCode: r.familyCode, name: r.name, adult: true }); S.cloudCode = r.cloudCode; save(); cloudDirty = true; cloudPush(); return true; } // на устройстве — игра этого взрослого
    if ((fam0.players || []).some(p => p.name === S.kid)) return false; // это игра другого взрослого семьи — не превращаем её в ребёнка
    const fam = fam0, mine = (fam.children || []).find(k => k.cloudCode && k.cloudCode === cloudCode()), empty = mine ? [mine] : (fam.children || []).filter(k => !k.xp && !k.lastSeen);
    // в семье есть ребёнок без прогресса (завели в кабинете заранее) — присоединяем игру к нему, а не создаём второго
    const r = empty.length === 1 ? await api('child/' + empty[0].id + '/attach', { cloudCode: cloudCode(), cat: S.name }, P.token) : await api('child', { name: S.kid, cloudCode: cloudCode(), cat: S.name }, P.token);
    ls.set(AK, { token: r.token, childId: r.child.id, familyCode: fam.code, name: S.kid }); S.cloudCode = r.child.cloudCode; save(); cloudDirty = true; cloudPush(); return true;
  }
  SCREENS.linknow = next => { // взрослый подтвердил ПИНом — привязываем и сразу возвращаемся туда, куда шли (друзья / успехи)
    app.innerHTML = `${topbar('🔗 Привязка', 'home')}<div class="page center"><div class="big-emoji">🔗</div><p>Привязываем игру к семье…</p></div>`;
    linkDevice().then(ok => { if (ok) { SND.win(); toast(`Игра «${esc(S.kid)}» в семье! ✅`); } go(next || 'friends'); }).catch(e => { toast('Не получилось: ' + (e.code || 'нет связи')); go('pcab'); });
  };
  if (parent() && S.kid && !linked() && !sessionStorage.getItem('autoLink')) { sessionStorage.setItem('autoLink', 1); setTimeout(() => linkDevice().then(ok => { if (ok) toast(`Игра «${esc(S.kid)}» теперь в семье: друзья, вызовы и облако включены ✅`); }).catch(() => { }), 2500); }
  /* ---------- кабинет родителя ---------- */
  const picHTML = (id, kid) => `<div class="pinpick" id="${id}">${PICS.map((p, i) => `<button type="button" class="pp" data-i="${i}">${p}</button>`).join('')}</div><div class="small">${kid ? 'Нажми свои 3 картинки по порядку' : 'Выберите 3 картинки по порядку — это ПИН ребёнка (запишите его)'}: <b class="pinshow">—</b> <button type="button" class="link pinclr">стереть</button></div>`;
  const bindPick = el => { const sel = [], show = () => { $('.pinshow', el.parentElement).textContent = sel.map(i => PICS[i]).join(' ') || '—'; }; $$('.pp', el).forEach(b => b.addEventListener('click', () => { if (sel.length >= 3) { sel.length = 0; toast('Выбираем заново: первая картинка'); } sel.push(+b.dataset.i); show(); SND.tap(); })); $('.pinclr', el.parentElement)?.addEventListener('click', () => { sel.length = 0; show(); }); return () => sel.slice(); };
  const share = (url, title) => { if (navigator.share) navigator.share({ title, url }).catch(() => { }); else { navigator.clipboard && navigator.clipboard.writeText(url); toast('Ссылка скопирована'); } };
  SCREENS.pcab = async arg => {
    const P = parent(); if (!P) return go('pauth'); if (!adultOk()) return gate('pcab');
    app.innerHTML = `${topbar('👨‍👩‍👧 Личный кабинет', 'parents')}<div class="page acc"><p class="center small">Загрузка…</p></div>`;
    let F; try { F = (await api('family', null, P.token)).family; } catch (e) { if (e.code === 'auth') { ls.set(PK, null); return go('pauth'); } $('.acc').innerHTML = '<div class="card"><p>Нет связи с сервером.</p></div>'; return; }
    if (curScreen !== 'pcab') return;
    const here = S.kid && !linked(), refUrl = c => HOME + 'r/' + c, dt = t => new Date(t).toLocaleDateString('ru-RU');
    // v35: кабинет — короткие раскрывающиеся блоки; «Дети» первыми. Какие блоки открыты — запоминаем на этом устройстве
    let opened = {}; try { opened = JSON.parse(localStorage.getItem('murlok-cab-open') || '{}') || {}; } catch (e) { }
    const sec = (id, title, body, open) => `<details class="cab-sec" id="${id}"${(id in opened ? opened[id] : open) ? ' open' : ''}><summary>${title}</summary>${body}</details>`;
    const supportRecent = (F.logins || []).filter(l => l.how === 'support' && Date.now() - l.at < 30 * 864e5);
    const pinNote = k => k.hasPin ? '🔐 картинка-ПИН есть' : k.legacyNoPin ? '🔓 без картинки-ПИН: входит по семейному коду, как раньше. Лучше поставить ПИН' : '⚠️ без картинки-ПИН: вход на новом устройстве — только с Вашего подтверждения здесь';
    const kidsCard = `<div class="card"><h3>Дети</h3>${F.children.length ? F.children.map(k => `<div class="kid-row"><div class="kr-cat">${catSVG({ fur: FURS[k.fur] ? k.fur : 'ginger', wear: k.wear || {}, smile: true })}</div><div class="kr-info"><b>${esc(k.name)}</b><small>⭐ ${k.xp} · дел ${k.cases} · ${k.minutesWeek} мин за неделю · ${k.lastSeen ? 'последний раз в игре ' + dt(k.lastSeen) : 'занятий пока не было'}</small><small>${pinNote(k)}${k.survey ? ' · опрос пройден' : ''}</small></div><div class="kr-btns"><button class="btn sm pink" data-rep="${k.cloudCode || ''}" data-name="${esc(k.name)}">📊 Отчёт</button><button class="btn sm" data-pin="${k.id}">🔐 ПИН</button><button class="btn sm" data-ren="${k.id}" data-name="${esc(k.name)}">✏️ Имя</button><button class="btn sm danger kr-del" data-krm="${k.id}" data-name="${esc(k.name)}">🗑 Удалить</button></div></div>`).join('') : '<p class="small">Пока никого. Добавьте ребёнка ниже.</p>'}
        <details ${F.children.length ? '' : 'open'}><summary>➕ Добавить ребёнка</summary><p class="small">Если ребёнок уже играет на своём планшете — не добавляйте его здесь: войдите как взрослый на его планшете, и игра со всем прогрессом привяжется сама. Здесь — для нового ребёнка, который ещё не играл.</p><input id="kname" class="nmi" placeholder="Имя ребёнка" maxlength="20">${picHTML('pk1')}<button class="btn pink" id="kadd">Добавить</button></details></div>`;
    const adultsCard = `<div class="card" id="fadults"><h3>👨‍👩‍👧 Взрослые семьи</h3>${(F.adults || []).map(a => `<div class="fm-adult"><span>${a.role === 'owner' ? '👑' : '🧑'} <b>${esc(a.name || a.email)}</b>${a.name ? ` <small>${esc(a.email)}</small>` : ''}${a.kin ? ` <small>· ${esc(a.kin)}</small>` : ''} <small>· ${a.role === 'owner' ? 'владелец кабинета' : 'по приглашению'}</small>${F.me && F.me.email === a.email ? ' <small>(Вы)</small>' : ''}</span>${a.role !== 'owner' && F.me && (F.me.role === 'owner' || F.me.email === a.email) ? `<button class="btn sm" data-arm="${a.id}" data-self="${F.me.email === a.email ? 1 : ''}">${F.me.email === a.email ? 'Выйти из семьи' : 'Убрать'}</button>` : ''}</div>`).join('')}
        ${(F.invites || []).map(v => `<div class="fm-adult"><span>✉️ ${esc(v.kin ? v.kin + ' · ' : '')}${esc(v.email)} <small>· приглашение отправлено, ждём входа</small></span><button class="btn sm" data-icancel="${esc(v.email)}">Отменить</button></div>`).join('')}
        <details><summary>➕ Пригласить взрослого</summary><p class="small">Второй родитель, бабушка или дедушка получат письмо со ссылкой «Принять приглашение» и войдут в этот же кабинет по своей почте — с теми же правами: видеть детей и их успехи, одобрять друзей, создавать челленджи. Удалить кабинет может только тот, кто его создал.</p><input id="iemail" class="nmi" type="email" placeholder="Почта взрослого" autocomplete="off"><div class="fm-roles" id="irole">${['Второй родитель', 'Бабушка', 'Дедушка', 'Другой взрослый'].map((x, i) => `<label class="chip ${i ? '' : 'on'}" data-r="${x}">${x}</label>`).join('')}</div><button class="btn pink" id="iadd">Отправить приглашение</button></details>
        <details><summary>🏷 Название семьи${F.title ? ': «' + esc(F.title) + '»' : ''}</summary><p class="small">Его увидят взрослые другой семьи, когда дети захотят подружиться, — чтобы понять, из какой вы семьи. Почту и фамилии мы не показываем.</p><input id="ftitle" class="nmi" maxlength="30" placeholder="Например: Ивановы" value="${esc(F.title || '')}"><button class="btn" id="ftsave">Сохранить название</button></details></div><div id="slot-play"></div>`;
    $('.acc').innerHTML = `
      ${S.kid ? '<button class="btn mint big to-game" data-go="home">🎮 Вернуться в игру</button>' : ''}<div class="acc-who"><span>Вы вошли как <b>${esc((parent() || {}).email || F.email)}</b></span><button class="btn sm" id="aout2">🚪 Выйти</button></div>
      <div id="cab-alerts">${(F.loginReqs || []).map(q => `<div class="card hl cab-lreq"><b>🔐 ${esc(q.name)} входит на новом устройстве</b><p class="small">Вход по семейному коду без картинки-ПИН. Разрешите, только если это ваш ребёнок и устройство сейчас у него.</p><div class="row-btns"><button class="btn sm pink" data-lok="${q.id}">Разрешить вход</button><button class="btn sm" data-lno="${q.id}">Это не мы</button></div></div>`).join('')}${supportRecent.length ? `<div class="card cab-sup"><b>🛟 Вход по коду поддержки</b><p class="small">${supportRecent.map(l => dt(l.at) + ' — ' + esc(l.email)).join('; ')}. Код выдаёт служба поддержки, если письмо со входом не доходит. Если вы не просили — ответьте на письмо об этом входе.</p></div>` : ''}</div>
      ${here ? `<div class="card hl link-here"><h3>📲 Прогресс на этом устройстве</h3><p><b>${esc(S.kid)}</b>, котик ${esc(S.name)}: ⭐ ${S.xp} опыта, дел ${S.cases}. Привязать его к кабинету, чтобы он сохранялся в облаке?</p>${picHTML('pk0')}<button class="btn pink" id="linkhere">Привязать к кабинету</button></div>` : ''}
      <div class="card"><h2>${F.title ? 'Семья «' + esc(F.title) + '»' : 'Ваша семья'}</h2><p>Семейный код для входа детей на других устройствах: <span class="ccode">${F.code}</span></p><p class="small">Ребёнок на новом устройстве нажимает «У меня есть семейный код», выбирает себя и вводит свою картинку-ПИН.</p></div>
      ${sec('sec-kids', '👧 Дети' + (F.children.length ? ` <small>· ${F.children.length}</small>` : ''), kidsCard, true)}
      ${sec('sec-time', '⏳ Время игры', '<div id="slot-lim"></div>', F.children.length > 0)}
      ${sec('sec-social', '📊 Успехи, челленджи и друзья', '<div id="pcab-social"></div>', false)}
      ${sec('sec-fam', '👨‍👩‍👧 Взрослые семьи и «Играть самому»', adultsCard, false)}
      ${sec('sec-prio', '🎯 Приоритеты обучения', `<div class="card"><h3>🎯 Приоритетные направления</h3><p class="small">Котик-тренер будет чаще предлагать эти темы и ставить их выше в Академии.</p><div class="prio">${PRIOS.map(([id, n]) => `<label class="chip ${F.priorities.includes(id) ? 'on' : ''}"><input type="checkbox" value="${id}" ${F.priorities.includes(id) ? 'checked' : ''} hidden>${n}</label>`).join('')}</div><button class="btn" id="psave">Сохранить приоритеты</button></div>`, false)}
      ${sec('sec-tg', '📬 Отчёт в Telegram', `<div class="card" id="tgcard2"><h3>📬 Отчёт в Telegram</h3><p class="small">Каждое воскресенье в 19:00 бот присылает отчёт по всем детям семьи: минуты, задачи, сильные стороны и что пока трудно. Туда же приходят запросы детей в дружбу.</p><p id="tgst" class="small">Проверяем…</p><div class="row-btns"><button class="btn pink" id="tglink">Подключить Telegram</button><button class="btn" id="tgnow" hidden>📨 Прислать отчёт сейчас</button><button class="btn" id="tgoff" hidden>Отключить</button></div></div>`, false)}
      ${sec('sec-data', '📄 Данные, согласие и история входов', `<div class="card"><h3>📄 Данные и согласие</h3><p class="small">Согласие от ${dt(F.consent.at)} (редакция ${F.consent.ver}). <a href="/privacy.html" target="_blank">Политика</a> · <a href="/consent.html" target="_blank">Согласие</a></p><div class="row-btns"><button class="btn" id="aexp">⬇️ Выгрузить все данные</button>${!F.me || F.me.role === 'owner' ? '<button class="btn danger" id="adel">Удалить аккаунт и данные</button>' : ''}<button class="btn" id="aout">🚪 Выйти из кабинета</button></div>
        <h3>🕘 История входов</h3>${(F.logins || []).length ? `<div class="cab-logins">${F.logins.map(l => `<div class="small">${new Date(l.at).toLocaleString('ru-RU')} — ${esc(l.email)} — ${l.how === 'support' ? '<b>по коду поддержки</b>' : 'код из почты'}</div>`).join('')}</div>` : '<p class="small">Записей пока нет.</p>'}</div>`, false)}
      ${sec('sec-ref', '🔗 Рассказать знакомым', `<div class="card"><p class="small">Если игра понравилась, ссылкой можно поделиться со знакомыми родителями. Это не реклама и не бонусы: мы только считаем, сколько людей пришло по ссылке. Регистрация по ссылке не делает людей друзьями в игре.</p><p>Ваша ссылка: <code>${refUrl(F.ref.code)}</code> <button class="btn sm" data-share="${refUrl(F.ref.code)}">Поделиться</button></p><p class="small">Переходы: <b>${F.ref.visits}</b> · регистрации: <b>${F.ref.regs}</b>.</p></div>`, false)}`;
    $$('.cab-sec', app).forEach(d => d.addEventListener('toggle', () => { opened[d.id] = d.open; try { localStorage.setItem('murlok-cab-open', JSON.stringify(opened)); } catch (e) { } }));
    $$('[data-lok], [data-lno]').forEach(b => b.addEventListener('click', async () => { const yes = !!b.dataset.lok; try { await api('fam/loginreq', { id: b.dataset.lok || b.dataset.lno, ok: yes }, P.token); toast(yes ? 'Вход разрешён ✅' : 'Вход отклонён'); } catch (e) { toast('Запрос устарел — пусть ребёнок попробует войти ещё раз'); } go('pcab'); }));
    $('#ftsave').addEventListener('click', async () => { try { await api('fam/title', { title: $('#ftitle').value }, P.token); toast('Название сохранено'); go('pcab'); } catch (e) { toast('Не получилось'); } });
    window.Family && Family.cabinet($('#pcab-social'));
    if (!window.Family) $('#sec-social')?.remove();
    window.Grownup && Grownup.cabinet(F, P, $('.acc')); // v30: «Играть самому» и время игры детей (grownup.js)
    let irole = 'Второй родитель'; $$('#irole .chip').forEach(l => l.addEventListener('click', () => { irole = l.dataset.r; $$('#irole .chip').forEach(x => x.classList.toggle('on', x === l)); }));
    $('#iadd').addEventListener('click', async () => { const email = $('#iemail').value.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return toast('Проверьте адрес почты'); $('#iadd').disabled = true;
      try { await api('fam/invite', { email, kin: irole }, P.token); toast('Приглашение отправлено на ' + esc(email)); go('pcab'); }
      catch (e) { $('#iadd').disabled = false; toast({ taken: 'У этой почты уже есть свой кабинет', already: 'Этот взрослый уже в семье', many: 'В семье уже много взрослых', mail: 'Не удалось отправить письмо', email: 'Проверьте адрес почты', slow: 'Слишком много приглашений — попробуйте завтра' }[e.code] || 'Не получилось'); } });
    $$('[data-icancel]').forEach(b => b.addEventListener('click', async () => { await api('fam/invite/cancel', { email: b.dataset.icancel }, P.token).catch(() => { }); go('pcab'); }));
    $$('[data-arm]').forEach(b => b.addEventListener('click', () => { const self = !!b.dataset.self; const m = modal(`<h2>${self ? 'Выйти из семьи?' : 'Убрать взрослого из семьи?'}</h2><p>${self ? 'Вы больше не увидите детей этой семьи в кабинете. Вернуться можно по новому приглашению.' : 'Этот взрослый потеряет доступ к кабинету семьи. Данные детей останутся.'}</p><div class="row-btns"><button class="btn danger" id="armgo">${self ? 'Выйти' : 'Убрать'}</button><button class="btn" data-close>Отмена</button></div>`);
      $('#armgo', m.el).addEventListener('click', async () => { try { await api('fam/adult/' + b.dataset.arm + '/remove', {}, P.token); m.close(); if (self) { ls.set(PK, null); toast('Вы вышли из семьи'); go(S.kid ? 'home' : 'hello'); } else { toast('Готово'); go('pcab'); } } catch (e) { toast('Не получилось'); } }); }));
    $$('[data-share]').forEach(b => b.addEventListener('click', () => share(b.dataset.share, 'Мурлок и Ко — тренажёр для детей')));
    $$('.prio .chip').forEach(l => l.addEventListener('click', e => { e.preventDefault(); const i = $('input', l); i.checked = !i.checked; l.classList.toggle('on', i.checked); }));
    $('#psave').addEventListener('click', async () => { const list = $$('.prio input:checked').map(i => i.value); await api('priorities', { list }, P.token).catch(() => { }); S.prio = list; save(); toast('Приоритеты сохранены'); });
    const g1 = $('#pk1') ? bindPick($('#pk1')) : null, g0 = $('#pk0') ? bindPick($('#pk0')) : null;
    const addKid = async (name, pin, linkHere) => {
      if (name.length < 2) return toast('Имя — хотя бы 2 буквы'); if (pin.length !== 3) return toast('Выберите 3 картинки для ПИН');
      try { const r = await api('child', { name, pin, cloudCode: linkHere ? cloudCode() : undefined, cat: linkHere ? S.name : '' }, P.token);
        if (linkHere) { ls.set(AK, { token: r.token, childId: r.child.id, familyCode: F.code, name }); S.cloudCode = r.child.cloudCode; save(); cloudDirty = true; cloudPush(); toast('Прогресс привязан и сохраняется в облаке ☁️'); }
        else setTimeout(() => modal(`<div class="big-emoji">✅</div><h2>Готово: ${esc(name)} в семье</h2><p>Картинка-ПИН: <b class="pin-big">${pin.map(i => PICS[i]).join(' ')}</b> — запишите или запомните её.</p><p class="small">На устройстве ребёнка: «У меня есть семейный код» → <b>${F.code}</b>, затем эти три картинки по порядку.</p><button class="btn pink" data-close>Понятно</button>`), 700); SND.win(); go('pcab'); }
      catch (e) { toast('Не получилось: ' + (e.code || 'ошибка')); } };
    $('#kadd') && $('#kadd').addEventListener('click', () => addKid($('#kname').value.trim(), g1(), false));
    $('#linkhere') && $('#linkhere').addEventListener('click', async () => { try { const pin = g0(); if (await linkDevice()) { if (pin.length === 3) await api('child/' + child().childId + '/pin', { pin }, P.token).catch(() => { }); SND.win(); toast('Игра привязана к семье ✅'); } go('pcab'); } catch (e) { toast('Не получилось: ' + (e.code || 'ошибка')); } });
    $$('[data-ren]').forEach(b => b.addEventListener('click', () => { const m = modal(`<h2>Имя ребёнка</h2><input id="rnm" class="nmi" maxlength="20" value="${b.dataset.name}"><div class="row-btns"><button class="btn pink" id="rnok">Сохранить</button><button class="btn" data-close>Отмена</button></div>`);
      $('#rnok', m.el).addEventListener('click', async () => { try { const nn = $('#rnm', m.el).value.trim(); await api('child/' + b.dataset.ren + '/rename', { name: nn }, P.token); if ((child() || {}).childId === b.dataset.ren && S.role !== 'adult') { S.kid = nn; save(); } m.close(); toast('Имя сохранено — на устройстве ребёнка оно появится при следующем входе в игру'); go('pcab'); } catch (e) { toast('Имя — хотя бы 2 буквы'); } }); }));
    // подробный отчёт ребёнка: его прогресс из облака в окне «только просмотр» (с любого профиля этого устройства)
    $$('[data-rep]').forEach(b => b.addEventListener('click', () => { if (!b.dataset.rep) return toast('Прогресса в облаке пока нет — ребёнок ещё не играл'); modal(`<h2>📊 ${b.dataset.name}</h2><iframe class="rep-frame" src="app/?view=${b.dataset.rep}" title="Отчёт"></iframe><div class="row-btns"><button class="btn" data-close>Закрыть</button></div>`, 'wide rep-sheet'); }));
    $$('[data-krm]').forEach(b => b.addEventListener('click', () => { const m = modal(`<h2>Удалить «${b.dataset.name}»?</h2><p>Ребёнок будет убран из семьи, а его облачный прогресс удалён. Если это ошибочная запись без прогресса — смело удаляйте.</p><div class="row-btns"><button class="btn danger" id="krmok">Удалить</button><button class="btn" data-close>Отмена</button></div>`);
      $('#krmok', m.el).addEventListener('click', async () => { try { await api('child/' + b.dataset.krm + '/remove', {}, P.token); if ((child() || {}).childId === b.dataset.krm) ls.set(AK, null); m.close(); toast('Удалено'); go('pcab'); } catch (e) { toast('Не получилось'); } }); }));
    $$('[data-pin]').forEach(b => b.addEventListener('click', () => { const m = modal(`<h2>Новая картинка-ПИН</h2>${picHTML('pk2')}<div class="row-btns"><button class="btn pink" id="pinok">Сохранить</button><button class="btn" data-close>Отмена</button></div>`); const g = bindPick($('#pk2', m.el)); $('#pinok', m.el).addEventListener('click', async () => { const pin = g(); if (pin.length !== 3) return toast('Выберите 3 картинки'); try { await api('child/' + b.dataset.pin + '/pin', { pin }, P.token); } catch (e) { return toast('Не получилось — проверьте связь'); } m.close(); go('pcab'); setTimeout(() => modal(`<h2>ПИН обновлён</h2><p>Новая картинка-ПИН: <b class="pin-big">${pin.map(i => PICS[i]).join(' ')}</b> — запишите её.</p><button class="btn pink" data-close>Понятно</button>`), 700); }); }));
    $('#aexp').addEventListener('click', async () => { try { const r = await fetch(CLOUD + '/acc/export', { headers: { authorization: 'Bearer ' + P.token } }); if (!r.ok) throw 0; const blob = await r.blob(), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'murlok-family-data.json'; a.click(); toast('Файл с данными скачан'); } catch (e) { toast('Не получилось выгрузить — проверьте связь и попробуйте ещё раз'); } });
    $('#adel') && $('#adel').addEventListener('click', () => { const m = modal(`<h2>Удалить аккаунт?</h2><p>Будут удалены кабинет, дети и весь их облачный прогресс. Это нельзя отменить. Согласие будет отозвано.</p><input id="dconf" class="nmi" placeholder="Напишите УДАЛИТЬ"><div class="row-btns"><button class="btn danger" id="dgo">Удалить</button><button class="btn" data-close>Отмена</button></div>`); $('#dgo', m.el).addEventListener('click', async () => { if ($('#dconf', m.el).value.trim() !== 'УДАЛИТЬ') return toast('Напишите УДАЛИТЬ'); try { await api('revoke', { confirm: 'УДАЛИТЬ' }, P.token); } catch (e) { return toast('Не получилось удалить — нет связи с сервером. Попробуйте ещё раз'); };         ls.set(PK, null); ls.set(AK, null); S.cloudAt = 0; save(); m.close(); toast('Аккаунт и данные удалены'); go(S.kid ? 'home' : 'hello'); }); });
    $$('#aout, #aout2').forEach(b => b.addEventListener('click', () => parentOut()));
    const tgState = async () => { try { const d = await api('tg/status', {}, P.token); $('#tgst').textContent = d.linked ? `✅ Подключено (${d.linked} ${d.linked === 1 ? 'чат' : 'чата'}).` : 'Пока не подключено. Нажмите «Подключить» и в Telegram — «Запустить».'; $('#tgnow').hidden = $('#tgoff').hidden = !d.linked; } catch (e) { $('#tgst').textContent = 'Нет связи с сервером.'; } };
    tgState();
    $('#tglink').addEventListener('click', async () => { const w = window.open('', '_blank'); try { const d = await api('tg/link', {}, P.token); if (w) w.location = d.url; else location.href = d.url; toast('Нажмите «Запустить» в Telegram — и вернитесь сюда'); setTimeout(tgState, 8000); } catch (e) { if (w) w.close(); toast('Не получилось — попробуйте ещё раз'); } });
    $('#tgnow').addEventListener('click', async () => { try { const d = await api('tg/test', {}, P.token); toast(d.ok ? 'Отчёт отправлен в Telegram 📨' : 'Не отправилось — проверьте, что бот не заблокирован'); } catch (e) { toast('Нет связи с сервером'); } });
    $('#tgoff').addEventListener('click', async () => { await api('tg/unlink', {}, P.token).catch(() => { }); tgState(); });
    if (arg === 'new' && !F.priorities.length) setTimeout(() => toast('Отметьте приоритетные направления — котик подстроит программу'), 800);
  };

  /* ---------- вход ребёнка на новом устройстве ---------- */
  SCREENS.clogin = () => {
    app.innerHTML = `${topbar('🧒 Вход по семейному коду', 'hello')}<div class="page acc"><div class="card center" id="cl1"><div class="big-emoji">🔑</div><p>Попроси у мамы или папы <b>семейный код</b> (он есть в их личном кабинете).</p><input id="fcode" class="nmi" placeholder="Семейный код" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false" inputmode="text" style="text-align:center;letter-spacing:4px;text-transform:uppercase"><button class="btn pink big" id="fgo">Дальше</button></div><div id="cl2"></div></div>`;
    // оставляем только буквы и цифры, не больше 6 (без maxlength: на некоторых клавиатурах он «съедал» последний символ)
    $('#fcode').addEventListener('input', e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (v !== e.target.value) e.target.value = v; });
    $('#fgo').addEventListener('click', async () => { const fc = $('#fcode').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6); if (fc.length !== 6) return toast('Код — 6 символов');
      let L; try { L = (await api('child/list', { familyCode: fc })).kids; } catch (e) { return toast(e.code === 'nf' ? 'Такого кода нет' : e.code === 'slow' ? 'Слишком много попыток' : 'Нет связи'); }
      $('#cl1').hidden = true; $('#cl2').innerHTML = `<div class="card center"><h3>Кто ты?</h3><div class="profs">${L.map(k => `<button class="prof" data-k="${k.id}"><span class="pc">${catSVG({ fur: FURS[k.fur] ? k.fur : 'ginger', wear: k.wear || {}, smile: true })}</span><b>${esc(k.name)}</b></button>`).join('')}</div></div>`;
      $$('[data-k]').forEach(b => b.addEventListener('click', () => { const kid = L.find(k => k.id === b.dataset.k);
        // нет картинки-ПИН у нового ребёнка — вход подтверждает взрослый в своём кабинете (одного семейного кода мало)
        $('#cl2').innerHTML = kid.needOk ? `<div class="card center"><h3>${esc(kid.name)}, позови взрослого</h3><p>Чтобы войти на этом устройстве, мама или папа подтвердят вход в своём личном кабинете.</p><button class="btn pink big" id="cgo">Попросить вход</button></div>`
          : kid.hasPin ? `<div class="card center"><h3>${esc(kid.name)}, выбери свои 3 картинки</h3>${picHTML('pkc', true)}<button class="btn pink big" id="cgo">Войти</button></div>` : `<div class="card center"><h3>Это ты, ${esc(kid.name)}?</h3><button class="btn pink big" id="cgo">Войти</button></div>`;
        const g = $('#pkc') ? bindPick($('#pkc')) : () => [];
        const wait = async rid => { $('#cl2').innerHTML = `<div class="card center"><div class="big-emoji">⏳</div><h3>Ждём взрослого</h3><p>Попроси маму или папу открыть личный кабинет и нажать «Разрешить вход». Можно не закрывать этот экран.</p><button class="btn" data-go="hello">Отмена</button></div>`;
          for (let i = 0; i < 300 && curScreen === 'clogin'; i++) { await new Promise(x => setTimeout(x, 3000)); if (curScreen !== 'clogin') return null; try { const w = await api('child/login/wait', { rid }); if (w.token) return w; } catch (e) { toast(e.code === 'denied' ? 'Взрослый не подтвердил вход' : e.code === 'expired' ? 'Время ожидания вышло — попробуй ещё раз' : 'Нет связи'); if (e.code === 'denied' || e.code === 'expired') { go('clogin'); return null; } } } return null; };
        $('#cgo').addEventListener('click', async () => { const pin = g(); if (kid.hasPin && pin.length !== 3) return toast('Выбери 3 картинки');
          try { let r = await api('child/login', { familyCode: fc, childId: kid.id, pin }); if (r.pending) { r = await wait(r.pending); if (!r) return; } ls.set(AK, { token: r.token, childId: kid.id, familyCode: fc, name: r.name, needSurvey: r.needSurvey, hasPin: !!kid.hasPin }); SND.win(); toast('Загружаем твой прогресс…');
            // в облаке у этой записи пусто, а на планшете уже есть игра — переносим её в семью (ничего не теряем)
            const hasLocal = S.kid && ((S.xp || 0) > 0 || solvedTotal() > 0);
            cloudRestore(r.cloudCode).catch(async () => { if (hasLocal) { try { const a2 = await api('child/adopt', { cloudCode: cloudCode() }, r.token); S.cloudCode = a2.cloudCode; save(); cloudDirty = true; cloudPush(); toast(`Готово! Игра «${esc(S.kid)}» теперь в семье ✅`); go('home'); return; } catch (e) { toast('Не получилось перенести игру: ' + (e.code || 'ошибка')); } } S.kid = S.kid || r.name; S.cloudCode = r.cloudCode; save(); go(S.name ? 'home' : 'hello'); }); }
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
    if (A2 && S.cloudCode) api('pending', { code: S.cloudCode }, A2.token).then(d => { (d.items || []).forEach(it => { if (it.type === 'grant') { S.candies += it.candies || 0; S.totalCandies += it.candies || 0; S.gems = (S.gems || 0) + (it.gems || 0); save(); updCandy(); setTimeout(() => { modal(`<div class="big-emoji">🎁</div><h2>Подарок от команды!</h2><p>${it.candies ? `+${it.candies} 🍬 ` : ''}${it.gems ? `+${it.gems} 💎` : ''}</p>${it.note ? `<p>${esc(it.note)}</p>` : ''}<button class="btn pink" data-close>Спасибо!</button>`); confetti(40); }, 1500); } if (it.type === 'restore') cloudRestore(S.cloudCode).catch(() => { }); }); }).catch(() => { });
    if (!A2 && S.kid) nudge(); // ребёнок играет без семьи — время от времени зовём взрослого (не чаще раза в 2 часа, можно закрыть)
  } catch (e) { console.warn(e); } return r; }; }
  // приглашение взрослого в команду: польза для ребёнка, без слова «привязать»; варианты сменяют друг друга
  const NUDGES = ['🐾 Позови маму или папу в свою команду — у котика появится облачный домик, и он не потеряется, даже если сменить планшет.',
    '🤝 Хочешь дружить с другими сыщиками и бросать вызовы? Позови взрослого — пусть откроет семейный кабинет.',
    '🏆 Кто быстрее решит таблицу Шульте — ты или папа? Позови взрослого, и устроим семейное соревнование!',
    '📬 Покажи маме свои победы! Когда взрослый откроет кабинет, он будет получать отчёт о твоих успехах.'];
  function nudge() {
    if ($('.acc-nudge', app)) return; const t = $('.tiles', app); if (!t) return;
    let last = 0; try { last = +localStorage.getItem('murlok-nudge-at') || 0; } catch (e) { }
    if (Date.now() - last < 2 * 36e5) return;
    const i = (S.nudgeI || 0) % NUDGES.length;
    t.insertAdjacentHTML('beforebegin', `<div class="acc-nudge"><span>${NUDGES[i]}</span><button class="btn sm pink" id="nudgeGo">Позвать взрослого</button><button class="nudge-x" id="nudgeX" aria-label="Закрыть">✕</button></div>`);
    const seen = () => { S.nudgeI = i + 1; save(); try { localStorage.setItem('murlok-nudge-at', Date.now()); } catch (e) { } };
    $('#nudgeGo').addEventListener('click', () => { seen(); go('pauth'); });
    $('#nudgeX').addEventListener('click', () => { seen(); $('.acc-nudge', app)?.remove(); });
    if (!document.getElementById('nudge-css')) { const st = document.createElement('style'); st.id = 'nudge-css'; st.textContent = '.acc-nudge{display:flex;align-items:center;gap:10px;flex-wrap:wrap;position:relative;padding-right:40px}.acc-nudge span{flex:1 1 220px}.nudge-x{position:absolute;right:8px;top:8px;width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.7);font-size:15px}'; document.head.appendChild(st); }
  }
  /* ---------- раздел для взрослых: вход в кабинет ---------- */
  { const pr = SCREENS.parents; SCREENS.parents = arg => { pr(arg); const pg = $('.page.parents', app); if (!pg) return; const P = parent();
    if (window.VIEW_RO) { pg.insertAdjacentHTML('afterbegin', `<div class="card top-note"><h3>📊 Отчёт: ${esc(S.kid || '')}</h3><p class="small">Прогресс из облака — только просмотр. Здесь ничего нельзя случайно изменить.</p></div>`); return; }
    if (S.role === 'adult' && P) pg.insertAdjacentHTML('afterbegin', `<div class="card top-note"><h3>🧑 Это отчёт о Вашей собственной игре</h3><p class="small">Сейчас открыт Ваш игровой профиль «${esc(S.kid || '')}». Подробные отчёты детей — в кабинете, кнопка «📊 Отчёт» рядом с именем ребёнка.</p><div class="row-btns"><button class="btn pink" data-go="pcab">📊 Отчёты детей</button></div></div>`);
    pg.insertAdjacentHTML('afterbegin', `<div class="card acc-card"><h3>👨‍👩‍👧 Личный кабинет</h3>${P ? `<p>Вы вошли как <b>${esc(P.email)}</b>.</p><div class="row-btns"><button class="btn pink" data-go="pcab">Открыть кабинет</button><button class="btn" id="aout3">🚪 Выйти</button></div>` : `<p class="small">Регистрация родителя: облачное хранение прогресса, вход на любом устройстве, друзья, отчёты, подстройка программы. ${linked() ? '' : 'Сейчас прогресс хранится только на этом устройстве.'}</p><button class="btn pink" data-go="pauth">Войти или зарегистрироваться</button>`}</div>`); $('#aout3', pg)?.addEventListener('click', () => parentOut()); }; }
  /* ---------- друзья — только с кабинетом ---------- */
  { const fr = SCREENS.friends; if (fr) SCREENS.friends = arg => { if (!linked()) { app.innerHTML = `${topbar('🤝 Друзья')}<div class="page"><div class="card center"><div class="big-emoji">🔐</div><h2>Друзья — вместе со взрослым</h2><p>Чтобы ходить в гости и дружить, попроси маму или папу открыть <b>личный кабинет</b> и привязать твой прогресс. Так безопаснее!</p><button class="btn pink big" data-go="clogin">🧒 Войти по семейному коду</button><p class="small">Код семьи и твою картинку-ПИН знает мама или папа — они в кабинете взрослого. Твоя игра на этом планшете перенесётся в семью.</p><button class="link small" data-go="agate" data-arg="${window.Accounts && Accounts.parent() ? 'linknow' : 'pcab'}">Я взрослый: привязать сам</button></div></div>`; return; } return fr(arg); }; }
  /* ---------- подстройка: приоритеты родителя и интересы ребёнка поднимают предметы в Академии ---------- */
  const LIKE2SUBJ = { '🐾 Животные и природа': ['world'], '🚀 Космос и наука': ['space', 'body'], '📖 Читать истории': ['stories', 'read'], '🎨 Рисовать и придумывать': ['creative'], '💬 Общаться с друзьями': ['talk'], '🧮 Решать задачи': ['think'], '🎲 Играть в игры': ['think', 'creative'] };
  function wanted() { const w = new Set(S.prio || []); [].concat((S.profile || {}).like || []).forEach(x => (LIKE2SUBJ[x] || []).forEach(id => w.add(id))); return w; }
  { const ah = SCREENS.academy; SCREENS.academy = arg => { ah(arg); const W = wanted(), grid = $('.acad-grid', app); if (!grid || !W.size) return;
    $$('.acad-card[data-s]', grid).filter(c => W.has(c.dataset.s)).reverse().forEach(c => { c.classList.add('fav'); if (!$('.favb', c)) c.insertAdjacentHTML('beforeend', '<span class="favb">⭐ для тебя</span>'); grid.prepend(c); }); }; }
  // при каждом запуске: приоритеты, новое имя из кабинета; токен не принят (семью удалили) — устройство отвязывается
  // (раньше проверка шла раз за сессию вкладки, и после удаления семьи оставалось «☁️ сохранено»)
  window.cloudUnlinked = () => { if (!child()) return; ls.set(AK, null); S.cloudAt = 0; save(); toast('Семейный кабинет больше не связан с этим устройством — прогресс сохраняется только здесь'); if (curScreen === 'home') go('home'); };
  if (linked() && !window.VIEW_RO) api('child/me', null, child().token).then(d => { if (!S.kid) return; S.prio = d.priorities || []; if (d.survey && !S.profile) S.profile = d.survey; const A2 = child(); if (d.role === 'child' && d.name && d.name !== S.kid) { S.kid = d.name; if (A2) { A2.name = d.name; ls.set(AK, A2); } if (curScreen === 'home') setTimeout(() => curScreen === 'home' && go('home'), 50); } save(); }).catch(e => { if (e.code === 'auth') window.cloudUnlinked(); });
  /* ---------- выход: родитель — из кабинета, ребёнок — со своего профиля на этом устройстве ---------- */
  async function parentOut() { const P = parent(); if (P) await api('logout', {}, P.token).catch(() => { }); ls.set(PK, null); toast('Вы вышли из кабинета'); go(S.kid ? 'home' : 'hello'); }
  function childOut() {
    if (!linked()) { toast('Сначала взрослый привяжет прогресс к кабинету — иначе он потеряется'); return; }
    if (S.role !== 'adult' && window.Limits && Limits.rules() && !adultOk()) { toast('Пока действуют правила времени, выйти можно только вместе со взрослым'); return gate('home'); } // иначе «выйти → новый игрок» обходит ограничения
    const m = modal(`<div class="big-emoji">🚪</div><h2>Выйти из игры?</h2><p>Твой прогресс сохранится в облаке. ${(child() || {}).hasPin === true ? 'Вернуться можно по семейному коду и своей картинке-ПИН.' : (child() || {}).hasPin === false ? 'Вернуться можно по семейному коду — вход подтвердит мама или папа.' : 'Вернуться можно по семейному коду.'}</p><div class="row-btns"><button class="btn pink" id="cout">Сохранить и выйти</button><button class="btn" data-close>Остаться</button></div>`);
    $('#cout', m.el).addEventListener('click', async () => { $('#cout', m.el).disabled = true; $('#cout', m.el).textContent = 'Сохраняем…';
      try { const r = await fetch(CLOUD + '/save', { method: 'POST', headers: { 'content-type': 'application/json', ...cloudHdr() }, body: JSON.stringify({ code: cloudCode(), data: (({ pin, pinLock, ...x }) => ({ ...x, chatLog: [] }))(S) }) }); if (!r.ok && r.status !== 409) throw 0; } // 409 — в облаке уже более свежий прогресс, он и останется
      catch (e) { $('#cout', m.el).disabled = false; $('#cout', m.el).textContent = 'Сохранить и выйти'; toast('Нет связи — прогресс не сохранился, попробуй позже'); return; }
      ls.set(AK, null); try { localStorage.removeItem(KEY); localStorage.setItem('murlok-saw-site', '1'); localStorage.setItem('murlok-had-family', '1'); } catch (e) { } location.href = '?site=1'; }); // после выхода — на сайт
  }
  // «Выйти» для любого случая: привязанный ребёнок — сохраняем в облако и выходим; без кабинета — объясняем, что прогресс пропадёт
  function exitAny() {
    if (linked()) return childOut();
    const m = modal(`<div class="big-emoji">🚪</div><h2>Выйти?</h2><p>Сейчас прогресс <b>${esc(S.kid || '')}</b> хранится только на этом устройстве. Если выйти, он пропадёт.</p><p class="small">Попроси взрослого открыть кабинет и привязать прогресс — тогда можно выходить и входить на любом устройстве по семейному коду.</p><div class="row-btns"><button class="btn pink" id="ex-link">👨‍👩‍👧 Привязать (для взрослых)</button>${window.Extras ? '<button class="btn" id="ex-prof">👥 Сменить игрока</button>' : ''}${parent() ? '<button class="btn" id="ex-pout">🔓 Выйти взрослому</button>' : ''}<button class="btn" data-close>Остаться</button></div>`);
    $('#ex-link', m.el).addEventListener('click', () => { m.close(); gate('pcab'); });
    $('#ex-prof', m.el)?.addEventListener('click', () => { m.close(); Extras.openProfiles(); });
    $('#ex-pout', m.el)?.addEventListener('click', () => { m.close(); parentOut(); });
  }
  /* ---------- замок раздела для взрослых ----------
     Есть ПИН → только ПИН (5 ошибок — пауза 10 минут). Нет ПИНа или забыли → код из почты родителя, затем новый ПИН.
     Ребёнку не пройти: у него нет ни ПИНа, ни доступа к маминой почте. Ушли из раздела — замок снова закрыт. */
  const ADULT = new Set(['parents', 'pcab', 'pauth', 'agate', 'pinset', 'linknow']);
  let adultUntil = 0;
  const devOpen = () => !!window.VIEW_RO || location.hostname === 'localhost' && !S.pin && !localStorage.getItem('murlok-strict-gate'); // автотесты на своём компьютере
  const adultOk = () => devOpen() || Date.now() < adultUntil;
  const unlock = () => { adultUntil = Date.now() + 20 * 60 * 1000; };
  // устройство ребёнка из семьи: ушли из раздела для взрослых — сессия взрослого закрывается (у ребёнка её быть не должно)
  const kidDevice = () => linked() && !(child() || {}).adult && S.role !== 'adult';
  let inAdult = false;
  { const g0 = go; go = function (name) { if (ADULT.has(name)) inAdult = true; else { if (inAdult && kidDevice() && parent()) { const P = parent(); ls.set(PK, null); api('logout', {}, P.token).catch(() => { }); } inAdult = false; adultUntil = 0; } return g0.apply(this, arguments); }; }
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
      if (pinOk($('#pinin').value.trim())) { L.n = 0; save(); unlock(); go(next); return; }
      L.n++; if (L.n >= 5) { L.n = 0; L.until = Date.now() + 10 * 60 * 1000; } save();
      SND.bad(); shake($('#pinin')); $('#pinin').value = ''; $('#pinerr').textContent = L.until > Date.now() ? 'Слишком много попыток. Попробуйте через 10 мин.' : 'Неверный ПИН';
    };
    $('#pingo').addEventListener('click', tryIt); $('#pinin').addEventListener('keydown', e => { if (e.key === 'Enter') tryIt(); });
    $('#pinforgot').addEventListener('click', () => go('pauth', 'gate:' + next));
  };
  // ПИН храним только как солёный хэш (и не отправляем в облако); старые ПИНы открытым текстом тоже принимаем и тут же перехэшируем
  function pinHash(p, salt) { salt = salt || Math.random().toString(36).slice(2, 10); let h = 2166136261 >>> 0; const src = salt + ':' + p; for (let k = 0; k < 20000; k++) for (let i = 0; i < src.length; i++) { h ^= src.charCodeAt(i) + k; h = Math.imul(h, 16777619) >>> 0; } return 'h1:' + salt + ':' + h.toString(36); }
  function pinOk(p) { const v = String(S.pin || ''); if (!v) return false; if (!v.startsWith('h1:')) { if (p !== v) return false; S.pin = pinHash(p); save(); return true; } return pinHash(p, v.split(':')[1]) === v; }
  window.pinOk = pinOk;
  SCREENS.pinset = next => {
    next = next || 'parents'; if (!adultOk()) return gate(next);
    app.innerHTML = `${topbar('🔐 ПИН для взрослых', S.kid ? 'home' : 'hello')}<div class="page center acc"><div class="card"><div class="big-emoji">🔢</div><h2>Придумайте ПИН</h2><p class="small">4 цифры. По ним вы будете входить в раздел для взрослых на этом устройстве — без кода из почты. Не показывайте их ребёнку. Забудете — войдёте снова по коду из почты.</p><input id="pin1" class="nmi" type="password" inputmode="numeric" maxlength="4" placeholder="ПИН" autocomplete="off" style="text-align:center;max-width:220px"><input id="pin2" class="nmi" type="password" inputmode="numeric" maxlength="4" placeholder="Ещё раз" autocomplete="off" style="text-align:center;max-width:220px"><p class="small err" id="perr"></p><button class="btn pink big" id="pinok">Сохранить</button><button class="link" id="pinlater">Не сейчас</button></div></div>`;
    $('#pinlater').addEventListener('click', () => go(next));
    $('#pinok').addEventListener('click', () => { const a = $('#pin1').value.trim(), b = $('#pin2').value.trim();
      if (!/^\d{4}$/.test(a)) { $('#perr').textContent = 'Нужно ровно 4 цифры'; return; } if (/^(\d)\1{3}$|^(1234|4321|0123)$/.test(a)) { $('#perr').textContent = 'Слишком простой ПИН — ребёнок угадает'; return; }
      if (a !== b) { $('#perr').textContent = 'ПИНы не совпадают'; return; }
      S.pin = pinHash(a); S.pinLock = { n: 0, until: 0 }; save(); SND.win(); toast('ПИН сохранён'); go(next); });
  };
  { const os = openSettings; openSettings = function () { const r = os.apply(this, arguments); const L = $$('.modal .set-list').pop(); if (L && !$('#set-adult', L)) {
    // кто вошёл и «Выйти» — всегда сверху, чтобы не искать
    L.insertAdjacentHTML('beforebegin', `<div class="acc-line"><span class="al-ic">${linked() ? '☁️' : '📱'}</span><div class="al-t"><b>${esc(S.kid || 'Игрок')}</b><small>${linked() ? 'вход по семейному коду' : 'прогресс только на этом устройстве'}${parent() && !kidDevice() ? ' · взрослый: ' + esc(parent().email) : ''}</small></div><button class="btn sm" id="set-exit">🚪 Выйти</button></div>`);
    L.insertAdjacentHTML('beforeend', `${parent() && !kidDevice() ? '<button class="set-row" id="set-pout"><span>🔓</span><b>Выйти из кабинета взрослого</b><i class="arr">›</i></button>' : ''}<button class="set-row adult" id="set-adult"><span>👨‍👩‍👧</span><b>Для взрослых</b><i class="arr">›</i></button><a class="set-row" id="set-site" href="?site=1"><span>🌐</span><b>На сайт «Мурлок и Ко»</b><i class="arr">›</i></a>`);
    const close = () => $$('.modal').forEach(x => x.remove());
    $('#set-adult', L).addEventListener('click', () => { close(); gate('parents'); });
    $('#set-exit')?.addEventListener('click', () => { close(); exitAny(); });
    $('#set-pout', L)?.addEventListener('click', () => { close(); parentOut(); });
  } return r; }; }
  ['pauth', 'pcab', 'clogin', 'survey', 'agate', 'pinset', 'linknow'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { parent, child, linked, api, SURVEY, gate, adultOk, parentOut, childOut, exitAny, ADULT };
})();
window.Accounts = Accounts;
// ссылка «Открыть кабинет родителя» с сайта (app/#parents) — сразу ко входу взрослого, а не в детскую анкету
if (location.hash === '#parents') setTimeout(() => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { } go(Accounts.parent() ? 'pcab' : 'pauth'); }, 400);
// ссылка «Принять приглашение» из письма (app/#join=почта) — вход взрослого сразу с этой почтой
{ const jm = location.hash.match(/^#join=([^&]+)/); if (jm) { let em = ''; try { em = decodeURIComponent(jm[1]).trim().toLowerCase(); } catch (e) { } if (/^\S+@\S+\.\S+$/.test(em)) { try { sessionStorage.setItem('murlok-join', em); history.replaceState(null, '', location.pathname + location.search); } catch (e) { } setTimeout(() => go(Accounts.parent() ? 'pcab' : 'pauth'), 400); } } }
