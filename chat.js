/* chat.js — «Поболтать с котиком»: ребёнок говорит (микрофон) или пишет, котик отвечает голосом.
   Ответы даёт сервер murlok-api (строгие детские правила безопасности). Переписка хранится только на этом устройстве. */
'use strict';
const API = 'https://level.tech-wave.ru/murlok-api';
const CAN_REC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
const CHAT_TIPS = ['Как у тебя дела?', 'Загадай мне загадку', 'Расскажи про космос', 'Помоги понять умножение', 'Какое твоё любимое лакомство?', 'Мне сегодня грустно', 'Расскажи смешную историю', 'Какие бывают кошки?'];
const deviceId = () => { if (!S.device) { S.device = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36); save(); } return S.device; };

/* голос котика для любого текста — потоком с сервера: начинает звучать, пока фраза ещё синтезируется */
const voiceEl = new Audio(); voiceEl.preload = 'auto'; voiceEl.crossOrigin = 'anonymous';
document.addEventListener('pointerdown', function unlockVoice() { // iOS: «разблокировать» элемент касанием
  document.removeEventListener('pointerdown', unlockVoice, true);
  voiceEl.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='; voiceEl.play().catch(() => { });
}, true);
voiceEl.addEventListener('playing', () => { document.body.classList.add('cat-talking'); Music.setDuck(true); });
['ended', 'pause', 'error'].forEach(ev => voiceEl.addEventListener(ev, () => { document.body.classList.remove('cat-talking'); Music.setDuck(false); }));
function speakRemote(text) {
  if (!S.sound || S.voice === false) return;
  try {
    M.hush();
    voiceEl.src = API + '/tts?s=1&t=' + encodeURIComponent(String(text).slice(0, 400));
    voiceEl.preservesPitch = false; voiceEl.webkitPreservesPitch = false; voiceEl.mozPreservesPitch = false;
    voiceEl.playbackRate = 1.14; voiceEl.volume = 1;
    voiceEl.addEventListener('loadedmetadata', () => { voiceEl.playbackRate = 1.14; }, { once: true });
    voiceEl.play().catch(() => { });
  } catch (e) { }
}


/* помощь с микрофоном: понятная инструкция под конкретный телефон и браузер */
function micHelp(err) {
  const ua = navigator.userAgent, ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = /Telegram|TelegramBot|WhatsApp|Instagram|FBAN|FBAV|VKClient|vkclient|OKApp|YaBrowser\/.*Mobile.*YaApp|Line\//i.test(ua) || (ios && !/Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua));
  const name = err && err.name || '';
  let how;
  if (inApp) how = `<p>Похоже, ссылка открыта <b>внутри мессенджера</b> — там сайтам нельзя включать микрофон.</p><ol class="rules"><li>Нажми <b>⋯</b> или <b>⋮</b> в углу экрана.</li><li>Выбери <b>«Открыть в браузере»</b> (${ios ? 'Safari' : 'Chrome'}).</li><li>В браузере снова зайди в «Поболтать с котиком» и нажми 🎤 → <b>Разрешить</b>.</li></ol><button class="btn" id="cpl">📋 Скопировать ссылку</button>`;
  else if (ios) how = `<p>Браузер не дал доступ к микрофону для этого сайта.</p><ol class="rules"><li>Нажми <b>«аА»</b> слева в адресной строке Safari.</li><li>Выбери <b>«Настройки веб-сайта»</b>.</li><li><b>Микрофон → Разрешить</b>.</li><li>Обнови страницу и нажми 🎤 ещё раз.</li></ol><p class="small">Если не помогло: Настройки iPhone → Safari → Микрофон → «Спросить» или «Разрешить». В Chrome на iPhone: Настройки iPhone → Chrome → Микрофон.</p>`;
  else how = `<p>Браузер не дал доступ к микрофону для этого сайта.</p><ol class="rules"><li>Нажми на значок <b>🔒</b> (или ⚙️) слева от адреса сайта.</li><li>Выбери <b>«Разрешения»</b> или «Настройки сайта».</li><li><b>Микрофон → Разрешить</b>.</li><li>Обнови страницу и нажми 🎤 ещё раз.</li></ol><p class="small">Ещё проверь: Настройки телефона → Приложения → Chrome → Разрешения → Микрофон.</p>`;
  if (name === 'NotFoundError') how = '<p>На этом устройстве не нашёлся микрофон. Можно писать котику текстом ✍️</p>';
  const m = modal(`<div class="big-emoji">🎤</div><h2>Включим микрофон</h2>${how}<p class="small">А пока можно нажать на поле ввода и сказать фразу через кнопку <b>🎙 диктовки на клавиатуре</b> — котик поймёт!</p><p class="small" style="opacity:.6">Код: ${esc(name || 'нет доступа')}</p><button class="btn pink" data-close>Понятно</button>`);
  const cp = $('#cpl', m.el); if (cp) cp.addEventListener('click', () => { try { navigator.clipboard.writeText(location.href.split('#')[0]); toast('Ссылка скопирована — вставь её в Safari или Chrome'); } catch (e) { } });
}

