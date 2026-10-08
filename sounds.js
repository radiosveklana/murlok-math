/* sounds.js — синтез кошачьих звуков на Web Audio (без файлов) + вибрация */
(function (root) {
'use strict';
let AC = null, master = null, noiseBuf = null, lastVoice = 0;
let enabled = () => true, vibroOn = () => true;


/* iOS: в беззвучном режиме Safari глушит Web Audio. Переключаем аудиосессию в «воспроизведение»
   (Safari 17+) и держим тихий <audio> — так звук слышен и при включённом беззвучном переключателе. */
let unmuted = false;
function unmuteIOS() {
  if (unmuted) return; unmuted = true;
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { }
  try {
    const sr = 8000, n = sr / 2, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    const a = document.createElement('audio'); a.setAttribute('x-webkit-airplay', 'deny'); a.preload = 'auto'; a.loop = true; a.volume = 0.01;
    a.src = URL.createObjectURL(new Blob([buf], { type: 'audio/wav' })); a.play().catch(() => { unmuted = false; });
  } catch (e) { }
}
function ctx() {
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    AC = new C(); master = AC.createDynamicsCompressor(); master.threshold.value = -14; master.ratio.value = 4;
    const g = AC.createGain(); g.gain.value = 0.9; master.connect(g); g.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (AC.state === 'suspended') AC.resume();
  unmuteIOS();
  return AC;
}
const rr = (a, b) => a + Math.random() * (b - a);
function noise(t0, dur) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(t0, Math.random()); s.stop(t0 + dur + 0.05); return s; }
function env(g, t0, pts) { g.gain.setValueAtTime(0.0001, t0); pts.forEach(([t, v]) => g.gain.linearRampToValueAtTime(Math.max(v, 0.0001), t0 + t)); }
function ok() { return enabled() && ctx(); }

/* ---------- простые тоны (интерфейс) ---------- */
function tone(seq) {
  if (!ok()) return; const t0 = AC.currentTime + 0.01;
  seq.forEach(([f, d, st = 0, type = 'sine', vol = 0.16, f2]) => {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0 + st);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + st + d);
    g.gain.setValueAtTime(0.0001, t0 + st); g.gain.exponentialRampToValueAtTime(vol, t0 + st + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + st + d);
    o.connect(g); g.connect(master); o.start(t0 + st); o.stop(t0 + st + d + 0.05);
  });
}


/* ---------- звуки, записанные ребёнком (Студия звуков) ---------- */
const CUST = {};
async function setCustom(id, ab, rate = 1) {
  if (!ab) { delete CUST[id]; return true; }
  if (!ctx()) return false;
  try {
    const b = await decode(ab.slice(0)); let pk = 0;
    for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i += 4) pk = Math.max(pk, Math.abs(d[i])); }
    CUST[id] = { b, rate, gain: pk > 0 ? Math.min(5, 0.85 / pk) : 1 }; return true;
  } catch (e) { return false; }
}
function custom(id, o = {}) {
  const c = CUST[id]; if (!c || !ok()) return false;
  const src = AC.createBufferSource(); src.buffer = c.b; src.playbackRate.value = (o.rate || c.rate) * (o.vary ? rr(0.94, 1.08) : 1); src.loop = !!o.loop;
  const g = AC.createGain(); g.gain.value = c.gain; src.connect(g); g.connect(master); src.start(AC.currentTime + 0.01);
  if (o.dur) src.stop(AC.currentTime + o.dur);
  return src;
}

