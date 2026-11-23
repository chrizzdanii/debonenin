// Money-safety tests: simulated provider + simulated Paystack. All money moves through the real flows.
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
let db;
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = 5100 + Math.floor(Math.random() * 300), FAKE = PORT + 400, URL = 'http://localhost:' + PORT;
const jar = {}; const paid = {}; let proc, fake, lastCallback = '', lastStatusBody = null, ipeStatus = { success: true, data: { status: 'pending' } };
const call = async (who, p, body) => { const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jar[who] || '' }, body: JSON.stringify(body || {}) }); const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0]; return { status: r.status, ...(await r.json().catch(() => ({}))) }; };
const bal = async who => (await call(who, 'me')).user.bal;
const dbq = (s, ...a) => db.q(s, ...a);
const dbx = (s, ...a) => db.x(s, ...a);
const send = (res, o) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
test.before(async () => {
  db = await H.newDb();
  fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => { const j = JSON.parse(b || '{}'), u = req.url;
    if (u === '/transaction/initialize') { lastCallback = j.callback_url; paid[j.reference] = { amount: j.amount, status: 'abandoned' }; return send(res, { status: true, data: { authorization_url: 'https://pay.test/' + j.reference } }); }
    const m = u.match(/verify\/(.+)$/); if (m) { const t = paid[m[1]]; return send(res, t ? { status: true, data: { status: t.status, amount: t.amount, currency: 'NGN' } } : { status: false }); }
    if (u.endsWith('/nin_by_nin.php')) return send(res, j.nin === '77777777777' ? { message: 'NIN premium slip generated successfully' } : j.nin === '88888888888' ? { status: 'error', message: 'Server busy' } : { status: 'success', pdf_base64: 'JVBERi0=' });
    if (u.endsWith('/ipe.php')) return send(res, j.trackingID === 'T-BAD' ? { success: false, message: 'Invalid tracking id' } : j.trackingID === 'T-OK' ? { status: 'success', data: { transaction_id: 'TX9' } } : { status: 'error', message: 'Invalid tracking id' });
    if (u.endsWith('/validation.php')) return send(res, { success: true, message: 'NIN validation request submitted successfully.', data: { status: 'pending' } }); // accepted but no ids
    if (u.endsWith('/ipe_status.php')) { lastStatusBody = j; return send(res, ipeStatus); }
    if (u.endsWith('/lookup.php')) return send(res, { status: 'success', balance: 5000, services: [] });
    send(res, { status: 'error' }); }); }).listen(FAKE);
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, REQ_CHECK_COOLDOWN: '0', PORT, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', VP_API_KEY: 'test', VP_BASE: 'http://127.0.0.1:' + FAKE + '/', PS_BASE: 'http://127.0.0.1:' + FAKE, PAYSTACK_SECRET: 'sk_test_safety', PAYSTACK_ENABLED: '1', BASE_URL: 'https://yourdomain.com' } });
  for (let i = 0; i < 30; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  await call('admin', 'register', { email: 'boss@test.com', pass: 'secret123', agree: true });
  await call('cust', 'register', { email: 'cust@test.com', pass: 'secret123', agree: true });
});
test.after(async () => { proc.kill(); fake.close(); await db.drop(); });
const fund = async (who, n) => { const r = await call(who, 'pay/init', { amount: n }); const ref = r.url.split('/').pop(); paid[ref].status = 'success'; await call(who, 'pay/verify', { ref }); return r; };
const slip = nin => call('cust', 'run', { service: 'nin_premium', f: { nin } });

