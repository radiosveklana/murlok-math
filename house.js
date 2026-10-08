/* house.js — домик котика: комнаты, расстановка вещей пальцем, сундук с вещами, уход за котом */
'use strict';
const HL = window.Lines;
const OLD_FURN = { sofa: 20, plant: 10, pic: 15, tv: 30, fishtank: 40, clock: 20, bowl: 10, milk: 10, cake: 25, cookies: 15, teapot: 20, cupcakes: 35, bed: 30, teddy: 15, lamp: 15, books: 20, lights: 25, pillow: 15, map: 20, dossier: 15, flash: 15, phone: 20, puzzle: 25, case: 20, yarn: 10, balloons: 15, ball: 10, game: 30, kite: 15, paint: 20, tree: 25, sunflower: 15, fountain: 50, butterfly: 15, mushroom: 10, ladybug: 10, scope: 50, planet: 30, moon: 20, star: 15, rocket: 60, ufo: 70 };
const CARE_RATE = { food: 5, water: 7, fun: 6, energy: 4, clean: 3 }; // убывание в час
const catItem = id => HL.CATALOG.find(c => c[0] === id);
const roomOpen = r => r.need <= solvedTotal();

/* переход со старого домика: возвращаем конфеты за прежнюю мебель */
function houseMigrate() {
  if (S.houseV === 2) return;
  let refund = 0; (S.furn || []).forEach(id => { refund += OLD_FURN[id] || 0; });
  S.furn = []; S.place = {}; S.catAt = {}; S.houseV = 2;
  S.care = S.care || { food: 85, water: 85, fun: 85, energy: 85, clean: 85, t: Date.now() };
  ['kitchen', 'living'].forEach(r => { if (!S.roomsSeen.includes(r)) S.roomsSeen.push(r); });
  if (refund) { S.candies += refund; S.houseRefund = refund; }
  save();
}
/* потребности котика убывают со временем, но не ниже 5 — котик только грустит */
function careNow() {
  houseMigrate();
  const c = S.care, h = (Date.now() - c.t) / 3.6e6;
  if (h > 0.02) {
    for (const k in CARE_RATE) { const room = HL.ROOMS.find(r => r.id === HL.CARE[k].room); if (room && roomOpen(room)) c[k] = Math.max(5, c[k] - CARE_RATE[k] * h); }
    c.t = Date.now(); save();
  }
  return c;
}
function careLow() { const c = careNow(); return Object.keys(HL.CARE).filter(k => roomOpen(HL.ROOMS.find(r => r.id === HL.CARE[k].room)) && c[k] < 35).sort((a, b) => c[a] - c[b]); }
function careAlertHTML() {
  const low = careLow(); if (!low.length) return '';
  const k = low[0], C = HL.CARE[k];
  return `<button class="care-alert" data-go="house" data-arg="${C.room}">😿 ${C.low} <b>→</b></button>`;
}

function roomPlace(room) {
  S.place = S.place || {}; S.catAt = S.catAt || {};
  if (!S.place[room.id]) { S.place[room.id] = room.fixed.map(f => ({ id: f[0], x: f[3], y: f[4] })); save(); }
  room.fixed.forEach(f => { if (!S.place[room.id].some(p => p.id === f[0])) S.place[room.id].push({ id: f[0], x: f[3], y: f[4] }); });
  return S.place[room.id];
}
function placedIds() { return Object.values(S.place || {}).flat().map(p => p.id); }
function itemInfo(room, id) {
  const f = room.fixed.find(x => x[0] === id); if (f) return { icon: f[1], name: f[2], care: f[5], line: f[6], fixed: true };
  const c = catItem(id); return c ? { icon: c[1], name: c[2], line: c[6], cat: c[5], wall: !!c[7] } : null;
}

