/* extras.js — профили (несколько детей на одном устройстве), отчёт родителю в Telegram,
   тренажёр разговора (раздел «Общение»: котик играет роль, в конце — мягкий разбор). */
'use strict';
const Extras = (() => {
  /* ================= профили ================= */
  const PK = 'murlok-profiles';
  const profs = () => { try { return JSON.parse(localStorage.getItem(PK) || 'null') || { active: 'main', list: [] }; } catch (e) { return { active: 'main', list: [] }; } };
  const keyOf = id => id === 'main' ? 'murlok-detective-v1' : 'murlok-detective-v1:' + id;
  function remember() { // обновляем карточку текущего профиля
    if (!S.kid) return; const P = profs(); let me = P.list.find(x => x.id === P.active);
    if (!me) { me = { id: P.active }; P.list.push(me); }
    Object.assign(me, { kid: S.kid, cat: S.name, fur: S.fur, wear: S.wear, xp: S.xp }); try { localStorage.setItem(PK, JSON.stringify(P)); } catch (e) { }
  }
  function switchTo(id) { remember(); const P = profs(); P.active = id; localStorage.setItem(PK, JSON.stringify(P)); cloudPush(); location.reload(); }
  function openProfiles() {
    remember(); const P = profs();
    const m = modal(`<h2>👥 Кто играет?</h2><p class="small">У каждого игрока свой котик, свой прогресс и свой домик.</p><div class="profs">${P.list.map(p => `<button class="prof ${p.id === P.active ? 'on' : ''}" data-p="${p.id}"><span class="pc">${catSVG({ fur: FURS[p.fur] ? p.fur : 'ginger', wear: p.wear || {}, smile: true })}</span><b>${esc(p.kid || 'Игрок')}</b><small>котик ${esc(p.cat || '')}${p.id === P.active ? ' · сейчас' : ''}</small></button>`).join('')}<button class="prof add" id="padd"><span class="pc">＋</span><b>Новый игрок</b><small>брат, сестра, друг</small></button></div><button class="btn" data-close>Закрыть</button>`);
    $$('.prof[data-p]', m.el).forEach(b => b.addEventListener('click', () => { if (b.dataset.p !== P.active) switchTo(b.dataset.p); else m.close(); }));
    $('#padd', m.el).addEventListener('click', () => { if (P.list.length >= 6) { toast('Можно до 6 игроков'); return; } const id = 'p' + Date.now().toString(36); remember(); const Q = profs(); Q.active = id; localStorage.setItem(PK, JSON.stringify(Q)); location.reload(); });
  }
  if (typeof openSettings === 'function') {
    const os = openSettings;
    openSettings = function () { const r = os.apply(this, arguments); const L = $$('.modal .set-list').pop(); if (L && !$('#set-prof', L)) { L.insertAdjacentHTML('beforeend', '<button class="set-row" id="set-prof"><span>👥</span><b>Игроки</b><i class="arr">›</i></button>'); $('#set-prof', L).addEventListener('click', () => { $$('.modal').forEach(x => x.remove()); openProfiles(); }); } return r; };
  }
  { const h = SCREENS.hello; SCREENS.hello = arg => { h(arg); const P = profs(); if (P.list.filter(p => p.kid).length) { const pg = $('.page', app) || app; pg.insertAdjacentHTML('afterbegin', '<button class="btn sm prof-back" id="pback">👥 Выбрать другого игрока</button>'); $('#pback').addEventListener('click', openProfiles); } }; }
  { const hm = SCREENS.home; SCREENS.home = arg => { const r = hm(arg); remember(); return r; }; }

  /* ================= свежий прогресс с другого устройства ================= */
  // каждое устройство хранит свой прогресс; если на другом устройстве (с тем же кодом) ушли дальше — предлагаем продолжить оттуда
  function cloudFresher() {
    if (!S.kid || !S.cloudCode || cloudOff() || sessionStorage.getItem('cloudChecked')) return; sessionStorage.setItem('cloudChecked', '1');
    fetch(CLOUD + '/load?code=' + S.cloudCode).then(r => r.ok ? r.json() : null).then(d => {
      if (!d || d.v !== 1 || !d.savedAt || d.savedAt <= (S.cloudAt || 0) + 60000 || (d.xp || 0) <= (S.xp || 0)) return;
      const m = modal(`<div class="big-emoji">☁️🐾</div><h2>На другом устройстве ты ушла дальше!</h2><p>В облаке: ⭐ <b>${d.xp}</b> опыта, 🍬 ${d.candies || 0}, дел: ${d.cases || 0}.<br>Здесь: ⭐ <b>${S.xp}</b>.</p><p>Продолжить с более свежего прогресса?</p><div class="row-btns"><button class="btn pink" id="cfYes">Да, продолжить оттуда</button><button class="btn" id="cfNo">Нет, оставить этот</button></div>`.replace('ушла', /[аяь]$/i.test(S.kid || '') ? 'ушла' : 'ушёл'));
      $('#cfYes', m.el).addEventListener('click', () => { exportBackup(); cloudRestore(S.cloudCode).catch(() => { m.close(); toast('Не получилось загрузить'); }); });
      $('#cfNo', m.el).addEventListener('click', () => { m.close(); cloudDirty = true; cloudPush(); });
    }).catch(() => { });
  }
  const exportBackup = () => { try { localStorage.setItem('murlok-before-restore', JSON.stringify(S)); } catch (e) { } }; // на всякий случай сохраняем текущий прогресс
  setTimeout(cloudFresher, 3500);

  /* ================= Telegram для родителя ================= */
  const tg = (act, body = {}) => fetch(CLOUD + '/tg/' + act, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: cloudCode(), ...body }) }).then(r => r.json());
  { const par = SCREENS.parents; SCREENS.parents = arg => {
    par(arg); const pg = $('.page.parents', app), anchor = pg && $('#reset', pg); if (!anchor) return;
    anchor.insertAdjacentHTML('beforebegin', `<div class="card" id="tgcard"><h3>📬 Отчёт в Telegram</h3><p class="small">Каждое воскресенье в 19:00 — коротко: сколько занимались, сильные стороны, что пока трудно и совет на неделю. Что читает ребёнок в «Энциклопедии подростка», в отчёт не попадает.</p><div id="tgst" class="small">Проверяем…</div></div>`);
    tg('status').then(d => {
      const el = $('#tgst'); if (!el) return;
      if (d.disabled) { el.innerHTML = 'Бот отчётов скоро заработает 🐾'; return; }
      if (d.error) { el.innerHTML = 'Подключение будет доступно, когда прогресс сохранится в облаке (через минуту).'; return; }
      el.innerHTML = d.linked ? '✅ Подключено. <div class="row-btns"><button class="btn sm" id="tgtest">Прислать отчёт сейчас</button><button class="btn sm" id="tgoff">Отключить</button></div>' : '<button class="btn pink" id="tglink">Подключить Telegram</button>';
      $('#tglink')?.addEventListener('click', async () => { const r = await tg('link').catch(() => ({})); if (r.url) { window.open(r.url, '_blank', 'noopener'); el.innerHTML = 'Откройте бота и нажмите «Старт». Потом вернитесь сюда.'; } });
      $('#tgtest')?.addEventListener('click', () => tg('test').then(r => toast(r.ok ? 'Отчёт отправлен в Telegram' : 'Не получилось')));
      $('#tgoff')?.addEventListener('click', () => tg('unlink').then(() => go('parents')));
    }).catch(() => { const el = $('#tgst'); if (el) el.textContent = 'Нет связи с сервером.'; });
  }; }

  /* ================= тренажёр разговора ================= */
  const RP = () => ((window.SUBJECTS || {}).talk || {}).roleplay || [];
  SCREENS.roleplay = () => {
    S.rp = S.rp || {};
    app.innerHTML = `${topbar('🎭 Тренажёр разговора', 'subject')}<div class="page"><p class="center">Котик сыграет роль, а ты попробуешь поговорить. Отвечай голосом 🎤 или текстом. В конце котик подскажет, что получилось!</p><div class="rp-list">${RP().map(s => `<button class="rp-card" data-s="${s.id}"><span class="ri">${s.icon}</span><b>${s.title}</b><small>${s.goal}</small><span class="stars">${'★'.repeat(S.rp[s.id] || 0)}${'☆'.repeat(3 - (S.rp[s.id] || 0))}</span></button>`).join('')}</div></div>`;
    $('.back', app).dataset.go = 'subject'; $('.back', app).dataset.arg = 'talk';
    $$('.rp-card').forEach(b => b.addEventListener('click', () => { SND.tap(); go('rpchat', b.dataset.s); }));
  };
  SCREENS.rpchat = id => {
    const sc = RP().find(s => s.id === id); if (!sc) return go('roleplay');
    const log = [{ r: 'c', t: sc.opener }]; let busy = false, rec = null;
    app.innerHTML = `${topbar(sc.icon + ' ' + sc.title, 'roleplay')}<div class="page rp">
      <div class="rp-role"><b>${sc.role}</b><small>🎯 ${sc.goal}</small><details><summary>💡 Подсказки</summary><ul>${(sc.tips || []).map(t => `<li>${t}</li>`).join('')}</ul></details></div>
      <div class="rp-log" id="rpl"></div>
      <div class="chat-bar"><input id="rpin" placeholder="Что ты скажешь?" autocomplete="off" maxlength="300"><button class="mic" id="rpmic" aria-label="Сказать голосом">🎤</button><button class="send" id="rpsend" aria-label="Отправить">➤</button></div>
      <div class="row-btns" style="justify-content:center"><button class="btn mint" id="rpend">✔ Завершить и узнать, как получилось</button></div></div>`;
    const draw = () => { $('#rpl').innerHTML = log.map(m => `<div class="msg ${m.r === 'u' ? 'me' : 'cat'}">${m.r === 'c' ? `<span class="rp-av">${sc.icon}</span>` : ''}<div class="bub">${esc(m.t)}</div></div>`).join('') + (busy ? `<div class="msg cat"><span class="rp-av">${sc.icon}</span><div class="bub">…</div></div>` : ''); const l = $('#rpl'); l.scrollTop = l.scrollHeight; };
    const speak = t => { if (typeof speakRemote === 'function') speakRemote(t); };
    draw(); speak(sc.opener);
    const meta = () => ({ device: deviceId(), kid: S.kid, cat: S.name, code: S.cloudCode || '', scenario: id, history: log.slice(-12) });
    const got = out => { busy = false; if (out.heard) log.push({ r: 'u', t: out.heard }); log.push({ r: 'c', t: out.reply }); draw(); speak(out.reply); if (out.flag === 'distress') { S.chatLog = S.chatLog || []; S.chatLog.push({ r: 'c', t: '[тренажёр] ' + out.reply, ts: Date.now(), flag: 'distress' }); save(); } if (log.filter(m => m.r === 'u').length >= 6) $('#rpend').classList.add('pulse'); };
    const sendText = async () => {
      const t = $('#rpin').value.trim(); if (!t || busy) return; $('#rpin').value = ''; log.push({ r: 'u', t }); busy = true; draw();
      try { const r = await fetch(CLOUD + '/roleplay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...meta(), history: log.slice(-13, -1), text: t }) }); got(await r.json()); }
      catch (e) { busy = false; log.push({ r: 'c', t: 'Ой, связь потерялась… Повтори, пожалуйста?' }); draw(); }
    };
    $('#rpsend').addEventListener('click', sendText); $('#rpin').addEventListener('keydown', e => { if (e.key === 'Enter') sendText(); });
    $('#rpmic').addEventListener('click', async () => {
      if (typeof wakeAudio === 'function') wakeAudio();
      if (rec) { rec.stop(); return; } if (busy) return;
      let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { toast('Нужно разрешить микрофон — или напиши текстом 🙂'); return; }
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      const chunks = []; rec = new MediaRecorder(stream, type ? { mimeType: type } : {}); $('#rpmic').classList.add('on'); $('#rpmic').textContent = '⏹'; if (window.Music) Music.setDuck(true);
      rec.ondataavailable = e => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); rec = null; $('#rpmic').classList.remove('on'); $('#rpmic').textContent = '🎤'; if (window.Music) Music.setDuck(false); if (typeof wakeAudio === 'function') wakeAudio();
        const blob = new Blob(chunks, { type: type || 'audio/webm' }); if (blob.size < 2000) { toast('Не расслышал — попробуй ещё раз'); return; }
        busy = true; draw();
        try { const r = await fetch(CLOUD + '/voice?m=' + encodeURIComponent(JSON.stringify(meta())), { method: 'POST', headers: { 'content-type': blob.type }, body: blob }); const out = await r.json(); if (!out.heard) { busy = false; draw(); toast(out.reply || 'Не расслышал'); return; } got(out); }
        catch (e) { busy = false; draw(); toast('Связь потерялась'); }
      };
      rec.start(250); setTimeout(() => { if (rec && rec.state === 'recording') rec.stop(); }, 20000);
    });
    cleanups.push(() => { if (rec) try { rec.stop(); } catch (e) { } if (typeof stopRemote === 'function') stopRemote(); });
    $('#rpend').addEventListener('click', async () => {
      if (log.filter(m => m.r === 'u').length < 2) { toast('Скажи хотя бы пару фраз — котику нужно понять, как ты общаешься 🙂'); return; }
      $('#rpend').disabled = true; $('#rpend').textContent = 'Котик думает…';
      let f; try { const r = await fetch(CLOUD + '/roleplay', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...meta(), history: log, end: true }) }); f = await r.json(); } catch (e) { f = { good: ['Ты попробовал(а) — это уже смело!'], try: [], stars: 2, reply: 'Мур!' }; }
      const st = Math.max(1, Math.min(3, f.stars || 2)); S.rp = S.rp || {}; const first = !S.rp[id]; S.rp[id] = Math.max(S.rp[id] || 0, st); save();
      award(2 + st * 2, 10 + st * 5); if (st === 3 && first) awardGems(1, 'за отличный разговор'); if (window.Coach) Coach.track('a:talk', st / 3); acadTask('talk', { mistakes: 3 - st });
      SND.win(); if (st === 3) confetti(30);
      const m = modal(`<div class="big-emoji">${['', '🥉', '🥈', '🏆'][st]}</div><h2>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</h2>${f.good && f.good.length ? `<h3>👍 Получилось</h3><ul class="howto">${f.good.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${f.try && f.try.length ? `<h3>💡 Попробуй в следующий раз</h3><ul class="howto">${f.try.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}<p>${esc(f.reply || '')}</p><div class="row-btns"><button class="btn pink" id="rpag">Ещё раз</button><button class="btn" id="rpls">Другие сценки</button></div>`);
      $('#rpag', m.el).addEventListener('click', () => { m.close(); go('rpchat', id); }); $('#rpls', m.el).addEventListener('click', () => { m.close(); go('roleplay'); });
      speak(f.reply || '');
    });
  };
  ['roleplay', 'rpchat'].forEach(x => NO_FLOAT.includes(x) || NO_FLOAT.push(x));
  if ((window.SUBJECTS || {}).talk) window.SUBJECTS.talk.extras = [{ id: 'roleplay', icon: '🎭', name: 'Тренажёр разговора', run: () => go('roleplay'), badge: () => { const d = Object.keys(S.rp || {}).length; return d ? `сценок: ${d} из ${RP().length}` : ''; }, prog: () => RP().length ? RP().reduce((t, r) => t + ((S.rp || {})[r.id] || 0) / 3, 0) / RP().length : 0 }];
  return { profs, openProfiles, keyOf };
})();
window.Extras = Extras;
