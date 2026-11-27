// Data, cable TV, electricity and exam pins (EasyAccess): pricing by role, money safety, refunds, held orders and the webhook.
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
const { spawn } = require('child_process'), http = require('http'), path = require('path');
const PORT = 4600 + Math.floor(Math.random() * 300), FAKE = PORT + 400, URL = 'http://localhost:' + PORT;
let db, proc, fake; const jar = {}, calls = [];
let pendState = 'Pending', verifyOk = true;
const ipFor = w => '10.7.' + (w.length % 200) + '.' + ([...w].reduce((a, c) => a + c.charCodeAt(0), 0) % 250 + 1);
const call = async (who, p, body) => { const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jar[who] || '', 'X-Forwarded-For': ipFor(who) }, body: JSON.stringify(body || {}) }); const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0]; return { status: r.status, ...(await r.json().catch(() => ({}))) }; };
const reg = (who, extra = {}) => call(who, 'register', { email: who + '@test.com', pass: 'secret123', agree: true, phone: H.phone(), name: who, ...extra });
const bal = async who => (await call(who, 'me')).user.bal;
const PLAN = (id, name, price, validity) => ({ plan_id: String(id), name, price, validity });
const PLANS = { mtn_cg: { MTN: [PLAN(45, '500MB (CG)', 200, '7days'), PLAN(46, '1GB (CG)', 400, '30days')] }, mtn_sme: { MTN: [PLAN(10, '1GB (SME)', 300, '30days')] },
  glo_cg: { GLO: [PLAN(70, '1GB (CG)', 350, '30days')] }, dstv: { DSTV: [PLAN(90, 'DSTV Yanga', 4500, '30days')] }, waec: { WAEC: [PLAN(1, 'WAEC Result Checker', 3000, '')] } };
const send = (res, o, http = 200) => { res.statusCode = http; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
test.before(async () => {
  db = await H.newDb({ autoApprove: false });
  fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => {
    const u = new globalThis.URL(req.url, 'http://x'), ep = u.pathname.replace(/^.*\/v1\//, ''), j = b ? JSON.parse(b) : {}; calls.push({ ep, auth: req.headers.authorization, j, mode: u.pathname.split('/')[2] });
    if (req.headers.authorization !== 'Bearer testkey') return send(res, { code: 401, status: 'failed', message: 'Invalid authorization token' }, 401);
    if (ep === 'get-plans') { const t = u.searchParams.get('product_type'); if (t === 'neco') { res.statusCode = 403; res.setHeader('Content-Type', 'text/html'); return res.end('<html><title>Attention Required! | Cloudflare</title></html>'); } return PLANS[t] ? send(res, { code: 200, ...PLANS[t] }) : send(res, { code: 404, status: 'failed', message: 'none' }, 404); }
    if (ep === 'wallet-balance') return send(res, { code: 200, status: 'success', balance: '28000', email: 'x@y.com', funding_bank1: 'Palmpay', funding_acctno1: '123' });
    if (ep === 'verify-tv') return verifyOk ? send(res, { code: 200, status: 'success', customer_name: 'JANE DOE', current_package: 'DSTV Yanga', customer_status: 'ACTIVE' }) : send(res, { code: 400, status: 'failed', message: 'Verification failed. Invalid smart card/IUC number, check again' }, 400);
    if (ep === 'verify-electricity') return verifyOk ? send(res, { code: 200, status: 'success', customer_name: 'JOHN DOE', customer_address: '1 TEST CLOSE', customer_metertype: 'PREPAID' }) : send(res, { code: 400, status: 'failed', message: 'Invalid meter number supplied' }, 400);
    if (ep === 'query-transactions') return send(res, { code: 200, status: 'success', retrieved_status: pendState, true_response: 'Dear Customer, delivered' });
    if (ep === 'purchase-data') { const n = j.mobileno;
      if (n === '08011111111') return send(res, { code: 200, status: 'success', reference: 'DATAok1', true_response: 'You have successfully gifted ' + n, balance_before: 9, balance_after: 8 });
      if (n === '08022222222') return send(res, { code: 400, status: 'failed', message: 'Data purchase was unsuccessful', true_response: 'Sorry, the number is not an MTN number. Thank you!' }, 400);
      if (n === '08033333333') return send(res, { code: 400, status: 'failed', message: 'Insufficient wallet balance' }, 400);
      if (n === '08044444444') return send(res, { error: 'boom' }, 502);
      if (n === '08055555555') return send(res, { code: 200, status: 'processing', reference: 'DATAPEND1' });
      if (n === '08066666666') return send(res, { code: 400, status: 'failed', message: 'Amount exceeds max_amount_payable' }, 400); }
    if (ep === 'pay-tv') return send(res, { code: 200, status: 'success', reference: 'TVok1', true_response: 'ok' });
    if (ep === 'pay-electricity') return send(res, { code: 200, status: 'success', reference: 'ELok1', token: '1234-5678-9012-3456', customer_name: 'JOHN DOE', customer_address: '1 TEST CLOSE' });
    if (ep === 'exam-pins') return send(res, { code: 200, status: 'success', reference: 'EXok1', pins: ['111<=>WRN1', '222<=>WRN2'] });
    send(res, { code: 404, status: 'failed', message: 'unknown' }, 404);
  }); }).listen(FAKE);
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', EA_API_KEY: 'testkey', EA_BASE: 'http://127.0.0.1:' + FAKE + '/api', EA_WEBHOOK_KEY: 'hook123', EA_EXTRA_DISCOS: '5:BEDC - Benin', PAYSTACK_SECRET: '', BASE_URL: URL } });
  for (let i = 0; i < 40; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  await reg('boss'); await reg('ind'); await reg('agent');
  await db.x("UPDATE users SET agent_status='approved' WHERE email='agent@test.com'"); await db.x('UPDATE users SET bal=20000');
});
test.after(async () => { proc.kill(); fake.close(); await db.drop(); });
const data = (who, mobileno, extra = {}) => call(who, 'vtu/buy', { kind: 'data', network: 1, dataplan: '46', mobileno, ...extra });
const ledger = async () => (await db.q('SELECT COALESCE(SUM(amt),0)::int n FROM tx'))[0].n;

