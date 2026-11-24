// Registration controls and agent verification: phone rules, bot trap, open/invite/closed, two price levels (agent / individual), applications, approvals.
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
const { spawn } = require('child_process'), http = require('http'), path = require('path');
let db, proc, fake; const jar = {};
const PORT = 6600 + Math.floor(Math.random() * 300), URL = 'http://localhost:' + PORT, FAKE = PORT + 400;
const ips = {}; const ipFor = who => ips[who] || (ips[who] = '10.7.' + Object.keys(ips).length + '.1'); // every test user comes from its own address, so the per-address sign-up limit does not interfere
const call = async (who, p, body) => { const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jar[who] || '', 'X-Forwarded-For': ipFor(who) }, body: JSON.stringify(body || {}) }); const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0]; return { status: r.status, ...(await r.json().catch(() => ({}))) }; };
const reg = (who, extra = {}) => call(who, 'register', { email: who + '@test.com', pass: 'secret123', agree: true, phone: H.phone(), name: who, ...extra });
const bal = async who => (await call(who, 'me')).user.bal;
const svc = async (who, k) => (await call(who, 'me')).services.find(s => s.key === k);
const png = n => 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(n, 98)]).toString('base64');
const application = (extra = {}) => ({ business: 'Chidi Digital Centre', phone: H.phone(), address: '12 Market Road, Warri', state: 'Delta', regno: '', dataUrl: png(800), name: 'id.png', ...extra });

test.before(async () => {
  db = await H.newDb({ autoApprove: false }); // new accounts start unverified, like on the real site
  fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => { res.setHeader('Content-Type', 'application/json');
    if (req.url.endsWith('/lookup.php')) return res.end(JSON.stringify({ status: 'success', data: { ok: 1 } }));
    res.end(JSON.stringify({ status: 'success', pdf_base64: 'JVBERi0=', user_data: { first_name: 'A' } })); }); }).listen(FAKE);
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', VP_API_KEY: 'test', VP_BASE: 'http://127.0.0.1:' + FAKE + '/', PAYSTACK_SECRET: '', BASE_URL: URL } });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
});
test.after(async () => { proc.kill(); fake.close(); await db.drop(); });