SCREENS.chat = () => {
  S.chatLog = S.chatLog || [];
  if (S.chatOn === false) { app.innerHTML = `${topbar('Поболтать с котиком')}<div class="page center"><div class="big-emoji">💤</div><p>Разговоры с котиком выключены взрослыми.</p></div>`; return; }
  app.innerHTML = `${topbar('Поболтать с котиком')}<div class="page chat">
    <div class="chat-top"><div class="chat-cat" id="ccat">${myCat()}</div><div class="chat-say" id="csay">Привет, ${esc(S.kid)}! Я ${esc(S.name)}. О чём поболтаем? Можно говорить в микрофон или писать 🐾</div></div>
    <div class="chat-log" id="clog"></div>
    <div class="chips" id="chips">${shuffle(CHAT_TIPS).slice(0, 4).map(t => `<button class="chip-b">${t}</button>`).join('')}</div>
    <div class="chat-bar"><button class="mic" id="mic" aria-label="Говорить">🎤</button><input id="cin" maxlength="300" placeholder="${CAN_REC ? 'Нажми 🎤 и говори — или напиши тут' : 'Напиши котику…'}" autocomplete="off"><button class="send" id="csend" aria-label="Отправить">➤</button></div>
    <p class="small center">Котик — персонаж игры. Не рассказывай ему секреты: фамилию, адрес, телефон и пароли 🤫</p></div>`;
  const log = $('#clog'), cin = $('#cin'), csay = $('#csay'), ccat = $('#ccat');
  let busy = false;
  const draw = () => { log.innerHTML = S.chatLog.slice(-30).map(m => `<div class="msg ${m.r === 'u' ? 'me' : 'cat'}">${esc(m.t)}</div>`).join(''); log.scrollTop = log.scrollHeight; };
  const face = mood => { ccat.innerHTML = myCat({ happy: mood === 'happy' || mood === 'love' || mood === 'surprised', sad: mood === 'sad' }); ccat.className = 'chat-cat m-' + (mood === 'sad' ? 'sad' : mood === 'think' ? 'think' : 'happy'); if (mood === 'love') hearts(ccat, 5); };
  async function send(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    busy = true; cin.value = ''; $('#chips').innerHTML = '';
    const hist = S.chatLog.slice(-10).map(m => ({ r: m.r, t: m.t }));
    S.chatLog.push({ r: 'u', t: text, ts: Date.now() }); draw(); SND.tap();
    csay.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>'; ccat.className = 'chat-cat m-think'; M.purr(1.2);
    let out;
    try {
      const r = await fetch(API + '/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ device: deviceId(), kid: S.kid, cat: S.name, history: hist, text }) });
      out = await r.json();
      if (!out.reply) throw 0;
    } catch (e) { out = { reply: 'Мур… связь с котиком потерялась. Проверь интернет и попробуй ещё раз!', mood: 'sad', flag: 'none' }; }
    answer(out);
  }
  function answer(out) {
    S.chatLog.push({ r: 'c', t: out.reply, ts: Date.now(), flag: out.flag !== 'none' ? out.flag : undefined });
    if (out.flag && out.flag !== 'none') { const last = S.chatLog[S.chatLog.length - 2]; if (last) last.flag = out.flag; }
    if (S.chatLog.length > 300) S.chatLog = S.chatLog.slice(-300);
    save(); draw(); csay.textContent = out.reply; face(out.mood); busy = false;
    speakRemote(out.reply);
  }
  $('#csend').addEventListener('click', () => send(cin.value));
  cin.addEventListener('keydown', e => { if (e.key === 'Enter') send(cin.value); });
  $$('.chip-b').forEach(b => b.addEventListener('click', () => send(b.textContent)));
  /* голос: записываем, сами останавливаемся, когда ребёнок замолчал, распознаём на сервере */
  if (!CAN_REC) $('#mic').addEventListener('click', () => micHelp({ name: window.isSecureContext ? 'NoRecorder' : 'Insecure' }));
  if (CAN_REC) {
    let rec = null;
    $('#mic').addEventListener('click', async () => {
      const mic = $('#mic');
      if (rec) { rec.stop(); return; }
      if (busy) return;
      let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); } catch (e) { try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e2) { micHelp(e2); return; } }
      M.hush(); Music.setDuck(true);
      const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
      const mr = new MediaRecorder(stream, type ? { mimeType: type } : {}), chunks = []; rec = mr;
      const ac = M.ctx(), src = ac.createMediaStreamSource(stream), an = ac.createAnalyser(); an.fftSize = 512; src.connect(an);
      const buf = new Uint8Array(an.fftSize); let spoke = false, quietFrom = 0; const t0 = Date.now();
      mic.classList.add('on'); mic.textContent = '✔'; csay.innerHTML = 'Слушаю тебя… 👂 Говори спокойно. Когда договоришь — нажми <b>✔</b> или просто помолчи. <span class="lvl"><i id="lvl"></i></span>'; ccat.className = 'chat-cat m-think';
      const iv = setInterval(() => {
        an.getByteTimeDomainData(buf); let pk = 0; for (const v of buf) pk = Math.max(pk, Math.abs(v - 128));
        const l = $('#lvl'); if (l) l.style.width = Math.min(100, pk * 1.4) + '%';
        if (pk > 9) { spoke = true; quietFrom = 0; } else if (spoke) { quietFrom = quietFrom || Date.now(); if (Date.now() - quietFrom > 2600) mr.stop(); }
        if (Date.now() - t0 > (spoke ? 25000 : 12000)) mr.stop();
      }, 80);
      mr.ondataavailable = e => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        clearInterval(iv); src.disconnect(); stream.getTracks().forEach(t => t.stop()); rec = null; mic.classList.remove('on'); mic.textContent = '🎤'; Music.setDuck(false);
        const blob = new Blob(chunks, { type: mr.mimeType || type || 'audio/webm' });
        if (!spoke || blob.size < 2000) { csay.textContent = 'Мур? Я ничего не услышал. Нажми 🎤 и скажи что-нибудь!'; ccat.className = 'chat-cat'; return; }
        busy = true; $('#chips').innerHTML = '';
        csay.innerHTML = 'Котик думает… <span class="dots"><i></i><i></i><i></i></span>'; ccat.className = 'chat-cat m-think'; M.purr(1.5);
        const hist = S.chatLog.slice(-10).map(m => ({ r: m.r, t: m.t }));
        let out;
        try {
          const meta = encodeURIComponent(JSON.stringify({ device: deviceId(), kid: S.kid, cat: S.name, history: hist }));
          const r = await fetch(API + '/voice?m=' + meta, { method: 'POST', headers: { 'content-type': blob.type || 'application/octet-stream' }, body: blob });
          out = await r.json(); if (!out.reply) throw 0;
        } catch (e) { out = { heard: '', reply: 'Мур… связь с котиком потерялась. Проверь интернет и попробуй ещё раз!', mood: 'sad', flag: 'none' }; }
        if (out.heard) { S.chatLog.push({ r: 'u', t: out.heard, ts: Date.now() }); draw(); }
        answer(out);
      };
      mr.start(250);
    });
  }
  draw();
  if (S.chatLog.length) { const last = S.chatLog.filter(m => m.r === 'c').pop(); if (last) csay.textContent = `С возвращением, ${S.kid}! О чём поговорим сегодня?`; }
};