/* ---------- мяу: пила + две форманты «м-и-а-у» ---------- */
function meow(o = {}) {
  if (!ok()) return;
  const now = AC.currentTime; if (now - lastVoice < 0.35 && !o.force) return; lastVoice = now;
  if (CUST.meow && (!o.shape || o.shape === 'normal' || o.shape === 'happy')) { custom('meow', { vary: true }); return; }
  const p = o.pitch || rr(0.9, 1.15), dur = o.dur || rr(0.55, 0.8), t0 = now + 0.02, vol = o.vol || 0.5;
  const shape = o.shape || 'normal'; // normal | question | sad | happy | kitten | long
  const f0 = 430 * p;
  const osc = AC.createOscillator(); osc.type = 'sawtooth';
  const f = osc.frequency; f.setValueAtTime(f0 * 0.85, t0);
  if (shape === 'question') { f.linearRampToValueAtTime(f0 * 1.15, t0 + dur * 0.4); f.linearRampToValueAtTime(f0 * 1.05, t0 + dur * 0.6); f.linearRampToValueAtTime(f0 * 1.6, t0 + dur); }
  else if (shape === 'sad') { f.linearRampToValueAtTime(f0 * 1.25, t0 + dur * 0.25); f.linearRampToValueAtTime(f0 * 0.7, t0 + dur); }
  else if (shape === 'happy') { f.linearRampToValueAtTime(f0 * 1.7, t0 + dur * 0.3); f.linearRampToValueAtTime(f0 * 1.45, t0 + dur * 0.6); f.linearRampToValueAtTime(f0 * 1.1, t0 + dur); }
  else { f.linearRampToValueAtTime(f0 * 1.5, t0 + dur * 0.35); f.linearRampToValueAtTime(f0 * 1.35, t0 + dur * 0.6); f.linearRampToValueAtTime(f0 * 0.9, t0 + dur); }
  // вибрато
  const vib = AC.createOscillator(), vg = AC.createGain(); vib.frequency.value = rr(5, 7); vg.gain.value = f0 * 0.025; vib.connect(vg); vg.connect(f);
  // форманты: и → а → у
  const mk = (a, b, c, q) => { const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(a, t0); bp.frequency.linearRampToValueAtTime(b, t0 + dur * 0.45); bp.frequency.linearRampToValueAtTime(c, t0 + dur); return bp; };
  const F1 = mk(380 * p, 950 * p, 420 * p, 5), F2 = mk(2300 * p, 1500 * p, 900 * p, 7);
  const g1 = AC.createGain(), g2 = AC.createGain(); g1.gain.value = 1; g2.gain.value = 0.6;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(500, t0); lp.frequency.linearRampToValueAtTime(5000, t0 + 0.08); // «м» в начале
  const out = AC.createGain(); env(out, t0, [[0.06, vol * 0.7], [dur * 0.3, vol], [dur * 0.75, vol * 0.8], [dur, 0.0001]]);
  osc.connect(lp); lp.connect(F1); lp.connect(F2); F1.connect(g1); F2.connect(g2); g1.connect(out); g2.connect(out); out.connect(master);
  osc.start(t0); vib.start(t0); osc.stop(t0 + dur + 0.05); vib.stop(t0 + dur + 0.05);
}
const kitten = () => (CUST.laugh && ok()) ? custom('laugh', { vary: true }) : meow({ pitch: rr(1.55, 1.8), dur: rr(0.3, 0.42), shape: Math.random() < 0.5 ? 'happy' : 'normal', vol: 0.4 });

/* ---------- мурлыканье: шум + НЧ-тон, модуляция ~26 Гц, вдох/выдох ---------- */
function purrNodes(t0, dur, vol = 0.55) {
  const n = noise(t0, dur); const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const bp = AC.createBiquadFilter(); bp.type = 'peaking'; bp.frequency.value = 140; bp.gain.value = 12; bp.Q.value = 1.2;
  const tone_ = AC.createOscillator(); tone_.type = 'triangle'; tone_.frequency.value = rr(48, 58);
  const tg = AC.createGain(); tg.gain.value = 0.5;
  const am = AC.createGain(); am.gain.value = 0.5;
  const lfo = AC.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = rr(24, 28);
  const lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
  const out = AC.createGain(); out.gain.setValueAtTime(0.0001, t0);
  // дыхательные циклы: выдох громче и чуть ниже
  let t = 0; const cyc = rr(0.8, 1.0);
  while (t < dur - 0.2) {
    out.gain.linearRampToValueAtTime(vol, t0 + t + 0.12); out.gain.linearRampToValueAtTime(vol * 0.8, t0 + t + cyc * 0.45);
    out.gain.linearRampToValueAtTime(vol * 0.15, t0 + t + cyc * 0.55); out.gain.linearRampToValueAtTime(vol * 0.7, t0 + t + cyc * 0.65);
    out.gain.linearRampToValueAtTime(vol * 0.55, t0 + t + cyc * 0.95); out.gain.linearRampToValueAtTime(vol * 0.12, t0 + t + cyc);
    t += cyc;
  }
  out.gain.linearRampToValueAtTime(0.0001, t0 + dur);
  n.connect(lp); lp.connect(bp); bp.connect(am); tone_.connect(tg); tg.connect(am); am.connect(out); out.connect(master);
  tone_.start(t0); lfo.start(t0); tone_.stop(t0 + dur + 0.1); lfo.stop(t0 + dur + 0.1);
  return { out, stop: () => { const now = AC.currentTime; try { out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now); out.gain.linearRampToValueAtTime(0.0001, now + 0.25); n.stop(now + 0.3); tone_.stop(now + 0.3); lfo.stop(now + 0.3); } catch (e) { } } };
}
function purr(dur = 2) { if (!ok()) return; if (CUST.purr) { custom('purr', { loop: true, dur }); return; } purrNodes(AC.currentTime + 0.02, dur); }
let purrLoop = null;
function purrStart() { if (!ok() || purrLoop) return; if (CUST.purr) { const src = custom('purr', { loop: true, dur: 30 }); purrLoop = { stop: () => { try { src.stop(); } catch (e) { } } }; return; } purrLoop = purrNodes(AC.currentTime + 0.02, 30); }
function purrStop() { if (purrLoop) { purrLoop.stop(); purrLoop = null; } }

