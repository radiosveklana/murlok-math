// Автотест сервера кабинетов и админки (без сети): node tools/test-accounts.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { scryptSync, randomBytes } from 'node:crypto';
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'macc-')), SAVE_DIR = path.join(DIR, 'saves'); fs.mkdirSync(SAVE_DIR);
fs.copyFileSync(new URL('../server/admin.html', import.meta.url), path.join(DIR, 'admin.html'));
const salt = randomBytes(8).toString('hex'); process.env.ADMIN_USER = 'adm'; process.env.ADMIN_HASH = salt + ':' + scryptSync('secret', salt, 32).toString('hex');
const { makeAccounts } = await import('../server/accounts.mjs'); const { makeAdmin } = await import('../server/admin.mjs');
const mails = []; const mail = async (to, subj, text) => { mails.push({ to, subj, text }); };
const send = (res, code, obj) => { res.code = code; res.body = obj; };
const tgSent = []; const acc = makeAccounts({ DIR, SAVE_DIR, limit: () => true, send, mail, tg: async (m, p) => { tgSent.push(p); return { ok: true }; }, weekly: s => 'WEEK ' + s.kid, TG_BOT: 'bot' });
const admin = makeAdmin({ DIR, SAVE_DIR, acc, send, mail, tg: async () => ({}), tgLinks: () => ({}), TG_BOT: 'bot' });
let fails = 0; const ok = (n, c, x = '') => { if (!c) fails++; console.log((c ? 'ACC OK ' : 'ACC FAIL ') + n + (x ? ' ' + x : '')); };
function call(handler, method, p, body, headers = {}) {
  const chunks = body ? [Buffer.from(JSON.stringify(body))] : []; const req = { method, headers: { 'x-real-ip': '1.2.3.4', ...headers }, url: p, [Symbol.asyncIterator]: async function* () { yield* chunks; } };
  const res = { headers: {}, writeHead(c, h) { this.code = c; Object.assign(this.headers, h || {}); }, end(b) { this.raw = b; try { this.body = JSON.parse(b); } catch { } } };
  return Promise.resolve(handler(req, res, new URL(p, 'http://x'), 'https://murlok.tech-wave.ru', '1.2.3.4')).then(() => res);
}
const A = (m, p, b, h) => call(acc.acc, m, p, b, h), AD = (m, p, b, h) => call(admin.route, m, p, b, h);

