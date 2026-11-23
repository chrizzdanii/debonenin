// Checks that different provider reply formats are read correctly (customer charged only on a real result).
const test = require('node:test'), assert = require('node:assert'), H = require('./helpers');
if (H.skip) { test('database tests (skipped)', { skip: H.skip }, () => {}); return; }
let db;
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), os = require('os'), path = require('path');
const PORT = 4200 + Math.floor(Math.random() * 300), FAKE = PORT + 400, URL = 'http://localhost:' + PORT;
let proc, fake, cookie = '';
const REPLY = {
  '11111111111': { status: 'success', response_code: '00', user_data: { first_name: 'A' }, message: 'PDF generated successfully', pdf_base64: 'JVBERi0=' },
  '22222222222': { message: 'NIN premium slip generated successfully', pdf_base64: 'JVBERi0=', data: { first_name: 'B' } },
  '33333333333': { success: true, message: 'ok', data: { first_name: 'C' } },
  '66666666666': { message: 'NIN premium slip generated successfully', file: { content: 'JVBERi0xLjQKJcfsj6IKJSVFT0Y=' } },
  '99999999999': { status: 'error', response_code: '07', message: 'Rate limit exceeded (60 requests per hour)' },
  '55555555553': { status: 'success', message: 'ok', pdf_base64: 'JVBERi0=', first_name: 'X', surname: 'Y' },
  '55555555551': { status: 'success', message: 'PDF generated successfully', pdf_base64: 'JVBERi0=', nin_details: { firstname: 'PHONE', lastname: 'USER', nin: '12345678901' } },
  '55555555552': { status: 'success', message: 'PDF generated successfully', pdf_base64: 'JVBERi0=', firstname: 'FLAT', lastname: 'REPLY' },
  '77777777771': { success: true, message: 'NIN Premium slip (by phone) generated successfully', transaction_id: 'abc', user_data: { status: 'success', response_code: '00', user_data: { response_code: '00', response: [{ firstname: 'SALAHA', surname: 'DANLAMI', middlename: '', gender: 'Female', telephoneno: '', nin: '82386599003', birthdate: '19-03-1991', photo: '/9j/' + 'A'.repeat(400), birthcountry: 'Nigeria', signature: '', trackingId: '' }] }, matches: 1, records: [{ nin: '82386599003', firstname: 'SALAHA', surname: 'DANLAMI', page: 1 }], message: 'PDF generated successfully', pdf_base64: 'JVBERi0xLjcKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZw==' } },
  '44444444444': { status: 'error', message: 'Record not found' },
  '55555555555': { status: 'error', response_code: '04', message: 'Insufficient balance' },
};
const call = async (p, body) => { const r = await fetch(URL + '/api/' + p, { method: 'POST', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify(body || {}) }); const c = r.headers.get('set-cookie'); if (c) cookie = c.split(';')[0]; return r.json(); };
const bal = async () => (await call('me')).user.bal;
test.before(async () => {
  db = await H.newDb();
  fake = http.createServer((req, res) => { let b = ''; req.on('data', d => b += d); req.on('end', () => { const j = JSON.parse(b || '{}'); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(REPLY[j.nin] || { status: 'error' })); }); }).listen(FAKE);
  proc = spawn(process.execPath, ['server.js'], { cwd: path.join(__dirname, '..'), env: { ...process.env, PORT, DATABASE_URL: db.url, VP_BASE: 'http://127.0.0.1:' + FAKE + '/', PAYSTACK_SECRET: '', ADMIN_EMAIL: 'boss@test.com', BASE_URL: URL } });
  for (let i = 0; i < 30; i++) { try { if ((await fetch(URL + '/health')).ok) break; } catch {} await new Promise(r => setTimeout(r, 200)); }
  await call('register', { email: 'c@test.com', pass: 'secret123', agree: true, phone: H.phone() });
  await db.x('UPDATE users SET bal=2000');
});
test.after(async () => { proc.kill(); fake.close(); await db.drop(); });
const run = nin => call('run', { service: 'nin_premium', f: { nin } });

test('documented success format is charged and returns the slip', async () => {
  const b = await bal(), r = await run('11111111111'); assert.equal(r.ok, true); assert.ok(r.pdf); assert.equal((await bal()), b - 300);
});
test('reply with only a message and a PDF is still a success (the bug seen in real use)', async () => {
  const b = await bal(), r = await run('22222222222'); assert.equal(r.ok, true); assert.ok(r.pdf); assert.equal((await bal()), b - 300);
});
test('reply using success:true is a success', async () => {
  const b = await bal(), r = await run('33333333333'); assert.equal(r.ok, true); assert.equal((await bal()), b - 300);
});
test('record not found is refunded', async () => {
  const b = await bal(), r = await run('44444444444'); assert.equal(r.ok, false); assert.equal((await bal()), b);
});
test('provider out of balance is refunded with a friendly message', async () => {
  const b = await bal(), r = await run('55555555555'); assert.equal(r.ok, false); assert.match(r.msg, /temporarily unavailable/); assert.equal((await bal()), b);
});