/* ---------- шипение ---------- */
function hiss(dur = 0.9) {
  if (!ok()) return; if (CUST.hiss) { custom('hiss'); return; } const t0 = AC.currentTime + 0.02;
  const n = noise(t0, dur); const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
  const pk = AC.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 5500; pk.gain.value = 8;
  const g = AC.createGain(); env(g, t0, [[0.04, 0.35], [0.12, 0.25], [dur * 0.7, 0.18], [dur, 0.0001]]);
  n.connect(hp); hp.connect(pk); pk.connect(g); g.connect(master);
  // «пф!» в начале
  const n2 = noise(t0, 0.08), bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; const g2 = AC.createGain(); env(g2, t0, [[0.005, 0.5], [0.07, 0.0001]]); n2.connect(bp); bp.connect(g2); g2.connect(master);
}

/* ---------- трель «мрр?» и чирик ---------- */
function trill(o = {}) {
  if (!ok()) return; const now = AC.currentTime; if (now - lastVoice < 0.3) return; lastVoice = now;
  const t0 = now + 0.02, dur = o.dur || rr(0.32, 0.45), p = o.pitch || rr(0.95, 1.2);
  const osc = AC.createOscillator(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(330 * p, t0); osc.frequency.linearRampToValueAtTime(560 * p, t0 + dur * 0.8); osc.frequency.linearRampToValueAtTime(520 * p, t0 + dur);
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 3; bp.frequency.setValueAtTime(600 * p, t0); bp.frequency.linearRampToValueAtTime(1300 * p, t0 + dur);
  const am = AC.createGain(); am.gain.value = 0.5; const lfo = AC.createOscillator(); lfo.frequency.value = 32; const lg = AC.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
  const g = AC.createGain(); env(g, t0, [[0.04, 0.6], [dur * 0.8, 0.5], [dur, 0.0001]]);
  osc.connect(bp); bp.connect(am); am.connect(g); g.connect(master); osc.start(t0); lfo.start(t0); osc.stop(t0 + dur + 0.05); lfo.stop(t0 + dur + 0.05);
}
function chirp() { tone([[rr(1500, 1800), 0.07, 0, 'triangle', 0.12, 2400], [rr(1700, 2000), 0.08, 0.1, 'triangle', 0.1, 2600]]); }

/* ---------- хрум-хрум (ест сладость) ---------- */
function crunch(n = 6) {
  if (!ok()) return; const t0 = AC.currentTime + 0.02;
  for (let i = 0; i < n; i++) {
    const st = t0 + i * rr(0.13, 0.19), s = noise(st, 0.06), bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rr(1500, 3200); bp.Q.value = 1.5;
    const g = AC.createGain(); env(g, st, [[0.004, rr(0.35, 0.55)], [0.05, 0.0001]]); s.connect(bp); bp.connect(g); g.connect(master);
  }
}
/* ---------- зевок «ау-ау-ам» ---------- */
function yawn() { meow({ pitch: 0.75, dur: 1.1, shape: 'sad', vol: 0.32, force: true }); }
/* ---------- топ-топ лапками ---------- */
function pawStep() { tone([[rr(140, 180), 0.06, 0, 'sine', 0.14, 70]]); }

/* ---------- вибрация (Android: vibrate; iOS 18+: системный тактильный отклик переключателя) ---------- */
let iosSwitch = null;
function haptic(pattern = 12) {
  if (!vibroOn()) return;
  try {
    if (navigator.vibrate) { navigator.vibrate(pattern); return; }
    if (!iosSwitch) {
      const lbl = document.createElement('label'); lbl.style.cssText = 'position:fixed;left:-99px;top:0;opacity:0;pointer-events:none';
      const inp = document.createElement('input'); inp.type = 'checkbox'; inp.setAttribute('switch', ''); lbl.appendChild(inp); document.body.appendChild(lbl); iosSwitch = lbl;
    }
    iosSwitch.click();
  } catch (e) { }
}


/* ---------- голос котика: встроенный синтез речи (Web Speech API) ---------- */
let ruVoice = null, voiceOn = () => true, onTalk = () => {};
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const ru = speechSynthesis.getVoices().filter(v => /^ru/i.test(v.lang));
  ruVoice = ru.find(v => /milena|милена/i.test(v.name)) || ru.find(v => /google/i.test(v.name)) || ru.find(v => /female|alena|svetlana|irina|katya|daria|anna|elena/i.test(v.name)) || ru[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function cleanForSpeech(t) {
  return String(t).replace(/<[^>]+>/g, ' ')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}️‍✔✖]/gu, '')
    .replace(/(\d)\s*[×·]\s*(\d)/g, '$1 умножить на $2').replace(/(\d)\s*:\s*(\d)/g, '$1 разделить на $2')
    .replace(/\s−\s/g, ' минус ').replace(/\s\+\s/g, ' плюс ').replace(/\s=\s/g, ' равно ')
    .replace(/\bx\b/g, 'икс').replace(/Мур-р+/gi, 'Муррр').replace(/Мур-мур-мур/gi, 'Мурр мурр мурр').replace(/\(а\)/g, '')
    .replace(/[«»"]/g, '').replace(/\s+/g, ' ').trim();
}
let lastSpoken = '', lastAt = 0;
function speak(text, o = {}) {
  if (!voiceOn() || !('speechSynthesis' in window)) return;
  const t = cleanForSpeech(text); if (!t) return;
  const now = Date.now(); if (t === lastSpoken && now - lastAt < 2500 && !o.force) return; lastSpoken = t; lastAt = now;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t); u.lang = 'ru-RU'; if (ruVoice) u.voice = ruVoice;
    u.pitch = o.pitch || 1.7; u.rate = o.rate || 1.08; u.volume = 1;
    u.onstart = () => onTalk(true); u.onend = u.onerror = () => onTalk(false);
    speechSynthesis.speak(u);
  } catch (e) { }
}
function unlockSpeech() { try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) { } }
function hush() { vToken++; hushTok++; stopVoice(); busyUntil = 0; busyPrio = -1; try { speechSynthesis.cancel(); } catch (e) { } }