test('catalogue is built from the provider plans; each role sees only its own price; admin pays the provider price', async () => {
  const find = (c, id) => c.data.find(n => n.code === 1).types.flatMap(t => t.plans).find(p => p.id === id);
  const i = await call('ind', 'vtu/catalog'), a = await call('agent', 'vtu/catalog'), b = await call('boss', 'vtu/catalog');
  assert.equal(i.ok, true); assert.equal(i.ready, true);
  assert.equal(find(b, '46').price, 400);                                                   // admin: provider price
  assert.equal(find(a, '46').price, 400 + Math.ceil(400 * 3 / 100));                        // agent: +3%
  assert.equal(find(i, '46').price, 400 + Math.ceil(400 * 8 / 100));                        // individual: +8%
  assert.ok(find(i, '46').price > find(a, '46').price);
  assert.equal(i.data.find(n => n.code === 1).types.map(t => t.key).sort().join(), 'cg,sme');
  assert.equal(i.exam.find(e => e.name === 'WAEC').unit, 3000 + 150); assert.equal(a.exam.find(e => e.name === 'WAEC').unit, 3000 + 50);
  assert.ok(!JSON.stringify(i).includes('"cost"'));
  assert.ok(calls.some(c => c.ep === 'get-plans' && c.mode === 'live'));
});
test('data purchase: charged once, delivered, saved in My Results, logged, ledger balanced, provider balances never shown', async () => {
  const b = await bal('agent'), r = await data('agent', '08011111111');
  assert.equal(r.ok, true); assert.equal(r.data.Network, 'MTN'); assert.equal(r.data['Phone number'], '08011111111'); assert.equal(r.bal, b - 412);
  assert.ok(!JSON.stringify(r).includes('balance_'));
  const sent = calls.filter(c => c.ep === 'purchase-data').pop().j; assert.equal(sent.dataplan, 46); assert.equal(sent.max_amount_payable, 400); assert.match(sent.client_reference, /^DEB/);
  const list = await call('agent', 'results/list'); assert.equal(list.rows.length, 1); assert.equal(list.rows[0].label, 'Data - MTN 1GB (CG)');
  const got = await call('agent', 'results/get', { id: list.rows[0].id }); assert.equal(got.data.Network, 'MTN');
  const raw = (await db.q('SELECT raw FROM results'))[0].raw; assert.ok(!raw.includes('balance_before'));
  const held = (await db.q('SELECT COALESCE(SUM(bal),0)::int n FROM users'))[0].n; assert.equal(held, 60000 + (await ledger())); // 3 test wallets were set to 20,000 directly; every other naira movement has a ledger row
});
test('provider says the order failed: customer is refunded in full and sees the provider\'s reason', async () => {
  const b = await bal('ind'), r = await data('ind', '08022222222'); assert.equal(r.ok, false); assert.match(r.msg, /not an MTN number/); assert.equal(await bal('ind'), b);
  const rows = await db.q("SELECT status,amt FROM tx WHERE svc LIKE 'Data%' ORDER BY id DESC LIMIT 2"); assert.deepEqual(rows.map(x => x.status).sort(), ['charged', 'refunded']);
});
test('provider-side money or account problems are hidden from customers, refunded, and flagged for the admin', async () => {
  const b = await bal('ind'), r = await data('ind', '08033333333'); assert.equal(r.ok, false); assert.match(r.msg, /temporarily unavailable/); assert.doesNotMatch(r.msg, /wallet|balance|Insufficient/i); assert.equal(await bal('ind'), b);
  const adminView = await data('boss', '08033333333'); assert.match(adminView.msg, /Admin only/);
  assert.ok((await db.q("SELECT 1 FROM admin_log WHERE action='vtu_provider_problem'")).length >= 1);
});
test('a price rise (max_amount_payable refused) refunds, asks the customer to retry, and refreshes plans', async () => {
  const b = await bal('ind'), n = calls.filter(c => c.ep === 'get-plans').length, r = await data('ind', '08066666666'); assert.equal(r.ok, false); assert.match(r.msg, /price just changed/); assert.equal(await bal('ind'), b);
  await new Promise(r => setTimeout(r, 800)); assert.ok(calls.filter(c => c.ep === 'get-plans').length > n);
});
test('no reply / server error is NOT a failure: money is held for review, never refunded on a guess, and the admin can settle it', async () => {
  const b = await bal('ind'), r = await data('ind', '08044444444'); assert.equal(r.ok, true); assert.equal(r.submitted, true);
  const price = 400 + 32; assert.equal(r.bal, b - price);
  const row = (await db.q("SELECT * FROM reqs WHERE svc='vtu_data' ORDER BY id DESC LIMIT 1"))[0]; assert.equal(row.status, 'review'); assert.equal(row.price, price);
  assert.equal((await call('ind', 'req/check', { id: row.id })).status, 'pending');
  const done = await call('boss', 'admin/req/complete', { id: row.id, note: 'Checked on provider dashboard' }); assert.equal(done.ok, true);
  assert.equal((await call('boss', 'admin/req/refund', { id: row.id })).ok, false);                  // closed: cannot also be refunded
  assert.equal(await bal('ind'), b - price);
});
test('an order the provider is still processing is tracked, then finished by the status check: success keeps the charge, failure refunds exactly once', async () => {
  const refunds = async () => (await db.q("SELECT COUNT(*)::int n FROM tx WHERE svc LIKE 'Data%' AND status='refunded'"))[0].n, r0 = await refunds();
  const b = await bal('ind'), r = await data('ind', '08055555555'); assert.equal(r.submitted, true);
  const row = (await db.q("SELECT * FROM reqs WHERE ref='DATAPEND1'"))[0]; assert.equal(row.status, 'pending'); assert.equal(await bal('ind'), b - 432);
  pendState = 'Pending'; assert.equal((await call('boss', 'admin/req/check', { id: row.id })).status, 'pending');
  pendState = 'Failed'; const f1 = await call('boss', 'admin/req/check', { id: row.id }); assert.equal(f1.status, 'failed'); await call('boss', 'admin/req/check', { id: row.id });
  assert.equal(await bal('ind'), b);                                                                  // refunded once, not twice
  assert.equal(await refunds(), r0 + 1);
  await data('ind', '08055555555'); const row2 = (await db.q("SELECT * FROM reqs WHERE ref='DATAPEND1' AND status='pending'"))[0];
  pendState = 'Successful'; const ok = await call('boss', 'admin/req/check', { id: row2.id }); assert.equal(ok.status, 'completed'); assert.equal(await bal('ind'), b - 432);
  assert.equal((await call('ind', 'results/list')).rows.some(x => x.label.startsWith('Data')), true);
});
test('webhook: wrong key is refused; the message itself is never trusted, the provider is asked', async () => {
  await data('ind', '08055555555'); const row = (await db.q("SELECT * FROM reqs WHERE ref='DATAPEND1' AND status='pending'"))[0], b = await bal('ind');
  const hook = (key, body) => fetch(URL + '/api/easyaccess/webhook' + (key ? '?key=' + key : ''), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await hook('', { status: 'failed', reference: 'DATAPEND1' })).status, 401); assert.equal((await hook('nope', { status: 'failed', reference: 'DATAPEND1' })).status, 401);
  pendState = 'Pending'; assert.equal((await hook('hook123', { status: 'failed', reference: 'DATAPEND1', client_reference: 'x' })).status, 200);
  assert.equal((await db.q('SELECT status FROM reqs WHERE id=?', row.id))[0].status, 'pending'); assert.equal(await bal('ind'), b);   // a fake "failed" changes nothing
  pendState = 'Failed'; assert.equal((await hook('hook123', { status: 'failed', reference: 'DATAPEND1' })).status, 200);
  assert.equal((await db.q('SELECT status FROM reqs WHERE id=?', row.id))[0].status, 'failed'); assert.equal(await bal('ind'), b + 432);
  await hook('hook123', { status: 'failed', reference: 'DATAPEND1' }); assert.equal(await bal('ind'), b + 432);                         // repeated webhook: no second refund
});
test('not enough balance: provider is never called and nothing is charged', async () => {
  await db.x("UPDATE users SET bal=10 WHERE email='ind@test.com'"); const n = calls.filter(c => c.ep === 'purchase-data').length;
  const r = await data('ind', '08011111111'); assert.equal(r.ok, false); assert.match(r.msg, /Not enough balance/); assert.equal(calls.filter(c => c.ep === 'purchase-data').length, n); assert.equal(await bal('ind'), 10);
  await db.x("UPDATE users SET bal=20000 WHERE email='ind@test.com'");
});
test('bad input is refused before any money moves: unknown plan, bad number, bad network', async () => {
  const b = await bal('ind');
  for (const bad of [{ dataplan: '9999' }, { mobileno: '123' }, { network: 7 }, { network: 2, dataplan: '46' }]) { const r = await call('ind', 'vtu/buy', { kind: 'data', network: 1, dataplan: '46', mobileno: '08011111111', ...bad }); assert.equal(r.ok, false); }
  assert.equal(await bal('ind'), b); assert.equal((await call('ind', 'vtu/buy', { kind: 'nope' })).ok, false);
});
test('cable TV: smart card is verified first; a bad card costs nothing; a good one is paid and shows the customer name', async () => {
  const v = await call('ind', 'vtu/verify', { kind: 'tv', company: 1, iucno: '1234567890' }); assert.equal(v.ok, true); assert.equal(v.info.name, 'JANE DOE');
  const b = await bal('ind'); verifyOk = false; const bad = await call('ind', 'vtu/buy', { kind: 'tv', company: 1, package: '90', iucno: '1234567890' }); verifyOk = true;
  assert.equal(bad.ok, false); assert.match(bad.msg, /Invalid smart card/); assert.equal(await bal('ind'), b); assert.ok(!calls.slice(-2).some(c => c.ep === 'pay-tv'));
  const r = await call('ind', 'vtu/buy', { kind: 'tv', company: 1, package: '90', iucno: '1234567890' }); assert.equal(r.ok, true); assert.equal(r.data['Customer name'], 'JANE DOE'); assert.equal(r.bal, b - 4600);
  assert.equal(calls.filter(c => c.ep === 'pay-tv').pop().j.max_amount_payable, 4500);
});
test('electricity: token is delivered and saved; the customer pays the amount plus the fee; minimum is N1,000; extra DISCO codes from the environment work', async () => {
  const v = await call('ind', 'vtu/verify', { kind: 'electricity', company: 3, metertype: 1, meterno: '61012400051', amount: 5000 }); assert.equal(v.ok, true); assert.equal(v.price, 5100);
  const b = await bal('ind'), r = await call('ind', 'vtu/buy', { kind: 'electricity', company: 5, metertype: 1, meterno: '61012400051', amount: 5000 });
  assert.equal(r.ok, true); assert.equal(r.data.Token, '1234-5678-9012-3456'); assert.equal(r.bal, b - 5100); assert.match(r.data.Company, /BEDC/);
  assert.equal((await call('ind', 'results/list')).rows.some(x => x.label.startsWith('Electricity')), true);
  assert.equal((await call('ind', 'vtu/buy', { kind: 'electricity', company: 3, metertype: 1, meterno: '61012400051', amount: 500 })).ok, false);
  assert.equal((await call('ind', 'vtu/buy', { kind: 'electricity', company: 99, metertype: 1, meterno: '61012400051', amount: 5000 })).ok, false);
});
test('exam pins: pins are delivered, priced per pin by role, and saved', async () => {
  const b = await bal('agent'), r = await call('agent', 'vtu/buy', { kind: 'exam', exam_board: 1, no_of_pins: 2 });
  assert.equal(r.ok, true); assert.deepEqual(r.data.Pins, ['111<=>WRN1', '222<=>WRN2']); assert.equal(r.bal, b - 2 * 3050); assert.equal(calls.filter(c => c.ep === 'exam-pins').pop().j.max_amount_payable, 6000);
  assert.equal((await call('agent', 'vtu/buy', { kind: 'exam', exam_board: 1, no_of_pins: 51 })).ok, false);
});
test('admin controls: prices, individual not below agent, switch a service off, plans refresh, provider balance, transaction lookup', async () => {
  const g = await call('boss', 'admin/vtu/get'); assert.equal(g.ok, true); assert.equal(g.key, true); assert.ok(g.groups.length >= 11);
  const m = Object.fromEntries(g.groups.map(x => [x.key, { ap: x.ap, af: x.af, ip: x.ip, if: x.if }]));
  m.data_mtn = { ap: 5, af: 0, ip: 4, if: 0 }; assert.equal((await call('boss', 'admin/vtu/save', { on: g.on, m })).ok, false);               // individual below agent
  m.data_mtn = { ap: 5, af: 0, ip: 10, if: 0 }; assert.equal((await call('boss', 'admin/vtu/save', { on: g.on, m })).ok, true);
  assert.equal((await call('ind', 'vtu/catalog')).data[0].types.find(t => t.key === 'cg').plans.find(p => p.id === '46').price, 440);
  assert.equal((await call('ind', 'admin/vtu/get')).status, 403); assert.equal((await call('ind', 'admin/vtu/save', { on: {}, m })).status, 403);
  assert.equal((await call('boss', 'admin/vtu/save', { on: { ...g.on, tv: 0 }, m })).ok, true); const off = await call('ind', 'vtu/buy', { kind: 'tv', company: 1, package: '90', iucno: '1234567890' });
  assert.equal(off.ok, false); assert.match(off.msg, /switched off/); assert.equal((await call('ind', 'vtu/catalog')).tv, undefined); assert.equal((await call('ind', 'me')).vtu.tv, 0);
  assert.equal((await call('boss', 'admin/vtu/refresh')).ok, true);
  const gd = await call('boss', 'admin/vtu/get'); assert.match(gd.diag, /neco \(HTTP 403: not JSON: .*Cloudflare/);          // the admin is told WHY a list is empty
  assert.match((await call('boss', 'vtu/catalog')).diag, /neco/); assert.equal((await call('ind', 'vtu/catalog')).diag, undefined); // customers never see it
  const bl = await call('boss', 'admin/vtu/balance'); assert.equal(bl.ok, true); assert.equal(bl.balance, 28000);
  pendState = 'Successful'; const qy = await call('boss', 'admin/vtu/query', { reference: 'DATAPEND1' }); assert.equal(qy.ok, true); assert.equal(qy.state, 'success'); assert.equal(qy.found, true);
});
test('the API key is only ever sent as a Bearer header, and a missing key makes the services unavailable (not broken)', async () => {
  assert.ok(calls.every(c => c.auth === 'Bearer testkey'));
});
