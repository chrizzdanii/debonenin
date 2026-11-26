// My Results (customers reopen their own saved results for free, 30 days), the admin-only guide chapters, and the live price fields.
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
const { spawn } = require('child_process'), http = require('http'), path = require('path');
let db, proc, fake; const jar = {};
const PORT = 6900 + Math.floor(Math.random() * 300), URL = 'http://localhost:' + PORT, FAKE = PORT + 400;
const ips = {}; const ipFor = who => ips[who] || (ips[who] = '10.9.' + Object.keys(ips).length + '.1');
const call = async (who, p, body) => { const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jar[who] || '', 'X-Forwarded-For': ipFor(who) }, body: JSON.stringify(body || {}) }); const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0]; return { status: r.status, ...(await r.json().catch(() => ({}))) }; };
const reg = who => call(who, 'register', { email: who + '@test.com', pass: 'secret123', agree: true, phone: H.phone(), name: who });
const bal = async who => (await call(who, 'me')).user.bal;
test.before(async () => {
  db = await H.newDb({ autoApprove: false });
  fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ status: 'success', pdf_base64: 'JVBERi0=', user_data: { first_name: 'A' } })); }); }).listen(FAKE);
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', VP_API_KEY: 'test', VP_BASE: 'http://127.0.0.1:' + FAKE + '/', PAYSTACK_SECRET: '', BASE_URL: URL } });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  for (const w of ['boss', 'ann', 'bob']) await reg(w);
  await db.x("UPDATE users SET bal=5000 WHERE email IN ('ann@test.com','bob@test.com')");
});
test.after(async () => { proc.kill(); fake.close(); await db.drop(); });

let rid;
test('a paid result is saved, and opening or downloading it again never charges', async () => {
  const r = await call('ann', 'run', { service: 'nin_premium', f: { nin: '12345678901' } }); assert.equal(r.ok, true); assert.ok(r.pdf);
  const after = await bal('ann'); const l = await call('ann', 'results/list'); assert.equal(l.ok, true); assert.equal(l.rows.length, 1); assert.equal(l.rows[0].has_pdf, true); rid = l.rows[0].id;
  assert.equal(l.rows[0].pdf, undefined, 'the list must not carry the PDF itself');
  for (let i = 0; i < 3; i++) { const g = await call('ann', 'results/get', { id: rid }); assert.equal(g.ok, true); assert.equal(g.pdf, 'JVBERi0='); }
  assert.equal(await bal('ann'), after, 'viewing/downloading must be free');
});
test('nobody else can see or open it', async () => {
  assert.equal((await call('bob', 'results/list')).rows.length, 0);
  assert.equal((await call('bob', 'results/get', { id: rid })).ok, false);
  assert.equal((await call('bob', 'results/delete', { id: rid })).ok, false);
  assert.equal((await call('nobody', 'results/list')).status, 401);
});
test('"needs review" and older-than-30-days results stay hidden from customers', async () => {
  await db.x("INSERT INTO results(uid,email,svc,label,outcome,pdf) SELECT id,email,'nin','review one','needs review','JVBERi0=' FROM users WHERE email='ann@test.com'");
  const l = await call('ann', 'results/list'); assert.equal(l.rows.length, 1);
  const hidden = (await db.q("SELECT id FROM results WHERE label='review one'"))[0].id; assert.equal((await call('ann', 'results/get', { id: hidden })).ok, false);
  await db.x("UPDATE results SET at = now() - interval '31 day' WHERE id=" + rid);
  assert.equal((await call('ann', 'results/list')).rows.length, 0); assert.equal((await call('ann', 'results/get', { id: rid })).ok, false);
  await db.x("UPDATE results SET at = now() WHERE id=" + rid);
  assert.equal((await call('ann', 'results/list')).rows.length, 1);
});
test('a customer can delete their own result', async () => {
  assert.equal((await call('ann', 'results/delete', { id: rid })).ok, true); assert.equal((await call('ann', 'results/list')).rows.length, 0);
});
test('admin chapters of the guide go only to the admin', async () => {
  assert.equal((await call('ann', 'guide/admin')).status, 403);
  const g = await call('boss', 'guide/admin'); assert.equal(g.ok, true); assert.ok(g.part.sections.length >= 10);
  const text = (await (await fetch(URL + '/guide-content.js')).text()); assert.ok(!/Approve and credit wallet/.test(text), 'admin steps must not be in the public file');
});
test('customers see only their own price, never the agent price', async () => {
  const me = await call('ann', 'me'); assert.ok(me.services.every(s => s.agentPrice === s.price && s.indPrice === s.price));
  assert.equal(me.services.find(s => s.key === 'ipe').price, 2000);
});
