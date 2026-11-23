// Bank transfer funding: order, receipt upload, admin approval. Run with: npm test
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
let db;
const { spawn } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = 3700 + Math.floor(Math.random() * 200), URL = 'http://localhost:' + PORT;
const jar = {}; let proc;
const call = async (who, p, body) => {
  const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jar[who] || '' }, body: JSON.stringify(body || {}) });
  const c = r.headers.get('set-cookie'); if (c) jar[who] = c.split(';')[0];
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};
// tiny but valid files: a PNG header + padding, a PDF header + padding
const png = (seed = 'a') => 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from(seed.repeat(400))]).toString('base64');
const pdf = 'data:application/pdf;base64,' + Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.from('x'.repeat(400))]).toString('base64');
const BANK = { accounts: [{ bank: 'OPay', name: 'Test Business', number: '8012345678' }, { bank: '', name: '', number: '' }] };

test.before(async () => {
  db = await H.newDb();
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', VP_API_KEY: 'test', VP_BASE: 'http://127.0.0.1:9/', PAYSTACK_SECRET: 'sk_test_x', BASE_URL: URL } });
  for (let i = 0; i < 30; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  await call('admin', 'register', { name: 'Boss', email: 'boss@test.com', pass: 'secret123', agree: true, phone: H.phone() });
  await call('ann', 'register', { name: 'Ann', email: 'ann@test.com', pass: 'secret123', agree: true, phone: H.phone() });
  await call('bob', 'register', { name: 'Bob', email: 'bob@test.com', pass: 'secret123', agree: true, phone: H.phone() });
});
test.after(async () => { proc.kill(); await db.drop(); });

test('Paystack is "temporarily unavailable" until the admin switches it on', async () => {
  assert.equal((await call('ann', 'me')).paystackLive, false);
  const r = await call('ann', 'pay/init', { amount: 1000 }); assert.equal(r.ok, false); assert.match(r.msg, /temporarily unavailable/i);
  assert.equal((await call('ann', 'admin/paystack', { on: true })).status, 403); // customers cannot flip it
  assert.equal((await call('admin', 'admin/paystack', { on: true })).ok, true); assert.equal((await call('ann', 'me')).paystackLive, true);
  assert.equal((await call('admin', 'admin/paystack', { on: false })).ok, true); assert.equal((await call('ann', 'me')).paystackLive, false);
});
test('no transfer can start until the admin has entered bank details; details are validated', async () => {
  assert.equal((await call('ann', 'me')).bankReady, false);
  assert.equal((await call('ann', 'transfer/create', { amount: 5000 })).ok, false);
  assert.equal((await call('ann', 'admin/bank/save', BANK)).ok, false); // customer is refused
  assert.equal((await call('admin', 'admin/bank/save', { accounts: [{ bank: 'OPay', name: 'X', number: '12ab' }] })).ok, false);
  assert.equal((await call('admin', 'admin/bank/save', BANK)).ok, true);
  assert.equal((await call('ann', 'me')).bankReady, true);
});
test('creating a transfer: amount rules, reference, bank accounts shown, max 3 unfinished', async () => {
  assert.equal((await call('ann', 'transfer/create', { amount: 50 })).ok, false);
  assert.equal((await call('ann', 'transfer/create', { amount: 1000.5 })).ok, false);
  const a = await call('ann', 'transfer/create', { amount: 5000 }); assert.equal(a.ok, true);
  assert.match(a.transfer.ref, /^DT-[0-9A-F]{8}$/); assert.equal(a.transfer.status, 'awaiting_transfer'); assert.equal(a.transfer.banks[0].number, '8012345678');
  await call('ann', 'transfer/create', { amount: 1000 }); await call('ann', 'transfer/create', { amount: 2000 });
  assert.equal((await call('ann', 'transfer/create', { amount: 3000 })).ok, false);
  const l = await call('ann', 'transfer/list'); for (const t of l.rows.filter(x => x.amt !== 5000)) await call('ann', 'transfer/cancel', { ref: t.ref });
});
test('full flow: made -> receipt -> admin approves -> wallet credited exactly once', async () => {
  const ref = (await call('ann', 'transfer/list')).rows.find(x => x.status === 'awaiting_transfer').ref;
  assert.equal((await call('ann', 'transfer/made', { ref })).transfer.status, 'awaiting_proof');
  assert.equal((await call('ann', 'transfer/proof', { ref, dataUrl: 'data:text/html;base64,PGI+', name: 'x' })).ok, false);                 // not an image/pdf
  assert.equal((await call('ann', 'transfer/proof', { ref, dataUrl: 'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>'.repeat(30)).toString('base64'), name: 'x.png' })).ok, false); // disguised file
  assert.equal((await call('ann', 'transfer/proof', { ref, dataUrl: 'data:image/png;base64,' + Buffer.alloc(3.2 * 1024 * 1024, 1).toString('base64') })).ok, false); // too big
  const up = await call('ann', 'transfer/proof', { ref, dataUrl: png('r1'), name: 'receipt.png' }); assert.equal(up.ok, true); assert.equal(up.transfer.status, 'proof_uploaded');
  assert.equal((await call('bob', 'transfer/get', { ref })).ok, false);                                  // another customer cannot see it
  assert.equal((await call('ann', 'admin/transfer/approve', { ref })).status, 403);                       // customers cannot approve
  const rec = await fetch(URL + '/api/admin/transfer/' + ref + '/receipt', { headers: { cookie: jar.ann } }); assert.equal(rec.status, 403);
  const adminRec = await fetch(URL + '/api/admin/transfer/' + ref + '/receipt', { headers: { cookie: jar.admin } }); assert.equal(adminRec.status, 200); assert.equal(adminRec.headers.get('content-type'), 'image/png');
  const list = await call('admin', 'admin/transfers'); assert.equal(list.rows[0].ref, ref); assert.equal(list.rows[0].email, 'ann@test.com'); // waiting ones come first
  assert.equal((await call('admin', 'admin/stats')).transfersPending, 1);
  const before = (await call('ann', 'me')).user.bal;
  const ok = await call('admin', 'admin/transfer/approve', { ref }); assert.equal(ok.ok, true);
  assert.equal((await call('ann', 'me')).user.bal, before + 5000);
  const again = await call('admin', 'admin/transfer/approve', { ref }); assert.equal(again.ok, false); // no double credit
  assert.equal((await call('ann', 'me')).user.bal, before + 5000);
  assert.equal((await call('ann', 'transfer/get', { ref })).transfer.status, 'approved');
  const s = await call('admin', 'admin/stats'); assert.equal(s.ledger, s.held); assert.equal(s.transfersPending, 0);
});
test('admin can credit the amount actually received, and reject with a reason so the customer can retry', async () => {
  const a = await call('bob', 'transfer/create', { amount: 10000 }); const ref = a.transfer.ref;
  await call('bob', 'transfer/proof', { ref, dataUrl: pdf, name: 'slip.pdf' });
  assert.equal((await call('admin', 'admin/transfer/reject', { ref, reason: 'no' })).ok, false);            // reason too short
  assert.equal((await call('admin', 'admin/transfer/reject', { ref, reason: 'Amount does not match our bank alert' })).ok, true);
  const t = (await call('bob', 'transfer/get', { ref })).transfer; assert.equal(t.status, 'rejected'); assert.match(t.reason, /does not match/);
  assert.equal((await call('bob', 'transfer/proof', { ref, dataUrl: png('r2'), name: 'again.png' })).transfer.status, 'proof_uploaded'); // can upload again
  assert.equal((await call('admin', 'admin/transfer/approve', { ref, amount: 0 })).ok, false);
  assert.equal((await call('admin', 'admin/transfer/approve', { ref, amount: 9500 })).ok, true);           // customer actually sent 9,500
  assert.equal((await call('bob', 'me')).user.bal, 9500);
  assert.equal((await call('bob', 'transfer/cancel', { ref })).ok, false);                                  // finished transfers cannot be cancelled
});
test('the same receipt image used twice is flagged before approval', async () => {
  const a = (await call('ann', 'transfer/create', { amount: 2000 })).transfer.ref;
  await call('ann', 'transfer/proof', { ref: a, dataUrl: png('r1'), name: 'same.png' });                   // same bytes as the first approved receipt
  const r = await call('admin', 'admin/transfer/approve', { ref: a }); assert.equal(r.ok, false); assert.ok(r.dup);
  assert.ok((await call('admin', 'admin/transfers')).rows.find(x => x.ref === a).dup);
  assert.equal((await call('admin', 'admin/transfer/approve', { ref: a, force: true })).ok, true);          // admin can still override on purpose
  const s = await call('admin', 'admin/stats'); assert.equal(s.ledger, s.held);
});
test('a customer who paid but never uploaded a receipt can still be approved by the admin; cancelled ones cannot', async () => {
  const a = (await call('bob', 'transfer/create', { amount: 1500 })).transfer.ref;
  assert.equal((await call('admin', 'admin/transfer/approve', { ref: a })).ok, true);
  const b = (await call('bob', 'transfer/create', { amount: 1600 })).transfer.ref; await call('bob', 'transfer/cancel', { ref: b });
  assert.equal((await call('admin', 'admin/transfer/approve', { ref: b })).ok, false);
});