/* ---------- мультяшный голос котика: готовые фразы (voice/) + имя ребёнка ---------- */
let VMAN = null, vmanP = null, vsrcs = [], vEndT = null, vToken = 0; const vcache = new Map();
function loadMan() { if (!vmanP) vmanP = fetch('voice/manifest.json').then(r => r.json()).then(m => (VMAN = { c: new Set(m.c), n: new Set(m.n) })).catch(() => null); return vmanP; }
function decode(b) { return new Promise((res, rej) => { try { const pr = AC.decodeAudioData(b, res, rej); if (pr && pr.then) pr.then(res, rej); } catch (e) { rej(e); } }); }
function clip(url) { if (!vcache.has(url)) vcache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decode).catch(() => null)); return vcache.get(url); }
function voiceUrls(tpls, names) {
  const L = root.Lines, out = [];
  [].concat(tpls).forEach(t => L.parts(t).forEach(p => {
    if (p.name) { const nm = names[p.name]; if (!nm) return; const k = L.key(L.nameKey(nm)); out.push(VMAN.n.has(k) ? 'voice/n/' + k + '.mp3' : TTS_API + encodeURIComponent(String(nm).slice(0, 30))); }
    else { const k = L.clipKey(p); if (VMAN.c.has(k)) out.push('voice/c/' + k + '.mp3'); else if (root.MURLOK_DEBUG) console.warn('VOICE-MISS', p.text); }
  }));
  return out;
}
/* очередь голосов: prio 2 — персонажи, улики, уроки, чат; 1 — котик; 0 — болтовня (пропускается, если кто-то говорит).
   Важное прерывает менее важное, равное — ждёт своей очереди. */
