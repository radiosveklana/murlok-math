// murlok-api, v23: семьи и личные кабинеты (152-ФЗ), вход родителя по почте с кодом, вход ребёнка по семейному коду
// и картинке-ПИНу, рефералы, админка (одна роль), снимки прогресса, тревожные отметки, рассылки.
// Хранилище — accounts.json (запись через временный файл), журнал согласий — consents.log (JSONL, только дозапись).
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, randomInt, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import { makeSocial } from './social.mjs';

export const CONSENT_VER = '2026-10-09';

export function makeAccounts({ DIR, SAVE_DIR, limit, send, mail, tg, weekly, TG_BOT }) {
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
  setInterval(() => { const t = now(); for (const [k, s] of Object.entries(A.sessions)) if (s.exp < t) { delete A.sessions[k]; touch(); } for (const [e, c] of Object.entries(A.codes)) if (c.exp < t) { delete A.codes[e]; touch(); } for (const [k, q] of Object.entries(A.loginReqs || {})) if (t - q.at > 36e5) { delete A.loginReqs[k]; touch(); } }, 36e5);

  // v30: в семье несколько взрослых. Первый — владелец (f.email), остальные приглашены по почте и имеют права родителя
  const adults = f => { if (!Array.isArray(f.parents)) { f.parents = [{ id: 'P' + rnd(8), email: f.email, role: 'owner', joined: f.created, consent: f.consent }]; touch(); } return f.parents; };
  // v30: взрослый тоже играет — своя «игровая» запись (role 'adult-player') в f.players: свой котик и прогресс, видна в семье (таблица, вызовы, челленджи)
  const isPlayer = ch => !!ch && ch.role === 'adult-player';
  const kidsOf = f => (f.children || []).map(id => A.children[id]).filter(Boolean);
  const playersOf = f => (f.players || []).map(id => A.children[id]).filter(Boolean);
  const membersOf = f => [...kidsOf(f), ...playersOf(f)];
  const LIM_DAILY = [0, 15, 30, 45, 60, 90, 120], HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
  const cleanLimits = d => { const daily = LIM_DAILY.includes(+d.daily) ? +d.daily : 0, hours = !!(d.from && d.to && HHMM.test(d.from) && HHMM.test(d.to) && d.from !== d.to);
    return { daily, from: hours ? d.from : null, to: hours ? d.to : null, breaks: d.breaks === true, at: now() }; };
  const hasLimits = l => !!(l && (l.daily || l.from || l.breaks));
  let hooks = { friendCodes: () => [], friendsAdmin: null }; // друзья живут в extra.mjs — сервер связывает модули через setHooks
  const setHooks = h => { hooks = { ...hooks, ...h }; };
  const social = makeSocial({ A, touch, readSave, rnd, SNAP, friendCodes: code => hooks.friendCodes(code), membersOf });
  // v35: чья облачная копия — по коду; если код уже закреплён за ребёнком семьи, доступ к ней только с токеном
  const ownerOf = code => { if (!code) return null; for (const c of Object.values(A.children)) if (c.cloudCode === code) return c; return null; };
  const bearer = req => { const h = String(req.headers.authorization || ''); return h.startsWith('Bearer ') ? h.slice(7) : ''; };
  function codeAccess(req, code, o = {}) {
    const k = bearer(req), s = k ? A.sessions[k] : null, live = !!(s && s.exp > now());
    if (k && !live) return { ok: false, code: 401, error: 'auth' }; // токен устарел или семья удалена — устройство отвяжется
    const ch = ownerOf(code);
    if (!ch) return o.owned ? { ok: false, code: 401, error: 'link' } : { ok: true, owner: null }; // устройство ещё не в семье — как раньше
    if (live && s.t === 'c' && s.c === ch.id) return { ok: true, owner: ch, s };
    if (live && o.parent && s.t === 'p' && s.f === ch.familyId) return { ok: true, owner: ch, s, parent: true };
    return { ok: false, code: live ? 403 : 401, error: live ? 'owner' : 'auth' };
  }
  const famKey = code => { const ch = ownerOf(code); return ch ? ch.familyId : ''; };
  const siblings = code => { const ch = Object.values(A.children).find(c => c.cloudCode === code), f = ch && A.families[ch.familyId]; return f ? [...(f.children || []), ...(f.players || [])].map(id => A.children[id]).filter(c => c && c.id !== ch.id).map(c => c.cloudCode) : []; };

  /* ---------- рефералы ---------- */
  const newRef = owner => { const c = uniq(6, A.refs); A.refs[c] = { owner, visits: 0, regs: 0 }; return c; };
  const refCount = c => { const r = A.refs[c]; return r ? { code: c, visits: r.visits, regs: r.regs } : null; };

  /* ---------- сводка ребёнка из облачной копии ---------- */
  function kidSummary(ch) {
    const s = readSave(ch.cloudCode) || {}, wk = Array.from({ length: 7 }, (_, k) => { const d = new Date(); d.setDate(d.getDate() - k); return d.toISOString().slice(0, 10); });
    const mins = Math.round(wk.reduce((t, d) => t + Object.values((s.time || {})[d] || {}).reduce((a, b) => a + b, 0), 0) / 60);
    // минуты за последние два дня (ключи — по часам устройства ребёнка): кабинет показывает «сегодня» по своему календарю
    const tdays = Object.keys(s.time || {}).sort().slice(-2), timeDays = Object.fromEntries(tdays.map(d => [d, Math.round(Object.values(s.time[d] || {}).reduce((a, b) => a + b, 0) / 60)]));
    return { id: ch.id, name: ch.name, cat: s.name || ch.cat || '', fur: s.fur || 'ginger', wear: s.wear || {}, xp: s.xp || 0, cases: s.cases || 0, candies: s.candies || 0, gems: s.gems || 0, minutesWeek: mins, lastSeen: s.savedAt || 0, survey: ch.survey || null, ref: refCount(ch.ref), hasPin: !!ch.pinHash, legacyNoPin: !ch.pinHash && !!ch.legacyNoPin, cloudCode: ch.cloudCode, limits: ch.limits || null, timeDays, ...(isPlayer(ch) ? { role: 'adult-player', adultOf: ch.adultOf } : {}) };
  }
  const REQ_TTL = 15 * 6e4; // запрос на вход ребёнка без ПИН ждёт подтверждения взрослого 15 минут
  const GODS = new Set(String(process.env.GOD_EMAILS || '').toLowerCase().split(/[\s,;]+/).filter(Boolean)); // «режим бога» для тестирования владельцем
  const isGod = (f, me) => !!f.god || GODS.has(String(me || f.email || '').toLowerCase());
  const famView = (f, me) => ({ id: f.id, email: f.email, code: f.code, god: isGod(f, me) || undefined, me: me ? { email: me, role: (adults(f).find(a => a.email === me) || {}).role || 'adult' } : null,
    title: famTitle(f), adults: adults(f).map(a => ({ id: a.id, email: a.email, name: a.name || '', kin: a.kin || '', role: a.role, joined: a.joined })), invites: Object.entries(A.invites).filter(([, v]) => v.f === f.id && v.exp > now()).map(([e, v]) => ({ email: e, name: v.name || '', kin: v.kin || '', exp: v.exp })),
    loginReqs: Object.entries(A.loginReqs || {}).filter(([, q]) => q.f === f.id && q.ok == null && now() - q.at < REQ_TTL && A.children[q.c]).map(([id, q]) => ({ id, childId: q.c, name: A.children[q.c].name, at: q.at })), logins: (f.logins || []).slice(0, 10), priorities: f.priorities || [], plan: f.plan || 'free', created: f.created, consent: f.consent, ref: refCount(f.ref), children: kidsOf(f).map(kidSummary),
    players: playersOf(f).map(ch => { const k = kidSummary(ch), mineA = me && adults(f).find(a => a.email === me), mine = !!(mineA && ch.adultOf === mineA.id); return { id: k.id, name: k.name, cat: k.cat, fur: k.fur, wear: k.wear, xp: k.xp, minutesWeek: k.minutesWeek, lastSeen: k.lastSeen, mine, ...(mine ? { cloudCode: ch.cloudCode } : {}) }; }) });

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

  function dropMember(ch) { try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } fs.readdirSync(SNAP).forEach(d => { try { fs.rmSync(path.join(SNAP, d, ch.cloudCode + '.json'), { force: true }); } catch { } }); delete A.pending[ch.cloudCode]; if (ch.ref) delete A.refs[ch.ref]; social.forgetChild(ch.id); delete A.children[ch.id]; touch(); }
  function wipeFamily(f, why) {
    playersOf(f).forEach(dropMember); f.players = [];
    (f.children || []).forEach(id => { const ch = A.children[id]; if (ch) { try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } fs.readdirSync(SNAP).forEach(d => { try { fs.rmSync(path.join(SNAP, d, ch.cloudCode + '.json'), { force: true }); } catch { } }); delete A.pending[ch.cloudCode]; if (ch.ref) delete A.refs[ch.ref]; delete A.children[id]; } });
    if (f.ref) delete A.refs[f.ref]; delete A.emailIdx[f.email]; delete A.famCodes[f.code];
    adults(f).forEach(a => { if (A.emailIdx[a.email] === f.id) delete A.emailIdx[a.email]; }); for (const [e, v] of Object.entries(A.invites)) if (v.f === f.id) delete A.invites[e];
    (f.children || []).forEach(id => social.forgetChild(id)); social.forgetFamily(f.id);
    for (const [k, s] of Object.entries(A.sessions)) if (s.f === f.id) delete A.sessions[k];
    logConsent({ type: why, family: f.id, emailHash: sha(f.email) }); delete A.families[f.id]; touch();
  }
  const pinHash = (f, pin) => sha(f.salt + ':' + (Array.isArray(pin) ? pin.join('-') : ''));
  const validPin = pin => Array.isArray(pin) && pin.length === 3 && pin.every(x => Number.isInteger(x) && x >= 0 && x < 12);
  // роль взрослого в семье («Второй родитель», «Бабушка»…) — не имя: раньше она записывалась в name
  const KIN = ['Второй родитель', 'Бабушка', 'Дедушка', 'Другой взрослый', 'Мама', 'Папа'];
  /* ---------- v35: разовая миграция ----------
     дети, у которых сейчас нет картинки-ПИН, продолжают входить по семейному коду как раньше (legacyNoPin);
     новые дети без ПИН входят на новом устройстве только с подтверждения взрослого в кабинете */
  A.migr = A.migr || {};
  if (!A.migr.v35) {
    for (const ch of Object.values(A.children)) if (!ch.pinHash && !isPlayer(ch)) ch.legacyNoPin = true;
    for (const f of Object.values(A.families)) (f.parents || []).forEach(a => { if (KIN.includes(a.name)) { a.kin = a.name; a.name = ''; } });
    for (const v of Object.values(A.invites)) if (KIN.includes(v.name)) { v.kin = v.name; v.name = ''; }
    A.migr.v35 = now(); touch();
  }
  const first = s => String(s || '').trim().split(/\s+/)[0].replace(/[^\p{L}-]/gu, '').slice(0, 14);
  const logIn = (f, email, how) => { f.logins = [{ at: now(), email, how }, ...(f.logins || [])].slice(0, 20); touch(); };
  const famTitle = f => (f && f.title) || '';

  /* ---------- облачная копия прогресса: /save и /load ----------
     Сервер хранит только игровые поля (белый список): служебные (роль, «режим бога», ПИН, переписка) отбрасываются.
     Числа, из которых строятся таблица успехов и челленджи, ограничены разумным приростом за день. */
  const SAVE_KEYS = new Set(('v kid name fur candies totalCandies xp owned wear cases casesPerfect caseLog st err facts badges days sound vibro voice music gems gemsTotal perf login goals furn roomsSeen recent crimeBag seenVersion lessons prefs cloudCode cloudAt '
    + 'read starsSeen rp place ideas agames chalBadges acad furs time theory solved sk limitBrk agSeen trip practices looks drillBest unlockAll tours tourVet tourDone limits catAt units profile limitRun hours care boost shareOn mtop mcured houseRefund gameBest factory diplomas coach chatOn use prio photos mlog mascot fxStash device cheats bx badgeAt tourMute tourInit rankV pubRooms nudgeI limitX limitStat legendSeen houseV houseSong friendsOn crimesV2 admired daily').split(' '));
  const NUMS = { xp: 5e7, candies: 1e7, totalCandies: 5e7, gems: 1e6, gemsTotal: 1e6, cases: 1e6, casesPerfect: 1e6 };
  const DAY_MAX = { x: 6000, t: 1500, a: 600 }, DAY_TASKS = 1500, XP_PER_DAY = 8000;
  const num = (v, max) => { const x = +v; return Number.isFinite(x) ? Math.max(0, Math.min(max, x)) : 0; };
  function cleanSave(data, old) {
    const out = {}; for (const [k, v] of Object.entries(data || {})) if (SAVE_KEYS.has(k)) out[k] = v;
    for (const [k, max] of Object.entries(NUMS)) if (k in out) out[k] = num(out[k], max);
    if (out.days && typeof out.days === 'object') { const D = {}; Object.entries(out.days).slice(-400).forEach(([d, n]) => { if (/^\d{4}-\d{2}-\d{2}$/.test(d)) D[d] = Math.round(num(n, DAY_TASKS)); }); out.days = D; } else delete out.days;
    if (out.daily && typeof out.daily === 'object') { const D = {}; Object.entries(out.daily).slice(-60).forEach(([d, x]) => { if (/^\d{4}-\d{2}-\d{2}$/.test(d) && x && typeof x === 'object') D[d] = { x: Math.round(num(x.x, DAY_MAX.x)), t: Math.round(num(x.t, DAY_MAX.t)), a: Math.round(num(x.a, DAY_MAX.a)) }; }); out.daily = D; } else delete out.daily;
    // общий опыт растёт не быстрее XP_PER_DAY за каждый день с прошлого сохранения
    if (old && Number.isFinite(+old.xp)) { const days = Math.max(1, Math.ceil((now() - (+old.savedAt || 0)) / 864e5)), cap = (+old.xp || 0) + XP_PER_DAY * Math.min(days, 365); if ((out.xp || 0) > cap) out.xp = cap; }
    return out;
  }
  async function cloud(req, res, url, origin, ip) {
    if (url.pathname === '/save') {
      const d = await body(req, 400000).catch(() => null); if (!d) return send(res, 413, { error: 'big' }, origin);
      const code = String(d.code || '').toUpperCase();
      if (!/^[A-Z0-9]{8}$/.test(code) || !d.data || d.data.v !== 1) return send(res, 400, { error: 'bad' }, origin);
      const g = codeAccess(req, code); if (!g.ok) return send(res, g.code, { error: g.error }, origin);
      if (!limit('save:' + code, 30, 6e5)) return send(res, 429, { error: 'slow' }, origin);
      const old = readSave(code), data = cleanSave(d.data, old);
      // устройство отстало (на другом устройстве с тем же кодом ушли дальше, а это его не видело) — не затираем: клиент спросит, какой прогресс оставить
      if (old && d.force !== true && (+data.xp || 0) < (+old.xp || 0) && (+data.cloudAt || 0) < (+old.savedAt || 0) - 5000) return send(res, 409, { error: 'stale', xp: old.xp || 0, candies: old.candies || 0, cases: old.cases || 0, savedAt: old.savedAt || 0 }, origin);
      const kidName = g.owner && !isPlayer(g.owner) ? g.owner.name : ''; if (kidName) data.kid = kidName; // имя ребёнка задаёт взрослый в кабинете
      const savedAt = now(); fs.writeFileSync(path.join(SAVE_DIR, code + '.json'), JSON.stringify({ ...data, savedAt }));
      return send(res, 200, { ok: true, savedAt, ...(kidName ? { kid: kidName } : {}) }, origin);
    }
    const code = String(url.searchParams.get('code') || '').toUpperCase(); // /load
    if (!/^[A-Z0-9]{8}$/.test(code) || !limit('load:' + ip, 60, 6e5)) return send(res, 400, { error: 'bad' }, origin);
    const g = codeAccess(req, code, { parent: true }); if (!g.ok) return send(res, g.code, { error: g.error }, origin);
    const sv = readSave(code); if (!sv) return send(res, 404, { error: 'nf' }, origin);
    delete sv.pin; delete sv.pinLock; delete sv.chatLog; delete sv.god; delete sv.role; // старые копии могли содержать ПИН и служебные поля — наружу не отдаём
    if (g.owner) { if (isPlayer(g.owner)) sv.role = 'adult'; else sv.kid = g.owner.name; }
    return send(res, 200, sv, origin);
  }

  /* ---------- API кабинетов ---------- */
  async function acc(req, res, url, origin, ip) {
    const r = url.pathname.slice(5); // после /acc/
    const J = async () => body(req);
    if (r === 'start' && req.method === 'POST') {
      const d = await J(), email = String(d.email || '').trim().toLowerCase();
      if (!okEmail(email)) return send(res, 400, { error: 'email' }, origin);
      // письма с кодом (было: 5 в час на адрес и 20 в час с IP): на адрес — 5 в час и 10 в сутки; с одного IP — 12 в час и 40 в сутки; всего — 300 в час
      if (!limit('accm:' + email, 5, 36e5) || !limit('accmd:' + email, 10, 864e5) || !limit('accip:' + ip, 12, 36e5) || !limit('accipd:' + ip, 40, 864e5) || !limit('accall', 300, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      const code = String(randomInt(100000, 1000000)); A.codes[email] = { h: sha(email + ':' + code), exp: now() + 15 * 6e4, tries: 0, ref: String(d.ref || '').toUpperCase().slice(0, 8) || null }; touch();
      try { await mail(email, 'Код входа в «Мурлок и Ко»: ' + code, `Здравствуйте!\n\nВаш код для входа в личный кабинет «Мурлок и Ко»: ${code}\n\nКод действует 15 минут. Если вы не запрашивали код — просто проигнорируйте это письмо.\n\nКоманда Tech Wave · murlok.tech-wave.ru`); }
      catch (e) { console.error('mail', e.message); return send(res, 502, { error: 'mail' }, origin); }
      const inv = !A.emailIdx[email] && A.invites[email] && A.invites[email].exp > now() && A.families[A.invites[email].f] ? A.invites[email] : null;
      return send(res, 200, { ok: true, isNew: !A.emailIdx[email], invite: inv ? { by: String(inv.email).replace(/^(.{2})[^@]*/, '$1***') } : null }, origin); // почту пригласившего — не целиком
    }
    if (r === 'verify' && req.method === 'POST') {
      const d = await J(), email = String(d.email || '').trim().toLowerCase(), h = sha(email + ':' + String(d.code || '').trim());
      // код от поддержки (админка) хранится отдельно — его не затирает повторный «Получить код»
      const ac = (A.acodes || {})[email], adminOk = ac && ac.exp > now() && ac.tries < 5 && ac.h === h;
      const c = adminOk ? ac : A.codes[email];
      if (!c || c.exp < now()) { if (ac && ac.exp > now()) { ac.tries++; touch(); return send(res, 400, { error: 'code', left: 5 - ac.tries }, origin); } return send(res, 400, { error: 'expired' }, origin); }
      if (c.tries >= 5) return send(res, 429, { error: 'tries' }, origin);
      if (c.h !== h) { c.tries++; if (ac && ac !== c) ac.tries++; touch(); return send(res, 400, { error: 'code', left: 5 - c.tries }, origin); }
      if (adminOk) delete A.acodes[email];
      let fid = A.emailIdx[email], f = fid && A.families[fid];
      const inv = !f && A.invites[email] && A.invites[email].exp > now() && A.families[A.invites[email].f];
      if (inv) { // приглашённый взрослый присоединяется к семье с правами родителя — со своим согласием
        if (d.consent !== true) return send(res, 400, { error: 'consent' }, origin);
        f = inv; fid = f.id; adults(f).push({ id: 'P' + rnd(8), email, name: A.invites[email].name || '', kin: A.invites[email].kin || '', role: 'adult', joined: now(), by: A.invites[email].by || null, consent: { ver: CONSENT_VER, at: now(), ip } });
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
      logIn(f, email, adminOk ? 'support' : 'mail');
      if (adminOk) { // вход по коду поддержки: взрослый сразу получает письмо, а в кабинете это видно в «Истории входов»
        logConsent({ type: 'support-login', family: fid, emailHash: sha(email) });
        Promise.resolve().then(() => mail(email, 'Вход в кабинет «Мурлок и Ко» по коду поддержки', `Здравствуйте!\n\nВ ваш личный кабинет «Мурлок и Ко» только что выполнен вход по одноразовому коду, который выдала служба поддержки (например, когда письмо с кодом не доходило).\n\nЕсли вы сами просили поддержку о таком коде — всё в порядке. Если нет — ответьте на это письмо, и мы разберёмся.\n\nИстория входов видна в кабинете, в блоке «Данные и согласие».\n\nКоманда Tech Wave · murlok.tech-wave.ru`)).catch(e => console.error('mail', e.message));
      }
      delete A.codes[email]; touch(); const ptok = token('p', fid, null, 180); A.sessions[ptok].e = email;
      return send(res, 200, { token: ptok, family: famView(f, email) }, origin);
    }
    if (r === 'child/list' && req.method === 'POST') { // ребёнок на новом устройстве: семейный код → кто ты?
      const d = await J(), fid = A.famCodes[String(d.familyCode || '').toUpperCase()];
      if (!limit('accfc:' + ip, 20, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      const f = fid && A.families[fid]; if (!f) return send(res, 404, { error: 'nf' }, origin);
      return send(res, 200, { kids: (f.children || []).map(id => A.children[id]).filter(Boolean).map(ch => { const s = readSave(ch.cloudCode) || {}; return { id: ch.id, name: ch.name, fur: s.fur || 'ginger', wear: s.wear || {}, hasPin: !!ch.pinHash, needOk: !ch.pinHash && !ch.legacyNoPin }; }) }, origin);
    }
    if (r === 'child/login' && req.method === 'POST') {
      const d = await J(), fid = A.famCodes[String(d.familyCode || '').toUpperCase()], f = fid && A.families[fid], ch = f && A.children[d.childId];
      if (!ch || ch.familyId !== fid || isPlayer(ch)) return send(res, 404, { error: 'nf' }, origin); // игрок-взрослый входит только из кабинета
      if (!limit('accpin:' + ch.id, 10, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      if (ch.pinHash && ch.pinHash !== pinHash(f, d.pin)) return send(res, 400, { error: 'pin' }, origin);
      if (!ch.pinHash && !ch.legacyNoPin) { // без картинки-ПИН одного семейного кода мало: вход подтверждает взрослый в кабинете
        if (!limit('accreq:' + ch.id, 6, 36e5)) return send(res, 429, { error: 'slow' }, origin);
        A.loginReqs = A.loginReqs || {}; for (const [k, q] of Object.entries(A.loginReqs)) if (q.c === ch.id && q.ok == null) delete A.loginReqs[k];
        const rid = randomBytes(12).toString('hex'); A.loginReqs[rid] = { f: fid, c: ch.id, at: now(), ok: null }; touch();
        (f.tg || []).forEach(c => Promise.resolve(tg('sendMessage', { chat_id: c, text: `🔐 «Мурлок и Ко»: ${first(ch.name)} входит в игру на новом устройстве по семейному коду. Если это ваш ребёнок — подтвердите вход в личном кабинете в течение 15 минут. Если нет — ничего не делайте.` })).catch(() => { }));
        return send(res, 202, { pending: rid, name: ch.name }, origin);
      }
      ch.lastLogin = now(); touch();
      return send(res, 200, { token: token('c', fid, ch.id, 365), cloudCode: ch.cloudCode, name: ch.name, needSurvey: !ch.survey }, origin);
    }
    if (r === 'child/login/wait' && req.method === 'POST') { // ребёнок ждёт, пока взрослый подтвердит вход
      const d = await J(), rid = String(d.rid || ''), q = (A.loginReqs || {})[rid];
      if (!limit('accwait:' + ip, 600, 36e5)) return send(res, 429, { error: 'slow' }, origin);
      if (!q || now() - q.at > REQ_TTL) { if (q) { delete A.loginReqs[rid]; touch(); } return send(res, 404, { error: 'expired' }, origin); }
      if (q.ok === false) { delete A.loginReqs[rid]; touch(); return send(res, 403, { error: 'denied' }, origin); }
      if (q.ok !== true) return send(res, 200, { pending: true }, origin);
      const ch = A.children[q.c], f = A.families[q.f]; delete A.loginReqs[rid]; touch(); if (!ch || !f) return send(res, 404, { error: 'nf' }, origin);
      ch.lastLogin = now();
      return send(res, 200, { token: token('c', f.id, ch.id, 365), cloudCode: ch.cloudCode, name: ch.name, needSurvey: !ch.survey }, origin);
    }
    if (r === 'survey' && req.method === 'POST') {
      const s = auth(req, 'c'); if (!s) return send(res, 401, { error: 'auth' }, origin);
      const d = await J(), ch = A.children[s.c]; if (!ch) return send(res, 404, { error: 'nf' }, origin);
      ch.survey = Object.fromEntries(Object.entries(d.answers || {}).slice(0, 20).map(([k, v]) => [String(k).slice(0, 30), Array.isArray(v) ? v.slice(0, 8).map(x => String(x).slice(0, 40)) : String(v).slice(0, 80)])); ch.surveyAt = now(); touch();
      return send(res, 200, { ok: true }, origin);
    }
    if (r === 'child/me' && req.method === 'GET') { // ребёнку — приоритеты семьи для подстройки программы
      const s2 = auth(req, 'c'); if (!s2) return send(res, 401, { error: 'auth' }, origin); const f2 = A.families[s2.f], ch = A.children[s2.c]; if (!f2 || !ch) return send(res, 401, { error: 'auth' }, origin);
      return send(res, 200, { name: ch.name, priorities: f2.priorities || [], survey: ch.survey || null, cloudCode: ch.cloudCode, limits: isPlayer(ch) ? null : (ch.limits || null), role: isPlayer(ch) ? 'adult-player' : 'child' }, origin);
    }
    if (r === 'child/adopt' && req.method === 'POST') { // ребёнок вошёл по семейному коду и картинке-ПИНу; в облаке у записи пусто — берём игру с этого планшета
      const s2 = auth(req, 'c'); if (!s2) return send(res, 401, { error: 'auth' }, origin); const ch = A.children[s2.c]; if (!ch) return send(res, 401, { error: 'auth' }, origin);
      const d = await J(), code = String(d.cloudCode || '').toUpperCase(); if (!/^[A-Z0-9]{8}$/.test(code)) return send(res, 400, { error: 'code' }, origin);
      if (code !== ch.cloudCode) { const old = readSave(ch.cloudCode); if (old && (old.xp || 0) > 0) return send(res, 400, { error: 'busy' }, origin);
        if (Object.values(A.children).some(c => c.cloudCode === code && c.id !== ch.id)) return send(res, 400, { error: 'taken' }, origin);
        try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } ch.cloudCode = code; touch(); }
      return send(res, 200, { cloudCode: ch.cloudCode }, origin);
    }
    if (r === 'pending' && req.method === 'POST') { // начисления/восстановление от админа — ребёнок забирает при входе
      const d = await J(), code = String(d.code || '').toUpperCase(), g = codeAccess(req, code); if (!g.ok) return send(res, g.code, { error: g.error }, origin);
      const p = A.pending[code]; if (!p) return send(res, 200, { items: [] }, origin);
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
    // семейный отчёт в Telegram: один бот, отчёт сразу по всем детям семьи
    if (r === 'tg/link' && req.method === 'POST') { A.tgTok = A.tgTok || {}; const tok = rnd(16); A.tgTok[tok] = { f: f.id, t: now() }; touch(); return send(res, 200, { url: `https://t.me/${TG_BOT || 'izzy_backup_bot'}?start=${tok}` }, origin); }
    if (r === 'tg/status' && req.method === 'POST') return send(res, 200, { linked: (f.tg || []).length }, origin);
    if (r === 'tg/test' && req.method === 'POST') { const n = await famReport(f, true); return send(res, 200, { ok: n > 0, sent: n }, origin); }
    if (r === 'tg/unlink' && req.method === 'POST') { f.tg = []; touch(); return send(res, 200, { ok: true }, origin); }
    if (r === 'fam/invite' && req.method === 'POST') { // пригласить второго родителя, бабушку… — по почте
      const d = await J(), email = String(d.email || '').trim().toLowerCase(); let name = String(d.name || '').replace(/[<>{}"]/g, '').trim().slice(0, 20), kin = String(d.kin || '').trim();
      if (KIN.includes(name)) { kin = kin || name; name = ''; } if (!KIN.includes(kin)) kin = '';
      if (!okEmail(email)) return send(res, 400, { error: 'email' }, origin);
      if (A.emailIdx[email]) return send(res, 400, { error: A.emailIdx[email] === f.id ? 'already' : 'taken' }, origin);
      const pend = Object.values(A.invites).filter(v => v.f === f.id && v.exp > now()).length;
      if (adults(f).length + pend >= 6) return send(res, 400, { error: 'many' }, origin);
      if (!limit('inv:' + f.id, 10, 864e5)) return send(res, 429, { error: 'slow' }, origin);
      A.invites[email] = { f: f.id, by: meA.id, email: meEmail, name, kin, exp: now() + 7 * 864e5 }; touch();
      const join = `https://murlok.tech-wave.ru/app/#join=${encodeURIComponent(email)}`; // открывает вход взрослого сразу с этой почтой
      try { await mail(email, 'Приглашение в семью «Мурлок и Ко»', `Здравствуйте${name ? ', ' + name : ''}!\n\n${meEmail} приглашает Вас в семейный кабинет «Мурлок и Ко» — обучающей игры для детей. Вы сможете видеть успехи детей, получать отчёты, одобрять друзей и создавать семейные челленджи.\n\nПринять приглашение: ${join}\n\nПо ссылке откроется вход для взрослых с Вашей почтой (${email}). Нажмите «Получить код на почту», введите код из следующего письма и подтвердите согласие на обработку персональных данных.\n\nПриглашение действует 7 дней. Если Вы не знаете отправителя — просто проигнорируйте это письмо.\n\nКоманда Tech Wave · murlok.tech-wave.ru`); }
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
      playersOf(f).filter(ch => ch.adultOf === a.id).forEach(ch => { f.players = f.players.filter(x => x !== ch.id); dropMember(ch); }); // его котик уходит вместе с ним
      for (const [k, x] of Object.entries(A.sessions)) if (x.f === f.id && x.e === a.email) delete A.sessions[k];
      logConsent({ type: a.id === meA.id ? 'adult-left' : 'adult-removed', family: f.id, emailHash: sha(a.email) }); touch();
      return send(res, 200, { ok: true }, origin);
    }
    if (r === 'fam/title' && req.method === 'POST') { // название семьи — его увидят взрослые другой семьи в запросе дружбы
      const d = await J(); f.title = String(d.title || '').replace(/[<>{}"@]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30); touch(); return send(res, 200, { ok: true, title: f.title }, origin);
    }
    if (r === 'fam/loginreq' && req.method === 'POST') { // взрослый подтверждает или отклоняет вход ребёнка без ПИН на новом устройстве
      const d = await J(), q = (A.loginReqs || {})[String(d.id || '')]; if (!q || q.f !== f.id || now() - q.at > REQ_TTL) return send(res, 404, { error: 'nf' }, origin);
      q.ok = d.ok === true; q.by = meA.id; touch(); return send(res, 200, { ok: true }, origin);
    }
    if (r === 'fam/friends' && req.method === 'GET') { // друзья детей из других семей: что ждёт разрешения взрослого
      const FA = hooks.friendsAdmin, kids = (f.children || []).map(id => A.children[id]).filter(Boolean);
      // к каждому другу и запросу — название другой семьи (если её взрослые его задали): так понятно, какой это «Даня»
      const withFam = L => (L || []).map(({ code, ...x }) => { const o = ownerOf(code); return { ...x, family: o ? famTitle(A.families[o.familyId]) : '' }; });
      return send(res, 200, { kids: kids.map(ch => { const L = FA ? FA.list(ch.cloudCode) : {}; return { id: ch.id, name: ch.name, friends: withFam(L.friends), requests: withFam(L.requests), waiting: withFam(L.waiting) }; }) }, origin);
    }
    if (r === 'fam/friends' && req.method === 'POST') {
      const d = await J(), ch = A.children[d.childId]; if (!ch || ch.familyId !== f.id || !hooks.friendsAdmin) return send(res, 404, { error: 'nf' }, origin);
      const done = hooks.friendsAdmin.approve(ch.cloudCode, String(d.pub || '').toUpperCase(), d.ok === true); return send(res, done ? 200 : 404, done ? { ok: true } : { error: 'nf' }, origin);
    }
    if (/^fam\/(social|chal)/.test(r)) { const d = req.method === 'POST' ? await J() : {}; const out = await social.parent(r, req, d, f, o => send(res, 200, o, origin), (c, e) => send(res, c, { error: e }, origin)); if (out !== null) return out; }
    if (r === 'play' && req.method === 'POST') { // «Играть самому»: своя игровая запись взрослого в семье — одна на взрослого
      const d = await J(); f.players = f.players || [];
      let ch = playersOf(f).find(x => x.adultOf === meA.id);
      if (!ch) {
        const name = String(d.name || '').replace(/[<>{}"]/g, '').trim().slice(0, 20); if (name.length < 2) return send(res, 400, { error: 'name' }, origin);
        let code; do { code = rnd(8); } while (Object.values(A.children).some(c => c.cloudCode === code) || fs.existsSync(path.join(SAVE_DIR, code + '.json')));
        const id = 'C' + rnd(10); ch = A.children[id] = { id, familyId: f.id, name, cat: String(d.cat || '').replace(/[<>{}"]/g, '').slice(0, 20), cloudCode: code, pinHash: null, created: now(), survey: null, role: 'adult-player', adultOf: meA.id };
        f.players.push(id);
      }
      ch.lastLogin = now(); touch();
      return send(res, 200, { token: token('c', f.id, ch.id, 365), childId: ch.id, cloudCode: ch.cloudCode, name: ch.name, cat: ch.cat || '', familyCode: f.code, hasSave: !!readSave(ch.cloudCode) }, origin);
    }
    if (r === 'play/remove' && req.method === 'POST') { const ch = playersOf(f).find(x => x.adultOf === meA.id); if (ch) { f.players = f.players.filter(x => x !== ch.id); dropMember(ch); } return send(res, 200, { ok: true }, origin); }
    const ml = r.match(/^child\/(C[A-Z0-9]{10})\/limits$/);
    if (ml && req.method === 'POST') { // ограничения времени игры: норма на день, разрешённые часы, перерыв каждые 25 минут
      const ch = A.children[ml[1]]; if (!ch || ch.familyId !== f.id || isPlayer(ch)) return send(res, 404, { error: 'nf' }, origin);
      const d = await J(); ch.limits = { ...cleanLimits(d), by: meA.id }; touch(); return send(res, 200, { ok: true, limits: ch.limits }, origin);
    }
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
    const m = r.match(/^child\/(C[A-Z0-9]{10})\/(pin|remove|rename|attach)$/);
    if (m && req.method === 'POST') {
      const ch = A.children[m[1]]; if (!ch || ch.familyId !== f.id) return send(res, 404, { error: 'nf' }, origin);
      if (m[2] === 'attach') { // игра с планшета присоединяется к уже заведённому, но пустому ребёнку (родитель завёл его в кабинете раньше)
        const d = await J(), code = String(d.cloudCode || '').toUpperCase(); if (!/^[A-Z0-9]{8}$/.test(code)) return send(res, 400, { error: 'code' }, origin);
        if (ch.cloudCode === code) return send(res, 200, { child: kidSummary(ch), token: token('c', f.id, ch.id, 365) }, origin); // уже эта игра — просто вход на устройстве
        if (Object.values(A.children).some(c => c.cloudCode === code && c.id !== ch.id)) return send(res, 400, { error: 'taken' }, origin);
        const old = readSave(ch.cloudCode); if (old && (old.xp || 0) > 0) return send(res, 400, { error: 'busy' }, origin);
        try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } ch.cloudCode = code; if (d.cat) ch.cat = String(d.cat).slice(0, 20); touch();
        return send(res, 200, { child: kidSummary(ch), token: token('c', f.id, ch.id, 365) }, origin); }
      if (m[2] === 'rename') { const d = await J(), name = String(d.name || '').replace(/[<>{}"]/g, '').trim().slice(0, 20); if (name.length < 2) return send(res, 400, { error: 'name' }, origin); ch.name = name; touch();
        const sv = readSave(ch.cloudCode); if (sv) { sv.kid = name; try { fs.writeFileSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), JSON.stringify(sv)); } catch { } } // новое имя сразу видно друзьям, устройство ребёнка подхватит его при входе
        return send(res, 200, { ok: true }, origin); }
      if (m[2] === 'pin') { const d = await J(); if (!validPin(d.pin)) return send(res, 400, { error: 'pin' }, origin); ch.pinHash = pinHash(f, d.pin); touch(); return send(res, 200, { ok: true }, origin); }
      f.children = f.children.filter(x => x !== ch.id); social.forgetChild(ch.id); try { fs.rmSync(path.join(SAVE_DIR, ch.cloudCode + '.json'), { force: true }); } catch { } if (ch.ref) delete A.refs[ch.ref]; delete A.children[ch.id]; touch(); return send(res, 200, { ok: true }, origin);
    }
    if (r === 'export' && req.method === 'GET') {
      const out = { family: { ...famView(f), salt: undefined }, consents: fs.existsSync(CLOG) ? fs.readFileSync(CLOG, 'utf8').split('\n').filter(l => l.includes(f.id)).map(l => JSON.parse(l)) : [], progress: Object.fromEntries(membersOf(f).map(ch => [ch.name + (isPlayer(ch) ? ' (взрослый)' : ''), readSave(ch.cloudCode)])) };
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'content-disposition': 'attachment; filename="murlok-family-data.json"' }); return res.end(JSON.stringify(out, null, 1));
    }
    if ((r === 'delete' || r === 'revoke') && req.method === 'POST') { const d = await J(); if (meA.role !== 'owner') return send(res, 403, { error: 'owner' }, origin); if (d.confirm !== 'УДАЛИТЬ') return send(res, 400, { error: 'confirm' }, origin); wipeFamily(f, r === 'revoke' ? 'revoke' : 'delete'); return send(res, 200, { ok: true }, origin); }
    if (r === 'logout' && req.method === 'POST') { delete A.sessions[s.k]; touch(); return send(res, 200, { ok: true }, origin); }
    return send(res, 404, { error: 'nf' }, origin);
  }

  /* ---------- запрос в дружбу: коды совпали, ждём разрешения взрослых — сообщаем семье в Telegram и письмом ---------- */
  function friendAsk(code, other) {
    const ch = ownerOf(code), f = ch && A.families[ch.familyId], o = ownerOf(other); if (!f || !o || isPlayer(ch)) return;
    if (!limit('frn:' + code + ':' + other, 1, 864e5)) return;
    const os = readSave(other) || {}, from = famTitle(A.families[o.familyId]);
    const txt = `${first(ch.name)} и ${first(o.name)} (котик ${String(os.name || 'Котик').slice(0, 20)}${from ? ', семья «' + from + '»' : ''}) обменялись кодами друзей и хотят дружить в игре. Разрешить или отклонить дружбу можно в личном кабинете, в блоке «Друзья детей». Пока взрослые обеих семей не разрешат, дружбы нет.`;
    (f.tg || []).forEach(c => Promise.resolve(tg('sendMessage', { chat_id: c, text: '🐾 «Мурлок и Ко»: ' + txt })).catch(() => { }));
    adults(f).forEach(a => Promise.resolve().then(() => mail(a.email, 'Запрос в дружбу — «Мурлок и Ко»', `Здравствуйте!\n\n${txt}\n\nКоманда Tech Wave · murlok.tech-wave.ru`)).catch(e => console.error('mail', e.message)));
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
  function tgStart(tok, chat) {
    if (tok && A.admin.tgTok && tok === A.admin.tgTok) { A.admin.tg = chat; A.admin.tgTok = null; touch(); return true; }
    const t = (A.tgTok || {})[tok]; if (!t || now() - t.t > 864e5) return false;
    const f = A.families[t.f]; delete A.tgTok[tok]; if (!f) return false;
    f.tg = [...new Set([...(f.tg || []), chat])]; touch();
    setTimeout(() => famReport(f, true, chat), 800);
    return '🐾 Готово! Каждое воскресенье в 19:00 я буду присылать отчёт по всем детям семьи. Прислать отчёт сразу — кнопка в кабинете родителя. Отключить — там же или командой /stop.';
  }
  function tgStop(chat) { let hit = false; for (const f of Object.values(A.families)) if ((f.tg || []).includes(chat)) { f.tg = f.tg.filter(c => c !== chat); hit = true; } if (hit) touch(); return hit; }
  async function famReport(f, force, onlyChat) {
    const chats = onlyChat ? [onlyChat] : (f.tg || []); if (!chats.length || !weekly) return 0;
    const kids = (f.children || []).map(id => A.children[id]).filter(Boolean);
    const msgs = kids.map(k => { const sv = readSave(k.cloudCode); return sv ? weekly(sv) : `🐾 ${k.name}: прогресса в облаке пока нет — откройте приложение на устройстве ребёнка и войдите по семейному коду.`; });
    if (!msgs.length) msgs.push('🐾 В семье пока нет детей. Добавьте ребёнка в кабинете родителя — и отчёты начнут приходить.');
    let n = 0; for (const c of chats) for (const m of msgs) { const r = await tg('sendMessage', { chat_id: c, text: m }); if (r && r.ok) n++; await new Promise(x => setTimeout(x, 150)); }
    return n;
  }
  // воскресенье 19:00 МСК — недельные отчёты всем семьям с Telegram
  setInterval(async () => {
    const msk = new Date(Date.now() + 3 * 36e5), wk = msk.toISOString().slice(0, 10);
    if (msk.getUTCDay() !== 0 || msk.getUTCHours() !== 19 || A.famSent === wk) return;
    A.famSent = wk; touch(); for (const f of Object.values(A.families)) if ((f.tg || []).length) await famReport(f);
  }, 5 * 60000).unref?.();

  return { acc, cloud, codeAccess, ownerOf, famKey, friendAsk, cleanSave, refLink, flag, tgStart, tgStop, famReport, A, touch, flush, famView, kidSummary, readSave, wipeFamily, logConsent, CLOG, SNAP, auth, token, rnd, sha, social, setHooks, siblings, adults, isPlayer, kidsOf, playersOf, membersOf, hasLimits };
}
