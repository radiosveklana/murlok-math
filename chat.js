/* chat.js — «Поболтать с котиком»: ребёнок говорит (микрофон) или пишет, котик отвечает голосом.
   Ответы даёт сервер murlok-api (строгие детские правила безопасности). Переписка хранится только на этом устройстве. */
'use strict';
const API = 'https://level.tech-wave.ru/murlok-api';
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const CHAT_TIPS = ['Как у тебя дела?', 'Загадай мне загадку', 'Расскажи про космос', 'Помоги понять умножение', 'Какое твоё любимое лакомство?', 'Мне сегодня грустно', 'Расскажи смешную историю', 'Какие бывают кошки?'];
const deviceId = () => { if (!S.device) { S.device = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36); save(); } return S.device; };

/* голос котика для любого текста — с сервера (тот же мультяшный голос) */
async function speakRemote(text) {
  if (!S.sound || S.voice === false) return;
  try {
    M.hush(); M.ctx();
    const r = await fetch(API + '/tts?t=' + encodeURIComponent(String(text).slice(0, 400)));
    if (!r.ok) return;
    await M.playBuffer(await r.arrayBuffer());
  } catch (e) { }
}

SCREENS.chat = () => {
  S.chatLog = S.chatLog || [];
  if (S.chatOn === false) { app.innerHTML = `${topbar('Поболтать с котиком')}<div class="page center"><div class="big-emoji">💤</div><p>Разговоры с котиком выключены взрослыми.</p></div>`; return; }
  app.innerHTML = `${topbar('Поболтать с котиком')}<div class="page chat">
    <div class="chat-top"><div class="chat-cat" id="ccat">${myCat()}</div><div class="chat-say" id="csay">Привет, ${esc(S.kid)}! Я ${esc(S.name)}. О чём поболтаем? Можно говорить в микрофон или писать 🐾</div></div>
    <div class="chat-log" id="clog"></div>
    <div class="chips" id="chips">${shuffle(CHAT_TIPS).slice(0, 4).map(t => `<button class="chip-b">${t}</button>`).join('')}</div>
    <div class="chat-bar">${SR ? '<button class="mic" id="mic" aria-label="Говорить">🎤</button>' : ''}<input id="cin" maxlength="300" placeholder="${SR ? 'Нажми 🎤 и говори — или напиши тут' : 'Напиши котику…'}" autocomplete="off"><button class="send" id="csend" aria-label="Отправить">➤</button></div>
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
    S.chatLog.push({ r: 'c', t: out.reply, ts: Date.now(), flag: out.flag !== 'none' ? out.flag : undefined });
    if (out.flag && out.flag !== 'none') { const last = S.chatLog[S.chatLog.length - 2]; if (last) last.flag = out.flag; }
    if (S.chatLog.length > 300) S.chatLog = S.chatLog.slice(-300);
    save(); draw(); csay.textContent = out.reply; face(out.mood); busy = false;
    speakRemote(out.reply);
  }
  $('#csend').addEventListener('click', () => send(cin.value));
  cin.addEventListener('keydown', e => { if (e.key === 'Enter') send(cin.value); });
  $$('.chip-b').forEach(b => b.addEventListener('click', () => send(b.textContent)));
  if (SR) {
    let rec = null;
    $('#mic').addEventListener('click', () => {
      const mic = $('#mic');
      if (rec) { rec.stop(); return; }
      M.hush(); Music.setDuck(true);
      rec = new SR(); rec.lang = 'ru-RU'; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
      let finalT = '';
      rec.onresult = e => { let t = ''; for (const r of e.results) { t += r[0].transcript; if (r.isFinal) finalT = t; } cin.value = t; };
      rec.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast('Разреши доступ к микрофону в настройках браузера 🎤'); };
      rec.onend = () => { mic.classList.remove('on'); Music.setDuck(false); rec = null; const t = finalT || cin.value; if (t.trim()) send(t); };
      mic.classList.add('on'); csay.textContent = 'Слушаю тебя… 👂'; ccat.className = 'chat-cat m-think';
      try { rec.start(); } catch (e) { mic.classList.remove('on'); rec = null; }
    });
  }
  draw();
  if (S.chatLog.length) { const last = S.chatLog.filter(m => m.r === 'c').pop(); if (last) csay.textContent = `С возвращением, ${S.kid}! О чём поговорим сегодня?`; }
};