test('Paystack fee is added to what the customer pays; wallet gets the full amount', async () => {
  const r = await fund('cust', 5000); assert.equal(r.total, 5178); assert.equal(r.fee, 178); assert.equal(await bal('cust'), 5000);
});
test('return link works even when BASE_URL is still the placeholder', async () => assert.ok(lastCallback.startsWith('http://localhost:' + PORT + '/?paid=')));
test('an under-payment is not credited and is flagged for review', async () => {
  const r = await call('cust', 'pay/init', { amount: 2000 }), ref = r.url.split('/').pop(); paid[ref] = { amount: 100, status: 'success' };
  assert.equal((await call('cust', 'pay/verify', { ref })).status, 'failed'); assert.equal(await bal('cust'), 5000);
  assert.equal((await dbq('SELECT status FROM pay WHERE ref=?', ref))[0].status, 'review');
});
test('customers see their own payments; admin sees all; customers cannot use admin tools', async () => {
  assert.ok((await call('cust', 'pay/list')).rows.length >= 2);
  assert.ok((await call('admin', 'admin/payments')).rows.length >= 2);
  for (const p of ['admin/payments', 'admin/pay/recheck', 'admin/requests', 'admin/req/refund', 'admin/provider-check']) assert.equal((await call('cust', p)).status, 403);
});
test('a "generated successfully" reply with no file is still charged (the real bug), with a notice and an alert', async () => {
  await fund('cust', 5000); const b = await bal('cust'), r = await slip('77777777777');
  assert.equal(r.ok, true); assert.ok(r.notice); assert.equal(await bal('cust'), b - 300);
  assert.ok((await dbq("SELECT 1 FROM admin_log WHERE action='slip_without_file'")).length);
});
test('a normal slip is charged; a provider failure is refunded', async () => {
  const b = await bal('cust'); assert.equal((await slip('11111111111')).ok, true); assert.equal(await bal('cust'), b - 300);
  const c = await bal('cust'); assert.equal((await slip('88888888888')).ok, false); assert.equal(await bal('cust'), c);
});
test('agency request accepted WITHOUT a request id keeps the money and goes to review (no silent loss)', async () => {
  await fund('cust', 5000); const b = await bal('cust'), r = await call('cust', 'run', { service: 'validation', f: { nin: '12345678901', error_type: 'sim' } });
  assert.equal(r.ok, true); assert.equal(await bal('cust'), b - 800);
  const row = (await dbq("SELECT id,status FROM reqs WHERE ref='REVIEW'"))[0]; assert.equal(row.status, 'review');
  assert.equal((await call('admin', 'admin/requests')).rows.find(x => x.id === row.id).status, 'review');
  assert.equal((await call('admin', 'admin/req/refund', { id: row.id })).ok, true); assert.equal(await bal('cust'), b);
  assert.equal((await call('admin', 'admin/req/refund', { id: row.id })).ok, false); assert.equal(await bal('cust'), b);
});
test('agency request with an id stays pending until a real result arrives', async () => {
  const b = await bal('cust'); assert.equal((await call('cust', 'run', { service: 'ipe', f: { trackingID: 'T-OK' } })).ok, true); assert.equal(await bal('cust'), b - 800);
  const id = (await dbq("SELECT id FROM reqs WHERE ref='TX9'"))[0].id;
  ipeStatus = { success: true, data: { status: 'pending', trackingID: 'T-OK' } }; assert.equal((await call('cust', 'req/check', { id })).status, 'pending'); assert.equal(lastStatusBody.trackingID, 'T-OK');
  ipeStatus = { success: true, data: { status: 'completed', newNIN: '12345678901', newTrackingID: 'ABC', transaction_id: 'x', amount_charged: '500.00' } };
  const done = await call('cust', 'req/check', { id }); assert.equal(done.status, 'completed'); assert.equal(done.data.newNIN, '12345678901'); assert.equal(done.data.amount_charged, undefined); // provider money fields are never shown to customers
});
test('a rejected agency request is refunded', async () => {
  const b = await bal('cust'); assert.equal((await call('cust', 'run', { service: 'ipe', f: { trackingID: 'T-BAD' } })).ok, false); assert.equal(await bal('cust'), b);
});
test('prices can never go below the provider price', async () => {
  const r = await call('admin', 'admin/price', { key: 'nin_premium', price: 50, cost: 100, active: true }); assert.equal(r.ok, false); assert.match(r.msg, /lower than the provider/);
  await dbx("UPDATE prices SET price=40 WHERE k='nin_premium'");
  assert.equal((await call('cust', 'me')).services.find(s => s.key === 'nin_premium').price, 100);
  await dbx("UPDATE prices SET price=300 WHERE k='nin_premium'");
});
test('provider connection check reports reachability and balance', async () => {
  const r = await call('admin', 'admin/provider-check'); assert.equal(r.reachable, true); assert.equal(r.balance, 5000);
});
test('wallet records always add up (no money created or lost)', async () => {
  const s = await call('admin', 'admin/stats'); assert.equal(s.ledger, s.held);
});
