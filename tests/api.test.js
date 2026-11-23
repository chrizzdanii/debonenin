// Run with: npm test   (starts its own server on a temporary database)
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
let db;
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = 3200 + Math.floor(Math.random() * 500), URL = 'http://localhost:' + PORT;
const jar = {}; let proc;
const call = async (who, p, body, headers = {}) => {
  const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jar[who] || '', ...headers }, body: JSON.stringify(body || {}) });
  const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0];
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};
const setBal = (email, n) => db.x('UPDATE users SET bal=? WHERE email=?', n, email);
const svc = (me, k) => me.services.find(s => s.key === k);

test.before(async () => {
  db = await H.newDb();
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', VP_API_KEY: 'test', VP_BASE: 'http://127.0.0.1:9/', PAYSTACK_SECRET: '', BASE_URL: URL } });
  for (let i = 0; i < 30; i++) { try { if ((await fetch(URL + '/health')).ok) return; } catch {} await new Promise(r => setTimeout(r, 200)); }
  throw new Error('server did not start');
});
test.after(async () => { proc.kill(); await db.drop(); });

test('health endpoint and security headers', async () => {
  const r = await fetch(URL + '/health'); assert.equal(r.status, 200);
  assert.match(r.headers.get('content-security-policy'), /script-src 'self'/); assert.equal(r.headers.get('x-frame-options'), 'DENY');
});
test('rejects non-JSON posts (CSRF guard)', async () => {
  const r = await fetch(URL + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'a=1' });
  assert.equal(r.status, 415);
});
test('registration needs agreement and a strong password', async () => {
  assert.equal((await call('x', 'register', { email: 'a@test.com', pass: 'secret123', phone: H.phone() })).ok, false); // no agreement
  assert.equal((await call('x', 'register', { email: 'a@test.com', pass: 'short', agree: true, phone: H.phone() })).ok, false);
});
test('admin and customer accounts', async () => {
  assert.equal((await call('admin', 'register', { name: 'Boss', email: 'boss@test.com', pass: 'secret123', agree: true, phone: H.phone() })).ok, true);
  assert.equal((await call('ann', 'register', { name: 'Ann', email: 'ann@test.com', pass: 'secret123', agree: true, phone: H.phone() })).ok, true);
  assert.equal((await call('ann', 'register', { email: 'ann@test.com', pass: 'secret123', agree: true, phone: H.phone() })).ok, false);
  assert.equal((await call('admin', 'me')).user.admin, true);
  assert.equal((await call('ann', 'me')).user.admin, false);
});
test('customers cannot use admin routes', async () => {
  assert.equal((await call('ann', 'admin/stats')).status, 403);
  assert.equal((await call('nobody', 'me')).status, 401);
});
test('admin pays provider price, customer pays selling price', async () => {
  assert.equal((await call('admin', 'admin/price', { key: 'nin_premium', price: 555, cost: 120, active: true })).ok, true);
  assert.equal(svc(await call('ann', 'me'), 'nin_premium').price, 555);
  const a = svc(await call('admin', 'me'), 'nin_premium'); assert.equal(a.price, 120); assert.equal(a.sell, 555);
  const ann = await call('ann', 'me'); assert.equal(svc(ann, 'nin_premium').cost, undefined);
});
test('input is validated before any money moves', async () => {
  await setBal('ann@test.com', 1000);
  const r = await call('ann', 'run', { service: 'nin_premium', f: { nin: '123' } });
  assert.equal(r.ok, false); assert.match(r.msg, /11 digits/); assert.equal((await call('ann', 'me')).user.bal, 1000);
});
test('a failed provider call refunds the wallet', async () => {
  const r = await call('ann', 'run', { service: 'nin_premium', f: { nin: '12345678901' } });
  assert.equal(r.ok, false); assert.equal((await call('ann', 'me')).user.bal, 1000);
  const h = await call('ann', 'history'); assert.ok(h.rows.some(x => x.status === 'refunded'));
});
test('insufficient balance is refused', async () => {
  await setBal('ann@test.com', 10);
  assert.match((await call('ann', 'run', { service: 'nin_premium', f: { nin: '12345678901' } })).msg, /Not enough balance/);
});
test('a switched-off service cannot be used', async () => {
  await call('admin', 'admin/price', { key: 'nin_premium', price: 555, cost: 120, active: false });
  assert.match((await call('ann', 'run', { service: 'nin_premium', f: { nin: '12345678901' } })).msg, /switched off/);
});
test('Paystack is the only funding route and is protected', async () => {
  assert.equal((await call('ann', 'pay/init', { amount: 1000 })).ok, false);
  assert.equal((await call('ann', 'admin/credit', { email: 'ann@test.com', amount: 500 })).status, 404); // manual crediting no longer exists
  const r = await fetch(URL + '/api/paystack/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': 'bad' }, body: '{}' });
  assert.equal(r.status, 401);
});
test('suspended users are locked out', async () => {
  const id = (await call('admin', 'admin/users', { q: 'ann@' })).rows[0].id;
  assert.equal((await call('admin', 'admin/user/status', { id, active: false })).ok, true);
  assert.equal((await call('ann', 'me')).status, 401);
  assert.match((await call('ann2', 'login', { email: 'ann@test.com', pass: 'secret123' })).msg, /suspended/);
  await call('admin', 'admin/user/status', { id, active: true });
});
test('admin can reset a password', async () => {
  const id = (await call('admin', 'admin/users', { q: 'ann@' })).rows[0].id;
  const r = await call('admin', 'admin/user/reset', { id }); assert.ok(r.temp);
  assert.equal((await call('ann3', 'login', { email: 'ann@test.com', pass: r.temp })).ok, true);
});