test('slip under an unexpected field name is still found, charged and saved for the admin', async () => {
  const b = await bal(), r = await run('66666666666'); assert.equal(r.ok, true); assert.ok(r.pdf); assert.equal((await bal()), b - 300);
});
test('saved results are admin-only and the slip can be downloaded from them', async () => {
  assert.equal((await call('admin/results')).ok, false);
  cookie = ''; await call('register', { email: 'boss@test.com', pass: 'secret123', agree: true, phone: H.phone() });
  const l = await call('admin/results'); assert.equal(l.ok, true); assert.ok(l.rows.length >= 3);
  const row = l.rows.find(x => x.has_pdf); const d = await call('admin/result', { id: row.id });
  assert.ok(d.ok && d.pdf.startsWith('JVBER')); assert.ok(!d.raw.includes('api_key'));
  assert.equal((await call('admin/result/delete', { id: row.id })).ok, true);
});

test('provider rate limit is refunded with a friendly message and an alert', async () => {
  await db.x('UPDATE users SET bal=2000');
  const b = await bal(), r = await run('99999999999'); assert.equal(r.ok, false); assert.match(r.msg, /temporarily unavailable/); assert.match(r.msg, /^This service is temporarily unavailable. You were not charged./); assert.equal((await bal()), b);
});

test('NIN by demographics wants DD-MM-YYYY; NIN validation only accepts the provider\'s error types', async () => {
  const b = await bal();
  let r = await call('run', { service: 'nin_demo', f: { firstname: 'A', lastname: 'B', dob: '1990-05-21', gender: '' } }); assert.equal(r.ok, false); assert.match(r.msg, /21-05-1990/);
  r = await call('run', { service: 'validation', f: { nin: '12345678901', error_type: 'bogus' } }); assert.equal(r.ok, false); assert.match(r.msg, /valid option/);
  assert.equal(await bal(), b);
});

test('person details are shown even when the provider puts them at the top level or under another name', async () => {
  await db.x('UPDATE users SET bal=5000');
  const a = await run('55555555553'); assert.equal(a.ok, true); assert.equal(a.data.first_name, 'X'); assert.equal(a.data.surname, 'Y'); assert.equal(a.data.message, undefined);
});

test('details are shown even when the provider names them differently (nested or flat)', async () => {
  await db.x('UPDATE users SET bal=5000');
  let r = await run('55555555551'); assert.ok(r.ok && r.pdf); assert.equal(r.data.firstname, 'PHONE');
  r = await run('55555555552'); assert.ok(r.ok && r.pdf); assert.equal(r.data.firstname, 'FLAT'); assert.equal(r.data.pdf_base64, undefined);
});

test('real nested phone-slip reply becomes clean details, a photo and a PDF', async () => {
  await db.x('UPDATE users SET bal=5000');
  const r = await run('77777777771'); assert.ok(r.ok && r.pdf && r.pdf.startsWith('JVBER'));
  assert.equal(r.data.firstname, 'SALAHA'); assert.equal(r.data.birthcountry, 'Nigeria'); assert.equal(r.data.photo, undefined); assert.equal(r.data.middlename, ''); assert.equal(r.data.records, undefined);
  assert.ok(r.photo && r.photo.startsWith('/9j/'));
});

test('admin Saved Results gives clean details and the photo, not just raw JSON', async () => {
  const l = await call('admin/results'); const row = l.rows.find(x => x.has_pdf && /phone|NIN/i.test(x.label)); assert.ok(row);
  const all = await Promise.all(l.rows.filter(x => x.has_pdf).map(x => call('admin/result', { id: x.id })));
  const d = all.find(x => x.info && x.info.firstname === 'SALAHA'); assert.ok(d, 'nested reply rebuilt into details');
  assert.equal(d.info.surname, 'DANLAMI'); assert.equal(d.info.middlename, ''); assert.ok(d.photo && d.photo.startsWith('/9j/'));
});

test('lookup fields are checked before any money moves (bank codes, meter company, CAC type)', async () => {
  const b = await bal(), bad = async (service, f, re) => { const r = await call('run', { service, f }); assert.equal(r.ok, false); assert.match(r.msg, re); };
  await bad('bank_account', { number: '123', bank_code: '058' }, /10 digits/);
  await bad('bvn_bank_verify', { bvn: '22222222222', bankCode: '058', bankAccount: '0123456789' }, /valid option/); // 3-digit code is not a NIBSS code
  await bad('bank_account', { number: '0123456789', bank_code: '999' }, /valid option/);
  await bad('meter_address', { meter_number: '12345678', electricity_company: 'lekki' }, /valid option/);
  await bad('cac_basic', { rc_number: '123456', company_type: 'XX' }, /valid option/);
  assert.equal(await bal(), b);
});
