// Security tests: cross-site blocking, two-step login, session revocation, shared rate limits, cron protection, receipt limits, database RLS.
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
const { spawn } = require('child_process'), crypto = require('crypto'), path = require('path'), { Client } = require('pg');
let db; const procs = [];
const PORT = 6100 + Math.floor(Math.random() * 300), URL = 'http://localhost:' + PORT, URL2 = 'http://localhost:' + (PORT + 1), CRON = 'cron-secret-for-tests';
const jars = {};
const call = async (who, p, body, base = URL, headers = {}) => {
  const r = await fetch(base + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: jars[who] || '', ...headers }, body: JSON.stringify(body || {}) });
  const c = r.headers.get('set-cookie'); if (c) jars[who] = c.split(';')[0];
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
};
const boot = async (port) => {
  const p = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT: port, DATABASE_URL: db.url, ADMIN_EMAIL: 'boss@test.com', VP_API_KEY: 'test', VP_BASE: 'http://127.0.0.1:9/', PAYSTACK_SECRET: '', CRON_SECRET: CRON, BASE_URL: 'http://localhost:' + port } });
  procs.push(p);
  for (let i = 0; i < 40; i++) { try { if ((await fetch('http://localhost:' + port + '/health')).ok) return; } catch {} await new Promise(r => setTimeout(r, 200)); }
  throw new Error('server did not start');
};
// the same authenticator maths the phone app uses
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32dec = s => { let bits = ''; for (const c of s) bits += B32.indexOf(c).toString(2).padStart(5, '0'); const out = []; for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(out); };
const codeAt = (secret, step) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(step)); const h = crypto.createHmac('sha1', b32dec(secret)).update(b).digest(), o = h[19] & 15; return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0'); };
const nowStep = () => Math.floor(Date.now() / 30000);

test.before(async () => {
  db = await H.newDb(); await boot(PORT); await boot(PORT + 1);
  await call('admin', 'register', { email: 'boss@test.com', pass: 'secret123', agree: true });
  await call('ann', 'register', { email: 'ann@test.com', pass: 'secret123', agree: true });
});
test.after(async () => { procs.forEach(p => p.kill()); await db.x('DROP OWNED BY dv_probe').catch(() => {}); await db.x('DROP ROLE IF EXISTS dv_probe').catch(() => {}); await db.drop(); });