test('registration can be closed, but the admin address can always register', async () => {
  await db.x("INSERT INTO settings(k,v) VALUES('reg_mode','closed') ON CONFLICT (k) DO UPDATE SET v='closed'");
  assert.equal((await call('x', 'public')).regMode, 'closed');
  const nope = await reg('nobody'); assert.equal(nope.ok, false); assert.match(nope.msg, /closed/);
  assert.equal((await reg('boss')).ok, true); assert.equal((await call('boss', 'me')).user.admin, true);
  assert.equal((await call('boss', 'admin/regmode', { mode: 'open' })).ok, true); assert.equal((await call('x', 'public')).regMode, 'open');
});
test('sign-up needs a valid mobile number, used only once', async () => {
  assert.match((await reg('p0', { phone: '12345' })).msg, /mobile number/); assert.match((await reg('p0', { phone: '' })).msg, /mobile number/);
  const ph = H.phone(); assert.equal((await reg('p1', { phone: ph })).ok, true);
  const dup = await reg('p2', { phone: ph }); assert.equal(dup.ok, false); assert.match(dup.msg, /phone number is already/);
  assert.equal((await reg('p3', { phone: '+234' + H.phone().slice(1) })).ok, true); // +234 form is accepted
  assert.equal((await reg('p1')).ok, false); // same email
});
test('a bot that fills the hidden field is refused and no account is made', async () => {
  const r = await reg('bot', { website: 'http://spam.example' }); assert.equal(r.ok, false);
  assert.equal((await db.q("SELECT COUNT(*)::int n FROM users WHERE email='bot@test.com'"))[0].n, 0);
});
test('new accounts are unverified but can use every service, at the individual price', async () => {
  await reg('ann'); const me = await call('ann', 'me'); assert.equal(me.user.agentStatus, 'none'); assert.equal(me.user.agent, false);
  const n = await svc('ann', 'nin_premium'); assert.equal(n.locked, false);
  assert.equal(n.agentPrice, 300); assert.equal(n.price, 600); // agent price 300 -> individual price 600 (cheap services: x2)
  assert.ok(me.services.every(x => !x.locked && x.price > x.agentPrice), 'every service is open and costs an individual more than an agent');
  await db.x("UPDATE users SET bal=2000 WHERE email='ann@test.com'");
  const r = await call('ann', 'run', { service: 'nin_premium', f: { nin: '12345678901' } }); assert.equal(r.ok, true); assert.ok(r.pdf); assert.equal(await bal('ann'), 2000 - 600);
  await db.x("UPDATE users SET bal=2000 WHERE email='ann@test.com'");
});
test('lookup services also work for unverified users at the individual price', async () => {
  const r = await call('ann', 'run', { service: 'cac_basic', f: { rc_number: '123456', company_type: 'RC' } }); assert.equal(r.ok, true); assert.equal(await bal('ann'), 2000 - 700); // agent 400 -> individual 700 (x1.7)
  await db.x("UPDATE users SET bal=2000 WHERE email='ann@test.com'");
});
test('the admin sets the individual price per service, and it can never be below the agent price', async () => {
  const set = b => call('boss', 'admin/price', { key: 'bank_account', cost: 90, active: true, ...b });
  assert.match((await set({ price: 200, priceInd: 150 })).msg, /Individual price cannot be lower than the agent price/);
  assert.equal((await set({ price: 200, priceInd: 500 })).ok, true);
  assert.equal((await svc('ann', 'bank_account')).price, 500); assert.equal((await svc('ann', 'bank_account')).agentPrice, 200);
  assert.equal((await svc('boss', 'bank_account')).sellInd, 500);
  for (const [agent, ind] of [[150, 300], [200, 400], [250, 500], [300, 600], [350, 600], [400, 700], [450, 800], [550, 950], [600, 1050], [800, 1200], [1000, 1500], [1500, 2250], [1800, 2550]]) { // 0 = automatic, tiered: x2 up to 300, x1.7 up to 600, x1.5 up to 1500, x1.4 above; rounded up to N50
    assert.equal((await set({ price: agent, priceInd: 0 })).ok, true);
    assert.equal((await svc('ann', 'bank_account')).price, ind, 'agent ' + agent); assert.equal((await svc('ann', 'bank_account')).agentPrice, agent); }
  assert.equal((await set({ price: 200, priceInd: 0 })).ok, true); // back to the normal agent price
});
test('an individual never sees the provider cost', async () => assert.equal((await svc('ann', 'nin_premium')).cost, undefined));
test('an application needs valid details and a real document', async () => {
  assert.match((await call('ann', 'agent/apply', application({ business: '' }))).msg, /business/);
  assert.match((await call('ann', 'agent/apply', application({ state: 'Atlantis' }))).msg, /state/);
  assert.match((await call('ann', 'agent/apply', application({ phone: '123' }))).msg, /mobile/);
  assert.match((await call('ann', 'agent/apply', application({ dataUrl: '' }))).msg, /Upload/);
  assert.match((await call('ann', 'agent/apply', application({ dataUrl: png(2.6 * 1024 * 1024) }))).msg, /2\.5 MB/);
  assert.match((await call('ann', 'agent/apply', application({ dataUrl: 'data:image/png;base64,' + Buffer.alloc(500, 1).toString('base64') }))).msg, /not a valid/);
});
test('a good application goes to review and cannot be sent twice', async () => {
  const r = await call('ann', 'agent/apply', application()); assert.equal(r.ok, true); assert.equal(r.status, 'pending');
  assert.equal((await call('ann', 'me')).user.agentStatus, 'pending'); assert.equal((await svc('ann', 'nin_premium')).price, 600); // still the individual price while waiting
  assert.match((await call('ann', 'agent/apply', application())).msg, /already waiting/);
  assert.equal((await call('ann', 'agent/status')).app.status, 'pending');
});
test('only the admin can see applications and ID documents', async () => {
  for (const p of ['admin/agents', 'admin/agent/decide', 'admin/user/agent', 'admin/regmode', 'admin/invites', 'admin/invite/create']) assert.equal((await call('ann', p, {})).status, 403);
  const list = await call('boss', 'admin/agents'); const a = list.rows.find(x => x.email === 'ann@test.com'); assert.ok(a && a.has_doc); assert.equal((await call('boss', 'admin/stats')).agentsPending >= 1, true);
  assert.equal((await fetch(URL + '/api/admin/agent/' + a.id + '/doc')).status, 401);
  assert.equal((await fetch(URL + '/api/admin/agent/' + a.id + '/doc', { headers: { cookie: jar.ann } })).status, 403);
  const ok = await fetch(URL + '/api/admin/agent/' + a.id + '/doc', { headers: { cookie: jar.boss } }); assert.equal(ok.status, 200); assert.equal(ok.headers.get('content-type'), 'image/png');
});
test('approving gives the lower agent price', async () => {
  const a = (await call('boss', 'admin/agents')).rows.find(x => x.email === 'ann@test.com');
  assert.equal((await call('boss', 'admin/agent/decide', { id: a.id, approve: true })).ok, true);
  assert.equal((await call('boss', 'admin/agent/decide', { id: a.id, approve: true })).ok, false); // already decided
  assert.equal((await call('ann', 'me')).user.agentStatus, 'approved'); assert.equal((await svc('ann', 'nin_premium')).price, 300);
  const r = await call('ann', 'run', { service: 'nin_premium', f: { nin: '12345678901' } }); assert.equal(r.ok, true); assert.ok(r.pdf); assert.equal(await bal('ann'), 2000 - 300);
});
test('a rejection needs a reason and the applicant can apply again', async () => {
  await reg('bea'); await call('bea', 'agent/apply', application());
  const a = (await call('boss', 'admin/agents')).rows.find(x => x.email === 'bea@test.com');
  assert.match((await call('boss', 'admin/agent/decide', { id: a.id, approve: false, reason: '' })).msg, /why/);
  assert.equal((await call('boss', 'admin/agent/decide', { id: a.id, approve: false, reason: 'The photo is too blurry to read.' })).ok, true);
  const st = await call('bea', 'agent/status'); assert.equal(st.status, 'rejected'); assert.match(st.app.reason, /blurry/);
  assert.equal((await svc('bea', 'nin_premium')).price, 600); // rejected: still pays the individual price
  assert.equal((await call('bea', 'agent/apply', application())).ok, true); assert.equal((await call('bea', 'agent/status')).status, 'pending');
});
test('the admin can grant and remove agent access directly', async () => {
  const id = (await call('boss', 'admin/users', { q: 'bea@' })).rows[0].id;
  assert.equal((await call('boss', 'admin/user/agent', { id, status: 'approved' })).ok, true); assert.equal((await svc('bea', 'nin_premium')).price, 300);
  assert.equal((await call('boss', 'admin/user/agent', { id, status: 'none' })).ok, true); assert.equal((await svc('bea', 'nin_premium')).price, 600);
});
test('the admin account is never locked', async () => assert.equal((await svc('boss', 'nin_premium')).locked, false));
test('each service can be switched between "agents only" and "open to all"', async () => {
  await reg('cy'); assert.equal((await svc('cy', 'cac_basic')).locked, false);
  assert.equal((await call('boss', 'admin/price', { key: 'cac_basic', price: 400, cost: 230, active: true, agentOnly: true })).ok, true);
  assert.equal((await svc('cy', 'cac_basic')).locked, true); await db.x("UPDATE users SET bal=2000 WHERE email='cy@test.com'");
  assert.equal((await call('cy', 'run', { service: 'cac_basic', f: { rc_number: '1', company_type: 'RC' } })).locked, true);
  assert.equal((await call('boss', 'admin/price', { key: 'cac_basic', price: 400, cost: 230, active: true, agentOnly: false })).ok, true);
  assert.equal((await svc('cy', 'cac_basic')).locked, false);
});
test('invite-only registration: a code works once, expires, and is created by the admin only', async () => {
  assert.equal((await call('boss', 'admin/regmode', { mode: 'invite' })).ok, true); assert.equal((await call('x', 'public')).regMode, 'invite');
  assert.match((await reg('inv0')).msg, /invite code/); assert.match((await reg('inv0', { invite: 'DV-NOPE1234' })).msg, /not valid/);
  const c = await call('boss', 'admin/invite/create', { note: 'for Emeka', days: 7 }); assert.match(c.code, /^DV-[A-Z0-9]{8}$/);
  assert.equal((await reg('inv1', { invite: c.code.toLowerCase() })).ok, true); // not case sensitive
  assert.match((await reg('inv2', { invite: c.code })).msg, /already used|not valid/); // used already
  const e = await call('boss', 'admin/invite/create', { days: 1 }); await db.x("UPDATE invites SET expires_at = now() - interval '1 hour' WHERE code=?", e.code);
  assert.match((await reg('inv3', { invite: e.code })).msg, /expired|not valid/);
  const list = await call('boss', 'admin/invites'); assert.ok(list.rows.find(r => r.code === c.code).used_email === 'inv1@test.com');
  const f = await call('boss', 'admin/invite/create', { days: 1 }); await call('boss', 'admin/invite/delete', { code: f.code }); assert.match((await reg('inv4', { invite: f.code })).msg, /not valid/);
  assert.equal((await call('boss', 'admin/regmode', { mode: 'open' })).ok, true);
});
test('a failed invite does not leave a half-made account behind', async () => {
  await call('boss', 'admin/regmode', { mode: 'invite' }); await reg('ghost', { invite: 'DV-ZZZZZZZZ' });
  assert.equal((await db.q("SELECT COUNT(*)::int n FROM users WHERE email='ghost@test.com'"))[0].n, 0); await call('boss', 'admin/regmode', { mode: 'open' });
});
