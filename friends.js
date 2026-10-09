/* friends.js — друзья и гости в домиках.
   Безопасность: дружба только взаимная (оба вводят «код друга» друг друга), никакого свободного текста —
   только ❤️, готовые стикеры-подарки и фразы из списка. Гостевой домик рисуется отдельно, только для чтения:
   глобальное состояние S не трогается. */
'use strict';
const Friends = (() => {
  const API = CLOUD + '/friend/';
  let cache = null, me = null;
  const on = () => S.friendsOn !== false;
  async function call(act, body = {}) {
    if (!S.kid) throw new Error('nokid');
    const r = await fetch(API + act, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: cloudCode(), ...body }) });
    const d = await r.json().catch(() => ({}));
    if (d.error === 'nocloud') { cloudDirty = true; cloudPush(); throw Object.assign(new Error('nocloud'), { soft: true }); }
    if (!r.ok) throw Object.assign(new Error(d.error || r.status), { code: d.error });
    return d;
  }
  const pubRooms = () => { try { return window.Lines.ROOMS.filter(roomOpen).map(r => r.id); } catch (e) { return []; } };
  function syncPub() { const pr = pubRooms(); if (JSON.stringify(pr) !== JSON.stringify(S.pubRooms || [])) { S.pubRooms = pr; save(); } }
  const furSafe = f => (FURS[f] ? f : 'ginger');
  const ago = ts => { if (!ts) return ''; const m = Math.round((Date.now() - ts) / 6e4); return m < 60 ? 'был(а) недавно' : m < 1440 ? `был(а) ${Math.round(m / 60)} ч назад` : `был(а) ${Math.round(m / 1440)} дн. назад`; };
  const roomName = id => (window.Lines.ROOMS.find(r => r.id === id) || {}).name || id;

  /* ---------- экран «Друзья» ---------- */
  SCREENS.friends = async () => {
    syncPub();
    app.innerHTML = `${topbar('🤝 Друзья')}<div class="page friends"><div class="fr-load center"><div class="big-emoji">🐾</div><p>Котик ищет твоих друзей…</p></div></div>`;
    if (!on()) { $('.friends').innerHTML = '<div class="card center"><div class="big-emoji">🔒</div><p>Друзья сейчас выключены взрослыми.</p></div>'; return; }
    let d; try { d = await load(); } catch (e) {
      if (curScreen !== 'friends') return;
      $('.friends').innerHTML = `<div class="card center"><div class="big-emoji">☁️</div><p>${e.soft ? 'Сохраняем твой домик в облако… Попробуй ещё раз через минутку.' : 'Не получилось связаться с сервером. Проверь интернет.'}</p><button class="btn pink" data-go="friends">Ещё раз</button></div>`; return;
    }
    if (curScreen !== 'friends') return;
    const card = f => `<div class="fr-card"><div class="fr-cat">${catSVG({ fur: furSafe(f.fur), wear: f.wear || {}, smile: true })}</div><div class="fr-info"><b>${esc(f.cat)}</b><small>${esc(f.kid || '')}${f.seen ? ' · ' + ago(f.seen) : ''}</small></div><button class="btn pink sm" data-visit="${f.pub}">🏠 В гости</button><button class="fr-x" data-del="${f.pub}" aria-label="Удалить из друзей">✕</button></div>`;
    $('.friends').innerHTML = `
      <div class="card fr-me"><h3>Мой код друга</h3><div class="ccode">${d.me}</div><p class="small">Скажи этот код другу <b>лично</b> — в школе, во дворе или через маму. Друг введёт твой код, а ты — его. Так дружат только те, кто знает друг друга по-настоящему.</p></div>
      <div class="card"><h3>Добавить друга</h3><div class="fr-add"><input id="frc" class="nmi" maxlength="6" placeholder="Код друга" autocomplete="off" autocapitalize="characters"><button class="btn pink" id="fradd">Добавить</button></div><p class="small">🛡️ Добавляй только тех, кого знаешь в жизни. В игре нет переписки — только ❤️, подарки и добрые фразы.</p></div>
      ${d.incoming.length ? `<div class="card"><h3>Хотят дружить</h3>${d.incoming.map(f => `<div class="fr-req"><span>🐾 Котик <b>${esc(f.cat)}</b>${f.kid ? ' (' + esc(f.kid) + ')' : ''}</span><button class="btn sm mint" data-acc="${f.pub}">Дружить!</button></div>`).join('')}<p class="small">Нажимай, только если знаешь этого человека.</p></div>` : ''}
      ${d.inbox.length ? `<div class="card"><h3>Новости от друзей ${d.unread ? `<span class="badge">${d.unread}</span>` : ''}</h3><div class="fr-inbox">${d.inbox.slice(0, 12).map(x => `<div class="fr-msg ${x.read ? '' : 'new'}">${x.kind === 'like' ? '❤️' : x.kind === 'gift' ? d.gifts[x.val] : '💬'} <b>${esc(x.cat)}</b>${x.kid ? ' (' + esc(x.kid) + ')' : ''} ${x.kind === 'like' ? `— понравилась твоя комната «${esc(roomName(x.room))}»` : x.kind === 'gift' ? '— прислал(а) тебе подарок!' : `: «${esc(d.phrases[x.val] || '')}»`}</div>`).join('')}</div></div>` : ''}
      <h3>Мои друзья</h3>${d.friends.length ? `<div class="fr-list">${d.friends.map(card).join('')}</div>` : '<p class="small center">Пока друзей нет. Обменяйся кодами с другом — и ходите друг к другу в гости!</p>'}
      ${d.pending.length ? `<p class="small">⏳ Ждём, когда введут твой код: ${d.pending.map(f => `<b>${esc(f.cat)}</b>`).join(', ')}.</p>` : ''}`;
    const add = async pub => {
      pub = String(pub || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); if (pub.length !== 6) { toast('Код друга — 6 букв и цифр'); return; }
      try { const r = await call('add', { pub }); SND.win(); toast(r.status === 'mutual' ? `<span class="tb">🤝</span><div>Вы с котиком <b>${esc(r.friend.cat)}</b> теперь друзья!</div>` : `<span class="tb">⏳</span><div>Котик <b>${esc(r.friend.cat)}</b> добавлен. Когда он введёт твой код — вы станете друзьями.</div>`); cache = null; go('friends'); }
      catch (e) { SND.bad(); toast({ nf: 'Такого кода нет. Проверь буквы и цифры.', self: 'Это твой собственный код 🙂', many: 'Друзей уже очень много!', slow: 'Слишком много попыток. Попробуй позже.' }[e.code] || 'Не получилось. Проверь интернет.'); }
    };
    $('#fradd').addEventListener('click', () => add($('#frc').value)); $('#frc').addEventListener('keydown', e => { if (e.key === 'Enter') add($('#frc').value); });
    $$('[data-acc]').forEach(b => b.addEventListener('click', () => add(b.dataset.acc)));
    $$('[data-visit]').forEach(b => b.addEventListener('click', () => { SND.tap(); go('visit', b.dataset.visit); }));
    $$('[data-del]').forEach(b => b.addEventListener('click', () => { const m = modal(`<h2>Удалить из друзей?</h2><p>Вы больше не сможете ходить друг к другу в гости, пока снова не обменяетесь кодами.</p><div class="row-btns"><button class="btn danger" id="frdel">Удалить</button><button class="btn" data-close>Отмена</button></div>`); $('#frdel', m.el).addEventListener('click', async () => { await call('remove', { pub: b.dataset.del }).catch(() => { }); m.close(); cache = null; go('friends'); }); }));
    if (d.unread) call('seen').catch(() => { });
  };
  async function load() { const d = await call('list'); cache = { d, t: Date.now() }; me = d.me; return d; }

  /* ---------- в гостях ---------- */
  SCREENS.visit = async pub => {
    app.innerHTML = `${topbar('🏠 В гостях', 'friends')}<div class="page visit"><div class="center"><div class="big-emoji">🚶‍♀️🐾</div><p>Идём в гости…</p></div></div>`;
    let h; try { h = await call('house', { pub }); } catch (e) { if (curScreen !== 'visit') return; $('.visit').innerHTML = `<div class="card center"><p>${e.code === 'closed' ? 'Домик друга сейчас закрыт для гостей.' : e.code === 'notfriend' ? 'Вы пока не друзья.' : 'Не получилось зайти в гости. Проверь интернет.'}</p><button class="btn" data-go="friends">К друзьям</button></div>`; return; }
    if (curScreen !== 'visit') return;
    if (!cache) await load().catch(() => { });
    const gifts = (cache && cache.d.gifts) || [], phrases = (cache && cache.d.phrases) || [];
    const rooms = window.Lines.ROOMS.filter(r => h.rooms.includes(r.id)); let cur = rooms[0];
    const liked = new Set();
    $('.visit').innerHTML = `<div class="visit-head"><div class="fr-cat sm">${catSVG({ fur: furSafe(h.fur), wear: h.wear, smile: true, paw: true })}</div><div><b>Домик котика ${esc(h.cat)}</b><small>${h.kid ? 'Хозяйка/хозяин: ' + esc(h.kid) : ''}</small></div></div>
      <div class="room-tabs" id="vrt"></div><div class="room big" id="vroom"></div>
      <div class="visit-act"><button class="btn" id="vlike">❤️ Нравится</button><button class="btn" id="vgift">🎁 Подарок</button><button class="btn" id="vsay">💬 Сказать</button></div><p class="small center">Ты в гостях — вещи можно рассматривать, но двигать их может только хозяин 🙂</p>`;
    const roomEl = $('#vroom'), setU = () => roomEl.style.setProperty('--u', (roomEl.clientWidth / 100) + 'px');
    const ro = window.ResizeObserver ? new ResizeObserver(setU) : null; ro && ro.observe(roomEl); cleanups.push(() => ro && ro.disconnect());
    const zOf = y => 200 - Math.round(y * 2);
    const draw = () => {
      $('#vrt').innerHTML = rooms.map(r => `<button class="rtab ${r === cur ? 'on' : ''}" data-r="${r.id}"><span>${r.icon}</span>${r.name}${h.likes[r.id] ? ` <small>❤️${h.likes[r.id]}</small>` : ''}</button>`).join('');
      $$('#vrt .rtab').forEach(b => b.addEventListener('click', () => { cur = rooms.find(r => r.id === b.dataset.r); SND.tap(); draw(); }));
      const pl = h.place[cur.id] || cur.fixed.map(f => ({ id: f[0], x: f[3], y: f[4] })), cat = h.catAt[cur.id] || { x: 72, y: 3 };
      roomEl.className = `room big guest ${cur.dark ? 'dark' : ''} ${ROOM_IMG.has(cur.id) ? 'hasbg' : ''}`; roomEl.style.backgroundImage = ROOM_IMG.has(cur.id) ? `url('img/rooms/${cur.id}.jpg')` : '';
      roomEl.style.setProperty('--wall', cur.wall); roomEl.style.setProperty('--floor', cur.floor); setU();
      roomEl.innerHTML = `<div class="wall"><div class="window">${cur.dark ? '✨' : '☁️'}</div></div><div class="floor"></div>
        ${pl.map(p => { const it = itemInfo(cur, p.id); return it ? `<button class="fx" data-id="${esc(p.id)}" style="left:${p.x}%;bottom:${p.y}%;z-index:${zOf(p.y)};--s:${FSIZE[p.id] || 10}">${icon(p.id, it.icon)}</button>` : ''; }).join('')}
        <div class="room-cat" style="left:${cat.x}%;bottom:${cat.y}%;z-index:${zOf(cat.y) + 1}">${catSVG({ fur: furSafe(h.fur), wear: h.wear, smile: true })}</div>
        <div class="room-cat guest-cat" style="left:14%;bottom:3%;z-index:420">${myCat({ smile: true, paw: true })}</div>`;
      $$('.fx', roomEl).forEach(b => b.addEventListener('click', () => { b.classList.remove('wiggle'); void b.offsetWidth; b.classList.add('wiggle'); M.sfx('pop'); const it = itemInfo(cur, b.dataset.id); if (it) floatText(it.name); }));
      $('#vlike').classList.toggle('on', liked.has(cur.id));
    };
    draw();
    const react = async (kind, val) => { try { const r = await call('react', { pub, kind, room: cur.id, val }); if (kind === 'like') { liked.add(cur.id); if (!r.dup) h.likes[cur.id] = (h.likes[cur.id] || 0) + 1; draw(); hearts($('#vroom'), 4); } SND.win(); toast(kind === 'like' ? '❤️ Хозяин узнает, что тебе понравилось!' : kind === 'gift' ? `🎁 Подарок ${gifts[val]} отправлен!` : '💬 Друг увидит твои слова!'); } catch (e) { toast(e.code === 'slow' ? 'На сегодня хватит — завтра можно ещё 🙂' : 'Не получилось отправить'); } };
    $('#vlike').addEventListener('click', () => { if (liked.has(cur.id)) return toast('Ты уже поставил(а) ❤️ этой комнате'); react('like', 0); });
    $('#vgift').addEventListener('click', () => { const m = modal(`<h2>🎁 Подарок другу</h2><div class="fr-pick">${gifts.map((g, i) => `<button class="ph-s" data-g="${i}">${g}</button>`).join('')}</div><button class="btn" data-close>Отмена</button>`); $$('[data-g]', m.el).forEach(b => b.addEventListener('click', () => { m.close(); react('gift', +b.dataset.g); })); });
    $('#vsay').addEventListener('click', () => { const m = modal(`<h2>💬 Что сказать?</h2><div class="fr-phr">${phrases.map((p, i) => `<button class="btn" data-p="${i}">${p}</button>`).join('')}</div><button class="btn" data-close>Отмена</button>`); $$('[data-p]', m.el).forEach(b => b.addEventListener('click', () => { m.close(); react('phrase', +b.dataset.p); })); });
    M.meow({ shape: 'happy' });
  };

  /* ---------- подключение ---------- */
  const wrap = (n, after) => { const f = SCREENS[n]; if (!f) return; SCREENS[n] = arg => { const r = f(arg); try { after(arg); } catch (e) { console.warn(e); } return r; }; };
  wrap('home', () => {
    syncPub(); if (!on()) return;
    const ph = $('.t-photo', app) || $('.t-house', app); if (!ph || $('.t-friends', app)) return;
    ph.insertAdjacentHTML('beforebegin', '<button class="tile t-friends" data-go="friends"><span class="ti">🤝</span><b>Друзья</b><small>Ходите в гости в домики</small><span class="tbadge" id="frbadge" hidden></span></button>');
    if (S.cloudAt && !cloudOff()) call('list').then(d => { cache = { d, t: Date.now() }; const b = $('#frbadge'); const n = d.unread + d.incoming.length; if (b && n) { b.hidden = false; b.textContent = n; } }).catch(() => { });
  });
  wrap('house', () => { syncPub(); });
  wrap('parents', () => {
    const pg = $('.page.parents', app); if (!pg || !$('#reset', pg)) return;
    $('#reset', pg).insertAdjacentHTML('beforebegin', `<div class="card"><h3>🤝 Друзья в игре</h3><label class="tgl"><input type="checkbox" id="frOn" ${on() ? 'checked' : ''}> Разрешить друзей и гостей в домике</label><p class="small">Дружба только взаимная: дети обмениваются кодами лично. Переписки нет — только ❤️, стикеры и готовые добрые фразы. Друзья видят имя котика, имя ребёнка, наряд и комнаты домика — и больше ничего.</p><div id="frpar" class="small">Загружаем список…</div></div>`);
    $('#frOn').addEventListener('change', e => { S.friendsOn = e.target.checked; save(); cloudDirty = true; cloudPush(); });
    call('list').then(d => { const el = $('#frpar'); if (!el) return; el.innerHTML = d.friends.length ? d.friends.map(f => `<div class="fr-req"><span>🐾 ${esc(f.cat)}${f.kid ? ' (' + esc(f.kid) + ')' : ''}</span><button class="btn sm danger" data-pdel="${f.pub}">Удалить</button></div>`).join('') : 'Друзей пока нет.'; $$('[data-pdel]', el).forEach(b => b.addEventListener('click', async () => { await call('remove', { pub: b.dataset.pdel }).catch(() => { }); b.closest('.fr-req').remove(); })); }).catch(() => { const el = $('#frpar'); if (el) el.textContent = 'Список появится, когда прогресс сохранится в облаке.'; });
  });
  ['friends', 'visit'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  return { call, syncPub };
})();
window.Friends = Friends;
