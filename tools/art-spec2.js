// Вливает tools/art/spec2-<subject>.json в prompts-*.json (запасная иллюстрация) и photoq-*.json (запрос фото): node tools/art-spec2.js
const fs = require('fs'), path = require('path'), D = path.join(__dirname, 'art');
for (const f of fs.readdirSync(D).filter(f => /^spec2-.*\.json$/.test(f))) {
  const s = f.slice(6, -5), spec = JSON.parse(fs.readFileSync(path.join(D, f), 'utf8'));
  const pf = path.join(D, `prompts-${s}.json`), qf = path.join(D, `photoq-${s}.json`);
  const P = fs.existsSync(pf) ? JSON.parse(fs.readFileSync(pf, 'utf8')) : {}, Q = fs.existsSync(qf) ? JSON.parse(fs.readFileSync(qf, 'utf8')) : {};
  let a = 0, q = 0;
  for (const [k, v] of Object.entries(spec)) {
    if (P[k]) continue;
    if (!v || v.type === 'none') { P[k] = { type: 'none' }; continue; }
    P[k] = { type: 'art', p: v.p }; a++;
    if (v.type === 'photo' && v.q) { Q[k] = { q: v.q, alt: v.alt || '' }; q++; }
  }
  fs.writeFileSync(pf, JSON.stringify(P, null, 1)); fs.writeFileSync(qf, JSON.stringify(Q, null, 1));
  console.log(s, 'описаний', a, 'запросов фото', q);
}
