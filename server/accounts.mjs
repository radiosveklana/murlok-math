// murlok-api, v23: семьи и личные кабинеты (152-ФЗ), вход родителя по почте с кодом, вход ребёнка по семейному коду
// и картинке-ПИНу, рефералы, админка (одна роль), снимки прогресса, тревожные отметки, рассылки.
// Хранилище — accounts.json (запись через временный файл), журнал согласий — consents.log (JSONL, только дозапись).
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, randomInt, createHash, scryptSync, timingSafeEqual } from 'node:crypto';

export const CONSENT_VER = '2026-10-09';

export function makeAccounts({ DIR, SAVE_DIR, limit, send, mail, tg }) {
  const FILE = path.join(DIR, 'accounts.json'), CLOG = path.join(DIR, 'consents.log'), SNAP = path.join(DIR, 'snapshots');
  fs.mkdirSync(SNAP, { recursive: true });
  let A = { families: {}, children: {}, codes: {}, sessions: {}, refs: {}, emailIdx: {}, famCodes: {}, flags: [], pending: {}, admin: { tg: null, tgTok: null } };
  try { A = { ...A, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; } catch { }
  let dirty = false; const touch = () => { dirty = true; };
  const flush = () => { if (!dirty) return; dirty = false; const t = FILE + '.tmp'; fs.writeFileSync(t, JSON.stringify(A)); fs.renameSync(t, FILE); };
  setInterval(flush, 2000);
  const logConsent = rec => fs.appendFileSync(CLOG, JSON.stringify({ ...rec, at: new Date().toISOString() }) + '\n');

  const AB = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', rnd = n => Array.from({ length: n }, () => AB[randomInt(AB.length)]).join('');
  const uniq = (n, used) => { for (;;) { const c = rnd(n); if (!used[c]) return c; } };
  const sha = s => createHash('sha256').update(String(s)).digest('hex');
  const now = () => Date.now();
  const okEmail = e => /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[a-z]{2,}$/i.test(e);
  const readSave = code => { try { return JSON.parse(fs.readFileSync(path.join(SAVE_DIR, code + '.json'), 'utf8')); } catch { return null; } };
  const body = async (req, max = 8000) => { let b = ''; for await (const c of req) { b += c; if (b.length > max) throw new Error('big'); } return b ? JSON.parse(b) : {}; };
  const token = (t, f, c, days) => { const k = randomBytes(24).toString('hex'); A.sessions[k] = { t, f, c: c || null, exp: now() + days * 864e5 }; touch(); return k; };
  const auth = (req, type) => { const h = String(req.headers.authorization || ''), k = h.startsWith('Bearer ') ? h.slice(7) : ''; const s = A.sessions[k]; if (!s || s.exp < now() || (type && s.t !== type)) return null; return { ...s, k }; };
  setInterval(() => { const t = now(); for (const [k, s] of Object.entries(A.sessions)) if (s.exp < t) { delete A.sessions[k]; touch(); } for (const [e, c] of Object.entries(A.codes)) if (c.exp < t) { delete A.codes[e]; touch(); } }, 36e5);

  /* ---------- рефералы ---------- */
  const newRef = owner => { const c = uniq(6, A.refs); A.refs[c] = { owner, visits: 0, regs: 0 }; return c; };
  const refCount = c => { const r = A.refs[c]; return r ? { code: c, visits: r.visits, regs: r.regs } : null; };

  /* ---------- сводка ребёнка из облачной копии ---------- */
  function kidSummary(ch) {
    const s = readSave(ch.cloudCode) || {}, wk = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toISOString().slice(0, 10); });
    const mins = Math.round(wk.reduce((t, d) => t + Object.values((s.time || {})[d] || {}).reduce((a, b) => a + b, 0), 0) / 60);
    return { id: ch.id, name: ch.name, cat: s.name || ch.cat || '', fur: s.fur || 'ginger', wear: s.wear || {}, xp: s.xp || 0, cases: s.cases || 0, candies: s.candies || 0, gems: s.gems || 0, minutesWeek: mins, lastSeen: s.savedAt || 0, survey: ch.survey || null, ref: refCount(ch.ref), hasPin: !!ch.pinHash, cloudCode: ch.cloudCode };
  }
  const famView = f => ({ id: f.id, email: f.email, code: f.code, priorities: f.priorities || [], plan: f.plan || 'free', created: f.created, consent: f.consent, ref: refCount(f.ref), children: (f.children || []).map(id => A.children[id]).filter(Boolean).map(kidSummary) });

  /* ---------- снимки прогресса (раз в сутки, 14 дней) ---------- */
  function snapshot() {
    const day = new Date().toISOString().slice(0, 10), dir = path.join(SNAP, day); if (fs.existsSync(dir)) return;
    fs.mkdirSync(dir, { recursive: true }); for (const f of fs.readdirSync(SAVE_DIR)) if (f.endsWith('.json')) fs.copyFileSync(path.join(SAVE_DIR, f), path.join(dir, f));
    fs.readdirSync(SNAP).sort().slice(0, -14).forEach(d => fs.rmSync(path.join(SNAP, d), { recursive: true, force: true }));
    // сохранения без кабинета родителя (без согласия) — удаляем через 90 дней неактивности
    const linked = new Set(Object.values(A.children).map(c => c.cloudCode)), friendsFile = path.join(DIR, 'friends.json');
    for (const f of fs.readdirSync(SAVE_DIR)) { if (!/^[A-Z0-9]{8}\.json$/.test(f) || linked.has(f.slice(0, 8))) continue; const st = fs.statSync(path.join(SAVE_DIR, f)); if (Date.now() - st.mtimeMs > 90 * 864e5) { try { fs.rmSync(path.join(SAVE_DIR, f)); } catch { } } }
  }
  setTimeout(snapshot, 5000); setInterval(snapshot, 36e5);

  function wipeFamily(f, why) {
    (f.children || []).forEach(id => { const ch = A.children[id]; if (ch) { try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } fs.readdirSync(SNAP).forEach(d => { try { fs.rmSync(path.join(SNAP, d, ch.cloudCode + '.json'), { force: true }); } catch { } }); delete A.pending[ch.cloudCode]; if (ch.ref) delete A.refs[ch.ref]; delete A.children[id]; } });
    if (f.ref) delete A.refs[f.ref]; delete A.emailIdx[f.email]; delete A.famCodes[f.code];
    for (const [k, s] of Object.entries(A.sessions)) if (s.f === f.id) delete A.sessions[k];
    logConsent({ type: why, family: f.id, emailHash: sha(f.email) }); delete A.families[f.id]; touch();
  }
  const pinHash = (f, pin) => sha(f.salt + ':' + (Array.isArray(pin) ? pin.join('-') : ''));
  const validPin = pin => Array.isArray(pin) && pin.length === 3 && pin.every(x => Number.isInteger(x) && x >= 0 && x < 12);

  /* ---------- API кабинетов ---------- */
  async function acc(req, res, url, origin, ip) {
    const r = url.pathname.slice(5); // после /acc/
    const J = async () => body(req);
    if (r === 'start' && req.method === 'POST') {
      const d = await J(), email = String(d.email || '').trim().toLowerCase();
      if (!okEmail(email)) return send(res, 400, { error: 'email' }, origin);
      if (!limit('accm:' + email, 5, 36e5) || !limit('accip:' + ip, 20, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      const code = String(randomInt(100000, 1000000)); A.codes[email] = { h: sha(email + ':' + code), exp: now() + 15 * 6e4, tries: 0, ref: String(d.ref || '').toUpperCase().slice(0, 8) || null }; touch();
      try { await mail(email, 'Код входа в «Мурлок и Ко»: ' + code, `Здравствуйте!\n\nВаш код для входа в личный кабинет «Мурлок и Ко»: ${code}\n\nКод действует 15 минут. Если вы не запрашивали код — просто проигнорируйте это письмо.\n\nКоманда Tech Wave · murlok.tech-wave.ru`); }
      catch (e) { console.error('mail', e.message); return send(res, 502, { error: 'mail' }, origin); }
      return send(res, 200, { ok: true, isNew: !A.emailIdx[email] }, origin);
    }
    if (r === 'verify' && req.method === 'POST') {
      const d = await J(), email = String(d.email || '').trim().toLowerCase(), c = A.codes[email];
      if (!c || c.exp < now()) return send(res, 400, { error: 'expired' }, origin);
      if (c.tries >= 5) return send(res, 429, { error: 'tries' }, origin);
      if (c.h !== sha(email + ':' + String(d.code || '').trim())) { c.tries++; touch(); return send(res, 400, { error: 'code', left: 5 - c.tries }, origin); }
      let fid = A.emailIdx[email], f = fid && A.families[fid];
      if (!f) {
        if (d.consent !== true) return send(res, 400, { error: 'consent' }, origin);
        fid = 'F' + rnd(10); const code = uniq(6, A.famCodes);
        f = A.families[fid] = { id: fid, email, code, salt: randomBytes(8).toString('hex'), created: now(), consent: { ver: CONSENT_VER, at: now(), ip }, priorities: [], plan: 'free', children: [], refBy: c.ref && A.refs[c.ref] ? c.ref : null };
        f.ref = newRef({ f: fid }); A.emailIdx[email] = fid; A.famCodes[code] = fid;
        if (f.refBy) { A.refs[f.refBy].regs++; }
        logConsent({ type: 'consent', family: fid, emailHash: sha(email), ver: CONSENT_VER, ip });
      }
      delete A.codes[email]; touch();
      return send(res, 200, { token: token('p', fid, null, 180), family: famView(f) }, origin);
    }
    if (r === 'child/list' && req.method === 'POST') { // ребёнок на новом устройстве: семейный код → кто ты?
      const d = await J(), fid = A.famCodes[String(d.familyCode || '').toUpperCase()];
      if (!limit('accfc:' + ip, 20, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      const f = fid && A.families[fid]; if (!f) return send(res, 404, { error: 'nf' }, origin);
      return send(res, 200, { kids: (f.children || []).map(id => A.children[id]).filter(Boolean).map(ch => { const s = readSave(ch.cloudCode) || {}; return { id: ch.id, name: ch.name, fur: s.fur || 'ginger', wear: s.wear || {}, hasPin: !!ch.pinHash }; }) }, origin);
    }
    if (r === 'child/login' && req.method === 'POST') {
      const d = await J(), fid = A.famCodes[String(d.familyCode || '').toUpperCase()], f = fid && A.families[fid], ch = f && A.children[d.childId];
      if (!ch || ch.familyId !== fid) return send(res, 404, { error: 'nf' }, origin);
      if (!limit('accpin:' + ch.id, 10, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      if (ch.pinHash && ch.pinHash !== pinHash(f, d.pin)) return send(res, 400, { error: 'pin' }, origin);
      ch.lastLogin = now(); touch();
      return send(res, 200, { token: token('c', fid, ch.id, 365), cloudCode: ch.cloudCode, name: ch.name, needSurvey: !ch.survey }, origin);
    }
    if (r === 'survey' && req.method === 'POST') {
      const s = auth(req, 'c'); if (!s) return send(res, 401, { error: 'auth' }, origin);
      const d = await J(), ch = A.children[s.c]; if (!ch) return send(res, 404, { error: 'nf' }, origin);
      ch.survey = Object.fromEntries(Object.entries(d.answers || {}).slice(0, 20).map(([k, v]) => [String(k).slice(0, 30), Array.isArray(v) ? v.slice(0, 8).map(x => String(x).slice(0, 40)) : String(v).slice(0, 80)])); ch.surveyAt = now(); touch();
      return send(res, 200, { ok: true }, origin);
    }
    if (r === 'child/me' && req.method === 'GET') { // ребёнку — приоритеты семьи для подстройки программы
      const s2 = auth(req, 'c'); if (!s2) return send(res, 401, { error: 'auth' }, origin); const f2 = A.families[s2.f], ch = A.children[s2.c]; if (!f2 || !ch) return send(res, 401, { error: 'auth' }, origin);
      return send(res, 200, { name: ch.name, priorities: f2.priorities || [], survey: ch.survey || null, cloudCode: ch.cloudCode }, origin);
    }
    if (r === 'pending' && req.method === 'POST') { // начисления/восстановление от админа — ребёнок забирает при входе
      const d = await J(), code = String(d.code || '').toUpperCase(); const p = A.pending[code]; if (!p) return send(res, 200, { items: [] }, origin);
      delete A.pending[code]; touch(); return send(res, 200, { items: p }, origin);
    }
    // ниже — только для родителя
    const s = auth(req, 'p'); if (!s) return send(res, 401, { error: 'auth' }, origin);
    const f = A.families[s.f]; if (!f) return send(res, 401, { error: 'auth' }, origin);
    if (r === 'family' && req.method === 'GET') return send(res, 200, { family: famView(f) }, origin);
    if (r === 'priorities' && req.method === 'POST') { const d = await J(); f.priorities = (Array.isArray(d.list) ? d.list : []).slice(0, 8).map(x => String(x).slice(0, 20)); touch(); return send(res, 200, { ok: true }, origin); }
    if (r === 'child' && req.method === 'POST') {
      const d = await J(), name = String(d.name || '').replace(/[<>{}"]/g, '').trim().slice(0, 20);
      if (name.length < 2 || (f.children || []).length >= 6) return send(res, 400, { error: 'name' }, origin);
      if (d.pin && !validPin(d.pin)) return send(res, 400, { error: 'pin' }, origin);
      let code = String(d.cloudCode || '').toUpperCase(); const taken = Object.values(A.children).some(c => c.cloudCode === code);
      if (!/^[A-Z0-9]{8}$/.test(code) || taken) code = rnd(8);
      const id = 'C' + rnd(10); A.children[id] = { id, familyId: f.id, name, cat: String(d.cat || '').slice(0, 20), cloudCode: code, pinHash: d.pin ? pinHash(f, d.pin) : null, created: now(), survey: null, refBy: f.refBy || null };
      A.children[id].ref = newRef({ f: f.id, c: id }); f.children.push(id); touch();
      return send(res, 200, { child: kidSummary(A.children[id]), token: token('c', f.id, id, 365) }, origin);
    }
    const m = r.match(/^child\/(C[A-Z0-9]{10})\/(pin|remove)$/);
    if (m && req.method === 'POST') {
      const ch = A.children[m[1]]; if (!ch || ch.familyId !== f.id) return send(res, 404, { error: 'nf' }, origin);
      if (m[2] === 'pin') { const d = await J(); if (!validPin(d.pin)) return send(res, 400, { error: 'pin' }, origin); ch.pinHash = pinHash(f, d.pin); touch(); return send(res, 200, { ok: true }, origin); }
      f.children = f.children.filter(x => x !== ch.id); try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } if (ch.ref) delete A.refs[ch.ref]; delete A.children[ch.id]; touch(); return send(res, 200, { ok: true }, origin);
    }
    if (r === 'export' && req.method === 'GET') {
      const out = { family: { ...famView(f), salt: undefined }, consents: fs.existsSync(CLOG) ? fs.readFileSync(CLOG, 'utf8').split('\n').filter(l => l.includes(f.id)).map(l => JSON.parse(l)) : [], progress: Object.fromEntries((f.children || []).map(id => A.children[id]).filter(Boolean).map(ch => [ch.name, readSave(ch.cloudCode)])) };
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="murlok-family-data.json"' }); return res.end(JSON.stringify(out, null, 1));
    }
    if ((r === 'delete' || r === 'revoke') && req.method === 'POST') { const d = await J(); if (d.confirm !== 'УДАЛИТЬ') return send(res, 400, { error: 'confirm' }, origin); wipeFamily(f, r === 'revoke' ? 'revoke' : 'delete'); return send(res, 200, { ok: true }, origin); }
    if (r === 'logout' && req.method === 'POST') { delete A.sessions[s.k]; touch(); return send(res, 200, { ok: true }, origin); }
    return send(res, 404, { error: 'nf' }, origin);
  }

  /* ---------- реферальная ссылка ---------- */
  function refLink(req, res, url) {
    const c = url.pathname.slice(3).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    if (A.refs[c] && limit('refv:' + c + ':' + (req.headers['x-real-ip'] || ''), 3, 864e5)) { A.refs[c].visits++; touch(); }
    res.writeHead(302, { location: '/?ref=' + c }); res.end();
  }

  /* ---------- тревожные отметки из разговоров с котиком ---------- */
  function flag(rec) {
    const item = { ts: now(), ...rec }; A.flags.unshift(item); A.flags = A.flags.slice(0, 500); touch();
    if (A.admin.tg && (rec.flag === 'distress' || rec.flag === 'pii')) tg('sendMessage', { chat_id: A.admin.tg, text: `⚠️ Мурлок: ${rec.flag === 'distress' ? 'ребёнку плохо/страшно' : 'личные данные'}\nРебёнок: ${rec.kid || '—'} (котик ${rec.cat || '—'})\nСообщение: ${String(rec.text || '').slice(0, 300)}\n\nПодробнее — в админке.` }).catch(() => { });
  }
  function tgStart(tok, chat) { if (tok && A.admin.tgTok && tok === A.admin.tgTok) { A.admin.tg = chat; A.admin.tgTok = null; touch(); return true; } return false; }

  return { acc, refLink, flag, tgStart, A, touch, flush, famView, kidSummary, readSave, wipeFamily, logConsent, CLOG, SNAP, auth, token, rnd, sha };
}
