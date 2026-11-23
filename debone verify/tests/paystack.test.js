// Tests the wallet-funding flow against a simulated Paystack server.
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
let db;
const { spawn } = require('child_process'), http = require('http'), crypto = require('crypto'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = 3800 + Math.floor(Math.random() * 300), FAKE = PORT + 400, URL = 'http://localhost:' + PORT, SECRET = 'sk_test_unit';
const paid = {}; let proc, fake, cookie = '';
const call = async (p, body) => { const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify(body || {}) }); const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0]; return r.json(); };
test.before(async () => {
  db = await H.newDb();
  fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => { res.setHeader('Content-Type', 'application/json');
    if (req.url === '/transaction/initialize') { const j = JSON.parse(b); paid[j.reference] = { amount: j.amount, status: 'abandoned' }; return res.end(JSON.stringify({ status: true, data: { authorization_url: 'https://pay.test/' + j.reference } })); }
    const m = req.url.match(/verify\/(.+)$/); const t = m && paid[m[1]]; res.end(JSON.stringify(t ? { status: true, data: { status: t.status, amount: t.amount, currency: 'NGN' } } : { status: false })); }); }).listen(FAKE);
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, PAYSTACK_SECRET: SECRET, PAYSTACK_ENABLED: '1', PS_BASE: 'http://127.0.0.1:' + FAKE, VP_BASE: 'http://127.0.0.1:9/', ADMIN_EMAIL: 'boss@test.com', BASE_URL: URL } });
  for (let i = 0; i < 30; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  await call('register', { email: 'pay@test.com', pass: 'secret123', agree: true });
});
test.after(async () => { proc.kill(); fake.close(); await db.drop(); });
const ref = u => u.split('/').pop();

test('rejects bad amounts', async () => {
  for (const a of [50, 600000, 10.5, 'abc']) assert.equal((await call('pay/init', { amount: a })).ok, false);
});
test('unpaid payment does not credit the wallet', async () => {
  const r = await call('pay/init', { amount: 2000 }); assert.equal(r.ok, true);
  const v = await call('pay/verify', { ref: ref(r.url) }); assert.notEqual(v.status, 'paid'); assert.equal((await call('me')).user.bal, 0);
});
test('paid payment credits once, even if verified and webhooked repeatedly', async () => {
  const r = await call('pay/init', { amount: 5000 }), rf = ref(r.url); paid[rf].status = 'success';
  assert.equal((await call('pay/verify', { ref: rf })).status, 'paid');
  assert.equal((await call('pay/verify', { ref: rf })).status, 'paid');
  const body = JSON.stringify({ event: 'charge.success', data: { reference: rf } });
  const sig = crypto.createHmac('sha512', SECRET).update(body).digest('hex');
  assert.equal((await fetch(URL + '/api/paystack/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': sig }, body })).status, 200);
  assert.equal((await call('me')).user.bal, 5000);
});
test('a payment with the wrong amount is refused', async () => {
  const r = await call('pay/init', { amount: 3000 }), rf = ref(r.url); paid[rf] = { amount: 100, status: 'success' };
  assert.equal((await call('pay/verify', { ref: rf })).status, 'failed'); assert.equal((await call('me')).user.bal, 5000);
});
test('a forged webhook is rejected and credits nothing', async () => {
  const r = await call('pay/init', { amount: 1000 }), rf = ref(r.url); paid[rf].status = 'success';
  const body = JSON.stringify({ event: 'charge.success', data: { reference: rf } });
  const bad = crypto.createHmac('sha512', 'wrong').update(body).digest('hex');
  assert.equal((await fetch(URL + '/api/paystack/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-paystack-signature': bad }, body })).status, 401);
  assert.equal((await call('me')).user.bal, 5000);
});
test("one user cannot verify another user's payment", async () => {
  const r = await call('pay/init', { amount: 1000 }); cookie = '';
  await call('register', { email: 'other@test.com', pass: 'secret123', agree: true });
  assert.equal((await call('pay/verify', { ref: ref(r.url) })).ok, false);
});
