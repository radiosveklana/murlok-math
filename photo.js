/* photo.js — «Фотостудия»: фото котика на фоне комнат и мест происшествий, стикеры, подпись, плашка достижения.
   Сохранить на устройство, поделиться (системное меню — там есть ВКонтакте), галерея в IndexedDB. Камера не используется. */
'use strict';
const Photo = (() => {
  const APP_URL = 'https://radiosveklana.github.io/murlok-math/';
  const GRADS = { candy: ['Сладкоград', '#FFD1E3', '#FFF4D6'], space: ['Космос', '#1B1446', '#4B2A85'], mint: ['Мятный', '#C9F7E6', '#E9F3FF'], sunset: ['Закат', '#FFB88A', '#FF7FA6'], night: ['Ночь сыщика', '#22284A', '#3F4C7A'], fit: ['Примерочная', '#FFE1EE', '#E8DDFF'] };
  const STICK = ['⭐', '💖', '🍬', '🍩', '🔍', '🎀', '🌈', '✨', '👑', '🐟', '🎉', '🌙', '🚀', '🧁', '🏆', '🐾'];
  const st = { bg: 'g:candy', pose: 'smile', name: true, badge: 'rank', stickers: [], wear: null, fur: null };
  const P = () => window.Fitting ? Fitting.poseOf(st.pose) : { o: { smile: true } };
  const catOf = () => catSVG({ fur: st.fur || S.fur, wear: st.wear || S.wear, ...P().o });
  function bgs() {
    const rooms = [...(typeof ROOM_IMG !== 'undefined' ? ROOM_IMG : [])].map(id => { const r = (window.Lines.ROOMS || []).find(x => x.id === id); return ['img/rooms/' + id + '.jpg', r ? r.name : id]; });
    const scenes = [0, 3, 6, 9, 12, 15].map(n => ['img/scene/' + n + '.jpg', 'Место происшествия']);
    return [...Object.entries(GRADS).map(([k, g]) => ['g:' + k, g[0]]), ...rooms, ...scenes];
  }
  const badgeText = () => {
    if (st.badge === 'rank') return '🎖️ ' + rank().name;
    if (st.badge === 'cases') return '🔍 Раскрыто дел: ' + (S.cases || 0);
    if (st.badge === 'talent') { const t = window.Coach && Coach.talents()[0]; return t ? '⭐ Талант: ' + Coach.info(t).name : '⭐ Юный сыщик'; }
    return '';
  };
  const caption = () => st.name ? `Котик ${S.name} и сыщик ${S.kid}` : `Котик ${S.name}`;
  const bgCSS = b => b.startsWith('g:') ? `linear-gradient(160deg,${GRADS[b.slice(2)][1]},${GRADS[b.slice(2)][2]})` : `url('${b}') center/cover`;

  SCREENS.photo = arg => {
    if (arg && typeof arg === 'string') st.bg = arg; st.stickers = []; if (arg !== 'g:fit') { st.wear = null; st.fur = null; }
    app.innerHTML = `${topbar('📸 Фотостудия')}<div class="page photo">
      <div class="stage" id="stage"><div class="st-cat" id="stc"></div><div class="st-badge" id="stb"></div><div class="st-cap" id="stcap"></div></div>
      <div class="ph-row"><b>Фон:</b><div class="ph-bgs" id="bgs">${bgs().map(([b, n]) => `<button class="ph-bg ${b === st.bg ? 'on' : ''}" data-b="${b}" title="${n}" style="background:${bgCSS(b)}"></button>`).join('')}</div></div>
      <div class="ph-row"><b>Стикеры:</b> <small class="small">нажми на стикер на фото — он исчезнет, веди пальцем — переедет</small><div class="ph-st">${STICK.map(e => `<button class="ph-s" data-e="${e}">${e}</button>`).join('')}<button class="ph-s" id="stclr" title="Убрать стикеры">🧽</button></div></div>
      <div class="ph-row seg-wrap"><div class="seg poses" id="mood">${(window.Fitting ? Fitting.POSES : []).map(p => `<button data-v="${p.id}" class="${p.id === st.pose ? 'on' : ''}">${p.name}</button>`).join('')}</div>
        <div class="seg" id="badge">${[['rank', '🎖️ Звание'], ['cases', '🔍 Дела'], ['talent', '⭐ Талант'], ['', 'Без плашки']].map(([v, n]) => `<button data-v="${v}" class="${st.badge === v ? 'on' : ''}">${n}</button>`).join('')}</div>
        <label class="tgl"><input type="checkbox" id="phname" ${st.name ? 'checked' : ''}> Моё имя на фото</label></div>
      <div class="row-btns ph-act"><button class="btn big pink" id="snap">📸 Сделать фото</button></div>
      <h3>Мои фото</h3><div class="ph-gal" id="gal"><p class="small">Тут будут твои фото.</p></div></div>`;
    draw(); gallery();
    $$('.ph-bg').forEach(b => b.addEventListener('click', () => { st.bg = b.dataset.b; $$('.ph-bg').forEach(x => x.classList.toggle('on', x === b)); SND.tap(); draw(); }));
    $$('.ph-s[data-e]').forEach(b => b.addEventListener('click', () => { if (st.stickers.length >= 12) { toast('Хватит стикеров — 12 максимум 🙂'); return; } st.stickers.push({ e: b.dataset.e, x: 15 + Math.random() * 70, y: 10 + Math.random() * 40, s: 1 }); SND.tap(); draw(); }));
    $('#stclr').addEventListener('click', () => { st.stickers = []; draw(); });
    $$('#mood button').forEach(b => b.addEventListener('click', () => { st.pose = b.dataset.v; $$('#mood button').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
    $$('#badge button').forEach(b => b.addEventListener('click', () => { st.badge = b.dataset.v; $$('#badge button').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
    $('#phname').addEventListener('change', e => { st.name = e.target.checked; draw(); });
    $('#snap').addEventListener('click', snap);
  };
  function draw() {
    const stg = $('#stage'); if (!stg) return;
    stg.style.background = bgCSS(st.bg);
    $('#stc').innerHTML = catOf(); $('#stc').classList.toggle('tilt', !!P().tilt);
    $('#stb').textContent = badgeText(); $('#stb').hidden = !st.badge; $('#stcap').textContent = caption();
    $$('.st-stk', stg).forEach(x => x.remove());
    st.stickers.forEach((k, i) => {
      const el = document.createElement('span'); el.className = 'st-stk'; el.textContent = k.e; el.style.left = k.x + '%'; el.style.top = k.y + '%'; stg.appendChild(el);
      el.addEventListener('pointerdown', e => { // перетаскивание пальцем; короткое касание — удалить
        e.preventDefault(); const R = stg.getBoundingClientRect(), t0 = Date.now(), x0 = e.clientX, y0 = e.clientY; let moved = false; try { el.setPointerCapture(e.pointerId); } catch (er) { }
        const mv = ev => { if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 10) return; moved = true; k.x = Math.max(0, Math.min(92, (ev.clientX - R.left) / R.width * 100 - 4)); k.y = Math.max(0, Math.min(90, (ev.clientY - R.top) / R.height * 100 - 4)); el.style.left = k.x + '%'; el.style.top = k.y + '%'; };
        const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); if (!moved && Date.now() - t0 < 600) { st.stickers.splice(i, 1); SND.tap(); draw(); } };
        el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      });
    });
  }
  const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  async function render() {
    const W = 1080, cv = document.createElement('canvas'); cv.width = cv.height = W; const g = cv.getContext('2d');
    if (st.bg.startsWith('g:')) { const G = GRADS[st.bg.slice(2)], lg = g.createLinearGradient(0, 0, W * 0.4, W); lg.addColorStop(0, G[1]); lg.addColorStop(1, G[2]); g.fillStyle = lg; g.fillRect(0, 0, W, W); }
    else { try { const im = await loadImg(st.bg), k = Math.max(W / im.width, W / im.height); g.drawImage(im, (W - im.width * k) / 2, (W - im.height * k) / 2, im.width * k, im.height * k); } catch (e) { g.fillStyle = '#FFE3EC'; g.fillRect(0, 0, W, W); } }
    const svg = catOf().replace('<svg ', '<svg width="620" height="732" ');
    const cat = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    g.save(); g.shadowColor = 'rgba(40,20,60,.35)'; g.shadowBlur = 40; g.shadowOffsetY = 18; if (P().tilt) { g.translate(W / 2, W - 120); g.rotate(-0.1); g.translate(-W / 2, -(W - 120)); } g.drawImage(cat, (W - 620) / 2, W - 732 - 120, 620, 732); g.restore();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    st.stickers.forEach(k => { g.font = '110px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText(k.e, (k.x + 4) / 100 * W, (k.y + 4) / 100 * W); });
    const pill = (txt, y, size, bg, fg) => { g.font = `700 ${size}px Nunito, "Segoe UI", sans-serif`; const tw = g.measureText(txt).width; if (tw > W - 150) { size = Math.max(26, Math.floor(size * (W - 150) / tw)); g.font = `700 ${size}px Nunito, "Segoe UI", sans-serif`; } const w = Math.min(W - 80, g.measureText(txt).width + 70); g.fillStyle = bg; rr(g, (W - w) / 2, y - size * 0.85, w, size * 1.7, size * 0.85); g.fill(); g.fillStyle = fg; g.fillText(txt, W / 2, y + 2, W - 120); };
    if (st.badge) pill(badgeText(), 80, 44, 'rgba(255,255,255,.88)', '#5A2D82');
    pill(caption(), W - 70, 52, 'rgba(255,111,156,.94)', '#fff');
    g.font = '600 26px Nunito, sans-serif'; g.fillStyle = 'rgba(255,255,255,.85)'; g.textAlign = 'right'; g.fillText('Мурлок и Ко 🐾', W - 28, W - 150);
    g.lineWidth = 18; g.strokeStyle = '#fff'; rr(g, 9, 9, W - 18, W - 18, 46); g.stroke();
    return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  /* ---- галерея (IndexedDB, только на этом устройстве) ---- */
  const db = () => new Promise((res, rej) => { const q = indexedDB.open('murlok-photos', 1); q.onupgradeneeded = () => q.result.createObjectStore('p', { keyPath: 'id' }); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
  async function put(blob) { const d = await db(); await new Promise(r => { const t = d.transaction('p', 'readwrite'); t.objectStore('p').put({ id: Date.now(), blob }); t.oncomplete = r; t.onerror = r; }); const all = await list(); all.slice(24).forEach(x => del(x.id)); }
  async function list() { try { const d = await db(); return await new Promise(r => { const q = d.transaction('p').objectStore('p').getAll(); q.onsuccess = () => r(q.result.sort((a, b) => b.id - a.id)); q.onerror = () => r([]); }); } catch (e) { return []; } }
  async function del(id) { const d = await db(); d.transaction('p', 'readwrite').objectStore('p').delete(id); }
  let urls = [];
  async function gallery() {
    const el = $('#gal'); if (!el) return; urls.forEach(u => URL.revokeObjectURL(u)); urls = [];
    const all = await list(); if (!$('#gal')) return;
    if (!all.length) { el.innerHTML = '<p class="small">Тут будут твои фото.</p>'; return; }
    el.innerHTML = all.map(x => { const u = URL.createObjectURL(x.blob); urls.push(u); return `<button class="ph-th" data-id="${x.id}"><img src="${u}" alt="Фото котика"></button>`; }).join('');
    $$('.ph-th', el).forEach(b => b.addEventListener('click', () => { const x = all.find(p => p.id === +b.dataset.id); if (x) view(x.blob, x.id); }));
  }
  /* ---- сохранить и поделиться ---- */
  const file = blob => new File([blob], `murlok-${S.name || 'cat'}-${today()}.png`, { type: 'image/png' });
  const canFiles = blob => { try { return !!(navigator.canShare && navigator.canShare({ files: [file(blob)] })); } catch (e) { return false; } };
  const iOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function download(blob) { const a = document.createElement('a'), u = URL.createObjectURL(blob); a.href = u; a.download = file(blob).name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
  async function saveIt(blob) {
    if (iOS && canFiles(blob)) { try { await navigator.share({ files: [file(blob)] }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    download(blob); toast('💾 Фото сохранено в «Загрузки»');
  }
  async function shareIt(blob, vk) {
    if (S.shareOn === false) { toast('Взрослые выключили «Поделиться». Фото можно сохранить 💾'); return; }
    const text = `Мой котик ${S.name} в «Мурлок и Ко» 🐾`;
    if (canFiles(blob)) { try { await navigator.share({ files: [file(blob)], title: 'Мурлок и Ко', text }); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
    download(blob);
    if (vk) { window.open('https://vk.com/share.php?url=' + encodeURIComponent(APP_URL) + '&title=' + encodeURIComponent(text), '_blank', 'noopener'); toast('Фото сохранено — прикрепи его к записи ВКонтакте 📎'); }
    else toast('Фото сохранено — его можно отправить из галереи телефона');
  }
  function view(blob, id, fresh) {
    const u = URL.createObjectURL(blob), share = S.shareOn !== false;
    const m = modal(`<img class="ph-big" src="${u}" alt="Фото котика">${fresh ? '<h2>Вот это кадр! 📸</h2>' : ''}<div class="row-btns"><button class="btn pink" id="psave">💾 Сохранить</button>${share ? '<button class="btn" id="pshare">📤 Поделиться</button><button class="btn vk" id="pvk">ВКонтакте</button>' : ''}${id ? '<button class="btn danger sm" id="pdel">🗑</button>' : ''}<button class="btn" data-close>Закрыть</button></div>${share ? '<p class="small">Делись только с теми, кого знаешь. На фото нет адреса и личных данных — так и должно быть 🛡️</p>' : ''}`, 'ph-sheet');
    $('#psave', m.el).addEventListener('click', () => saveIt(blob));
    $('#pshare', m.el)?.addEventListener('click', () => shareIt(blob, false));
    $('#pvk', m.el)?.addEventListener('click', () => shareIt(blob, true));
    $('#pdel', m.el)?.addEventListener('click', async () => { await del(id); m.close(); gallery(); });
    m.el.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === m.el) URL.revokeObjectURL(u); });
  }
  async function snap() {
    const b = $('#snap'); b.disabled = true; M.sfx('shutter'); M.haptic(30);
    const fl = document.createElement('div'); fl.className = 'flash'; $('#stage').appendChild(fl); setTimeout(() => fl.remove(), 500);
    try { const blob = await render(); window.__lastPhoto = blob.size; await put(blob).catch(() => { }); view(blob, null, true); gallery(); S.photos = (S.photos || 0) + 1; save(); catMood('happy', 1500); M.meow({ shape: 'happy' }); }
    catch (e) { console.warn(e); toast('Не получилось сделать фото 😿 Попробуй другой фон.'); }
    b.disabled = false;
  }
  /* кнопка 📸 в домике и в Кондитерской */
  const wrap = (n, getBg) => { const f = SCREENS[n]; if (!f) return; SCREENS[n] = arg => { f(arg); if (curScreen === undefined) return; const btn = document.createElement('button'); btn.className = 'photo-fab'; btn.setAttribute('aria-label', 'Сфотографировать котика'); btn.textContent = '📸'; btn.addEventListener('click', () => { SND.tap(); go('photo', getBg()); }); app.appendChild(btn); }; };
  wrap('house', () => { const r = $('#room'), m = r && getComputedStyle(r).backgroundImage.match(/img\/rooms\/(\w+)\.jpg/); return m ? 'img/rooms/' + m[1] + '.jpg' : ''; });
  wrap('shop', () => 'g:candy');
  if (!NO_FLOAT.includes('photo')) NO_FLOAT.push('photo');
  return { render, state: st, list, view, saveIt, shareIt };
})();
window.Photo = Photo;
