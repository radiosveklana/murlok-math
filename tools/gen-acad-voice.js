/* Озвучка карточек учебников Академии заранее: node tools/gen-acad-voice.js
   Тот же мультяшный голос котика, что в tools/gen-voice.js. Файлы voice/a/<ключ>.mp3 + voice/a/index.json.
   Готовые файлы не перегенерирует. Ключ — Lines.key(текст карточки), такой же считает academy.js. */
const { execFile } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm');
const L = require('../lines.js');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'voice/a'), FF = process.env.FFMPEG || 'ffmpeg';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'avoice-'));
const run = (cmd, args) => new Promise((res, rej) => execFile(cmd, args, { windowsHide: true, maxBuffer: 1 << 24 }, (e, so, se) => e ? rej(new Error(se || e.message)) : res(so)));
const cardText = c => (c.t + '. ' + c.h + (c.tip ? '. ' + c.tip : '')).replace(/<br\s*\/?>/gi, '. ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function ttsText(t) {
  return t.replace(/(\d)\s*[×·]\s*(\d)/g, '$1 умножить на $2').replace(/\s−\s/g, ' минус ').replace(/\s\+\s/g, ' плюс ').replace(/\s=\s/g, ' равно ')
    .replace(/[«»"]/g, '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/→/g, ', ').replace(/•/g, ', ');
}
async function make(text, out) {
  if (fs.existsSync(out)) return 'skip';
  const raw = path.join(TMP, path.basename(out) + '.raw.mp3');
  for (let a = 0; a < 4; a++) {
    try {
      await run('edge-tts', ['--voice', 'ru-RU-SvetlanaNeural', '--rate=+4%', '--pitch=+30Hz', '--text', ttsText(text), '--write-media', raw]);
      await run(FF, ['-v', 'error', '-y', '-i', raw, '-af', 'asetrate=24000*1.17,aresample=24000,atempo=0.92,highpass=f=110,loudnorm=I=-16:TP=-1.5', '-b:a', '40k', '-ac', '1', out]);
      fs.unlinkSync(raw); return 'ok';
    } catch (e) { if (a === 3) { console.error('FAIL', text.slice(0, 60), e.message.slice(0, 160)); return 'fail'; } await new Promise(r => setTimeout(r, 1500 * (a + 1))); }
  }
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ctx = { window: { SUBJECTS: {} } };
  for (const f of fs.readdirSync(path.join(ROOT, 'content')).filter(f => f.endsWith('.js'))) vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'), ctx);
  const jobs = [];
  for (const s of Object.values(ctx.window.SUBJECTS)) for (const u of s.units) for (const c of u.cards) { const t = cardText(c), k = L.key(t); jobs.push([t, path.join(OUT, k + '.mp3'), k]); }
  console.log('cards:', jobs.length);
  let i = 0; const stat = {};
  await Promise.all(Array.from({ length: 6 }, async () => { while (i < jobs.length) { const j = jobs[i++]; const r = await make(j[0], j[1]); stat[r] = (stat[r] || 0) + 1; } }));
  const keys = jobs.map(j => j[2]).filter(k => fs.existsSync(path.join(OUT, k + '.mp3')));
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify([...new Set(keys)]));
  const size = fs.readdirSync(OUT).reduce((t, f) => t + fs.statSync(path.join(OUT, f)).size, 0);
  console.log(stat, 'index:', keys.length, 'size MB:', (size / 1048576).toFixed(1));
})();
