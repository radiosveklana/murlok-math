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

/* ---------- мяу: пила + две форманты «м-и-а-у» ---------- */
function meow(o = {}) {
  if (!ok()) return;
  const now = AC.currentTime; if (now - lastVoice < 0.35 && !o.force) return; lastVoice = now;
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
const kitten = () => meow({ pitch: rr(1.55, 1.8), dur: rr(0.3, 0.42), shape: Math.random() < 0.5 ? 'happy' : 'normal', vol: 0.4 });

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
function purr(dur = 2) { if (!ok()) return; purrNodes(AC.currentTime + 0.02, dur); }
let purrLoop = null;
function purrStart() { if (!ok() || purrLoop) return; purrLoop = purrNodes(AC.currentTime + 0.02, 30); }
function purrStop() { if (purrLoop) { purrLoop.stop(); purrLoop = null; } }

/* ---------- шипение ---------- */
function hiss(dur = 0.9) {
  if (!ok()) return; const t0 = AC.currentTime + 0.02;
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
function hush() { vToken++; stopVoice(); try { speechSynthesis.cancel(); } catch (e) { } }

/* ---------- мультяшный голос котика: готовые фразы (voice/) + имя ребёнка ---------- */
let VMAN = null, vmanP = null, vsrcs = [], vEndT = null, vToken = 0; const vcache = new Map();
function loadMan() { if (!vmanP) vmanP = fetch('voice/manifest.json').then(r => r.json()).then(m => (VMAN = { c: new Set(m.c), n: new Set(m.n) })).catch(() => null); return vmanP; }
function decode(b) { return new Promise((res, rej) => { try { const pr = AC.decodeAudioData(b, res, rej); if (pr && pr.then) pr.then(res, rej); } catch (e) { rej(e); } }); }
function clip(url) { if (!vcache.has(url)) vcache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decode).catch(() => null)); return vcache.get(url); }
let custom = () => null; // записи ребёнка: (slot) => AudioBuffer|null
function voiceUrls(tpls, names) {
  const L = root.Lines, out = [];
  [].concat(tpls).forEach(t => L.parts(t).forEach(p => {
    if (p.name) { const nm = names[p.name]; if (!nm) return; const k = L.key(L.nameKey(nm)); if (VMAN.n.has(k)) out.push('voice/n/' + k + '.mp3'); }
    else { const k = L.key(p.text); if (VMAN.c.has(k)) out.push('voice/c/' + k + '.mp3'); else if (root.MURLOK_DEBUG) console.warn('VOICE-MISS', p.text); }
  }));
  return out;
}
async function voice(tpls, names = {}) {
  if (!voiceOn() || !ok() || !root.Lines) return false;
  const my = ++vToken; const man = await loadMan(); if (!man || my !== vToken) return false;
  const urls = voiceUrls(tpls, names); if (!urls.length) return false;
  const bufs = (await Promise.all(urls.map(clip))).filter(Boolean);
  if (my !== vToken || !bufs.length) return false;
  stopVoice();
  let t = AC.currentTime + 0.04; const g = AC.createGain(); g.gain.value = 1.15; g.connect(master);
  bufs.forEach(b => { const s = AC.createBufferSource(); s.buffer = b; s.connect(g); s.start(t); vsrcs.push(s); t += b.duration + 0.05; });
  onTalk(true); vEndT = setTimeout(() => { onTalk(false); vsrcs = []; }, (t - AC.currentTime) * 1000);
  return true;
}
function stopVoice() { vsrcs.forEach(s => { try { s.stop(); } catch (e) { } }); vsrcs = []; clearTimeout(vEndT); onTalk(false); }
function preloadVoice(list, names) { if (!ok()) return; loadMan().then(m => { if (m) voiceUrls(list, names).forEach(clip); }); }
root.Meow = { ctx, tone, meow, kitten, purr, purrStart, purrStop, hiss, trill, chirp, crunch, yawn, pawStep, haptic, setEnabled: f => { enabled = f; }, setVibro: f => { vibroOn = f; }, setVoice: f => { voiceOn = f; }, onTalk: f => { onTalk = f; }, speak, voice, preloadVoice, loadMan, unlockSpeech, hush, hasSpeech: () => 'speechSynthesis' in window, stopAll: () => purrStop() };
})(this);