/* ================= ЭКРАН: Домик ================= */
SCREENS.house = (roomId) => {
  houseMigrate();
  const ROOMS = HL.ROOMS; let cur = ROOMS.find(r => r.id === roomId) || ROOMS[0], edit = false;
  app.innerHTML = `${topbar('Домик котика')}<div class="page house">
    <div class="care-bars" id="cb"></div>
    <div class="room-tabs" id="rt"></div>
    <div class="room" id="room"></div>
    <div class="house-tools"><button class="btn sm" id="edit">✏️ Расставить</button><button class="btn sm" id="invb">🎒 Сундук с вещами <b id="invn"></b></button><button class="btn sm pink" id="hshop">🛍️ Магазин вещей</button></div>
    <div class="tray" id="tray" hidden></div><p class="small center" id="hint"></p></div>`;
  if (S.houseRefund) { const n = S.houseRefund; S.houseRefund = 0; save(); later(() => { modal(`<div class="big-emoji">🏠✨</div><h2>Домик обновился!</h2><p>Комнаты стали больше, вещи можно расставлять пальцем, а за котиком теперь можно ухаживать.</p><p>Конфеты за прежние покупки вернулись: <b>+${n} 🍬</b></p><button class="btn pink" data-close>Ура!</button>`); speakT(PH.room[3]); }, 300); }

  const drawCare = () => {
    const c = careNow();
    $('#cb').innerHTML = Object.entries(HL.CARE).map(([k, C]) => { const open = roomOpen(ROOMS.find(r => r.id === C.room)); return `<button class="cbar ${!open ? 'off' : c[k] < 35 ? 'low' : ''}" data-r="${C.room}" title="${C.name}"><span>${open ? C.icon : '🔒'}</span><i><b style="width:${open ? Math.round(c[k]) : 0}%"></b></i></button>`; }).join('');
    $$('.cbar', app).forEach(b => b.addEventListener('click', () => { const r = ROOMS.find(x => x.id === b.dataset.r); if (roomOpen(r)) { cur = r; SND.tap(); drawTabs(); drawRoom(); } else say(PH.room[1]); }));
  };
  const drawTabs = () => {
    $('#rt').innerHTML = ROOMS.map(r => `<button class="rtab ${r === cur ? 'on' : ''} ${roomOpen(r) ? '' : 'lock'}" data-r="${r.id}"><span>${roomOpen(r) ? r.icon : '🔒'}</span>${r.name}</button>`).join('');
    $$('.rtab', app).forEach(b => b.addEventListener('click', () => { cur = ROOMS.find(r => r.id === b.dataset.r); edit = false; SND.tap(); drawTabs(); drawRoom(); }));
    $('.rtab.on', app)?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };
  const invList = () => S.furn.filter(id => !placedIds().includes(id) && catItem(id));
  const drawTools = () => {
    $('#invn').textContent = invList().length || '';
    $('#edit').textContent = edit ? '✅ Готово' : '✏️ Расставить';
    $('#edit').classList.toggle('mint', edit);
    $('#hint').textContent = !roomOpen(cur) ? '' : edit ? 'Перетаскивай вещи пальцем. Чтобы убрать вещь в сундук — перетащи её на значок 🎒 внизу комнаты.' : `${cur.care}. Нажимай на вещи — котик с ними поиграет. Котика можно гладить!`;
  };
  const drawRoom = () => {
    const room = $('#room'), open = roomOpen(cur), n = solvedTotal();
    room.className = `room big ${cur.dark ? 'dark' : ''} ${open ? '' : 'closed'} ${edit ? 'editing' : ''}`;
    room.style.setProperty('--wall', cur.wall); room.style.setProperty('--floor', cur.floor);
    const pl = roomPlace(cur), low = careLow(), cat = S.catAt[cur.id] || { x: 74, y: 3 };
    room.innerHTML = `<div class="wall"><div class="window">${cur.dark ? '✨' : '☁️'}</div><div class="shelf"></div></div><div class="floor"></div>
      ${pl.map(p => { const it = itemInfo(cur, p.id); if (!it) return ''; const need = it.care && Object.keys(HL.CARE).find(k => (k === 'food' && it.care === 'food') || (k === 'water' && it.care === 'water') || (k === 'energy' && it.care === 'sleep') || (k === 'fun' && it.care === 'play') || (k === 'clean' && it.care === 'wash'));
        return `<button class="fx ${it.fixed ? 'fixed' : ''} ${it.care ? 'carei' : ''} ${need && low.includes(need) ? 'needs' : ''}" data-id="${p.id}" style="left:${p.x}%;bottom:${p.y}%;z-index:${200 - Math.round(p.y)}">${it.icon}${it.care ? `<small class="ctag">${{ food: '🍽️', water: '💧', sleep: '💤', play: '🎾', wash: '🫧', rest: '🛋️' }[it.care]}</small>` : ''}</button>`; }).join('')}
      <div class="room-cat" id="rcat" style="left:${cat.x}%;bottom:${cat.y}%">${myCat()}</div>
      ${edit ? '<div class="trash" id="trash">🎒<small>в сундук</small></div>' : ''}
      ${open ? '' : `<div class="room-lock"><div class="big-emoji">🔒</div><h3>«${cur.name}»</h3><p>Откроется после <b>${cur.need}</b> решённых задач.</p><div class="bar"><i style="width:${Math.min(1, n / cur.need) * 100}%"></i></div><p class="small">Решено ${n} из ${cur.need} — осталось ${cur.need - n}!</p></div>`}`;
    drawTools(); drawCare();
    if (!open) { say(PH.room[1]); return; }
    $$('.fx', room).forEach(b => {
      b.addEventListener('click', () => { if (!edit) interact(b); });
      dragify(b, (x, y, overTrash) => { const p = pl.find(q => q.id === b.dataset.id); if (overTrash && !itemInfo(cur, p.id).fixed) { S.place[cur.id] = pl.filter(q => q !== p); save(); say(HOUSE_PH()[1]); drawRoom(); return; } p.x = x; p.y = y; save(); b.style.zIndex = 200 - Math.round(y); });
    });
    dragify($('#rcat'), (x, y) => { S.catAt[cur.id] = { x, y }; save(); });
  };
  /* перетаскивание в режиме «Расставить» */
  function dragify(el, onDrop) {
    el.addEventListener('pointerdown', e => {
      if (!edit) return; e.preventDefault(); e.stopPropagation(); el.setPointerCapture(e.pointerId); el.classList.add('dragging');
      const R = $('#room').getBoundingClientRect();
      const move = ev => { const x = Math.max(3, Math.min(95, (ev.clientX - R.left) / R.width * 100)), y = Math.max(0, Math.min(86, (R.bottom - ev.clientY) / R.height * 100 - 5)); el.style.left = x + '%'; el.style.bottom = y + '%'; el._xy = [x, y]; const t = $('#trash'); if (t) { const T = t.getBoundingClientRect(); t.classList.toggle('over', ev.clientX > T.left && ev.clientX < T.right && ev.clientY > T.top && ev.clientY < T.bottom); } };
      const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.classList.remove('dragging'); const t = $('#trash'); const over = t && t.classList.contains('over'); if (el._xy || over) onDrop(...(el._xy || [0, 0]), over); el._xy = null; M.haptic(10); };
      el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
  }
  const HOUSE_PH = () => HL.HOUSE_PH;
  function catGoTo(b, then) {
    const c = $('#rcat'); if (!c) return then && then();
    const x = Math.min(92, parseFloat(b.style.left) + 9), y = Math.max(0, Math.min(10, parseFloat(b.style.bottom)));
    c.classList.add('walking'); c.style.left = x + '%'; c.style.bottom = y + '%';
    setTimeout(() => { c.classList.remove('walking'); then && then(); }, 750);
  }
  function catFace(o, ms) { const c = $('#rcat'); if (!c) return; c.innerHTML = myCat(o); clearTimeout(c._t); c._t = setTimeout(() => { if (c.isConnected) c.innerHTML = myCat(); }, ms); }
  function particles(b, chars, n = 8) { const R = b.getBoundingClientRect(); for (let i = 0; i < n; i++) { const p = document.createElement('div'); p.className = 'heart'; p.textContent = pick(chars); p.style.left = (R.left + R.width * Math.random()) + 'px'; p.style.top = (R.top + R.height * 0.3) + 'px'; p.style.setProperty('--dx', (Math.random() * 90 - 45) + 'px'); p.style.animationDelay = (i * 0.1) + 's'; document.body.appendChild(p); setTimeout(() => p.remove(), 2400); } }
  const bump = (k, v) => { const c = careNow(); c[k] = Math.min(100, c[k] + v); save(); drawCare(); $$('.fx.needs', app).forEach(x => { if (!careLow().length) x.classList.remove('needs'); }); };
  function interact(b) {
    const it = itemInfo(cur, b.dataset.id), c = careNow(); if (!it) return;
    b.classList.remove('boing'); void b.offsetWidth; b.classList.add('boing'); M.haptic(15);
    if (it.care === 'food') return openFood(b);
    if (it.care === 'water') { if (c.water >= 95) return say(HOUSE_PH()[6]); return catGoTo(b, () => { tone([[1200, 0.06, 0, 'sine', 0.12, 700], [1100, 0.06, 0.15, 'sine', 0.12, 650], [1250, 0.06, 0.3, 'sine', 0.12, 700]]); particles(b, ['💧', '💦'], 6); bump('water', 100); catFace({ happy: true }, 1500); say(HL.CARE.water.ok); }); }
    if (it.care === 'sleep') { if (c.energy >= 95) return say(HOUSE_PH()[5]); return catGoTo(b, () => { $('#rcat').classList.add('sleeping'); catFace({ happy: true }, 4200); M.purr(3.5); particles(b, ['💤', '⭐', '🌙'], 7); say(PH.purr[0]); setTimeout(() => { $('#rcat')?.classList.remove('sleeping'); bump('energy', 100); say(HL.CARE.energy.ok); }, 4000); }); }
    if (it.care === 'wash') { if (c.clean >= 95) return say(HOUSE_PH()[4]); return catGoTo(b, () => { M.crunch(3); particles(b, ['🫧', '🫧', '💦', '✨'], 12); $('#rcat').classList.add('m-purr'); setTimeout(() => { $('#rcat')?.classList.remove('m-purr'); bump('clean', 100); catFace({ happy: true }, 1500); say(HL.CARE.clean.ok); }, 1800); }); }
    if (it.care === 'play') { return catGoTo(b, () => { $('#rcat').classList.remove('m-happy'); void $('#rcat').offsetWidth; $('#rcat').classList.add('m-happy'); M.meow({ shape: 'happy' }); const was = c.fun; bump('fun', 20); catFace({ happy: true }, 900); say(was < 85 && careNow().fun >= 85 ? HL.CARE.fun.ok : it.line); }); }
    if (it.care === 'rest') { bump('energy', 8); M.purr(1.5); catFace({ happy: true }, 1500); return say(it.line); }
    say(it.line); catFace({ happy: true }, 1000);
    if (it.cat === 'Игрушки') { bump('fun', 6); M.meow({ shape: 'happy' }); }
    else if (it.cat === 'Вкусняшки') M.crunch(3);
    else if (it.cat === 'Питомцы') M.chirp();
    else if (it.cat === 'Волшебство' || it.cat === 'Космос' || it.cat === 'Праздник') { particles(b, ['✨', '⭐', '💫'], 8); M.trill(); }
    else M.trill();
  }
  function openFood(b) {
    const c = careNow();
    if (c.food >= 95) return say(HOUSE_PH()[3]);
    const m = modal(`<h2>🥣 Чем покормим котика?</h2><p class="small">Сытость: ${Math.round(c.food)}%. Еда покупается за конфеты, которые ты заработал(а) примерами.</p><div class="items">${HL.FOODS.map(f => `<button class="item" data-food="${f[0]}"><span class="ii">${f[1]}</span><span class="in">${f[2]}</span><span class="ip">${f[3]} 🍬 · +${f[4]}%</span></button>`).join('')}</div><button class="btn" data-close>Потом</button>`);
    $$('[data-food]', m.el).forEach(x => x.addEventListener('click', () => {
      const f = HL.FOODS.find(y => y[0] === x.dataset.food);
      if (S.candies < f[3]) { SND.bad(); say(PH.poor[0]); return; }
      S.candies -= f[3]; save(); updCandy(); m.close();
      catGoTo(b, () => { b.textContent = f[1]; M.crunch(5); particles(b, [f[1], '😋'], 5); setTimeout(() => { M.purr(1.5); bump('food', f[4]); catFace({ happy: true }, 1600); say(f[5]); drawRoom(); }, 900); });
    }));
  }
  $('#edit').addEventListener('click', () => { edit = !edit; SND.tap(); if (edit) say(HOUSE_PH()[2]); drawRoom(); });
  $('#invb').addEventListener('click', () => {
    const t = $('#tray'), list = invList(); t.hidden = !t.hidden; SND.tap();
    if (t.hidden) return;
    t.innerHTML = list.length ? `<div class="items">${list.map(id => { const c = catItem(id); return `<button class="item" data-put="${id}"><span class="ii">${c[1]}</span><span class="in">${c[2]}</span><span class="ip">поставить сюда</span></button>`; }).join('')}</div>` : `<p class="center">Сундук пуст. Вещи покупаются в <b>Магазине вещей</b> за конфеты, заработанные примерами 🍬</p>`;
    $$('[data-put]', t).forEach(x => x.addEventListener('click', () => {
      if (!roomOpen(cur)) return say(PH.room[1]);
      const c = catItem(x.dataset.put), wall = !!c[7];
      roomPlace(cur).push({ id: c[0], x: 10 + Math.random() * 60, y: wall ? 48 + Math.random() * 25 : 2 + Math.random() * 10 }); save();
      confetti(12); SND.tap(); say(HOUSE_PH()[0]); t.hidden = true; drawRoom();
    }));
  });
  $('#hshop').addEventListener('click', () => { SHOP_TAB = 'home'; go('shop'); });
  drawTabs(); drawRoom();
  const low = careLow(); if (low.length) later(() => say(HL.CARE[low[0]].low), 700); else later(() => say(pick(PH.house)), 700);
  const iv = setInterval(drawCare, 60000); cleanups.push(() => clearInterval(iv));
};

/* ================= магазин вещей для домика ================= */
let SHOP_TAB = 'wear';
function furnShopHTML() {
  houseMigrate(); const n = solvedTotal(), cats = [...new Set(HL.CATALOG.map(c => c[5]))];
  return `<p class="small">Купленные вещи попадают в <b>сундук</b> в домике — оттуда их можно поставить в любую комнату и передвинуть пальцем.</p>` + cats.map(cat => `<h3>${cat}</h3><div class="items">${HL.CATALOG.filter(c => c[5] === cat).map(c => { const own = S.furn.includes(c[0]), lock = c[4] > n; return `<button class="item ${own ? 'own on' : ''} ${lock ? 'lockd' : ''}" data-f="${c[0]}"><span class="ii">${lock ? '🔒' : c[1]}</span><span class="in">${c[2]}</span><span class="ip">${own ? 'куплено ✔' : lock ? `после ${c[4]} задач` : c[3] + ' 🍬'}</span></button>`; }).join('')}</div>`).join('');
}
function bindFurnShop(root, redraw) {
  $$('.item[data-f]', root).forEach(b => b.addEventListener('click', () => {
    const c = catItem(b.dataset.f), n = solvedTotal();
    if (S.furn.includes(c[0])) { say(c[6]); return; }
    if (c[4] > n) { SND.bad(); toast(`<span class="tb">🔒</span><div>Откроется после <b>${c[4]}</b> решённых задач.<br>Решено: ${n}. Вперёд к примерам!</div>`); say(PH.room[1]); return; }
    if (S.candies < c[3]) { SND.bad(); say(PH.poor[0]); toast(`<span class="tb">🍬</span><div>Не хватает конфет: нужно ещё <b>${c[3] - S.candies}</b>.<br>Реши ещё несколько примеров!</div>`); return; }
    const m = modal(`<div class="big-emoji">${c[1]}</div><h2>${c[2]}</h2><p>Купить за <b>${c[3]} 🍬</b>? Вещь попадёт в сундук в домике.</p><div class="row-btns"><button class="btn pink" id="buy">Купить!</button><button class="btn" data-close>Не сейчас</button></div>`);
    $('#buy', m.el).addEventListener('click', () => { S.candies -= c[3]; S.furn.push(c[0]); save(); updCandy(); m.close(); tone([[988, 0.09], [1319, 0.25, 0.07]]); confetti(20); say(PH.boughtHome[0]); catMood('happy', 1500); redraw && redraw(); });
  }));
}
function surprise() { // редкий подарок из сундука 20 задач / 7-го дня
  houseMigrate();
  const outfits = ITEMS.filter(i => i.price > 0 && i.price <= 50 && !S.owned.includes(i.id)).map(i => ({ icon: i.icon, name: i.name, give: () => S.owned.push(i.id) }));
  const furn = HL.CATALOG.filter(c => c[4] <= solvedTotal() && c[3] <= 50 && !S.furn.includes(c[0])).map(c => ({ icon: c[1], name: c[2], give: () => S.furn.push(c[0]) }));
  const all = outfits.concat(furn); if (!all.length) return null;
  const g = pick(all); g.give(); save(); return g;
}
function checkRooms() {
  houseMigrate();
  const fresh = HL.ROOMS.find(r => roomOpen(r) && !S.roomsSeen.includes(r.id)); if (!fresh || $('.modal')) return;
  S.roomsSeen.push(fresh.id); save(); SND.win(); confetti(30);
  const m = modal(`<div class="big-emoji">${fresh.icon}🔓</div><h2>Открыта новая комната: «${fresh.name}»!</h2><p>${fresh.care}. Загляни и обустрой её!</p><div class="row-btns"><button class="btn pink" id="gohouse">🏠 Посмотреть</button><button class="btn" data-close>Позже</button></div>`);
  speakT([PH.room[0], `${fresh.name}!`]);
  $('#gohouse', m.el).addEventListener('click', () => { m.close(); go('house', fresh.id); });
}