let busyUntil = 0, busyPrio = -1, hushTok = 0;
function setBusy(sec, prio = 2) { if (!AC) return; busyUntil = Math.max(busyUntil, AC.currentTime + sec); busyPrio = Math.max(prio, AC.currentTime < busyUntil ? busyPrio : -1); }
async function voice(tpls, names = {}, o = {}) {
  const prio = o.prio == null ? 1 : o.prio;
  if (!voiceOn() || !ok() || !root.Lines) return false;
  const myHush = hushTok, man = await loadMan(); if (!man || myHush !== hushTok) return false;
  const urls = voiceUrls(tpls, names); if (!urls.length) return false;
  const bufs = (await Promise.all(urls.map(clip))).filter(Boolean);
  if (myHush !== hushTok || !bufs.length) return false;
  let now = AC.currentTime;
  if (now < busyUntil) {
    if (prio > busyPrio) stopVoice();                 // важное перебивает болтовню
    else if (prio === 0) return false;                 // болтовню не вставляем поверх
    else { const wait = (busyUntil - now) * 1000 + 200; if (wait > 9000) return false; await new Promise(r => setTimeout(r, wait)); if (myHush !== hushTok) return false; if (AC.currentTime < busyUntil && prio <= busyPrio) return false; }
  }
  let t = AC.currentTime + 0.04; const g = AC.createGain(); g.gain.value = 1.15; g.connect(master);
  bufs.forEach(b => { const src = AC.createBufferSource(); src.buffer = b; src.connect(g); src.start(t); vsrcs.push(src); t += b.duration + 0.05; });
  busyUntil = t; busyPrio = prio; onTalk(true); clearTimeout(vEndT);
  vEndT = setTimeout(() => { onTalk(false); vsrcs = []; busyPrio = -1; }, (t - AC.currentTime) * 1000);
  return true;
}
const TTS_API = 'https://level.tech-wave.ru/murlok-api/tts?t=';
async function playBuffer(ab) { // произвольная фраза с сервера (ответ котика в чате)
  if (!voiceOn() || !ok()) return false;
  const my = ++vToken; let buf; try { buf = await decode(ab); } catch (e) { return false; }
  if (my !== vToken) return false; stopVoice();
  const g = AC.createGain(); g.gain.value = 1.15; g.connect(master);
  const s = AC.createBufferSource(); s.buffer = buf; s.connect(g); s.start(AC.currentTime + 0.03); vsrcs.push(s);
  onTalk(true); vEndT = setTimeout(() => { onTalk(false); vsrcs = []; }, (buf.duration + 0.1) * 1000);
  return true;
}
function stopVoice() { vsrcs.forEach(s => { try { s.stop(); } catch (e) { } }); vsrcs = []; clearTimeout(vEndT); onTalk(false); busyUntil = 0; busyPrio = -1; }
function preloadVoice(list, names) { if (!ok()) return; loadMan().then(m => { if (m) voiceUrls(list, names).forEach(clip); }); }