// регистрация родителя
let r = await A('POST', '/acc/start', { email: 'Mama@Test.ru' }); ok('start sends code', r.code === 200 && mails.length === 1 && /\d{6}/.test(mails[0].text));
const code = mails[0].text.match(/(\d{6})/)[1];
r = await A('POST', '/acc/verify', { email: 'mama@test.ru', code: '000000' }); ok('wrong code rejected', r.code === 400 && r.body.error === 'code');
r = await A('POST', '/acc/verify', { email: 'mama@test.ru', code }); ok('consent required for new', r.code === 400 && r.body.error === 'consent');
r = await A('POST', '/acc/verify', { email: 'mama@test.ru', code, consent: true }); ok('verify creates family', r.code === 200 && r.body.token && r.body.family.code.length === 6);
const tok = r.body.token, fam = r.body.family, H = { authorization: 'Bearer ' + tok };
ok('consent logged', fs.readFileSync(path.join(DIR, 'consents.log'), 'utf8').includes('"type":"consent"'));
// ребёнок с уже существующим прогрессом устройства
fs.writeFileSync(path.join(SAVE_DIR, 'KIDCODE1.json'), JSON.stringify({ v: 1, kid: 'Кэтика', name: 'Котофей', xp: 32130, cases: 13, savedAt: Date.now() }));
r = await A('POST', '/acc/child', { name: 'Кэтика', pin: [1, 5, 9], cloudCode: 'KIDCODE1', cat: 'Котофей' }, H); ok('child linked to existing progress', r.code === 200 && r.body.child.cloudCode === 'KIDCODE1' && r.body.child.xp === 32130);
const kid = r.body.child;
r = await A('POST', '/acc/child/list', { familyCode: fam.code }); ok('child list by family code', r.code === 200 && r.body.kids.length === 1 && r.body.kids[0].hasPin);
r = await A('POST', '/acc/child/login', { familyCode: fam.code, childId: kid.id, pin: [1, 5, 8] }); ok('wrong picture pin rejected', r.code === 400);
r = await A('POST', '/acc/child/login', { familyCode: fam.code, childId: kid.id, pin: [1, 5, 9] }); ok('child login', r.code === 200 && r.body.cloudCode === 'KIDCODE1' && r.body.needSurvey);
const ctok = r.body.token;
r = await A('POST', '/acc/survey', { answers: { like: ['🐾 Животные и природа'], me: '🦊 Хитрый' } }, { authorization: 'Bearer ' + ctok }); ok('survey saved', r.code === 200);
await A('POST', '/acc/priorities', { list: ['math4', 'read'] }, H);
r = await A('GET', '/acc/child/me', null, { authorization: 'Bearer ' + ctok }); ok('child sees priorities', r.body.priorities.join() === 'math4,read' && r.body.survey.me);
r = await A('GET', '/acc/family', null, { authorization: 'Bearer ' + ctok }); ok('child token cannot open parent cabinet', r.code === 401);
// семейный отчёт в Telegram
r = await A('POST', '/acc/tg/link', {}, H); const ttok = (r.body.url || '').split('start=')[1]; ok('tg link for family', r.code === 200 && /^[A-Z0-9]{16}$/.test(ttok || ''));
ok('tg start binds chat', typeof acc.tgStart(ttok, 'CHAT1') === 'string' && acc.tgStart(ttok, 'CHAT2') === false);
tgSent.length = 0; r = await A('POST', '/acc/tg/test', {}, H); ok('tg report now: one message per child', r.body.sent === 1 && tgSent[0].chat_id === 'CHAT1' && tgSent[0].text === 'WEEK Кэтика', JSON.stringify(tgSent));
r = await A('POST', '/acc/tg/status', {}, H); ok('tg status', r.body.linked === 1);
acc.tgStop('CHAT1'); r = await A('POST', '/acc/tg/status', {}, H); ok('tg /stop unlinks family', r.body.linked === 0);
// рефералы: переход + регистрация по ссылке, без дружбы
r = await call(acc.refLink, 'GET', '/r/' + fam.ref.code); ok('ref link redirects', r.code === 302 && /\?ref=/.test(r.headers.location));
mails.length = 0; await A('POST', '/acc/start', { email: 'papa@test.ru', ref: fam.ref.code }); const c2 = mails[0].text.match(/(\d{6})/)[1];
r = await A('POST', '/acc/verify', { email: 'papa@test.ru', code: c2, consent: true }); const tok2 = r.body.token;
r = await A('GET', '/acc/family', null, H); ok('ref counted (visit + registration)', r.body.family.ref.visits === 1 && r.body.family.ref.regs === 1);
// админка
r = await AD('POST', '/admin/api/login', { user: 'adm', pass: 'wrong' }); ok('admin wrong pass', r.code === 401);
r = await AD('POST', '/admin/api/login', { user: 'adm', pass: 'secret' }); const cookie = (r.headers['set-cookie'] || '').split(';')[0]; ok('admin login cookie', /^madm=/.test(cookie) && /HttpOnly/.test(r.headers['set-cookie']));
r = await AD('GET', '/admin/api/stats', null, { cookie }); ok('admin stats', r.body.families === 2 && r.body.children === 1 && r.body.sources.viaRef === 1, JSON.stringify(r.body).slice(0, 120));
r = await AD('GET', '/admin/api/stats'); ok('admin api closed without cookie', r.code === 401);
r = await AD('POST', `/admin/api/child/${kid.id}/grant`, { candies: 50, gems: 5, note: 'За старание' }, { cookie }); ok('admin grant', r.body.ok);
r = await A('POST', '/acc/pending', { code: 'KIDCODE1' }); ok('child receives grant once', r.body.items.length === 1 && r.body.items[0].candies === 50);
r = await A('POST', '/acc/pending', { code: 'KIDCODE1' }); ok('grant not repeated', r.body.items.length === 0);
acc.flag({ flag: 'distress', kid: 'Кэтика', cat: 'Котофей', code: 'KIDCODE1', text: 'мне грустно' }); r = await AD('GET', '/admin/api/flags', null, { cookie }); ok('flags visible to admin', r.body.flags.length === 1);
r = await AD('GET', `/admin/api/family/${fam.id}`, null, { cookie }); ok('admin family card', r.body.children[0].name === 'Кэтика' && r.body.children[0].xp === 32130);
// выгрузка и удаление
r = await A('GET', '/acc/export', null, H); ok('export has progress', r.code === 200 && JSON.parse(r.raw).progress['Кэтика'].xp === 32130);
r = await A('POST', '/acc/revoke', { confirm: 'нет' }, H); ok('revoke needs confirm', r.code === 400);
r = await A('POST', '/acc/revoke', { confirm: 'УДАЛИТЬ' }, H); ok('revoke wipes family', r.body.ok && !fs.existsSync(path.join(SAVE_DIR, 'KIDCODE1.json')) && !acc.A.families[fam.id]);
r = await A('GET', '/acc/family', null, H); ok('old token dead', r.code === 401);
ok('revoke logged', fs.readFileSync(path.join(DIR, 'consents.log'), 'utf8').includes('"type":"revoke"'));
acc.flush(); console.log(fails ? 'ACC FAILED ' + fails : 'ACC ALL OK'); process.exit(fails ? 1 : 0);
