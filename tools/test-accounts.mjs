// Автотест сервера кабинетов и админки (без сети): node tools/test-accounts.mjs
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import { scryptSync, randomBytes } from 'node:crypto';
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'macc-')), SAVE_DIR = path.join(DIR, 'saves'); fs.mkdirSync(SAVE_DIR);
fs.copyFileSync(new URL('../server/admin.html', import.meta.url), path.join(DIR, 'admin.html'));
const salt = randomBytes(8).toString('hex'); process.env.ADMIN_USER = 'adm'; process.env.ADMIN_HASH = salt + ':' + scryptSync('secret', salt, 32).toString('hex');
const { makeAccounts } = await import('../server/accounts.mjs'); const { makeAdmin } = await import('../server/admin.mjs');
const mails = []; const mail = async (to, subj, text) => { mails.push({ to, subj, text }); };
const send = (res, code, obj) => { res.code = code; res.body = obj; };
const acc = makeAccounts({ DIR, SAVE_DIR, limit: () => true, send, mail, tg: async () => ({}) });
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
// ---------- v30: семья из нескольких взрослых, семья = друзья, успехи, вызовы, челленджи ----------
const { makeExtra } = await import('../server/extra.mjs');
const extra = makeExtra({ DIR, SAVE_DIR, ORIGINS: ['https://murlok.tech-wave.ru'], limit: () => true, send, claude: async () => ({}), parseReply: x => x, maskPII: x => x, BAD_OUT: /$^/, MODEL: 'x', dayOk: () => true });
acc.setHooks({ friendCodes: extra.friendCodes, friendsAdmin: extra.friendsAdmin }); extra.setFamilyHook(c => acc.siblings(c));
const FR = (code, act, body = {}) => call(extra, 'POST', '/friend/' + act, { code, ...body });
const mskDay = (k = 0) => new Date(Date.now() + 3 * 36e5 - k * 864e5).toISOString().slice(0, 10);
const CH = t => ({ authorization: 'Bearer ' + t });
mails.length = 0;
r = await A('POST', '/acc/fam/invite', { email: 'Babushka@Test.ru', name: 'Бабушка' }, H); ok('invite adult by email', r.code === 200 && mails.length === 1 && mails[0].to === 'babushka@test.ru' && /Приглашение/.test(mails[0].subj) && r.body.family.invites.length === 1);
r = await A('POST', '/acc/fam/invite', { email: 'papa@test.ru' }, H); ok('cannot invite adult of another family', r.code === 400 && r.body.error === 'taken');
mails.length = 0; r = await A('POST', '/acc/start', { email: 'babushka@test.ru' }); ok('invited adult sees invite on login', r.body.isNew && r.body.invite && r.body.invite.by === 'ma***@test.ru');
const cb = mails[0].text.match(/(\d{6})/)[1];
r = await A('POST', '/acc/verify', { email: 'babushka@test.ru', code: cb }); ok('invited adult must consent', r.code === 400 && r.body.error === 'consent');
r = await A('POST', '/acc/verify', { email: 'babushka@test.ru', code: cb, consent: true }); ok('invited adult joins same family', r.code === 200 && r.body.family.id === fam.id && r.body.family.adults.length === 2 && r.body.family.me.role === 'adult');
const btok = r.body.token, babId = r.body.family.adults.find(a => a.role === 'adult').id;
ok('adult consent logged', fs.readFileSync(path.join(DIR, 'consents.log'), 'utf8').includes('"type":"consent-adult"'));
r = await A('POST', '/acc/revoke', { confirm: 'УДАЛИТЬ' }, CH(btok)); ok('invited adult cannot delete family', r.code === 403);
r = await A('GET', '/acc/family', null, CH(btok)); ok('invited adult sees children', r.body.family.children.length === 1);
// второй ребёнок семьи и прогресс за неделю
fs.writeFileSync(path.join(SAVE_DIR, 'KIDCODE2.json'), JSON.stringify({ v: 1, kid: 'Миша Иванов', name: 'Барсик', xp: 500, days: { [mskDay()]: 40 }, daily: { [mskDay()]: { x: 300, t: 40, a: 6 } }, read: { schulte: { 4: 21.5 } }, acad: { space: { best: { a: 3, b: 2 } } }, savedAt: Date.now() }));
const s1 = JSON.parse(fs.readFileSync(path.join(SAVE_DIR, 'KIDCODE1.json'), 'utf8')); Object.assign(s1, { days: { [mskDay()]: 120 }, daily: { [mskDay()]: { x: 900, t: 120, a: 25 } } }); fs.writeFileSync(path.join(SAVE_DIR, 'KIDCODE1.json'), JSON.stringify(s1));
r = await A('POST', '/acc/child', { name: 'Миша Иванов', pin: [2, 3, 4], cloudCode: 'KIDCODE2' }, CH(btok)); ok('invited adult can add a child', r.code === 200);
const misha = r.body.child, mtok = r.body.token;
r = await FR('KIDCODE1', 'list'); ok('family kids are friends automatically', r.body.friends.some(f => f.family && f.kid === 'Миша'));
r = await FR('KIDCODE1', 'remove', { pub: r.body.friends[0].pub }); ok('family friend cannot be removed', r.code === 400);
r = await A('GET', '/acc/social/board', null, CH(ctok)); const fb = r.body.family || [];
ok('weekly family board', r.code === 200 && fb.length === 2 && fb[0].name === 'Кэтика' && fb[0].xp === 900 && fb[0].tasks === 120 && fb[1].schulte[4] === 21.5 && fb[1].stars === 5, JSON.stringify(fb).slice(0, 200));
ok('board shows only first names, no codes/emails', !/KIDCODE|@|Иванов/.test(JSON.stringify(r.body)));
r = await A('GET', '/acc/social/board', null, H); ok('parent token cannot use child social api', r.code === 401);
// вызов
r = await A('POST', '/acc/duel/new', { to: misha.id, game: 'schulte4' }, CH(ctok)); ok('duel created with seed', r.code === 200 && r.body.duel.seed > 0);
const did = r.body.duel.id;
r = await A('GET', '/acc/duel/list', null, CH(mtok)); ok('duel hidden until challenger plays', r.body.incoming.length === 0);
r = await A('POST', `/acc/duel/${did}/result`, { time: 30.55, errs: 1 }, CH(mtok)); ok('opponent cannot play first', r.code === 400 && r.body.error === 'early');
r = await A('POST', `/acc/duel/${did}/result`, { time: 30.55, errs: 1 }, CH(ctok)); ok('challenger result saved', r.code === 200 && r.body.duel.mine.time === 30.6 && !r.body.duel.done);
r = await A('GET', '/acc/social/news', null, CH(mtok)); ok('opponent gets notification', r.body.incoming.length === 1 && r.body.incoming[0].other.name === 'Кэтика');
r = await A('POST', `/acc/duel/${did}/result`, { time: 25, errs: 0 }, CH(mtok)); ok('duel finished, faster wins', r.body.duel.done && r.body.duel.result === 'win');
r = await A('POST', `/acc/duel/${did}/result`, { time: 1, errs: 0 }, CH(mtok)); ok('cannot replay duel', r.code === 400);
r = await A('POST', `/acc/duel/${did}/claim`, {}, CH(mtok)); ok('winner gets candies once', r.body.candies === 15);
r = await A('POST', `/acc/duel/${did}/claim`, {}, CH(mtok)); ok('no double reward', r.code === 400);
r = await A('POST', `/acc/duel/${did}/claim`, {}, CH(ctok)); ok('loser gets a small reward', r.body.candies === 3);
r = await A('GET', '/acc/duel/list', null, CH(ctok)); ok('duel history', r.body.done.length === 1 && r.body.done[0].result === 'lose' && r.body.done[0].theirs.time === 25);
// челленджи
r = await A('POST', '/acc/fam/chal', { tpl: 'fam_tasks' }, H); ok('parent creates family challenge', r.code === 200 && r.body.chal.progress === 160);
r = await A('POST', '/acc/fam/chal', { tpl: 'fam_tasks' }, CH(btok)); ok('no duplicate family challenge', r.code === 400 && r.body.error === 'dup');
r = await A('POST', '/acc/fam/chal', { tpl: 'solo_tasks' }, H); ok('parent cannot pick non-family template', r.code === 400);
r = await A('POST', '/acc/chal/start', { tpl: 'solo_tasks' }, CH(ctok)); ok('child starts solo challenge', r.code === 200 && r.body.chal.complete && r.body.chal.claimable);
r = await A('POST', '/acc/chal/start', { tpl: 'solo_tasks' }, CH(ctok)); ok('no duplicate solo challenge', r.code === 400);
r = await A('GET', '/acc/chal/list', null, CH(mtok)); ok('family challenge visible to every kid', r.body.active.some(c => c.tpl === 'fam_tasks' && c.members.length === 2 && !c.complete));
const solo = (await A('GET', '/acc/chal/list', null, CH(ctok))).body.active.find(c => c.tpl === 'solo_tasks');
r = await A('POST', `/acc/chal/${solo.id}/claim`, {}, CH(ctok)); ok('challenge reward', r.body.candies === 30 && r.body.badge === '🧮');
r = await A('POST', `/acc/chal/${solo.id}/claim`, {}, CH(ctok)); ok('challenge reward once', r.code === 400);
r = await A('POST', '/acc/chal/start', { tpl: 'fr_race', with: [misha.id] }, CH(ctok)); ok('friends race with family member', r.code === 200 && r.body.chal.members.length === 2);
// друзья из другой семьи — по кодам и с разрешения взрослых обеих семей
r = await A('POST', '/acc/child', { name: 'Петя', pin: [5, 6, 7], cloudCode: 'KIDCODE3' }, CH(tok2)); const petya = r.body.child, ptok3 = r.body.token;
fs.writeFileSync(path.join(SAVE_DIR, 'KIDCODE3.json'), JSON.stringify({ v: 1, kid: 'Петя', name: 'Рыжик', xp: 10, days: { [mskDay()]: 3 }, savedAt: Date.now() }));
const pubK = (await FR('KIDCODE1', 'me')).body.pub, pubP = (await FR('KIDCODE3', 'me')).body.pub;
await FR('KIDCODE1', 'add', { pub: pubP }); r = await FR('KIDCODE3', 'add', { pub: pubK }); ok('friendship waits for adults', r.body.status === 'approval');
r = await FR('KIDCODE1', 'list'); ok('not friends before approval', !r.body.friends.some(f => f.pub === pubP) && r.body.pending.some(f => f.pub === pubP && f.wait === 'parent'));
r = await A('POST', '/acc/duel/new', { to: petya.id, game: 'paws' }, CH(ctok)); ok('no duel with unapproved friend', r.code === 403);
r = await A('GET', '/acc/fam/friends', null, H); ok('parent sees friend request', r.body.kids.find(k => k.id === kid.id).requests.some(x => x.pub === pubP));
await A('POST', '/acc/fam/friends', { childId: kid.id, pub: pubP, ok: true }, H); r = await FR('KIDCODE1', 'list'); ok('one side approved is not enough', !r.body.friends.some(f => f.pub === pubP));
r = await A('POST', '/acc/fam/friends', { childId: petya.id, pub: pubK, ok: true }, CH(tok2)); r = await FR('KIDCODE1', 'list'); ok('both families approved → friends', r.body.friends.some(f => f.pub === pubP && !f.family));
r = await A('GET', '/acc/social/board', null, CH(ctok)); ok('friends board includes approved friend', r.body.friends.length === 2 && r.body.friends.some(x => x.name === 'Петя') && !r.body.friends.some(x => x.name === 'Миша'));
r = await A('POST', '/acc/fam/friends', { childId: kid.id, pub: pubP, ok: true }, CH(tok2)); ok('parent cannot approve for another family', r.code === 404);
r = await A('GET', '/acc/fam/social', null, H); ok('parent cabinet social summary', r.body.board.rows.length === 2 && r.body.chals.length >= 2 && r.body.duelsWeek === 1 && r.body.templates.length === 4);
r = await AD('GET', '/admin/api/stats', null, { cookie }); ok('admin social counters', r.body.social.multiAdultFamilies === 1 && r.body.social.duelsPlayed === 1 && r.body.social.challengesActive >= 3, JSON.stringify(r.body.social));
// убрать приглашённого взрослого
r = await A('POST', `/acc/fam/adult/${babId}/remove`, {}, H); ok('owner removes invited adult', r.code === 200);
r = await A('GET', '/acc/family', null, CH(btok)); ok('removed adult loses access', r.code === 401);
ok('removal logged', fs.readFileSync(path.join(DIR, 'consents.log'), 'utf8').includes('"type":"adult-removed"'));

// выгрузка и удаление
r = await A('GET', '/acc/export', null, H); ok('export has progress', r.code === 200 && JSON.parse(r.raw).progress['Кэтика'].xp === 32130);
r = await A('POST', '/acc/revoke', { confirm: 'нет' }, H); ok('revoke needs confirm', r.code === 400);
r = await A('POST', '/acc/revoke', { confirm: 'УДАЛИТЬ' }, H); ok('revoke wipes family', r.body.ok && !fs.existsSync(path.join(SAVE_DIR, 'KIDCODE1.json')) && !acc.A.families[fam.id]);
r = await A('GET', '/acc/family', null, H); ok('old token dead', r.code === 401);
ok('revoke logged', fs.readFileSync(path.join(DIR, 'consents.log'), 'utf8').includes('"type":"revoke"'));
acc.flush(); console.log(fails ? 'ACC FAILED ' + fails : 'ACC ALL OK'); process.exit(fails ? 1 : 0);