/* ---------- звуки предметов в домике ---------- */
function nburst(t0, dur, f, q, vol, type = 'bandpass') { const n = noise(t0, dur), bp = AC.createBiquadFilter(); bp.type = type; bp.frequency.value = f; bp.Q.value = q; const g = AC.createGain(); env(g, t0, [[0.01, vol], [dur, 0.0001]]); n.connect(bp); bp.connect(g); g.connect(master); }
function sfx(name) {
  if (!ok()) return; const t = AC.currentTime + 0.02;
  if (name === 'splash') { for (let i = 0; i < 7; i++) nburst(t + i * rr(0.12, 0.3), rr(0.12, 0.3), rr(600, 1800), 0.8, rr(0.25, 0.45)); return; }
  if (name === 'scratch') { for (let i = 0; i < 6; i++) nburst(t + i * 0.16, 0.12, rr(3000, 5000), 2, 0.3, 'highpass'); return; }
  if (name === 'lap') { for (let i = 0; i < 6; i++) tone([[rr(700, 900), 0.05, i * 0.22, 'sine', 0.14, 400]]); return; }
  if (name === 'drum') { [0, 0.25, 0.5, 0.62, 0.75].forEach((d, i) => { tone([[i % 2 ? 180 : 110, 0.25, d, 'sine', 0.4, 50]]); nburst(t + d, 0.08, 2500, 0.7, i % 2 ? 0.25 : 0.1); }); return; }
  if (name === 'melody') { [523, 587, 659, 523, 659, 784, 659, 523].forEach((f, i) => tone([[f, 0.28, i * 0.22, 'triangle', 0.16]])); return; }
  if (name === 'strum') { [196, 247, 294, 392, 494].forEach((f, i) => tone([[f, 1.2, i * 0.03, 'sawtooth', 0.05], [f * 2, 0.8, i * 0.03, 'triangle', 0.05]])); return; }
  if (name === 'whoosh') { const n = noise(t, 1.2), bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(3000, t + 1); const g = AC.createGain(); env(g, t, [[0.3, 0.4], [1.2, 0.0001]]); n.connect(bp); bp.connect(g); g.connect(master); return; }
  if (name === 'chug') { for (let i = 0; i < 10; i++) nburst(t + i * 0.18, 0.1, 400, 1, 0.3); tone([[660, 0.3, 0.1, 'square', 0.06], [880, 0.4, 0.3, 'square', 0.06]]); return; }
  if (name === 'pop') { tone([[300, 0.08, 0, 'sine', 0.3, 900]]); nburst(t, 0.06, 1500, 1, 0.3); return; }
  if (name === 'magic') { [1047, 1319, 1568, 2093, 1568, 2637].forEach((f, i) => tone([[f, 0.25, i * 0.07, 'sine', 0.1]])); return; }
  if (name === 'bounce') { [0, 0.35, 0.6, 0.78].forEach((d, i) => tone([[200 - i * 20, 0.12, d, 'sine', 0.3 - i * 0.05, 90]])); return; }
  if (name === 'tv') { nburst(t, 0.4, 3000, 0.5, 0.12); tone([[440, 0.2, 0.45, 'square', 0.05], [660, 0.3, 0.65, 'square', 0.05]]); return; }
  if (name === 'boing') { tone([[220, 0.4, 0, 'sine', 0.3, 660]]); return; }
  if (name === 'bubbles') { for (let i = 0; i < 8; i++) tone([[rr(500, 1100), 0.06, i * rr(0.08, 0.2), 'sine', 0.12, rr(1200, 1800)]]); return; }
  if (name === 'fire') { for (let i = 0; i < 4; i++) { nburst(t + i * 0.4, 0.5, 800, 0.5, 0.35); tone([[rr(800, 1600), 0.4, i * 0.4 + 0.1, 'sine', 0.1, 3000]]); } return; }
  if (name === 'shutter') { nburst(t, 0.03, 4000, 1, 0.5, 'highpass'); nburst(t + 0.08, 0.05, 2500, 1, 0.35); return; }
  if (name === 'mystery') { [220, 277, 330].forEach((f, i) => tone([[f, 2.4, i * 0.05, 'sine', 0.06]])); [1319, 1568, 1976, 1568].forEach((f, i) => tone([[f, 0.6, 0.6 + i * 0.35, 'triangle', 0.05]])); return; }
  if (name === 'snore') { [0, 1.4].forEach(d => { nburst(t + d, 0.7, 200, 1, 0.25, 'lowpass'); }); return; }
}
root.Meow = { ctx, tone, meow, kitten, purr, purrStart, purrStop, hiss, trill, chirp, crunch, yawn, pawStep, haptic, setEnabled: f => { enabled = f; }, setVibro: f => { vibroOn = f; }, setVoice: f => { voiceOn = f; }, onTalk: f => { onTalk = f; }, speak, voice, setBusy, sfx, playBuffer, setCustom, custom, preloadVoice, loadMan, unlockSpeech, hush, hasSpeech: () => 'speechSynthesis' in window, stopAll: () => purrStop() };
})(this);
