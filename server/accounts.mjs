// murlok-api, v23: семьи и личные кабинеты (152-ФЗ), вход родителя по почте с кодом, вход ребёнка по семейному коду
// и картинке-ПИНу, рефералы, админка (одна роль), снимки прогресса, тревожные отметки, рассылки.
// Хранилище — accounts.json (запись через временный файл), журнал согласий — consents.log (JSONL, только дозапись).
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, randomInt, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { makeSocial } from './social.mjs';

export const CONSENT_VER = '2026-10-09';

export function makeAccounts({ DIR, SAVE_DIR, limit, send, mail, tg }) {
  const FILE = path.join(DIR, 'accounts.json'), CLOG = path.join(DIR, 'consents.log'), SNAP = path.join(DIR, 'snapshots');
  fs.mkdirSync(SNAP, { recursive: true });
  let A = { families: {}, children: {}, codes: {}, sessions: {}, refs: {}, emailIdx: {}, famCodes: {}, flags: [], pending: {}, invites: {}, duels: {}, chals: {}, admin: { tg: null, tgTok: null } };
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

  // v30: в семье несколько взрослых. Первый — владелец (f.email), остальные приглашены по почте и имеют права родителя
  const adults = f => { if (!Array.isArray(f.parents)) { f.parents = [{ id: 'P' + rnd(8), email: f.email, role: 'owner', joined: f.created, consent: f.consent }]; touch(); } return f.parents; };
  let hooks = { friendCodes: () => [], friendsAdmin: null }; // друзья живут в extra.mjs — сервер связывает модули через setHooks
  const setHooks = h => { hooks = { ...hooks, ...h }; };
  const social = makeSocial({ A, touch, readSave, rnd, SNAP, friendCodes: code => hooks.friendCodes(code) });
  const siblings = code => { const ch = Object.values(A.children).find(c => c.cloudCode === code), f = ch && A.families[ch.familyId]; return f ? (f.children || []).map(id => A.children[id]).filter(c => c && c.id !== ch.id).map(c => c.cloudCode) : []; };

  /* ---------- рефералы ---------- */
  const newRef = owner => { const c = uniq(6, A.refs); A.refs[c] = { owner, visits: 0, regs: 0 }; return c; };
  const refCount = c => { const r = A.refs[c]; return r ? { code: c, visits: r.visits, regs: r.regs } : null; };

  /* ---------- сводка ребёнка из облачной копии ---------- */
  function kidSummary(ch) {
    const s = readSave(ch.cloudCode) || {}, wk = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toISOString().slice(0, 10); });
    const mins = Math.round(wk.reduce((t, d) => t + Object.values((s.time || {})[d] || {}).reduce((a, b) => a + b, 0), 0) / 60);
    return { id: ch.id, name: ch.name, cat: s.name || ch.cat || '', fur: s.fur || 'ginger', wear: s.wear || {}, xp: s.xp || 0, cases: s.cases || 0, candies: s.candies || 0, gems: s.gems || 0, minutesWeek: mins, lastSeen: s.savedAt || 0, survey: ch.survey || null, ref: refCount(ch.ref), hasPin: !!ch.pinHash, cloudCode: ch.cloudCode };
  }
  const famView = (f, me) => ({ id: f.id, email: f.email, code: f.code, me: me ? { email: me, role: (adults(f).find(a => a.email === me) || {}).role || 'adult' } : null,
    adults: adults(f).map(a => ({ id: a.id, email: a.email, name: a.name || '', role: a.role, joined: a.joined })), invites: Object.entries(A.invites).filter(([, v]) => v.f === f.id && v.exp > now()).map(([e, v]) => ({ email: e, name: v.name || '', exp: v.exp })), priorities: f.priorities || [], plan: f.plan || 'free', created: f.created, consent: f.consent, ref: refCount(f.ref), children: (f.children || []).map(id => A.children[id]).filter(Boolean).map(kidSummary) });

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
    adults(f).forEach(a => { if (A.emailIdx[a.email] === f.id) delete A.emailIdx[a.email]; }); for (const [e, v] of Object.entries(A.invites)) if (v.f === f.id) delete A.invites[e];
    (f.children || []).forEach(id => social.forgetChild(id)); social.forgetFamily(f.id);
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
      const inv = !A.emailIdx[email] && A.invites[email] && A.invites[email].exp > now() && A.families[A.invites[email].f] ? A.invites[email] : null;
      return send(res, 200, { ok: true, isNew: !A.emailIdx[email], invite: inv ? { by: String(inv.email).replace(/^(.{2})[^@]*/, '$1***') } : null }, origin); // почту пригласившего — не целиком
    }
    if (r === 'verify' && req.method === 'POST') {
      const d = await J(), email = String(d.email || '').trim().toLowerCase(), c = A.codes[email];
      if (!c || c.exp < now()) return send(res, 400, { error: 'expired' }, origin);
      if (c.tries >= 5) return send(res, 429, { error: 'tries' }, origin);
      if (c.h !== sha(email + ':' + String(d.code || '').trim())) { c.tries++; touch(); return send(res, 400, { error: 'code', left: 5 - c.tries }, origin); }
      let fid = A.emailIdx[email], f = fid && A.families[fid];
      const inv = !f && A.invites[email] && A.invites[email].exp > now() && A.families[A.invites[email].f];
      if (inv) { // приглашённый взрослый присоединяется к семье с правами родителя — со своим согласием
        if (d.consent !== true) return send(res, 400, { error: 'consent' }, origin);
        f = inv; fid = f.id; adults(f).push({ id: 'P' + rnd(8), email, name: A.invites[email].name || '', role: 'adult', joined: now(), by: A.invites[email].by || null, consent: { ver: CONSENT_VER, at: now(), ip } });
        A.emailIdx[email] = fid; delete A.invites[email];
        logConsent({ type: 'consent-adult', family: fid, emailHash: sha(email), ver: CONSENT_VER, ip });
      }
      if (!f) {
        if (d.consent !== true) return send(res, 400, { error: 'consent' }, origin);
        fid = 'F' + rnd(10); const code = uniq(6, A.famCodes);
        f = A.families[fid] = { id: fid, email, code, salt: randomBytes(8).toString('hex'), created: now(), consent: { ver: CONSENT_VER, at: now(), ip }, priorities: [], plan: 'free', children: [], refBy: c.ref && A.refs[c.ref] ? c.ref : null };
        f.ref = newRef({ f: fid }); A.emailIdx[email] = fid; A.famCodes[code] = fid; adults(f);
        if (f.refBy) { A.refs[f.refBy].regs++; }
        logConsent({ type: 'consent', family: fid, emailHash: sha(email), ver: CONSENT_VER, ip });
      }
      delete A.codes[email]; touch(); const ptok = token('p', fid, null, 180); A.sessions[ptok].e = email;
      return send(res, 200, { token: ptok, family: famView(f, email) }, origin);
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
    if (/^(social|duel|chal)\//.test(r)) { // v30: успехи, вызовы и челленджи — только ребёнку из кабинета семьи
      const sc = auth(req, 'c'); if (!sc) return send(res, 401, { error: 'auth' }, origin);
      if (!limit('soc:' + sc.c, 300, 6e5)) return send(res, 429, { error: 'slow' }, origin);
      const d = req.method === 'POST' ? await J() : {};
      const out = await social.child(r, req, d, sc, o => send(res, 200, o, origin), (c, e) => send(res, c, { error: e }, origin));
      return out === null ? send(res, 404, { error: 'nf' }, origin) : out;
    }
    // ниже — только для взрослых семьи
    const s = auth(req, 'p'); if (!s) return send(res, 401, { error: 'auth' }, origin);
    const f = A.families[s.f]; if (!f) return send(res, 401, { error: 'auth' }, origin);
    const meEmail = s.e || f.email, meA = adults(f).find(a => a.email === meEmail);
    if (!meA) { delete A.sessions[s.k]; touch(); return send(res, 401, { error: 'auth' }, origin); } // взрослого убрали из семьи
    if (r === 'family' && req.method === 'GET') return send(res, 200, { family: famView(f, meEmail) }, origin);
    if (r === 'fam/invite' && req.method === 'POST') { // пригласить второго родителя, бабушку… — по почте
      const d = await J(), email = String(d.email || '').trim().toLowerCase(), name = String(d.name || '').replace(/[<>{}"]/g, '').trim().slice(0, 20);
      if (!okEmail(email)) return send(res, 400, { error: 'email' }, origin);
      if (A.emailIdx[email]) return send(res, 400, { error: A.emailIdx[email] === f.id ? 'already' : 'taken' }, origin);
      const pend = Object.values(A.invites).filter(v => v.f === f.id && v.exp > now()).length;
      if (adults(f).length + pend >= 6) return send(res, 400, { error: 'many' }, origin);
      if (!limit('inv:' + f.id, 10, 864e5)) return send(res, 429, { error: 'slow' }, origin);
      A.invites[email] = { f: f.id, by: meA.id, email: meEmail, name, exp: now() + 7 * 864e5 }; touch();
      try { await mail(email, 'Приглашение в семью «Мурлок и Ко»', `Здравствуйте${name ? ', ' + name : ''}!\n\n${meEmail} приглашает Вас в семейный кабинет «Мурлок и Ко» — обучающей игры для детей. Вы сможете видеть успехи детей, получать отчёты, одобрять друзей и создавать семейные челленджи.\n\nКак присоединиться:\n1. Откройте https://murlok.tech-wave.ru/ и нажмите «Я взрослый: регистрация».\n2. Укажите эту почту (${email}) — мы пришлём код входа.\n3. Подтвердите согласие на обработку персональных данных.\n\nПриглашение действует 7 дней. Если Вы не знаете отправителя — просто проигнорируйте это письмо.\n\nКоманда Tech Wave · murlok.tech-wave.ru`); }
      catch (e) { console.error('mail', e.message); delete A.invites[email]; touch(); return send(res, 502, { error: 'mail' }, origin); }
      return send(res, 200, { ok: true, family: famView(f, meEmail) }, origin);
    }
    if (r === 'fam/invite/cancel' && req.method === 'POST') { const d = await J(), email = String(d.email || '').trim().toLowerCase(); if (A.invites[email] && A.invites[email].f === f.id) { delete A.invites[email]; touch(); } return send(res, 200, { ok: true }, origin); }
    const ma = r.match(/^fam\/adult\/(P[A-Z0-9]{8})\/remove$/);
    if (ma && req.method === 'POST') { // владелец убирает приглашённого взрослого, взрослый может выйти сам
      const a = adults(f).find(x => x.id === ma[1]); if (!a) return send(res, 404, { error: 'nf' }, origin);
      if (a.role === 'owner') return send(res, 400, { error: 'owner' }, origin);
      if (meA.role !== 'owner' && a.id !== meA.id) return send(res, 403, { error: 'owner' }, origin);
      f.parents = adults(f).filter(x => x.id !== a.id); if (A.emailIdx[a.email] === f.id) delete A.emailIdx[a.email];
      for (const [k, x] of Object.entries(A.sessions)) if (x.f === f.id && x.e === a.email) delete A.sessions[k];
      logConsent({ type: a.id === meA.id ? 'adult-left' : 'adult-removed', family: f.id, emailHash: sha(a.email) }); touch();
      return send(res, 200, { ok: true }, origin);
    }
    if (r === 'fam/friends' && req.method === 'GET') { // друзья детей из других семей: что ждёт разрешения взрослого
      const FA = hooks.friendsAdmin, kids = (f.children || []).map(id => A.children[id]).filter(Boolean);
      return send(res, 200, { kids: kids.map(ch => ({ id: ch.id, name: ch.name, ...(FA ? FA.list(ch.cloudCode) : { friends: [], requests: [] }) })) }, origin);
    }
    if (r === 'fam/friends' && req.method === 'POST') {
      const d = await J(), ch = A.children[d.childId]; if (!ch || ch.familyId !== f.id || !hooks.friendsAdmin) return send(res, 404, { error: 'nf' }, origin);
      const done = hooks.friendsAdmin.approve(ch.cloudCode, String(d.pub || '').toUpperCase(), d.ok === true); return send(res, done ? 200 : 404, done ? { ok: true } : { error: 'nf' }, origin);
    }
    if (/^fam\/(social|chal)/.test(r)) { const d = req.method === 'POST' ? await J() : {}; const out = await social.parent(r, req, d, f, o => send(res, 200, o, origin), (c, e) => send(res, c, { error: e }, origin)); if (out !== null) return out; }
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
      f.children = f.children.filter(x => x !== ch.id); social.forgetChild(ch.id); try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } if (ch.ref) delete A.refs[ch.ref]; delete A.children[ch.id]; touch(); return send(res, 200, { ok: true }, origin);
    }
    if (r === 'export' && req.method === 'GET') {
      const out = { family: { ...famView(f), salt: undefined }, consents: fs.existsSync(CLOG) ? fs.readFileSync(CLOG, 'utf8').split('\n').filter(l => l.includes(f.id)).map(l => JSON.parse(l)) : [], progress: Object.fromEntries((f.children || []).map(id => A.children[id]).filter(Boolean).map(ch => [ch.name, readSave(ch.cloudCode)])) };
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="murlok-family-data.json"' }); return res.end(JSON.stringify(out, null, 1));
    }
    if ((r === 'delete' || r === 'revoke') && req.method === 'POST') { const d = await J(); if (meA.role !== 'owner') return send(res, 403, { error: 'owner' }, origin); if (d.confirm !== 'УДАЛИТЬ') return send(res, 400, { error: 'confirm' }, origin); wipeFamily(f, r === 'revoke' ? 'revoke' : 'delete'); return send(res, 200, { ok: true }, origin); }
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

  return { acc, refLink, flag, tgStart, A, touch, flush, famView, kidSummary, readSave, wipeFamily, logConsent, CLOG, SNAP, auth, token, rnd, sha, social, setHooks, siblings, adults };
}