test('requests that come from another website are blocked', async () => {
  assert.equal((await call('ann', 'me', {}, URL, { Origin: 'https://evil.example' })).status, 403);
  assert.equal((await call('ann', 'me', {}, URL, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  assert.equal((await call('ann', 'me', {}, URL, { Origin: URL })).status, 200);
});
test('sessions are kept in the database', async () => {
  const rows = await db.q('SELECT uid FROM sess WHERE uid IS NOT NULL'); assert.ok(rows.length >= 2);
});
test('changing a password signs out the other devices', async () => {
  await call('ann2', 'login', { email: 'ann@test.com', pass: 'secret123' }); assert.equal((await call('ann2', 'me')).status, 200);
  assert.equal((await call('ann', 'profile', { current: 'secret123', pass: 'newsecret456' })).ok, true);
  assert.equal((await call('ann2', 'me')).status, 401); assert.equal((await call('ann', 'me')).status, 200);
});
test('admin two-step login: needs a code, rejects wrong and reused codes', async () => {
  assert.equal((await call('ann', '2fa/setup')).status, 403); // customers cannot use it
  const s = await call('admin', '2fa/setup'); assert.ok(/^[A-Z2-7]{32}$/.test(s.secret)); assert.match(s.url, /^otpauth:\/\/totp\//);
  assert.equal((await call('admin', '2fa/enable', { code: '000000' })).ok, false);
  assert.equal((await call('admin', '2fa/enable', { code: codeAt(s.secret, nowStep()) })).ok, true);
  assert.equal((await call('admin', 'me')).twofa, true);
  await call('admin', 'logout');
  const noCode = await call('admin', 'login', { email: 'boss@test.com', pass: 'secret123' }); assert.equal(noCode.ok, false); assert.equal(noCode.needCode, true);
  assert.equal((await call('admin', 'login', { email: 'boss@test.com', pass: 'secret123', code: '123456' })).ok, false);
  assert.equal((await call('admin', 'login', { email: 'boss@test.com', pass: 'wrongpass1', code: codeAt(s.secret, nowStep() + 1) })).ok, false); // right code, wrong password
  const good = codeAt(s.secret, nowStep() + 1);
  assert.equal((await call('admin', 'login', { email: 'boss@test.com', pass: 'secret123', code: good })).ok, true);
  await call('admin', 'logout');
  assert.equal((await call('admin', 'login', { email: 'boss@test.com', pass: 'secret123', code: good })).ok, false); // the same code cannot be used twice
  assert.equal((await call('admin', 'login', { email: 'boss@test.com', pass: 'secret123', code: codeAt(s.secret, nowStep() + 1) })).ok, false);
});
test('scheduled-jobs endpoint refuses callers without the secret', async () => {
  assert.equal((await fetch(URL + '/api/cron/jobs')).status, 401);
  assert.equal((await fetch(URL + '/api/cron/jobs', { headers: { Authorization: 'Bearer wrong' } })).status, 401);
  const ok = await fetch(URL + '/api/cron/jobs', { headers: { Authorization: 'Bearer ' + CRON } }); assert.equal(ok.status, 200); assert.equal((await ok.json()).ok, true);
});
test('receipts above 2.5 MB are refused; real small ones are accepted', async () => {
  await db.x("INSERT INTO settings(k,v) VALUES('bank1_bank','OPay'),('bank1_name','Test Business'),('bank1_number','8012345678') ON CONFLICT (k) DO NOTHING");
  const t = await call('ann', 'transfer/create', { amount: 5000 }); assert.equal(t.ok, true);
  const png = n => 'data:image/png;base64,' + Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(n, 97)]).toString('base64');
  const big = await call('ann', 'transfer/proof', { ref: t.transfer.ref, dataUrl: png(2.6 * 1024 * 1024) }); assert.equal(big.ok, false); assert.match(big.msg, /2\.5 MB/);
  assert.equal((await call('ann', 'transfer/proof', { ref: t.transfer.ref, dataUrl: png(500) })).ok, true);
});
test('only the admin can open a receipt', async () => {
  const ref = (await db.q("SELECT ref FROM transfers LIMIT 1"))[0].ref;
  assert.equal((await fetch(URL + '/api/admin/transfer/' + ref + '/receipt')).status, 401);
  const r = await fetch(URL + '/api/admin/transfer/' + ref + '/receipt', { headers: { cookie: jars.ann } }); assert.equal(r.status, 403);
});
test('the database refuses to show data to anyone without a policy (row level security)', async () => {
  await db.x("DROP ROLE IF EXISTS dv_probe"); await db.x("CREATE ROLE dv_probe LOGIN PASSWORD 'probe'"); await db.x('GRANT USAGE ON SCHEMA public TO dv_probe'); await db.x('GRANT SELECT ON users TO dv_probe');
  assert.ok((await db.q('SELECT COUNT(*)::int n FROM users'))[0].n >= 2); // rows exist
  const u = new globalThis.URL(db.adminUrl); u.username = 'dv_probe'; u.password = 'probe';
  const c = new Client({ connectionString: u.toString() }); await c.connect();
  assert.equal((await c.query('SELECT COUNT(*)::int n FROM users')).rows[0].n, 0); await c.end(); // sees nothing
});
test('the restricted website user cannot change the database structure', async () => {
  const c = new Client({ connectionString: db.url }); await c.connect();
  await assert.rejects(c.query('DROP TABLE users')); await assert.rejects(c.query('CREATE TABLE evil(x int)')); await c.end();
});
test('login limits are shared between servers, even when guesses come from many addresses', async () => {
  const em = 'victim@test.com', bad = (base, i) => call('guess', 'login', { email: em, pass: 'nope-nope-1' }, base, { 'X-Forwarded-For': '203.0.113.' + i });
  for (let i = 1; i <= 6; i++) assert.equal((await bad(URL, i)).status, 200);
  for (let i = 7; i <= 10; i++) assert.equal((await bad(URL2, i)).status, 200);
  assert.equal((await bad(URL2, 11)).status, 429); assert.equal((await bad(URL, 12)).status, 429);
});
