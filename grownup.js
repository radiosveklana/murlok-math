/* grownup.js (v30) — взрослые в игре и время игры детей.
   1) «🎮 Играть самому»: в кабинете взрослый создаёт своего котика (запись role 'adult-player' в семье, POST /acc/play).
      На устройстве это отдельный профиль игрока (extras.js) с пометкой «взрослый»; войти в него с профиля ребёнка можно
      только через замок для взрослых. Взрослый виден в таблице успехов семьи, вызовах и челленджах, но не в друзьях.
   2) «⏳ Время игры»: норма на день, разрешённые часы и перерывы для каждого ребёнка (POST /acc/child/:id/limits),
      сколько ребёнок играл сегодня. Правила на устройстве применяет limits.js. */
'use strict';
const Grownup = (() => {
  const PKEY = 'murlok-profiles';
  const ROLES = ['Мама', 'Папа', 'Бабушка', 'Дедушка'];
  const DAILY = [[0, 'Без ограничения'], [15, '15 мин'], [30, '30 мин'], [45, '45 мин'], [60, '1 час'], [90, '1,5 часа'], [120, '2 часа']];
  const HOURS = Array.from({ length: 48 }, (_, i) => String(Math.floor(i / 2)).padStart(2, '0') + ':' + (i % 2 ? '30' : '00'));
  const profs = () => (window.Extras ? Extras.profs() : { active: 'main', list: [] });
  const keyOf = id => (window.Extras ? Extras.keyOf(id) : (id === 'main' ? 'murlok-detective-v1' : 'murlok-detective-v1:' + id));
  const setProfs = P => { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) { } };
  const isAdult = () => S.role === 'adult';
  function remember(P) { // карточка текущего игрока — чтобы потом вернуться к нему через «Игроки»
    if (!S.kid) return; let me = P.list.find(x => x.id === P.active); if (!me) { me = { id: P.active }; P.list.push(me); }
    Object.assign(me, { kid: S.kid, cat: S.name, fur: S.fur, wear: S.wear, xp: S.xp }, isAdult() ? { adult: true, cloudCode: S.cloudCode } : {});
  }
  function switchTo(id) { const P = profs(); remember(P); P.active = id; setProfs(P); try { cloudPush(); } catch (e) { } location.reload(); }

  /* ---------- «Играть самому» ---------- */
  async function play(Pp, name, cat, btn) {
    if (btn) { btn.disabled = true; btn.textContent = 'Готовим котика…'; }
    let r; try { r = await Accounts.api('play', { name, cat }, Pp.token); }
    catch (e) { if (btn) { btn.disabled = false; btn.textContent = '🎮 Играть'; } toast(e.code === 'name' ? 'Имя — хотя бы 2 буквы' : 'Нет связи с сервером'); return; }
    const P = profs(); remember(P);
    let prof = P.list.find(p => p.adult && p.cloudCode === r.cloudCode);
    if (!prof) {
      if (P.list.length >= 6) { if (btn) { btn.disabled = false; btn.textContent = '🎮 Играть'; } toast('На устройстве уже 6 игроков — уберите кого-нибудь в ⚙️ «Игроки»'); return; }
      let base = null; if (r.hasSave) { try { const x = await fetch(CLOUD + '/load?code=' + r.cloudCode); if (x.ok) base = await x.json(); } catch (e) { } }
      const id = 'a' + Date.now().toString(36), key = keyOf(id);
      const sv = Object.assign(fresh(), base && base.v === 1 ? base : {}, { kid: r.name, name: (base && base.name) || r.cat || cat || 'Барсик', cloudCode: r.cloudCode, role: 'adult', seenVersion: APP_VERSION, limits: null });
      if (S.pin) { sv.pin = S.pin; sv.pinLock = { n: 0, until: 0 }; } // тот же ПИН раздела для взрослых — замок не ломается
      try { localStorage.setItem(key, JSON.stringify(sv)); } catch (e) { toast('Не хватает места на устройстве'); return; }
      prof = { id, kid: sv.kid, cat: sv.name, fur: sv.fur, wear: sv.wear, xp: sv.xp, adult: true, cloudCode: r.cloudCode }; P.list.push(prof);
    }
    try { localStorage.setItem('murlok-acc:' + keyOf(prof.id), JSON.stringify({ token: r.token, childId: r.childId, familyCode: r.familyCode, name: r.name, adult: true })); } catch (e) { }
    setProfs(P); SND.win(); toast('🎮 Открываем Вашего котика…');
    if (P.active === prof.id) { location.reload(); return; }
    P.active = prof.id; setProfs(P); try { cloudPush(); } catch (e) { } setTimeout(() => location.reload(), 400);
  }

  /* ---------- в профиль взрослого с профиля ребёнка — только через замок ---------- */
  SCREENS.adultswitch = () => {
    let id = ''; try { id = sessionStorage.getItem('adultSwitch') || ''; } catch (e) { }
    const p = profs().list.find(x => x.id === id); if (!p) return go('home');
    if (!Accounts.adultOk()) return Accounts.gate('adultswitch');
    try { sessionStorage.removeItem('adultSwitch'); } catch (e) { } switchTo(id);
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('.prof[data-p]'); if (!b) return;
    const P = profs(), p = P.list.find(x => x.id === b.dataset.p);
    if (!p || p.id === P.active || isAdult() || Accounts.adultOk()) return; // сменить игрока с профиля ребёнка — только через замок взрослого
    e.preventDefault(); e.stopImmediatePropagation(); $$('.modal').forEach(m => m.remove());
    try { sessionStorage.setItem('adultSwitch', p.id); } catch (er) { } go('adultswitch');
  }, true);
  // пометка «взрослый» в окне «Кто играет?»
  new MutationObserver(() => { const L = $$('.modal .prof[data-p]:not([data-adl])'); if (!L.length) return; const P = profs();
    L.forEach(b => { b.dataset.adl = '1'; const p = P.list.find(x => x.id === b.dataset.p); if (p && p.adult) b.insertAdjacentHTML('beforeend', '<small class="prof-adl">🧑 взрослый · вход через замок</small>'); }); })
    .observe(document.body, { childList: true });

  /* ---------- профиль взрослого: без друзей из других семей, понятная подпись в настройках ---------- */
  { const fr = SCREENS.friends; if (fr) SCREENS.friends = arg => { if (!isAdult()) return fr(arg); app.innerHTML = `${topbar('🤝 Друзья')}<div class="page"><div class="card center"><div class="big-emoji">🧑</div><h2>Друзья — для детей</h2><p>Взрослый игрок играет со своей семьёй: таблица успехов, вызовы и челленджи.</p><button class="btn pink" data-go="board">🏆 К успехам семьи</button></div></div>`; }; }
  { const os = openSettings; openSettings = function () { const r = os.apply(this, arguments); if (isAdult()) { const s = $('.modal .acc-line .al-t small'); if (s) s.textContent = 'взрослый игрок семьи · вернуться к ребёнку — «Игроки»'; } return r; }; }

  /* ---------- кабинет: карточки «Играть самому» и «Время игры» ---------- */
  function cabinet(F, Pp, root) {
    if (!root || !F) return;
    const mine = (F.players || []).find(p => p.mine), others = (F.players || []).filter(p => !p.mine);
    const playCard = `<div class="card" id="gplay"><h3>🎮 Играть самому</h3><p class="small">Играйте вместе с детьми: у Вас будет свой котик и свой прогресс. Вы появитесь в таблице успехов семьи с пометкой «взрослый», дети смогут бросать Вам вызовы, а Вы — им. Награды за семейные челленджи получают только дети.</p>
      ${mine ? `<div class="gp-me">${catSVG({ fur: FURS[mine.fur] ? mine.fur : 'ginger', wear: mine.wear || {}, smile: true })}<div><b>${esc(mine.name)}</b><small>котик ${esc(mine.cat || '')} · ⭐ ${mine.xp} · ${mine.minutesWeek} мин за неделю</small></div></div>
        <div class="row-btns">${isAdult() ? '<span class="small">Сейчас на этом устройстве играете Вы.</span><button class="btn" id="gp-back">👥 Вернуться к ребёнку</button>' : '<button class="btn pink" id="gp-go">🎮 Играть</button>'}<button class="btn sm" id="gp-del">Убрать моего котика</button></div>`
      : `<div class="fm-roles" id="gp-role">${ROLES.map((x, i) => `<label class="chip ${i ? '' : 'on'}" data-r="${x}">${x}</label>`).join('')}</div><input id="gp-name" class="nmi" maxlength="20" value="${ROLES[0]}" placeholder="Как Вас зовут в игре"><input id="gp-cat" class="nmi" maxlength="20" placeholder="Имя Вашего котика" value="Барсик"><button class="btn pink" id="gp-go">🎮 Создать котика и играть</button>`}
      ${others.length ? `<p class="small">Ещё играют: ${others.map(p => `${esc(p.name)} (котик ${esc(p.cat || '')}, ⭐ ${p.xp})`).join(', ')}</p>` : ''}
      <p class="small">На этом устройстве Ваш котик появится в ⚙️ «Игроки». С профиля ребёнка войти в него можно только через ПИН или код из почты.</p></div>`;
    const kids = F.children || [];
    const kidRow = k => { const l = k.limits || {}, hours = !!(l.from && l.to), here = S.cloudCode && S.cloudCode === k.cloudCode && !isAdult();
      const today0 = here ? Math.round(Limits.usedSec() / 60) : ((k.timeDays || {})[today()] || 0);
      const opt = (v, def) => HOURS.map(h => `<option ${h === (v || def) ? 'selected' : ''}>${h}</option>`).join('');
      return `<div class="lim-kid" data-k="${k.id}"><div class="lim-h"><b>${esc(k.name)}</b><span class="lim-today">Сегодня: <b>${today0}</b> ${plural(today0, 'минута', 'минуты', 'минут')}${l.daily ? ` из ${l.daily}` : ''}</span></div>
        ${l.daily ? `<span class="pbar"><i style="width:${Math.min(100, today0 / l.daily * 100)}%"></i></span>` : ''}
        <div class="lim-lbl">Сколько можно играть в день</div><div class="lim-daily">${DAILY.map(([v, n]) => `<label class="chip ${(+l.daily || 0) === v ? 'on' : ''}" data-d="${v}">${n}</label>`).join('')}</div>
        <label class="tgl"><input type="checkbox" class="lim-hrs" ${hours ? 'checked' : ''}> Только в разрешённые часы</label>
        <div class="lim-hsel" ${hours ? '' : 'hidden'}>с <select class="lim-from">${opt(l.from, '08:00')}</select> до <select class="lim-to">${opt(l.to, '20:00')}</select></div>
        <label class="tgl"><input type="checkbox" class="lim-brk" ${l.breaks ? 'checked' : ''}> Перерыв 5 минут каждые 25 минут игры</label>
        <button class="btn sm pink lim-save">Сохранить для ${esc(k.name)}</button></div>`; };
    const limCard = `<div class="card" id="glim"><h3>⏳ Время игры</h3><p class="small">Считаются только активные минуты (когда ребёнок что-то нажимает); раздел для взрослых не считается. За 5 минут до конца котик предупредит, потом покажет экран «Пора отдохнуть». Продлить на 15 минут можно на устройстве ребёнка — через ПИН или код из почты. Без интернета работают последние сохранённые настройки.</p>
      ${kids.length ? kids.map(kidRow).join('') : '<p class="small">Добавьте ребёнка — и здесь можно будет настроить время игры.</p>'}</div>`;
    const ad = $('#fadults', root); if (ad) ad.insertAdjacentHTML('afterend', playCard); else root.insertAdjacentHTML('beforeend', playCard);
    const pr = $('.prio', root), prCard = pr && pr.closest('.card'); if (prCard) prCard.insertAdjacentHTML('beforebegin', limCard); else root.insertAdjacentHTML('beforeend', limCard);

    // «Играть самому»
    $$('#gp-role .chip', root).forEach(c => c.addEventListener('click', () => { $$('#gp-role .chip', root).forEach(x => x.classList.toggle('on', x === c)); $('#gp-name', root).value = c.dataset.r; SND.tap(); }));
    $('#gp-go', root)?.addEventListener('click', e => { const name = mine ? mine.name : $('#gp-name', root).value.trim(), cat = mine ? mine.cat : $('#gp-cat', root).value.trim(); if (!mine && name.length < 2) return toast('Имя — хотя бы 2 буквы'); play(Pp, name, cat || 'Барсик', e.currentTarget); });
    $('#gp-back', root)?.addEventListener('click', () => window.Extras && Extras.openProfiles());
    $('#gp-del', root)?.addEventListener('click', () => { const m = modal(`<h2>Убрать Вашего котика?</h2><p>Прогресс взрослого игрока удалится, из таблицы успехов и вызовов Вы пропадёте. Прогресс детей не изменится.</p><div class="row-btns"><button class="btn danger" id="gpd">Убрать</button><button class="btn" data-close>Отмена</button></div>`);
      $('#gpd', m.el).addEventListener('click', async () => { try { await Accounts.api('play/remove', {}, Pp.token); } catch (e) { toast('Не получилось'); return; }
        const P = profs(), own = P.list.filter(p => p.adult && p.cloudCode === mine.cloudCode && p.id !== P.active); // локальный профиль этого взрослого убираем (кроме открытого сейчас)
        own.forEach(p => { try { localStorage.removeItem(keyOf(p.id)); localStorage.removeItem('murlok-acc:' + keyOf(p.id)); } catch (e) { } }); P.list = P.list.filter(p => !own.includes(p)); setProfs(P);
        m.close(); toast('Готово'); go('pcab'); }); });

    // «Время игры»
    $$('.lim-kid', root).forEach(box => {
      const k = kids.find(x => x.id === box.dataset.k); let daily = +((k.limits || {}).daily || 0);
      $$('.lim-daily .chip', box).forEach(c => c.addEventListener('click', () => { daily = +c.dataset.d; $$('.lim-daily .chip', box).forEach(x => x.classList.toggle('on', x === c)); SND.tap(); }));
      $('.lim-hrs', box).addEventListener('change', e => { $('.lim-hsel', box).hidden = !e.target.checked; });
      $('.lim-save', box).addEventListener('click', async () => {
        const hours = $('.lim-hrs', box).checked, body = { daily, from: hours ? $('.lim-from', box).value : null, to: hours ? $('.lim-to', box).value : null, breaks: $('.lim-brk', box).checked };
        if (hours && body.from === body.to) return toast('Начало и конец разрешённого времени совпадают');
        try { const r = await Accounts.api('child/' + k.id + '/limits', body, Pp.token); k.limits = r.limits;
          if (S.cloudCode && S.cloudCode === k.cloudCode && !isAdult()) Limits.apply(r.limits);
          toast(`Сохранено для ${esc(k.name)}. На устройстве ребёнка применится в течение 10 минут или при следующем запуске`); SND.win(); }
        catch (e) { toast('Не получилось сохранить — проверьте интернет'); }
      });
    });
  }

  if (!document.getElementById('grownup-css')) { const st = document.createElement('style'); st.id = 'grownup-css'; st.textContent = `
    .gp-me{display:flex;align-items:center;gap:10px;margin:6px 0}.gp-me svg{width:64px;height:64px;flex:0 0 64px}.gp-me small{display:block;color:var(--muted)}
    #gplay .nmi{margin:6px 0}.prof-adl{display:block;font-size:11px;color:#2B6CB0;font-weight:800}
    .lim-kid{padding:10px 0;border-bottom:1px solid #f1e8ee}.lim-kid:last-child{border-bottom:0}.lim-h{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px;align-items:baseline}
    .lim-today{font-size:14px;color:var(--muted)}.lim-lbl{font-size:13px;font-weight:700;margin:8px 0 4px}.lim-daily{display:flex;flex-wrap:wrap;gap:4px}.lim-daily .chip{cursor:pointer}.lim-daily .chip.on{background:var(--pink);color:#fff}
    .lim-hsel{margin:2px 0 6px 28px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}.lim-hsel select{font:inherit;padding:6px 8px;border-radius:10px;border:1px solid #E5D8E0;background:#fff}
    .lim-kid .lim-save{margin-top:6px}.lim-kid .pbar{display:block;margin:4px 0}
  `; document.head.appendChild(st); }

  return { cabinet, play, switchTo };
})();
window.Grownup = Grownup;
