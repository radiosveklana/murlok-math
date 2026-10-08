/* Генератор озвучки котика: node tools/gen-voice.js
   edge-tts (ru-RU-SvetlanaNeural) → ffmpeg: выше тон и тембр («мультяшный котёнок»), нормализация громкости.
   Готовые файлы не перегенерирует; удалите voice/, чтобы переозвучить всё. */
const { execFile } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const L = require('../lines.js');
const ROOT = path.join(__dirname, '..');
const FF = process.env.FFMPEG || 'ffmpeg';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'mvoice-'));
const VOICES = {
  cat: { voice: 'ru-RU-SvetlanaNeural', rate: '+4%', pitch: '+30Hz', af: 'asetrate=24000*1.17,aresample=24000,atempo=0.92' },
  sus: { voice: 'ru-RU-DmitryNeural', rate: '+12%', pitch: '-8Hz', af: 'asetrate=24000*0.94,aresample=24000,atempo=1.06' },
};
function profile(id) { // m_5_10_106 → голос персонажа
  const [g, p, r, a] = id.split('_'); const k = (+a || 100) / 100;
  return { voice: g === 'f' ? 'ru-RU-SvetlanaNeural' : 'ru-RU-DmitryNeural', rate: (+r >= 0 ? '+' : '') + (+r || 0) + '%', pitch: (+p >= 0 ? '+' : '') + (+p || 0) + 'Hz', af: `asetrate=24000*${k},aresample=24000,atempo=${(1 / k * (k > 1 ? 1.06 : 1)).toFixed(3)}` };
}
const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, { windowsHide: true, maxBuffer: 1 << 24 }, (e, so, se) => e ? rej(new Error(se || e.message)) : res(so)));
function ttsText(t) { // как читать: математические знаки словами
  return t.replace(/(\d)\s*[×·]\s*(\d)/g, '$1 умножить на $2').replace(/(\d)\s*:\s*(\d)/g, '$1 разделить на $2')
    .replace(/\s−\s/g, ' минус ').replace(/\s\+\s/g, ' плюс ').replace(/\s=\s/g, ' равно ').replace(/\bx\b/g, 'икс')
    .replace(/Мур-р+/g, 'Мурр').replace(/Мур-мяу/g, 'Мур, мяу').replace(/[«»"]/g, '');
}
async function make(text, out, kind) {
  if (fs.existsSync(out)) return 'skip';
  const V = VOICES[kind] || profile(kind), raw = path.join(TMP, path.basename(out) + '.raw.mp3');
  for (let a = 0; a < 4; a++) {
    try {
      await run('edge-tts', ['--voice', V.voice, `--rate=${V.rate}`, `--pitch=${V.pitch}`, '--text', ttsText(text), '--write-media', raw]);
      await run(FF, ['-v', 'error', '-y', '-i', raw, '-af', `${V.af},highpass=f=110,silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-16:TP=-1.5`, '-ar', '24000', '-ac', '1', '-b:a', '40k', out]);
      fs.unlinkSync(raw); return 'ok';
    } catch (e) { if (a === 3) { console.error('FAIL', text, e.message.slice(0, 200)); return 'fail'; } await new Promise(r => setTimeout(r, 1500 * (a + 1))); }
  }
}
(async () => {
  const jobs = [];
  fs.mkdirSync(path.join(ROOT, 'voice/c'), { recursive: true }); fs.mkdirSync(path.join(ROOT, 'voice/n'), { recursive: true });
  const man = { c: [], n: [] };
  for (const t of L.allTexts()) { const p = L.parts(t)[0]; const k = L.clipKey(p); man.c.push(k); jobs.push([p.text, path.join(ROOT, 'voice/c', k + '.mp3'), p.voice]); }
  for (const n of new Set([...L.NAMES, ...L.CAT_NAMES])) { const k = L.key(L.nameKey(n)); if (man.n.includes(k)) continue; man.n.push(k); jobs.push([n, path.join(ROOT, 'voice/n', k + '.mp3'), 'cat']); }
  console.log('clips:', jobs.length);
  let i = 0, done = 0; const stat = {};
  await Promise.all(Array.from({ length: 8 }, async () => { while (i < jobs.length) { const j = jobs[i++]; const r = await make(...j); stat[r] = (stat[r] || 0) + 1; if (++done % 50 === 0) console.log(done, '/', jobs.length); } }));
  man.c = man.c.filter(k => fs.existsSync(path.join(ROOT, 'voice/c', k + '.mp3')));
  man.n = man.n.filter(k => fs.existsSync(path.join(ROOT, 'voice/n', k + '.mp3')));
  fs.writeFileSync(path.join(ROOT, 'voice/manifest.json'), JSON.stringify(man));
  console.log(stat, 'manifest:', man.c.length, 'phrases,', man.n.length, 'names');
})();
