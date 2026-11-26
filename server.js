/* DEBONE Digital Hub - verification reseller server
   Runs on Vercel (serverless) with a Supabase Postgres database. See README.md. */
'use strict';
require('dotenv').config();
const express = require('express'), session = require('express-session'), bcrypt = require('bcryptjs');
const crypto = require('crypto'), path = require('path'), { Pool, types } = require('pg');
const E = process.env, B = E.VP_BASE || 'https://verifyplatform.com/api/verification/';
const ON_VERCEL = !!E.VERCEL, PROD = ON_VERCEL || (E.BASE_URL || '').startsWith('https');
types.setTypeParser(20, v => parseInt(v, 10)); types.setTypeParser(1700, v => parseFloat(v)); // counts and sums come back as numbers, not strings

/* ---------- database (Supabase Postgres) ---------- */
if (!E.DATABASE_URL) { console.error('DATABASE_URL is missing. Add your Supabase connection string (see README.md).'); if (!ON_VERCEL && require.main === module) process.exit(1); }
const DB_URL = String(E.DATABASE_URL || '').replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
const LOCAL_DB = /@(localhost|127\.0\.0\.1)(:|\/)/.test(DB_URL);
const pool = new Pool({ connectionString: DB_URL, max: Number(E.DB_POOL_MAX || 3), idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000,
  ssl: LOCAL_DB ? false : (E.DATABASE_CA ? { ca: E.DATABASE_CA.replace(/\\n/g, '\n'), rejectUnauthorized: true } : { rejectUnauthorized: false }) });
pool.on('error', e => console.error('db pool error:', e.message));
const conv = s => { let i = 0; return s.replace(/\?/g, () => '$' + (++i)); }; // write SQL with ? and it becomes $1, $2...
const mk = ex => ({
  q: async (s, ...a) => (await ex.query(conv(s), a)).rows[0],
  all: async (s, ...a) => (await ex.query(conv(s), a)).rows,
  run: async (s, ...a) => { const r = await ex.query(conv(s), a); return { changes: r.rowCount, rows: r.rows }; },
});
const D = mk(pool), { q, all, run } = D;
async function tx(fn) { // everything inside succeeds together or not at all
  const c = await pool.connect();
  try { await c.query('BEGIN'); const out = await fn(mk(c)); await c.query('COMMIT'); return out; }
  catch (e) { try { await c.query('ROLLBACK'); } catch {} throw e; }
  finally { c.release(); }
}

/* ---------- SERVICES & YOUR SELLING PRICES (naira) ----------
   Edit prices freely, but keep each one above your provider cost.
   kind: slip = instant PDF, lookup = instant record, async = submit then check status.
   Fields marked VERIFY are not in the docs you sent; confirm names in your provider docs. */
const S = {};
const add = (key, group, label, price, url, fields, o = {}) => S[key] = { key, group, label, price, url, fields, kind: 'slip', ...o };
const nin = { nin: 'NIN (11 digits)' }, ph = { nin: 'Phone number (11 digits)' }, bvn = { bvn: 'BVN (11 digits)' };
add('nin_premium', 'NIN', 'NIN slip - Premium', 300, 'nin_by_nin.php', nin);
add('nin_standard', 'NIN', 'NIN slip - Standard', 250, 'nin_standard_slip.php', nin);
add('nin_regular', 'NIN', 'NIN slip - Regular', 200, 'nin_regular_slip.php', nin);
add('nin_vnin', 'NIN', 'VNIN slip', 200, 'vnin_slip.php', nin);
add('nin_basic', 'NIN', 'NIN slip - Basic', 150, 'nin_basic_slip.php', nin);
add('phone_premium', 'NIN', 'NIN by phone - Premium', 300, 'nin_by_phone_premium.php', ph);
add('phone_standard', 'NIN', 'NIN by phone - Standard', 250, 'nin_by_phone_standard.php', ph);
add('phone_regular', 'NIN', 'NIN by phone - Regular', 200, 'nin_by_phone_regular.php', ph);
add('nin_demo', 'NIN', 'NIN by demographics', 300, 'nin_by_demo.php', { firstname: 'First name', lastname: 'Last name', dob: 'Date of birth (DD-MM-YYYY)', gender: 'Gender (optional)' }, { optional: ['gender'], dobDmy: true, choices: { gender: ['MALE', 'FEMALE'] } });
add('bvn_premium', 'BVN', 'BVN slip - Premium', 250, 'bvn_premium_slip.php', bvn);
add('bvn_standard', 'BVN', 'BVN slip - Standard', 200, 'bvn_full_details_slip.php', bvn);
add('ipe', 'NIN agency', 'IPE clearance', 1100, 'ipe.php', { trackingID: 'Tracking ID' }, { kind: 'async', status: 'ipe_status.php', trackRef: true });
add('validation', 'NIN agency', 'NIN validation', 900, 'validation.php', { nin: 'NIN (11 digits)', error_type: 'Error type' }, { kind: 'async', status: 'validation_status.php', choices: { error_type: [['no_record', 'No Record Found'], ['sim', 'SIM Validation'], ['v.nin_validation', 'V.NIN Validation'], ['update_records', 'Update Records Validation'], ['bank_validation', 'Bank Validation'], ['modification', 'Modification Validation'], ['photo_error', 'Photographic Error']] } });
add('personalization', 'NIN agency', 'NIN personalisation', 300, 'personalization.php', { tracking_id: 'Enrolment tracking ID' }, { kind: 'async', status: 'personalization_status.php', trackRef: true });
const L = 'lookup.php', cac = { rc_number: 'RC / BN number (digits)', company_type: 'Registration type' };
const COMPANY_TYPES = [['RC', 'RC - Registered company'], ['BN', 'BN - Business name'], ['IT', 'IT - Incorporated trustees'], ['LP', 'LP - Limited partnership'], ['LLP', 'LLP - Limited liability partnership']];
const DISCOS = [['AEDC', 'AEDC - Abuja'], ['ABA', 'ABA - Aba Power'], ['BEDC', 'BEDC - Benin'], ['EKEDC', 'EKEDC - Eko'], ['EEDC', 'EEDC - Enugu'], ['IBEDC', 'IBEDC - Ibadan'], ['IKEDC', 'IKEDC - Ikeja'], ['JED', 'JED - Jos'], ['KAEDCO', 'KAEDCO - Kaduna'], ['KEDCO', 'KEDCO - Kano'], ['PHED', 'PHED - Port Harcourt'], ['YEDC', 'YEDC - Yola']];
const STATES = ['Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'];
// rules: [pattern, message, stripSpacesAndDashes] - checked before any money moves
const DIG = (n, what) => [new RegExp('^\\d{' + n + '}$'), `${what} must be exactly ${n} digits.`, true];
const FALLBACK = {
  bank_code: [['044', 'Access Bank'], ['011', 'First Bank of Nigeria'], ['058', 'Guaranty Trust Bank'], ['033', 'United Bank For Africa'], ['057', 'Zenith Bank'], ['999992', 'OPay Digital Services Limited (OPay)'], ['999991', 'PalmPay'], ['50515', 'Moniepoint MFB'], ['50211', 'Kuda Bank'], ['070', 'Fidelity Bank'], ['214', 'First City Monument Bank'], ['035', 'Wema Bank'], ['032', 'Union Bank of Nigeria'], ['232', 'Sterling Bank'], ['221', 'Stanbic IBTC Bank'], ['050', 'Ecobank Nigeria'], ['076', 'Polaris Bank'], ['082', 'Keystone Bank']],
  bankCode: [['000014', 'Access Bank'], ['000016', 'First Bank Of Nigeria'], ['000013', 'GTBank'], ['000004', 'UNITED BANK FOR AFRICA'], ['000015', 'Zenith Bank'], ['100004', 'OPay'], ['100033', 'PalmPay'], ['090405', 'Moniepoint'], ['090267', 'Kuda MFB'], ['000007', 'Fidelity Bank'], ['000003', 'First City Monument Bank'], ['000017', 'Wema Bank'], ['000018', 'Union Bank Of Nigeria'], ['000001', 'Sterling Bank'], ['000012', 'Stanbic IBTC Bank'], ['000010', 'Ecobank Nigeria'], ['000008', 'Polaris Bank'], ['000002', 'Keystone Bank']] };
let LISTS = {}; // 'service.field' -> [[code, name], ...] taken from the provider's own list
const lk = (key, group, label, price, fields, o = {}) => add(key, group, label, price, L, fields, { kind: 'lookup', ...o });
lk('tin', 'Tax & TIN', 'TIN verification', 450, { number: 'TIN' });
lk('tin_by_nin', 'Tax & TIN', 'Get TIN with NIN', 450, { number: 'NIN (11 digits)' }, { rules: { number: DIG(11, 'NIN') } });
lk('tin_by_phone', 'Tax & TIN', 'Get TIN with phone', 450, { number: 'Phone number (11 digits)' }, { rules: { number: [/^(0\d{10}|\+?234\d{10})$/, 'Phone number must be 11 digits, like 08012345678.', true] } });
lk('tin_by_cac', 'Tax & TIN', 'Get TIN with RC number', 450, { number: 'RC number' });
lk('tcc', 'Tax & TIN', 'Tax clearance certificate', 450, { tcc_number: 'TCC number', tin_or_firs_id: 'TIN or FIRS ID' }, { rules: { tcc_number: [/^\d{8,20}$/, 'TCC number must be 8 to 20 digits.', true], tin_or_firs_id: [/^[A-Za-z0-9\/-]{5,30}$/, 'TIN or FIRS ID must be 5 to 30 letters, digits, "-" or "/".'] } });
lk('business_tax', 'Tax & TIN', 'Business tax number', 450, { tax_number: 'Tax number' }, { rules: { tax_number: [/^\d{10,15}$/, 'Tax number must be 10 to 15 digits.', true] } });
lk('cac_basic', 'CAC', 'CAC search - Basic', 400, cac, { choices: { company_type: COMPANY_TYPES } });
lk('cac_advance', 'CAC', 'CAC search with directors', 600, cac, { choices: { company_type: COMPANY_TYPES } });
lk('cac_premium', 'CAC', 'CAC search - Premium', 1800, cac, { choices: { company_type: COMPANY_TYPES } });
lk('scuml', 'CAC', 'SCUML check', 350, { company_number: 'Company / SCUML number' });
lk('voters_card', 'ID documents', "Voter's card (PVC)", 1000, { number: 'VIN on card', first_name: 'First name', last_name: 'Last name', dob: 'Date of birth (YYYY-MM-DD)', state: 'State', lga: 'LGA' }, { choices: { state: STATES } });
lk('drivers_license', 'ID documents', "Driver's licence", 400, { number: 'Licence number', first_name: 'First name', last_name: 'Last name' });
lk('passport', 'ID documents', 'International passport', 450, { number: 'Passport number', nin: 'NIN', dob: 'Date of birth (YYYY-MM-DD)' });
lk('plate_number', 'Vehicle', 'Plate number check', 350, { vehicle_number: 'Plate number' });
lk('plate_advance', 'Vehicle', 'Plate number - Advanced', 400, { vehicle_number: 'Plate number' });
lk('vin_chassis', 'Vehicle', 'Chassis (VIN) check', 400, { vin: 'Chassis number' });
lk('bank_account', 'Bank & meter', 'Bank account name', 200, { number: 'Account number (10 digits)', bank_code: 'Bank' }, { dyn: ['bank_code'], rules: { number: DIG(10, 'Account number') } });
lk('bank_account_match', 'Bank & meter', 'Account name match', 250, { number: 'Account number (10 digits)', bank_code: 'Bank', customer_name: 'Expected full name' }, { dyn: ['bank_code'], rules: { number: DIG(10, 'Account number'), customer_name: [/^[A-Za-z][A-Za-z .'-]{2,99}$/, 'Name must be 3 to 100 letters.'] } });
lk('bvn_bank_verify', 'Bank & meter', 'BVN + bank account match', 200, { bvn: 'BVN (starts with 22)', bankCode: 'Bank', bankAccount: 'Account number (10 digits)' }, { dyn: ['bankCode'], rules: { bvn: [/^22\d{9}$/, 'BVN must be 11 digits starting with 22.', true], bankAccount: DIG(10, 'Account number') } });
lk('meter_address', 'Bank & meter', 'Address by meter number', 550, { meter_number: 'Meter or account number', electricity_company: 'Electricity company' }, { choices: { electricity_company: DISCOS }, rules: { meter_number: [/^\d{6,20}$/, 'Meter number must be 6 to 20 digits.', true] } });

/* ---------- core helpers ---------- */
const getSet = async k => ((await q('SELECT v FROM settings WHERE k=?', k)) || {}).v;
const setSet = (k, v) => run('INSERT INTO settings(k,v) VALUES(?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v', k, v);
const cfgAll = async () => Object.fromEntries((await all("SELECT k,v FROM settings WHERE k NOT IN ('secret','provider_list')")).map(r => [r.k, r.v]));
const ADMIN = (E.ADMIN_EMAIL || '').trim().toLowerCase();
const isAdmin = e => !!ADMIN && String(e).toLowerCase() === ADMIN;
const PASS_FEE = E.PASS_PAYSTACK_FEE !== '0';
const paystackLive = c => !!E.PAYSTACK_SECRET && (c.paystack_on != null ? c.paystack_on === '1' : E.PAYSTACK_ENABLED === '1'); // off unless you switch it on in Admin
const grossFor = a => { if (!PASS_FEE) return a; let g = Math.ceil(a / 0.985); if (g >= 2500) g = Math.ceil((a + 100) / 0.985); if (g - a > 2000) g = a + 2000; return g; };
const COST = {nin_premium: 100, nin_standard: 100, nin_regular: 100, nin_vnin: 100, nin_basic: 100, phone_premium: 100, phone_standard: 100, phone_regular: 100, nin_demo: 120, bvn_premium: 80, bvn_standard: 80, ipe: 500, validation: 500, personalization: 140, tin: 270, tin_by_nin: 270, tin_by_phone: 270, tin_by_cac: 270, tcc: 270, business_tax: 270, cac_basic: 230, cac_advance: 360, cac_premium: 1350, scuml: 180, voters_card: 720, drivers_license: 230, passport: 270, plate_number: 180, plate_advance: 230, vin_chassis: 230, bank_account: 90, bank_account_match: 140, bvn_bank_verify: 90, meter_address: 360};  // provider (API) prices in naira
const normPhone = p => { p = String(p || '').replace(/[\s\-()]/g, ''); if (/^\+234\d{10}$/.test(p)) p = '0' + p.slice(4); else if (/^234\d{10}$/.test(p)) p = '0' + p.slice(3); return /^0[789]\d{9}$/.test(p) ? p : null; };
const px = k => q('SELECT price,price_ind,cost,active,agent_only FROM prices WHERE k=?', k);
/* TWO PRICE LEVELS. "price" = the verified-agent price. "price_ind" = what an unverified individual pays.
   price_ind = 0 means "work it out automatically". Cheap services get the biggest gap, because that is where agents earn most:
     agent price up to N300 -> x1.8, N301-N1,500 -> x1.5, above N1,500 -> x1.4. Rounded up to the next N50 (and always at least N100 more). */
const indAutoV3 = a => { const [n, d] = a <= 300 ? [9, 5] : a <= 1500 ? [3, 2] : [7, 5]; return Math.max(Math.ceil(a * n / (d * 50)) * 50, a + 100); }; // the third version (x1.8 / x1.5 / x1.4), only used to upgrade untouched prices
const indAutoV4 = a => { const [n, d] = a <= 300 ? [11, 5] : a <= 1500 ? [17, 10] : [3, 2]; return Math.max(Math.ceil(a * n / (d * 50)) * 50, a + 150); }; // the fourth version, only used to upgrade untouched prices
const indAutoV5 = a => { const [n, d] = a <= 300 ? [4, 1] : a <= 600 ? [3, 1] : a <= 1500 ? [2, 1] : [3, 2]; return Math.max(Math.ceil(a * n / (d * 50)) * 50, a + 150, a > 1500 ? 3000 : a > 600 ? 1800 : a > 300 ? 1200 : 0); }; // the floors keep the customer price rising with the agent price // the fifth version, only used to upgrade untouched prices
// CURRENT automatic customer price: agent price up to N300 -> x3.5, up to N600 -> x2.7, up to N1,500 -> x1.8, above -> x1.4. Rounded up to the next N50, at least N150 more, with floors so it always rises with the agent price.
const indAuto = a => { const [n, d] = a <= 300 ? [7, 2] : a <= 600 ? [27, 10] : a <= 1500 ? [9, 5] : [7, 5]; return Math.max(Math.ceil(a * n / (d * 50)) * 50, a + 150, a > 1500 ? 2700 : a > 600 ? 1650 : a > 300 ? 1050 : 0); };
const indAutoV2 = a => { const [n, d] = a <= 300 ? [2, 1] : a <= 600 ? [17, 10] : a <= 1500 ? [3, 2] : [7, 5]; return Math.max(Math.ceil(a * n / (d * 50)) * 50, a + 100); }; // the second version, only used to upgrade untouched prices
const indAutoV1 = a => Math.max(Math.ceil(a * 1.5 / 50) * 50, a + 100); // the first version (+50%), only used to upgrade untouched prices
const indOf = p => Math.max(p.price_ind > 0 ? p.price_ind : indAuto(p.price), p.price, p.cost); // never below the agent price or the provider price
const agentOf = p => Math.max(p.price, p.cost);
const priceView = (p, u) => u.admin && p.cost > 0 ? p.cost : u.agent ? agentOf(p) : indOf(p);
/* Verified agents pay the agent price, unverified individuals pay the higher individual price. The admin pays the provider (API) price with no markup. */
const priceFor = async (k, u) => priceView(await px(k), u); // nobody pays below the provider price
const bal = async id => (await q('SELECT bal FROM users WHERE id=?', id)).bal;
const charge = async (id, n) => (await run('UPDATE users SET bal=bal-? WHERE id=? AND bal>=?', n, id, n)).changes === 1;
const refund = (id, n, X = D) => X.run('UPDATE users SET bal=bal+? WHERE id=?', n, id);
const log = (uid, svc, amt, status, X = D) => X.run('INSERT INTO tx(uid,svc,amt,status) VALUES(?,?,?,?)', uid, svc, amt, status);
const audit = (admin, action, detail) => run('INSERT INTO admin_log(admin,action,detail) VALUES(?,?,?)', admin, action, String(detail || '').slice(0, 300)).catch(() => {});
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const safeEq = (a, b) => { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); };
const regen = req => new Promise(r => req.session.regenerate(r));
const killSessions = (uid, keepSid) => run('DELETE FROM sess WHERE uid=? AND sid<>?', uid, keepSid || '');
const ipOf = req => (ON_VERCEL && req.get('x-vercel-forwarded-for')) || req.ip;
async function vp(url, body) {
  try {
    const r = await fetch(B + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: E.VP_API_KEY, ...body }), signal: AbortSignal.timeout(45000) });
    return await r.json();
  } catch { return { status: 'error' }; }
}

/* ---------- start-up: secret, prices, settings (runs once per server instance) ---------- */
let SECRET, listAt = 0, providerBusyUntil = 0, initP = null;
const initOnce = () => initP || (initP = init().catch(e => { initP = null; throw e; }));
async function init() {
  let s = E.SESSION_SECRET || await getSet('secret');
  if (!s) { await run("INSERT INTO settings(k,v) VALUES('secret',?) ON CONFLICT(k) DO NOTHING", crypto.randomBytes(32).toString('hex')); s = await getSet('secret'); }
  SECRET = s;
  const rows = Object.values(S);
  await pool.query(`INSERT INTO prices(k,price,cost) VALUES ${rows.map((x, i) => `($${i * 3 + 1},$${i * 3 + 2},$${i * 3 + 3})`).join(',')} ON CONFLICT (k) DO NOTHING`, rows.flatMap(x => [x.key, x.price, COST[x.key] || 0]));
  if ((await getSet('prices_v2')) == null) { for (const x of rows) await run('UPDATE prices SET price=?,cost=? WHERE k=?', x.price, COST[x.key] || 0, x.key); await setSet('prices_v2', '1'); } // one-time load of the provider price list
  if ((await getSet('ledger_base')) == null) await setSet('ledger_base', String((await q('SELECT COALESCE(SUM(bal),0) n FROM users')).n - (await q('SELECT COALESCE(SUM(amt),0) n FROM tx')).n)); // lets old data start balanced
  try { await q('SELECT agent_status, phone FROM users LIMIT 1'); await q('SELECT agent_only, price_ind FROM prices LIMIT 1'); await q('SELECT 1 x FROM agent_apps LIMIT 1'); await q('SELECT 1 x FROM invites LIMIT 1'); }
  catch (e) { throw new Error('The database is missing the newest tables. In Supabase run supabase/1-schema.sql and then supabase/2-app-user.sql again. (' + e.message + ')'); }
  if ((await getSet('ind_price_v1')) == null) { await run('UPDATE prices SET price_ind = CASE WHEN price_ind = 0 THEN GREATEST(CEIL(price * 1.5 / 50.0)::int * 50, price + 100) ELSE price_ind END'); await setSet('ind_price_v1', '1'); } // one-time: give every service a visible individual price (you can change each one in Admin -> Set Prices)
  if ((await getSet('ind_price_v2')) == null) { // one-time: move individual prices that were still on the first automatic formula (+50%) to the new tiered one. Prices you typed yourself are left alone.
    for (const r of await all('SELECT k,price,price_ind FROM prices')) { const nw = indAuto(r.price); if ((r.price_ind === 0 || r.price_ind === indAutoV1(r.price)) && r.price_ind !== nw) await run('UPDATE prices SET price_ind=? WHERE k=?', nw, r.k); }
    await setSet('ind_price_v2', '1'); }
  if ((await getSet('ind_price_v3')) == null) { // one-time: move untouched individual prices (still on an earlier automatic formula) to the market-checked tiers. Prices you typed yourself are left alone.
    for (const r of await all('SELECT k,price,price_ind FROM prices')) { const nw = indAutoV3(r.price); if ((r.price_ind === 0 || r.price_ind === indAutoV1(r.price) || r.price_ind === indAutoV2(r.price)) && r.price_ind !== nw) await run('UPDATE prices SET price_ind=? WHERE k=?', nw, r.k); }
    await setSet('ind_price_v3', '1'); }
  if ((await getSet('ind_price_v4')) == null) { // one-time: raise untouched individual prices to the higher tiers so agents stay worth it. Prices you typed yourself are left alone.
    for (const r of await all('SELECT k,price,price_ind FROM prices')) { const nw = indAutoV4(r.price); if ((r.price_ind === 0 || r.price_ind === indAutoV1(r.price) || r.price_ind === indAutoV2(r.price) || r.price_ind === indAutoV3(r.price)) && r.price_ind !== nw) await run('UPDATE prices SET price_ind=? WHERE k=?', nw, r.k); }
    await setSet('ind_price_v4', '1'); }
  if ((await getSet('ind_price_v5')) == null) { // one-time: move untouched customer prices to the market-level tiers. Prices you typed yourself are left alone.
    for (const r of await all('SELECT k,price,price_ind FROM prices')) { const nw = indAutoV5(r.price); if ((r.price_ind === 0 || r.price_ind === indAutoV1(r.price) || r.price_ind === indAutoV2(r.price) || r.price_ind === indAutoV3(r.price) || r.price_ind === indAutoV4(r.price)) && r.price_ind !== nw) await run('UPDATE prices SET price_ind=? WHERE k=?', nw, r.k); }
    await setSet('ind_price_v5', '1'); }
  if ((await getSet('ind_price_v6')) == null) { // one-time: move untouched customer prices to the slightly lower tiers. Prices you typed yourself are left alone.
    for (const r of await all('SELECT k,price,price_ind FROM prices')) { const nw = indAuto(r.price); if ((r.price_ind === 0 || r.price_ind === indAutoV1(r.price) || r.price_ind === indAutoV2(r.price) || r.price_ind === indAutoV3(r.price) || r.price_ind === indAutoV4(r.price) || r.price_ind === indAutoV5(r.price)) && r.price_ind !== nw) await run('UPDATE prices SET price_ind=? WHERE k=?', nw, r.k); }
    await setSet('ind_price_v6', '1'); }
  if ((await getSet('agent_price_v2')) == null) { // one-time: balance agent prices (IPE 1500 -> 1100, NIN validation 800 -> 900, BVN + bank match 250 -> 200). Only prices still at the old default are moved; the customer price follows if it was automatic. Prices you typed yourself are left alone.
    for (const [key, oldP, newP] of [['ipe', 1500, 1100], ['validation', 800, 900], ['bvn_bank_verify', 250, 200]]) {
      const r = await q('SELECT price,price_ind FROM prices WHERE k=?', key); if (!r || r.price !== oldP) continue;
      const auto = [0, indAutoV1(oldP), indAutoV2(oldP), indAutoV3(oldP), indAutoV4(oldP), indAutoV5(oldP), indAuto(oldP)].includes(r.price_ind);
      await run('UPDATE prices SET price=?, price_ind=? WHERE k=?', newP, auto ? indAuto(newP) : r.price_ind, key); }
    await setSet('agent_price_v2', '1'); }
  if ((await getSet('open_to_all_v1')) == null) { await run('UPDATE prices SET agent_only=0'); await setSet('open_to_all_v1', '1'); await setSet('agent_lock_v1', '1'); } // one-time: every service is open to everyone; unverified people simply pay the individual price
  try { const c = JSON.parse((await getSet('provider_list')) || '{}'); if (c.lists) LISTS = c.lists; listAt = c.at || 0; } catch { listAt = 0; }
}
/* Bank lists: the provider publishes the exact bank codes it accepts. We keep a copy and refresh it once a day (one request). */
async function refreshList() {
  const r = await vp('lookup.php', { service: 'list' });
  const svcs = r && r.data && r.data.services;
  if (!Array.isArray(svcs)) { if (String(r && r.response_code) === '07') providerBusyUntil = Date.now() + 10 * 60e3; return false; }
  const next = {};
  for (const sv of Object.values(S)) for (const f of sv.dyn || []) {
    const al = (svcs.find(x => x.service === sv.key)?.fields || []).find(x => x.name === f)?.allowed;
    if (!al || typeof al !== 'object') continue;
    const pop = FALLBACK[f].map(c => c[0]), everything = Array.isArray(al) ? al.map(x => [String(x), String(x)]) : Object.entries(al).map(([k, v]) => [k, String(v)]);
    const first = pop.map(c => everything.find(a => a[0] === c)).filter(Boolean); // the main banks first, then A-Z
    const rest = everything.filter(a => !pop.includes(a[0])).sort((a, b) => a[1].localeCompare(b[1], 'en', { sensitivity: 'base' }));
    if (first.length + rest.length > 5) next[sv.key + '.' + f] = [...first, ...rest];
  }
  if (!Object.keys(next).length) return false;
  LISTS = next; listAt = Date.now(); await setSet('provider_list', JSON.stringify({ at: listAt, lists: next })); return true;
}
/* The provider's replies do not always match its documentation, so read them tolerantly. */
const findPdf = (o, d = 0) => { // finds a PDF anywhere in the reply, whatever the field is called
  if (typeof o === 'string') { const m = o.match(/^(?:data:application\/pdf;base64,)?(JVBER[A-Za-z0-9+\/=\s]{20,})$/); return m ? m[1].replace(/\s/g, '') : null; }
  if (d > 4 || !o || typeof o !== 'object') return null;
  for (const v of Object.values(o)) { const f = findPdf(v, d + 1); if (f) return f; } return null;
};
const pdfOf = r => r.pdf_base64 || (typeof r.pdf === 'string' && r.pdf) || (r.data && r.data.pdf_base64) || findPdf(r) || null;
const okish = r => !!r && (['success', 'successful', 'ok', 'completed', 'found'].includes(String(r.status || '').toLowerCase()) || r.success === true || String(r.response_code || '') === '00' || !!pdfOf(r) || /(generated|retrieved|verified|completed) successfully|^successful$/i.test(String(r.message || '')));
/* Never show customers the provider's own money fields, photos or huge blobs. */
const HIDE = new Set(['pdf_base64', 'pdf', 'photo', 'image', 'signature', 'amount_charged', 'balance_before', 'balance_after', 'amount_refunded', 'refunded', 'transaction_id', 'ticket_id', 'api_key', 'price', 'balance', 'reference', 'duplicate']);
const scrub = (o, d = 0) => { if (!o || typeof o !== 'object' || Array.isArray(o)) return o; const out = {};
  for (const [k, v] of Object.entries(o)) { if (HIDE.has(k.toLowerCase()) || (typeof v === 'string' && v.length > 300)) continue;
    if (k === 'user_data' && v && typeof v === 'object' && !Array.isArray(v) && d < 2) { Object.assign(out, scrub(v, d + 1)); continue; }
    out[k] = v && typeof v === 'object' ? scrub(v, d + 1) : v; } return out; };
const NOT_DETAILS = new Set(['status', 'success', 'message', 'response_code', 'code', 'error', 'service', 'reference', 'price', 'balance', 'duplicate', 'refunded', 'field', 'pdf', 'pdf_base64', 'api_key']);
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const isPerson = o => isObj(o) && ('nin' in o || 'firstname' in o || 'surname' in o || 'first_name' in o);
const findRecs = (o, d = 0) => { // first list of person records anywhere in the reply (the richest list comes first)
  if (d > 6 || !o || typeof o !== 'object') return null;
  if (Array.isArray(o)) { if (o.length && isPerson(o[0])) return o; for (const v of o) { const f = findRecs(v, d + 1); if (f) return f; } return null; }
  for (const v of Object.values(o)) { const f = findRecs(v, d + 1); if (f) return f; } return null;
};
const findKey = (o, key, d = 0) => { if (d > 6 || !o || typeof o !== 'object') return null; for (const [k, v] of Object.entries(o)) { if (k === key && typeof v === 'string' && v.length > 200) return v.replace(/^data:image\/\w+;base64,/, ''); const f = findKey(v, key, d + 1); if (f) return f; } return null; };
const photoOf = r => findKey(r, 'photo');
const prune = o => { if (!isObj(o)) return o; const out = {}; for (const [k, v] of Object.entries(o)) if (v !== null && v !== undefined && k !== 'page' && !(Array.isArray(v) && !v.length)) out[k] = v; return out; };
const dataOf = r => { const recs = findRecs(r); if (recs) return prune(scrub(recs[0])); return prune(dataOf0(r)); };
const dataOf0 = r => { // find the person's details wherever the provider put them
  const known = r.user_data || (isObj(r.data) ? r.data : null) || r.result || r.record || r.details || r.nin_data || r.person;
  if (isObj(known) && Object.keys(scrub(known)).length) return scrub(known);
  const nested = Object.entries(r).find(([k, v]) => !NOT_DETAILS.has(k) && isObj(v) && Object.keys(scrub(v)).length);
  if (nested) return scrub(nested[1]);
  const flat = {}; for (const [k, v] of Object.entries(r)) if (!NOT_DETAILS.has(k) && (typeof v === 'string' || typeof v === 'number')) flat[k] = v;
  return scrub(flat);
};
const trim = r => JSON.stringify(r, (k, v) => k === 'api_key' ? undefined : typeof v === 'string' && v.length > 300 ? v.slice(0, 40) + '...[' + v.length + ' chars]' : v).slice(0, 4000);
async function archive(user, base, v, r, outcome, price) {
  try {
    const hint = Object.values(v.out || {})[0] ? '...' + String(Object.values(v.out)[0]).slice(-4) : '';
    const ph = photoOf(r); await run('INSERT INTO results(uid,email,svc,label,hint,outcome,price,pdf,raw,info,photo) VALUES(?,?,?,?,?,?,?,?,?,?,?)', user.id, user.email, base.key, base.label, hint, outcome, price, pdfOf(r), trim(r), JSON.stringify(dataOf(r)), ph && ph.length < 400000 ? ph : null);
  } catch (e) { console.error('archive error', e.message); }
}

/* ---------- limits and locks (kept in the database, because serverless runs many copies of this server) ---------- */
async function hit(k, max, winMs) { // true = allowed
  const w = Math.floor(Date.now() / winMs);
  const r = await q('INSERT INTO rate(k,win,n) VALUES(?,?,1) ON CONFLICT (k,win) DO UPDATE SET n=rate.n+1 RETURNING n', k, w);
  return r.n <= max;
}
const limit = (name, max, win) => wrap(async (req, res, next) => {
  if (!(await hit(name + ':' + (req.user ? req.user.id : ipOf(req)), max, win))) return res.status(429).json({ ok: false, msg: 'Too many attempts. Please wait a moment and try again.' });
  next();
});
const lockKey = s => crypto.createHash('sha1').update(s).digest('hex');
const getLock = async k => !!(await q("INSERT INTO locks(k) VALUES(?) ON CONFLICT (k) DO UPDATE SET at=now() WHERE locks.at < now() - interval '2 minutes' RETURNING k", k));
const freeLock = k => run('DELETE FROM locks WHERE k=?', k).catch(() => {});

/* input validation (runs before any money moves) */
const choicesFor = sv => { // fixed dropdowns plus the bank lists the provider publishes
  if (!sv.dyn) return sv.choices || null;
  const c = { ...(sv.choices || {}) };
  for (const f of sv.dyn) c[f] = LISTS[sv.key + '.' + f] || FALLBACK[f];
  return c;
};
function clean(sv, body) {
  const CH = choicesFor(sv);
  const out = {};
  for (const [f, lab] of Object.entries(sv.fields)) {
    let v = String((body || {})[f] ?? '').trim();
    if (!v && (sv.optional || []).includes(f)) continue;
    if (!v) return { err: `${lab} is required.` };
    if (CH && CH[f]) { const ok = CH[f].map(c => Array.isArray(c) ? c[0] : c); if (!ok.includes(v)) return { err: `Choose a valid option for ${lab}.` }; }
    if (v.length > 100) return { err: `${lab} is too long.` };
    if (/[\u0000-\u001f<>]/.test(v)) return { err: `${lab} contains invalid characters.` };
    if (f === 'nin' || f === 'bvn') {
      v = v.replace(/[\s-]/g, ''); if (/^\+234\d{10}$/.test(v)) v = '0' + v.slice(4);
      if (!/^\d{11}$/.test(v)) return { err: `${lab} must be exactly 11 digits.` };
    }
    if (f === 'dob' && !(sv.dobDmy ? /^\d{2}-\d{2}-\d{4}$/ : /^\d{4}-\d{2}-\d{2}$/).test(v)) return { err: `${lab} must look like ${sv.dobDmy ? '21-05-1990' : '1990-05-21'}.` };
    const rule = (sv.rules || {})[f];
    if (rule) { if (rule[2]) v = v.replace(/[\s-]/g, ''); if (!rule[0].test(v)) return { err: rule[1] }; }
    out[f] = v;
  }
  return { out };
}

/* ---------- two-step login (authenticator app) for the admin ---------- */
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32enc = buf => { let bits = '', out = ''; for (const b of buf) bits += b.toString(2).padStart(8, '0'); for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)]; return out; };
const b32dec = s => { let bits = ''; for (const c of String(s).replace(/=+$/, '').toUpperCase()) { const v = B32.indexOf(c); if (v < 0) throw new Error('bad key'); bits += v.toString(2).padStart(5, '0'); } const bytes = []; for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2)); return Buffer.from(bytes); };
const hotp = (secret, counter) => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(counter)); const h = crypto.createHmac('sha1', b32dec(secret)).update(b).digest(), o = h[19] & 15; return String((((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, '0'); };
const totpCheck = (secret, code, last) => { const now = Math.floor(Date.now() / 30000); for (const d of [0, -1, 1]) { const st = now + d; if (st > Number(last || 0) && /^\d{6}$/.test(code) && safeEq(hotp(secret, st), code)) return st; } return 0; }; // a code can be used only once

/* ---------- app, security, sessions ---------- */
class Store extends session.Store {
  get(sid, cb) { q('SELECT data,exp FROM sess WHERE sid=?', sid).then(r => cb(null, r && r.exp > Date.now() ? JSON.parse(r.data) : null), cb); }
  set(sid, s, cb) { const exp = s.cookie && s.cookie.expires ? new Date(s.cookie.expires).getTime() : Date.now() + 864e5; run('INSERT INTO sess(sid,data,exp,uid) VALUES(?,?,?,?) ON CONFLICT(sid) DO UPDATE SET data=excluded.data,exp=excluded.exp,uid=excluded.uid', sid, JSON.stringify(s), exp, s.uid || null).then(() => cb && cb(null), e => cb && cb(e)); }
  destroy(sid, cb) { run('DELETE FROM sess WHERE sid=?', sid).then(() => cb && cb(null), e => cb && cb(e)); }
}
const app = express();
app.disable('x-powered-by'); app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'Cache-Control': req.path.startsWith('/api') ? 'no-store' : 'no-cache' });
  if (PROD) res.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  const t = Date.now(); res.on('finish', () => { if (req.path.startsWith('/api') && res.statusCode >= 400) console.log(new Date().toISOString(), req.method, req.path, res.statusCode, (Date.now() - t) + 'ms'); });
  next();
});
app.get('/health', wrap(async (req, res) => { try { await q('SELECT 1 n'); res.json({ ok: true }); } catch { res.status(503).json({ ok: false }); } }));

/* scheduled work (Vercel Cron, Supabase pg_cron or any web cron service calls this with the CRON_SECRET) */
app.get('/api/cron/jobs', wrap(async (req, res) => {
  if (!E.CRON_SECRET || !safeEq(req.get('authorization') || '', 'Bearer ' + E.CRON_SECRET)) return res.sendStatus(401);
  await initOnce(); res.json({ ok: true, ...(await jobs()) });
}));

app.use('/api', wrap(async (req, res, next) => { await initOnce(); next(); }));
app.use('/api', limit('api', 600, 60e3));
app.use('/api', (req, res, next) => { // blocks requests that come from other websites
  if (req.method !== 'POST' || req.path === '/paystack/webhook') return next();
  const o = req.get('origin');
  if (o) { let ok = false; try { ok = new URL(o).host === req.get('host'); } catch {} if (!ok) return res.status(403).json({ ok: false, msg: 'Blocked request.' }); }
  if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ ok: false, msg: 'Blocked request.' });
  next();
});
app.use('/api', (req, res, next) => (req.method === 'POST' && !req.is('application/json')) ? res.status(415).json({ ok: false, msg: 'Unsupported request.' }) : next()); // JSON only (also stops cross-site form posts)
const smallJson = express.json({ limit: '50kb', verify: (req, res, buf) => { req.raw = buf; } });
app.use((req, res, next) => ['/api/transfer/proof', '/api/agent/apply'].includes(req.path) ? next() : smallJson(req, res, next)); // receipt photos are parsed later, only for logged-in users
let sessionMw;
app.use('/api', (req, res, next) => { sessionMw = sessionMw || session({ store: new Store(), secret: SECRET, resave: false, saveUninitialized: false, name: 'dv.sid',
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: 30 * 864e5 } }); sessionMw(req, res, next); }); // 'auto': secure cookie on https, normal cookie on http://localhost
const auth = wrap(async (req, res, next) => {
  const u = req.session.uid && await q('SELECT id,name,email,bal,active,totp_on,agent_status,phone FROM users WHERE id=?', req.session.uid);
  if (!u || !u.active) { if (u) req.session.destroy(() => {}); return res.status(401).json({ ok: false, auth: false }); }
  req.user = { ...u, admin: isAdmin(u.email), agent: isAdmin(u.email) || u.agent_status === 'approved' }; next();
});
const adminOnly = (req, res, next) => req.user.admin ? next() : res.status(403).json({ ok: false, msg: 'Admins only.' });

/* ---------- accounts ---------- */
app.post('/api/register', limit('reg', 10, 15 * 60e3), wrap(async (req, res) => {
  if (req.body.website) return res.json({ ok: false, msg: 'Could not create the account.' }); // hidden trap field: only bots fill it in
  const c = await cfgAll(), mode = c.reg_mode || 'open';
  const email = String(req.body.email || '').trim().toLowerCase(), pass = String(req.body.pass || ''), phone = normPhone(req.body.phone);
  const invite = String(req.body.invite || '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 20), bypass = isAdmin(email); // the admin address can always register
  if (!bypass && mode === 'closed') return res.json({ ok: false, msg: 'New registrations are closed right now. Please contact support.' });
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 120) return res.json({ ok: false, msg: 'Enter a valid email address.' });
  if (pass.length < 8 || pass.length > 100) return res.json({ ok: false, msg: 'Password must be 8 to 100 characters.' });
  if (!phone) return res.json({ ok: false, msg: 'Enter a valid Nigerian mobile number, for example 08012345678.' });
  if (!req.body.agree) return res.json({ ok: false, msg: 'Please accept the Terms & Privacy to continue.' });
  const needInvite = !bypass && mode === 'invite';
  if (needInvite && !invite) return res.json({ ok: false, msg: 'You need an invite code from us to register. Please contact support to get one.' });
  if (await q('SELECT 1 x FROM users WHERE email=?', email)) return res.json({ ok: false, msg: 'That email already has an account.' });
  if (await q('SELECT 1 x FROM users WHERE phone=?', phone)) return res.json({ ok: false, msg: 'That phone number is already registered.' });
  const hash = await bcrypt.hash(pass, 10); let id;
  try {
    id = await tx(async X => {
      const r = await X.run('INSERT INTO users(name,email,pass,phone,agreed_at,created) VALUES(?,?,?,?,now(),now()) RETURNING id', String(req.body.name || '').trim().slice(0, 80), email, hash, phone);
      if (needInvite) { const u = await X.run('UPDATE invites SET used_by=?,used_at=now() WHERE code=? AND used_by IS NULL AND (expires_at IS NULL OR expires_at > now())', r.rows[0].id, invite); if (!u.changes) throw Object.assign(new Error('invite'), { bad: true }); } // a code works once
      return r.rows[0].id;
    });
  } catch (e) {
    if (e.bad) return res.json({ ok: false, msg: 'That invite code is not valid, has expired or was already used.' });
    if (e.code === '23505') return res.json({ ok: false, msg: /phone/.test(String(e.constraint || e.detail)) ? 'That phone number is already registered.' : 'That email already has an account.' });
    throw e;
  }
  await regen(req); req.session.uid = id; res.json({ ok: true });
}));
const DUMMY = bcrypt.hashSync('x', 10);
app.post('/api/login', limit('login', 10, 15 * 60e3), wrap(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase().slice(0, 120);
  if (!(await hit('loginmail:' + email, 10, 15 * 60e3))) return res.status(429).json({ ok: false, msg: 'Too many attempts for this account. Please wait 15 minutes.' }); // stops password guessing from many addresses
  const u = await q('SELECT * FROM users WHERE email=?', email);
  const ok = await bcrypt.compare(String(req.body.pass || ''), u ? u.pass : DUMMY);
  if (!u || !ok) return res.json({ ok: false, msg: 'Wrong email or password.' });
  if (!u.active) return res.json({ ok: false, msg: 'This account has been suspended. Contact support.' });
  if (u.totp_on) {
    const code = String(req.body.code || '').replace(/\s/g, '');
    if (!code) return res.json({ ok: false, needCode: true, msg: 'Enter the 6-digit code from your authenticator app.' });
    const st = totpCheck(u.totp_secret, code, u.totp_last);
    if (!st) return res.json({ ok: false, needCode: true, msg: 'That code is wrong or has expired. Try the next code.' });
    await run('UPDATE users SET totp_last=? WHERE id=?', st, u.id);
  }
  await regen(req); req.session.uid = u.id;
  if (isAdmin(u.email)) req.session.cookie.maxAge = 12 * 36e5; // admin sessions end after 12 hours
  res.json({ ok: true });
}));
app.post('/api/logout', (req, res) => req.session.destroy(() => res.clearCookie('dv.sid').json({ ok: true })));
app.post('/api/public', wrap(async (req, res) => { const c = await cfgAll(); res.json({ whatsapp: c.whatsapp || E.WHATSAPP || '', regMode: c.reg_mode || 'open' }); }));
const bankAccounts = c => [1, 2].map(i => ({ bank: c['bank' + i + '_bank'] || E['BANK' + i + '_BANK'] || '', name: c['bank' + i + '_name'] || E['BANK' + i + '_NAME'] || '', number: c['bank' + i + '_number'] || E['BANK' + i + '_NUMBER'] || '' })).filter(b => b.bank && b.number);
app.post('/api/me', auth, wrap(async (req, res) => {
  const [rows, t, pend, c] = await Promise.all([all('SELECT k,price,price_ind,cost,active,agent_only FROM prices'),
    q("SELECT COALESCE(SUM(CASE WHEN status='credited' THEN amt END),0) funded, -COALESCE(SUM(CASE WHEN status!='credited' THEN amt END),0) spent FROM tx WHERE uid=?", req.user.id),
    q("SELECT COUNT(*) n FROM reqs WHERE uid=? AND status='pending'", req.user.id), cfgAll()]);
  const P = Object.fromEntries(rows.map(r => [r.k, r])), { id, name, email, bal: b, admin, phone } = req.user;
  res.json({ ok: true, user: { id, name, email, bal: b, admin, phone, agentStatus: admin ? 'approved' : req.user.agent_status, agent: req.user.agent }, whatsapp: c.whatsapp || E.WHATSAPP || '', paystack: !!E.PAYSTACK_SECRET, paystackLive: paystackLive(c), bankReady: bankAccounts(c).length > 0, passFee: PASS_FEE, twofa: !!req.user.totp_on, funded: t.funded, spent: t.spent, pending: pend.n,
    services: Object.values(S).map(sv => ({ key: sv.key, group: sv.group, label: sv.label, fields: sv.fields, kind: sv.kind, choices: choicesFor(sv), optional: sv.optional || [], agentOnly: !!P[sv.key].agent_only, locked: !!P[sv.key].agent_only && !req.user.agent, active: !!P[sv.key].active, price: priceView(P[sv.key], req.user), agentPrice: (req.user.admin || req.user.agent) ? agentOf(P[sv.key]) : priceView(P[sv.key], req.user), indPrice: (req.user.admin || req.user.agent) ? indOf(P[sv.key]) : priceView(P[sv.key], req.user), // customers never receive the agent price
      ...(admin ? { sell: P[sv.key].price, sellInd: indOf(P[sv.key]), cost: P[sv.key].cost } : {}) })) });
}));
app.post('/api/profile', auth, wrap(async (req, res) => {
  if (req.body.name != null) await run('UPDATE users SET name=? WHERE id=?', String(req.body.name).trim().slice(0, 80), req.user.id);
  if (req.body.pass) {
    const u = await q('SELECT pass FROM users WHERE id=?', req.user.id);
    if (!(await bcrypt.compare(String(req.body.current || ''), u.pass))) return res.json({ ok: false, msg: 'Your current password is wrong.' });
    if (String(req.body.pass).length < 8 || String(req.body.pass).length > 100) return res.json({ ok: false, msg: 'New password must be 8 to 100 characters.' });
    await run('UPDATE users SET pass=? WHERE id=?', await bcrypt.hash(String(req.body.pass), 10), req.user.id);
    await killSessions(req.user.id, req.sessionID); // signs out every other device
  }
  res.json({ ok: true, msg: 'Saved.' });
}));
app.post('/api/history', auth, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT svc,amt,status,at FROM tx WHERE uid=? ORDER BY id DESC LIMIT 200', req.user.id) })));

/* ---------- admin two-step login setup ---------- */
/* ---------- my results: a customer's own saved results, kept 30 days. Opening or downloading one never costs anything (no provider call, no charge).
   Only results that were really delivered ('success' / 'completed') are shown; anything marked "needs review" stays admin-only, because that money may have been refunded. ---------- */
const MY_RES = "uid=? AND outcome IN ('success','completed') AND at > now() - interval '30 day'";
app.post('/api/results/list', auth, wrap(async (req, res) => res.json({ ok: true, days: 30, rows: await all('SELECT id,at,label,hint,price,pdf IS NOT NULL AS has_pdf FROM results WHERE ' + MY_RES + ' ORDER BY id DESC LIMIT 200', req.user.id) })));
app.post('/api/results/get', auth, limit('resget', 60, 60e3), wrap(async (req, res) => {
  const r = await q('SELECT id,at,label,pdf,raw,info,photo FROM results WHERE id=? AND ' + MY_RES, Number(req.body.id) || 0, req.user.id);
  if (!r) return res.json({ ok: false, msg: 'This result was not found. Results are kept for 30 days.' });
  let info = null; try { info = JSON.parse(r.info); } catch {} if (!info || !Object.keys(info).length) { try { info = dataOf(JSON.parse(r.raw)); } catch { info = {}; } } // older rows: rebuild from the saved reply
  res.json({ ok: true, id: r.id, at: r.at, label: r.label, data: info, photo: r.photo, pdf: r.pdf });
}));
app.post('/api/results/delete', auth, wrap(async (req, res) => { const n = (await run('DELETE FROM results WHERE id=? AND uid=?', Number(req.body.id) || 0, req.user.id)).changes; res.json(n ? { ok: true, msg: 'Deleted. It cannot be recovered.' } : { ok: false, msg: 'Result not found.' }); }));
app.post('/api/2fa/setup', auth, adminOnly, wrap(async (req, res) => {
  if (req.user.totp_on) return res.json({ ok: false, msg: 'Two-step login is already on.' });
  const secret = b32enc(crypto.randomBytes(20));
  await run('UPDATE users SET totp_secret=?,totp_last=0 WHERE id=?', secret, req.user.id);
  res.json({ ok: true, secret, url: 'otpauth://totp/DEBONE:' + encodeURIComponent(req.user.email) + '?secret=' + secret + '&issuer=DEBONE&digits=6&period=30' });
}));
app.post('/api/2fa/enable', auth, adminOnly, limit('2fa', 10, 15 * 60e3), wrap(async (req, res) => {
  const u = await q('SELECT totp_secret,totp_on FROM users WHERE id=?', req.user.id);
  if (u.totp_on || !u.totp_secret) return res.json({ ok: false, msg: 'Start the setup first.' });
  const st = totpCheck(u.totp_secret, String(req.body.code || '').replace(/\s/g, ''), 0);
  if (!st) return res.json({ ok: false, msg: 'That code is wrong. Check the time on your phone and try again.' });
  await run('UPDATE users SET totp_on=1,totp_last=? WHERE id=?', st, req.user.id); await audit(req.user.email, '2fa_enabled', 'admin two-step login turned on');
  res.json({ ok: true, msg: 'Two-step login is on. You will need a code every time you sign in.' });
}));
app.post('/api/2fa/disable', auth, adminOnly, limit('2fa', 10, 15 * 60e3), wrap(async (req, res) => {
  const u = await q('SELECT pass,totp_secret,totp_on,totp_last FROM users WHERE id=?', req.user.id);
  if (!u.totp_on) return res.json({ ok: false, msg: 'Two-step login is not on.' });
  if (!(await bcrypt.compare(String(req.body.pass || ''), u.pass))) return res.json({ ok: false, msg: 'Your password is wrong.' });
  if (!totpCheck(u.totp_secret, String(req.body.code || '').replace(/\s/g, ''), u.totp_last)) return res.json({ ok: false, msg: 'That code is wrong or expired.' });
  await run('UPDATE users SET totp_on=0,totp_secret=NULL,totp_last=0 WHERE id=?', req.user.id); await audit(req.user.email, '2fa_disabled', 'admin two-step login turned off');
  res.json({ ok: true, msg: 'Two-step login is off.' });
}));

/* ---------- agent verification ---------- */
const agentView = a => a && ({ id: a.id, business: a.business, phone: a.phone, address: a.address, state: a.state, regno: a.regno, status: a.status, reason: a.reason || '', at: a.at });
app.post('/api/agent/status', auth, wrap(async (req, res) => {
  const a = await q('SELECT id,business,phone,address,state,regno,status,reason,at FROM agent_apps WHERE uid=? ORDER BY id DESC LIMIT 1', req.user.id);
  res.json({ ok: true, status: req.user.admin ? 'approved' : req.user.agent_status, app: agentView(a), states: STATES, phone: req.user.phone || '' });
}));
const AGENT_DOC_MAX = 2.5 * 1024 * 1024;
app.post('/api/agent/apply', auth, limit('agent', 15, 60 * 60e3), express.json({ limit: '4mb' }), wrap(async (req, res) => {
  if (req.user.agent) return res.json({ ok: false, msg: 'Your account is already a verified agent.' });
  if (req.user.agent_status === 'pending') return res.json({ ok: false, msg: 'Your application is already waiting for review.' });
  const business = String(req.body.business || '').trim(), address = String(req.body.address || '').trim(), state = String(req.body.state || ''), regno = String(req.body.regno || '').trim().slice(0, 40), phone = normPhone(req.body.phone);
  if (business.length < 2 || business.length > 80) return res.json({ ok: false, msg: 'Enter your business or shop name.' });
  if (!phone) return res.json({ ok: false, msg: 'Enter a valid Nigerian mobile number we can reach you on.' });
  if (address.length < 5 || address.length > 160) return res.json({ ok: false, msg: 'Enter your business address.' });
  if (!STATES.includes(state)) return res.json({ ok: false, msg: 'Choose your state.' });
  const m = /^data:(image\/jpeg|image\/png|image\/webp|application\/pdf);base64,([A-Za-z0-9+\/=]+)$/.exec(String(req.body.dataUrl || ''));
  if (!m) return res.json({ ok: false, msg: 'Upload a clear photo (JPG, PNG or WebP) or PDF of a valid ID: NIN slip, voter’s card, driver’s licence, passport or your agent licence.' });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > AGENT_DOC_MAX) return res.json({ ok: false, msg: 'The document is larger than 2.5 MB. Please upload a smaller photo or PDF.' });
  if (buf.length < 200 || !MAGIC[m[1]](buf)) return res.json({ ok: false, msg: 'That file is not a valid image or PDF.' });
  await tx(async X => {
    await X.run('INSERT INTO agent_apps(uid,business,phone,address,state,regno,doc,doc_name,doc_mime,doc_hash,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)', req.user.id, business, phone, address, state, regno, buf, String(req.body.name || 'document').replace(/[^\w.\- ]/g, '').slice(0, 80) || 'document', m[1], crypto.createHash('sha256').update(buf).digest('hex'), 'pending');
    await X.run("UPDATE users SET agent_status='pending' WHERE id=?", req.user.id);
  });
  await audit('system', 'agent_application', req.user.email + ': ' + business);
  res.json({ ok: true, status: 'pending' });
}));

/* ---------- run a service ---------- */
app.post('/api/run', auth, limit('run', 40, 60e3), wrap(async (req, res) => {
  const base = S[req.body.service]; if (!base) return res.json({ ok: false, msg: 'Unknown service.' });
  const pr0 = await px(base.key);
  if (!pr0.active) return res.json({ ok: false, msg: 'This service is switched off right now.' });
  if (pr0.agent_only && !req.user.agent) return res.json({ ok: false, locked: true, msg: 'This service is currently restricted to verified agents. Apply under Agent Verification to use it.' });
  const v = clean(base, req.body.f); if (v.err) return res.json({ ok: false, msg: v.err });
  const price = await priceFor(base.key, req.user), lock = lockKey(req.user.id + '|' + base.key + '|' + JSON.stringify(v.out));
  if (!(await getLock(lock))) return res.json({ ok: false, msg: 'This request is already being processed.' });
  let debited = false, settled = false;
  try {
    if (!(await charge(req.user.id, price))) return res.json({ ok: false, msg: 'Not enough balance. Fund your wallet first.', bal: await bal(req.user.id) });
    debited = true;
    const r = await vp(base.url, base.kind === 'lookup' ? { service: base.key, ...v.out } : v.out);
    const st = r.status || 'error', good = okish(r), low = !good && (r.response_code === '04' || /insufficient/i.test(String(r.message || '')));
    if (!good) console.log(new Date().toISOString(), 'provider reply for', base.key, '-> status:', r.status, '| code:', r.response_code, '| message:', String(r.message || '').slice(0, 80), '| fields:', Object.keys(r).join(','));
    if (good || pdfOf(r) || /success/i.test(String(r.message || ''))) await archive(req.user, base, v, r, good ? 'success' : 'needs review', price);
    const fail = async msg => { settled = true; await refund(req.user.id, price); await log(req.user.id, base.label, -price, 'charged'); await log(req.user.id, base.label, price, 'refunded'); return res.json({ ok: false, msg, bal: await bal(req.user.id) }); };
    const down = !good && !low && (['02', '03', '07', '09'].includes(String(r.response_code)) || /rate limit|temporarily unavailable|switched off/i.test(String(r.message || '')));
    if (down) { await audit('system', 'provider_unavailable', base.label + ': code ' + (r.response_code || '-') + ' ' + String(r.message || '').slice(0, 120)); return await fail('This service is temporarily unavailable. You were not charged. Please try again later.' + (req.user.admin ? ' [Admin only: provider replied "' + String(r.message || r.response_code).slice(0, 120) + '"]' : '')); }
    if (low) { await audit('system', 'provider_balance', base.label + ': provider wallet may be low'); return await fail('This service is temporarily unavailable. You were not charged. Please try again later.' + (req.user.admin ? ' [Admin only: provider replied "' + String(r.message || r.response_code || 'insufficient balance').slice(0, 120) + '". Fund your verifyplatform wallet.]' : '')); }
    if (base.kind === 'async') {
      const first = String(Object.values(v.out)[0] || ''), ref = r.transaction_id || r.ticket_id || (r.data && (r.data.transaction_id || r.data.ticket_id)) || (base.trackRef ? first : null); // IPE/personalisation can be tracked by tracking ID
      if (!(good || st === 'pending')) return await fail((r.message || 'Request was rejected.') + ' You were not charged.');
      settled = true;
      if (!ref) { // provider accepted it but gave no request id: keep the money, flag it, never lose it silently
        await run('INSERT INTO reqs(uid,svc,label,ref,price,status,input) VALUES(?,?,?,?,?,?,?)', req.user.id, base.key, base.label, 'REVIEW', price, 'review', first);
        await log(req.user.id, base.label, -price, 'submitted'); await audit('system', 'request_without_id', base.label + ' for ' + req.user.email + ': accepted by provider but no request id returned');
        return res.json({ ok: true, submitted: true, msg: 'Request submitted and under review. Track it under My Requests.', bal: await bal(req.user.id) });
      }
      await run('INSERT INTO reqs(uid,svc,label,ref,price,status,input) VALUES(?,?,?,?,?,?,?)', req.user.id, base.key, base.label, String(ref), price, 'pending', first);
      await log(req.user.id, base.label, -price, 'submitted');
      return res.json({ ok: true, submitted: true, msg: 'Request submitted. Track it under My Requests.', bal: await bal(req.user.id) });
    }
    const found = good, charged = base.kind === 'lookup' && (st === 'not_found' || String(r.response_code) === '01') && !r.refunded;
    if (!found && !charged) return await fail((r.message || 'Could not complete this check.') + ' You were not charged.' + (req.user.admin ? (st === 'error' && !r.message ? ' [Admin only: no reply from the provider. Check VP_API_KEY and your internet connection.]' : ' [Admin only: provider status=' + r.status + ', code=' + r.response_code + ']') : ''));
    settled = true; await log(req.user.id, base.label, -price, found ? 'success' : 'no record');
    if (!found) return res.json({ ok: false, msg: 'No record found for these details. The fee applies.', bal: await bal(req.user.id) });
    const pdf = pdfOf(r); let notice;
    if (base.kind === 'slip' && !pdf) { notice = 'Your payment went through and the slip was generated, but the file did not reach us. Support has been alerted and will send it to you.'; await audit('system', 'slip_without_file', base.label + ' for ' + req.user.email); }
    res.json({ ok: true, data: dataOf(r), photo: photoOf(r), pdf, notice, bal: await bal(req.user.id) });
  } catch (e) { if (debited && !settled) await refund(req.user.id, price).catch(() => {}); throw e; } finally { await freeLock(lock); }
}));

/* ---------- agency requests (IPE, validation, personalisation) ---------- */
const COOLDOWN = E.REQ_CHECK_COOLDOWN != null && E.REQ_CHECK_COOLDOWN !== '' ? Number(E.REQ_CHECK_COOLDOWN) : 120; // seconds between customer checks of one request
const checkedAgo = row => row.checked ? (Date.now() - new Date(row.checked).getTime()) / 1000 : Infinity;
async function checkReq(row, force) {
  if (row.status === 'completed') return { status: 'completed', ...JSON.parse(row.result) };
  if (row.status === 'failed') return { status: 'failed', msg: 'This request failed and your money was returned.' };
  if (row.status === 'review' || row.ref === 'REVIEW') return { status: 'pending', msg: 'This request is being reviewed by our team. We will update you shortly.' };
  const sb = row.svc === 'ipe' ? { trackingID: row.input || row.ref }
    : row.svc === 'validation' ? (/^TKT/i.test(row.ref) ? { ticket_id: row.ref } : { transaction_id: row.ref })
    : row.ref === row.input ? { tracking_id: row.ref } : { transaction_id: row.ref };
  if (Date.now() < providerBusyUntil) return { status: 'pending', msg: 'The provider is busy right now. Your request is safe. Check again in a few minutes.' };
  if (!force && checkedAgo(row) < COOLDOWN) return { status: 'pending', msg: 'Checked a moment ago and still processing. Results rarely change within minutes; check again shortly.' };
  await run('UPDATE reqs SET checked=now() WHERE id=?', row.id);
  const r = await vp(S[row.svc].status, sb);
  if (String(r.response_code) === '07' || /rate limit/i.test(String(r.message || ''))) { providerBusyUntil = Date.now() + 10 * 60e3; await audit('system', 'provider_rate_limit', 'status checks paused for 10 minutes'); return { status: 'pending', msg: 'The provider is busy right now. Your request is safe. Check again in a few minutes.' }; }
  const s = String((r.data && r.data.status) || r.request_status || r.transaction_status || '').toLowerCase(), top = String(r.status || '').toLowerCase();
  const pdf = pdfOf(r), d = r.data && typeof r.data === 'object' && !Array.isArray(r.data) ? r.data : null;
  const hasData = !!d && Object.keys(d).some(k => !['status', 'transaction_id', 'ticket_id'].includes(k));
  if (/fail|reject|declin|suspend|block|invalid|cancel/.test(s || top)) {
    await tx(async X => { if ((await X.run("UPDATE reqs SET status='failed' WHERE id=? AND status IN ('pending','review')", row.id)).changes) { await refund(row.uid, row.price, X); await log(row.uid, row.label, row.price, 'refunded', X); } });
    return { status: 'failed', msg: 'This request failed and your money was returned.' };
  }
  if ((['completed', 'complete', 'success', 'successful', 'done'].includes(s) && (pdf || hasData)) || (!s && pdf)) { // completed only when a real result arrives
    const out = { data: prune(scrub(d || {})), photo: photoOf(r) || null, pdf: pdf || null };
    if ((await run("UPDATE reqs SET status='completed',result=? WHERE id=? AND status='pending'", JSON.stringify(out), row.id)).changes) {
      try { const u = (await q('SELECT id,email FROM users WHERE id=?', row.uid)) || { id: row.uid, email: '' }; await archive(u, { key: row.svc, label: row.label }, { out: {} }, { pdf_base64: pdf || null, ...r }, 'completed', row.price); } catch {}
    }
    return { status: 'completed', ...out };
  }
  return { status: 'pending', msg: 'Still processing. Check again in a few minutes.' };
}
app.post('/api/reqs', auth, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT id,label,status,at FROM reqs WHERE uid=? ORDER BY id DESC LIMIT 100', req.user.id) })));
app.post('/api/req/check', auth, limit('chk', 30, 60e3), wrap(async (req, res) => {
  const row = await q('SELECT * FROM reqs WHERE id=? AND uid=?', Number(req.body.id) || 0, req.user.id); if (!row) return res.json({ ok: false, msg: 'Request not found.' });
  res.json({ ok: true, ...(await checkReq(row)), bal: await bal(req.user.id) });
}));

/* ---------- Paystack ---------- */
const ps = (p, o = {}) => fetch((E.PS_BASE || 'https://api.paystack.co') + p, { ...o, signal: AbortSignal.timeout(20000), headers: { Authorization: 'Bearer ' + E.PAYSTACK_SECRET, 'Content-Type': 'application/json' } }).then(r => r.json());
async function settle(ref) {
  const p = await q('SELECT * FROM pay WHERE ref=?', ref); if (!p) return 'unknown';
  if (p.status === 'paid') return 'paid';
  if (p.status === 'review') return 'failed';
  let v; try { v = await ps('/transaction/verify/' + encodeURIComponent(ref)); } catch { return 'pending'; }
  if (!v.status || !v.data) return 'pending';
  if (v.data.status !== 'success') return ['failed', 'abandoned', 'reversed'].includes(v.data.status) ? 'failed' : 'pending';
  const due = (p.charged || p.amt) * 100;
  if (v.data.amount !== due || v.data.currency !== 'NGN') { await run("UPDATE pay SET status='review' WHERE ref=? AND status='pending'", ref); await audit('system', 'paystack_mismatch', ref + ': paid ' + v.data.amount / 100 + ', expected ' + due / 100); return 'failed'; }
  await tx(async X => { if ((await X.run("UPDATE pay SET status='paid' WHERE ref=? AND status='pending'", ref)).changes) { await refund(p.uid, p.amt, X); await log(p.uid, 'Wallet funding (Paystack)', p.amt, 'credited', X); } }); // credited exactly once
  return 'paid';
}
app.post('/api/pay/init', auth, limit('pay', 10, 10 * 60e3), wrap(async (req, res) => {
  if (!paystackLive(await cfgAll())) return res.json({ ok: false, msg: 'Paystack is temporarily unavailable. Please fund your wallet by bank transfer instead.' });
  const amt = Number(req.body.amount);
  if (!Number.isInteger(amt) || amt < 100 || amt > 500000) return res.json({ ok: false, msg: 'Enter a whole amount from ₦100 to ₦500,000.' });
  const ref = 'DV' + Date.now() + crypto.randomBytes(3).toString('hex'), total = grossFor(amt);
  const base = /^https:\/\/(?!yourdomain\.com)/i.test(E.BASE_URL || '') ? E.BASE_URL.replace(/\/$/, '') : req.protocol + '://' + req.get('host'); // placeholder BASE_URL falls back to the real address
  let r; try { r = await ps('/transaction/initialize', { method: 'POST', body: JSON.stringify({ email: req.user.email, amount: total * 100, currency: 'NGN', reference: ref, callback_url: base + '/?paid=' + ref }) }); } catch { r = {}; }
  if (!r.status || !r.data) return res.json({ ok: false, msg: 'Payment could not start. Please try again.' });
  await run('INSERT INTO pay(ref,uid,amt,charged,status,at) VALUES(?,?,?,?,?,now())', ref, req.user.id, amt, total, 'pending');
  res.json({ ok: true, url: r.data.authorization_url, total, fee: total - amt });
}));
app.post('/api/pay/list', auth, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT ref,amt,COALESCE(charged,amt) charged,status,at FROM pay WHERE uid=? ORDER BY at DESC NULLS LAST, ref DESC LIMIT 50', req.user.id) })));
app.post('/api/pay/verify', auth, wrap(async (req, res) => {
  const p = await q('SELECT uid FROM pay WHERE ref=?', String(req.body.ref || ''));
  if (!p || p.uid !== req.user.id) return res.json({ ok: false, msg: 'Payment not found.' });
  res.json({ ok: true, status: await settle(req.body.ref), bal: await bal(req.user.id) });
}));
app.post('/api/paystack/webhook', wrap(async (req, res) => {
  if (!E.PAYSTACK_SECRET) return res.sendStatus(401);
  const sig = crypto.createHmac('sha512', E.PAYSTACK_SECRET).update(req.raw || '').digest('hex'), got = String(req.get('x-paystack-signature') || '');
  if (!safeEq(sig, got)) return res.sendStatus(401);
  if (req.body.event === 'charge.success' && req.body.data) await settle(req.body.data.reference);
  res.sendStatus(200);
}));

/* ---------- admin ---------- */
const adm = [auth, adminOnly];
/* ---------- guide: the admin chapters are sent only to the admin (the customer chapters are a normal public file) ---------- */
const GUIDE_ADMIN = require('./guide-admin.js');
app.post('/api/guide/admin', adm, (req, res) => res.json({ ok: true, part: GUIDE_ADMIN }));

const aid = async () => ((await q('SELECT id FROM users WHERE lower(email)=?', ADMIN)) || {}).id || 0;
app.post('/api/admin/stats', adm, wrap(async (req, res) => {
  const a = await aid(), n = async (s, ...p) => (await q(s, ...p)).n, c = await cfgAll();
  const [users, held, funded, revenue, pending, today, missing, transfersPending, payPending, payReview, reqReview, reqStuck, ledger, logs, agentsPending] = await Promise.all([
    n('SELECT COUNT(*) n FROM users'), n('SELECT COALESCE(SUM(bal),0) n FROM users'),
    n("SELECT COALESCE(SUM(amt),0) n FROM tx WHERE status='credited' AND uid!=?", a), n("SELECT -COALESCE(SUM(amt),0) n FROM tx WHERE status!='credited' AND uid!=?", a),
    n("SELECT COUNT(*) n FROM reqs WHERE status IN ('pending','review')"), n("SELECT COUNT(*) n FROM tx WHERE at::date = current_date AND status IN ('success','no record','submitted') AND uid!=?", a),
    n('SELECT COUNT(*) n FROM prices WHERE cost=0'), n("SELECT COUNT(*) n FROM transfers WHERE status='proof_uploaded'"),
    n("SELECT COUNT(*) n FROM pay WHERE status='pending' AND at > now() - interval '2 day'"), n("SELECT COUNT(*) n FROM pay WHERE status='review'"),
    n("SELECT COUNT(*) n FROM reqs WHERE status='review'"), n("SELECT COUNT(*) n FROM reqs WHERE status='pending' AND at < now() - interval '3 day'"),
    n('SELECT COALESCE(SUM(amt),0) n FROM tx'), all('SELECT at,admin,action,detail FROM admin_log ORDER BY id DESC LIMIT 15'), n("SELECT COUNT(*) n FROM agent_apps WHERE status='pending'")]);
  res.json({ ok: true, users, held, funded, revenue, pending, today, missing, paystack: !!E.PAYSTACK_SECRET, bankReady: bankAccounts(c).length > 0, transfersPending, payPending, payReview, reqReview, reqStuck, agentsPending, ledger: ledger + Number(c.ledger_base || (await getSet('ledger_base')) || 0), logs });
}));
app.post('/api/admin/payments', adm, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT p.ref,p.amt,COALESCE(p.charged,p.amt) charged,p.status,p.at,u.email FROM pay p LEFT JOIN users u ON u.id=p.uid ORDER BY p.at DESC NULLS LAST, p.ref DESC LIMIT 300') })));
app.post('/api/admin/pay/recheck', adm, wrap(async (req, res) => {
  if (!E.PAYSTACK_SECRET) return res.json({ ok: false, msg: 'Paystack key is not set.' });
  let n = 0, c = 0; for (const p of await all("SELECT ref FROM pay WHERE status='pending' ORDER BY at DESC NULLS LAST LIMIT 50")) { n++; if (await settle(p.ref) === 'paid') c++; }
  await audit(req.user.email, 'pay_recheck', n + ' checked, ' + c + ' credited'); res.json({ ok: true, msg: n ? n + ' payment(s) re-checked, ' + c + ' newly credited.' : 'No waiting payments.' });
}));
app.post('/api/admin/requests', adm, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT r.id,r.at,r.label,r.price,r.status,u.email FROM reqs r LEFT JOIN users u ON u.id=r.uid ORDER BY r.id DESC LIMIT 300') })));
app.post('/api/admin/req/check', adm, wrap(async (req, res) => {
  const row = await q('SELECT * FROM reqs WHERE id=?', Number(req.body.id) || 0); if (!row) return res.json({ ok: false, msg: 'Request not found.' });
  const out = await checkReq(row, true); res.json({ ok: true, ...out, msg: out.msg || (out.status === 'completed' ? 'Completed.' : '') });
}));
app.post('/api/admin/req/refund', adm, wrap(async (req, res) => {
  const row = await q('SELECT * FROM reqs WHERE id=?', Number(req.body.id) || 0); if (!row) return res.json({ ok: false, msg: 'Request not found.' });
  const done = await tx(async X => { if ((await X.run("UPDATE reqs SET status='failed' WHERE id=? AND status IN ('pending','review')", row.id)).changes) { await refund(row.uid, row.price, X); await log(row.uid, row.label, row.price, 'refunded', X); return true; } return false; });
  if (!done) return res.json({ ok: false, msg: 'This request is already closed. No refund was made.' });
  await audit(req.user.email, 'refund_request', row.label + ' #' + row.id); res.json({ ok: true, msg: 'Customer refunded and request closed.' });
}));
app.post('/api/admin/provider-check', adm, wrap(async (req, res) => {
  const r = await vp('lookup.php', { service: 'list' });
  const reachable = !(r.status === 'error' && !r.message && !r.response_code), b = r.balance ?? r.wallet_balance ?? (r.data && (r.data.balance ?? r.data.wallet_balance));
  res.json({ ok: true, reachable, status: r.status, code: r.response_code, message: String(r.message || '').slice(0, 120), balance: b != null && Number.isFinite(Number(b)) ? Number(b) : null });
}));

/* ---------- bank transfer funding: customer sends money to your account, uploads the receipt, you approve ---------- */
const tView = (t, banks) => ({ ref: t.ref, amount: t.amt, status: t.status, reason: t.reason || '', proofName: t.proof_name || '', at: t.at, upd: t.upd, credited: t.credited, banks });
const myTransfer = req => q('SELECT * FROM transfers WHERE ref=? AND uid=?', String(req.body.ref || ''), req.user.id);
const T_COLS = 'id,ref,uid,amt,credited,status,reason,proof_name,proof_mime,at,upd';
app.post('/api/transfer/create', auth, limit('tcreate', 10, 10 * 60e3), wrap(async (req, res) => {
  const banks = bankAccounts(await cfgAll());
  if (!banks.length) return res.json({ ok: false, msg: 'Bank transfer is not set up yet. Please contact support.' });
  const amt = Number(req.body.amount);
  if (!Number.isInteger(amt) || amt < 100 || amt > 500000) return res.json({ ok: false, msg: 'Enter a whole amount from ₦100 to ₦500,000.' });
  if ((await q("SELECT COUNT(*) n FROM transfers WHERE uid=? AND status IN ('awaiting_transfer','awaiting_proof')", req.user.id)).n >= 3) return res.json({ ok: false, msg: 'You already have 3 unfinished transfers. Finish or cancel one first.' });
  const ref = 'DT-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  await run("INSERT INTO transfers(ref,uid,amt,status) VALUES(?,?,?,'awaiting_transfer')", ref, req.user.id, amt);
  res.json({ ok: true, transfer: tView(await q('SELECT ' + T_COLS + ' FROM transfers WHERE ref=?', ref), banks) });
}));
app.post('/api/transfer/get', auth, wrap(async (req, res) => { const t = await myTransfer(req); res.json(t ? { ok: true, transfer: tView(t, bankAccounts(await cfgAll())) } : { ok: false, msg: 'Transfer not found.' }); }));
app.post('/api/transfer/list', auth, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT ref,amt,credited,status,at FROM transfers WHERE uid=? ORDER BY id DESC LIMIT 30', req.user.id) })));
app.post('/api/transfer/made', auth, wrap(async (req, res) => {
  const t = await myTransfer(req); if (!t) return res.json({ ok: false, msg: 'Transfer not found.' });
  if (!(await run("UPDATE transfers SET status='awaiting_proof',upd=now() WHERE id=? AND status IN ('awaiting_transfer','rejected')", t.id)).changes) return res.json({ ok: false, msg: 'This transfer is already waiting for review or finished.' });
  res.json({ ok: true, transfer: tView(await q('SELECT ' + T_COLS + ' FROM transfers WHERE id=?', t.id), bankAccounts(await cfgAll())) });
}));
app.post('/api/transfer/cancel', auth, wrap(async (req, res) => {
  const t = await myTransfer(req); if (!t) return res.json({ ok: false, msg: 'Transfer not found.' });
  if (!(await run("UPDATE transfers SET status='cancelled',upd=now() WHERE id=? AND status IN ('awaiting_transfer','awaiting_proof','rejected')", t.id)).changes) return res.json({ ok: false, msg: 'This transfer can no longer be cancelled.' });
  res.json({ ok: true });
}));
const MAX_PROOF = 2.5 * 1024 * 1024; // Vercel accepts request bodies up to 4.5 MB, and a photo grows by a third when sent
const MAGIC = { 'image/jpeg': b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff, 'image/png': b => b.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47])), 'image/webp': b => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP', 'application/pdf': b => b.slice(0, 4).toString() === '%PDF' };
app.post('/api/transfer/proof', auth, limit('tproof', 10, 10 * 60e3), express.json({ limit: '4mb' }), wrap(async (req, res) => {
  const t = await myTransfer(req); if (!t) return res.json({ ok: false, msg: 'Transfer not found.' });
  if (!['awaiting_transfer', 'awaiting_proof', 'rejected'].includes(t.status)) return res.json({ ok: false, msg: 'A receipt is not needed for this transfer.' });
  const m = /^data:(image\/jpeg|image\/png|image\/webp|application\/pdf);base64,([A-Za-z0-9+\/=]+)$/.exec(String(req.body.dataUrl || ''));
  if (!m) return res.json({ ok: false, msg: 'Upload a photo (JPG, PNG or WebP) or a PDF of your receipt.' });
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > MAX_PROOF) return res.json({ ok: false, msg: 'The receipt is larger than 2.5 MB. Please upload a smaller photo or PDF.' });
  if (buf.length < 200 || !MAGIC[m[1]](buf)) return res.json({ ok: false, msg: 'That file is not a valid receipt image or PDF.' });
  const hash = crypto.createHash('sha256').update(buf).digest('hex'), ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[m[1]];
  await run("UPDATE transfers SET status='proof_uploaded',reason='',proof=?,proof_mime=?,proof_name=?,proof_hash=?,upd=now() WHERE id=?", buf, m[1], String(req.body.name || 'receipt.' + ext).replace(/[^\w.\- ]/g, '').slice(0, 80) || 'receipt.' + ext, hash, t.id);
  res.json({ ok: true, transfer: tView(await q('SELECT ' + T_COLS + ' FROM transfers WHERE id=?', t.id), bankAccounts(await cfgAll())) });
}));
app.get('/api/admin/transfer/:ref/receipt', auth, adminOnly, wrap(async (req, res) => {
  const t = await q('SELECT proof,proof_mime,ref FROM transfers WHERE ref=?', req.params.ref);
  if (!t || !t.proof) return res.status(404).send('No receipt.');
  res.set({ 'Content-Type': t.proof_mime, 'Content-Disposition': 'inline; filename="receipt-' + t.ref + '"', 'Cache-Control': 'no-store' }); res.send(t.proof);
}));
app.post('/api/admin/transfers', adm, wrap(async (req, res) => res.json({ ok: true, rows: await all(`SELECT t.ref,t.amt,t.credited,t.status,t.reason,t.proof_name,t.at,t.upd,u.email,u.name,t.proof IS NOT NULL AS has_proof,t.proof_mime,
  (SELECT x.ref FROM transfers x WHERE x.proof_hash IS NOT NULL AND x.proof_hash=t.proof_hash AND x.id!=t.id LIMIT 1) AS dup
  FROM transfers t LEFT JOIN users u ON u.id=t.uid ORDER BY CASE t.status WHEN 'proof_uploaded' THEN 0 WHEN 'awaiting_proof' THEN 1 ELSE 2 END, t.upd DESC LIMIT 300`) })));
app.post('/api/admin/transfer/approve', adm, wrap(async (req, res) => {
  const t = await q('SELECT * FROM transfers WHERE ref=?', String(req.body.ref || '')); if (!t) return res.json({ ok: false, msg: 'Transfer not found.' });
  const amt = req.body.amount == null || req.body.amount === '' ? t.amt : Number(req.body.amount);
  if (!Number.isInteger(amt) || amt < 1 || amt > 1000000) return res.json({ ok: false, msg: 'Enter the amount you actually received, as a whole number.' });
  const dup = t.proof_hash && await q("SELECT ref FROM transfers WHERE proof_hash=? AND id!=? AND status='approved' LIMIT 1", t.proof_hash, t.id);
  if (dup && !req.body.force) return res.json({ ok: false, dup: dup.ref, msg: 'This same receipt image was already used for ' + dup.ref + '. Approve only if you are sure.' });
  const done = await tx(async X => {
    if (!(await X.run("UPDATE transfers SET status='approved',credited=?,reason='',decided_by=?,upd=now() WHERE id=? AND status IN ('awaiting_transfer','awaiting_proof','proof_uploaded','rejected')", amt, req.user.email, t.id)).changes) return false;
    await refund(t.uid, amt, X); await log(t.uid, 'Wallet funding (bank transfer)', amt, 'credited', X); return true; // credited exactly once
  });
  if (!done) return res.json({ ok: false, msg: 'This transfer is already finished. Nothing was credited.' });
  await audit(req.user.email, 'approve_transfer', t.ref + ': credited ' + amt + (amt !== t.amt ? ' (customer requested ' + t.amt + ')' : ''));
  res.json({ ok: true, msg: 'Approved. ₦' + amt.toLocaleString('en-US') + ' was added to the customer wallet.' });
}));
app.post('/api/admin/transfer/reject', adm, wrap(async (req, res) => {
  const reason = String(req.body.reason || '').trim().slice(0, 300);
  if (reason.length < 5) return res.json({ ok: false, msg: 'Tell the customer briefly why it was rejected.' });
  const t = await q('SELECT id,ref FROM transfers WHERE ref=?', String(req.body.ref || '')); if (!t) return res.json({ ok: false, msg: 'Transfer not found.' });
  if (!(await run("UPDATE transfers SET status='rejected',reason=?,decided_by=?,upd=now() WHERE id=? AND status IN ('awaiting_transfer','awaiting_proof','proof_uploaded')", reason, req.user.email, t.id)).changes) return res.json({ ok: false, msg: 'This transfer is already finished.' });
  await audit(req.user.email, 'reject_transfer', t.ref + ': ' + reason); res.json({ ok: true, msg: 'Rejected. The customer can upload a new receipt.' });
}));
app.post('/api/admin/bank', adm, wrap(async (req, res) => { const c = await cfgAll(); res.json({ ok: true, accounts: [1, 2].map(i => ({ bank: c['bank' + i + '_bank'] || E['BANK' + i + '_BANK'] || '', name: c['bank' + i + '_name'] || E['BANK' + i + '_NAME'] || '', number: c['bank' + i + '_number'] || E['BANK' + i + '_NUMBER'] || '' })), paystackOn: paystackLive(c), paystackKey: !!E.PAYSTACK_SECRET }); }));
app.post('/api/admin/bank/save', adm, wrap(async (req, res) => {
  const list = Array.isArray(req.body.accounts) ? req.body.accounts.slice(0, 2) : [];
  for (const [i, a] of list.entries()) {
    const bank = String(a.bank || '').trim().slice(0, 40), name = String(a.name || '').trim().slice(0, 80), number = String(a.number || '').replace(/\s/g, '');
    if (!bank && !name && !number) { for (const k of ['bank', 'name', 'number']) await setSet('bank' + (i + 1) + '_' + k, ''); continue; }
    if (bank.length < 2 || name.length < 2 || !/^\d{8,20}$/.test(number)) return res.json({ ok: false, msg: 'Account ' + (i + 1) + ': enter the bank name, the account name and a valid account number (digits only), or clear all three.' });
    await setSet('bank' + (i + 1) + '_bank', bank); await setSet('bank' + (i + 1) + '_name', name); await setSet('bank' + (i + 1) + '_number', number);
  }
  await audit(req.user.email, 'bank_accounts_changed', list.map(a => (a.bank || '-') + ' ' + String(a.number || '').slice(-4)).join(' | ')); res.json({ ok: true, msg: 'Bank details saved.' });
}));
app.post('/api/admin/paystack', adm, wrap(async (req, res) => {
  const on = !!req.body.on; if (on && !E.PAYSTACK_SECRET) return res.json({ ok: false, msg: 'Add PAYSTACK_SECRET to your environment variables first.' });
  await setSet('paystack_on', on ? '1' : '0'); await audit(req.user.email, 'paystack_switch', on ? 'on' : 'off'); res.json({ ok: true, on, msg: on ? 'Paystack is now available to customers.' : 'Paystack now shows "temporarily unavailable".' });
}));
app.post('/api/admin/results', adm, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT id,at,email,label,hint,outcome,price,pdf IS NOT NULL AS has_pdf FROM results ORDER BY id DESC LIMIT 300') })));
app.post('/api/admin/result', adm, wrap(async (req, res) => {
  const r = await q('SELECT id,at,email,label,outcome,pdf,raw,info,photo FROM results WHERE id=?', Number(req.body.id) || 0); if (!r) return res.json({ ok: false, msg: 'Not found.' });
  let info = null; try { info = JSON.parse(r.info); } catch {} if (!info || !Object.keys(info).length) { try { info = dataOf(JSON.parse(r.raw)); } catch { info = {}; } } // older rows: rebuild from the saved reply
  await audit(req.user.email, 'open_result', r.label + ' #' + r.id + ' (' + r.email + ')'); res.json({ ok: true, ...r, info });
}));
app.post('/api/admin/result/delete', adm, wrap(async (req, res) => { await run('DELETE FROM results WHERE id=?', Number(req.body.id) || 0); await audit(req.user.email, 'delete_result', '#' + req.body.id); res.json({ ok: true }); }));
app.post('/api/admin/agents', adm, wrap(async (req, res) => res.json({ ok: true, mode: (await cfgAll()).reg_mode || 'open', rows: await all(`SELECT a.id,a.business,a.phone,a.address,a.state,a.regno,a.status,a.reason,a.at,a.doc_name,a.doc IS NOT NULL AS has_doc,u.email,u.name,
  (SELECT x.id FROM agent_apps x WHERE x.doc_hash IS NOT NULL AND x.doc_hash=a.doc_hash AND x.id!=a.id LIMIT 1) AS dup
  FROM agent_apps a JOIN users u ON u.id=a.uid ORDER BY CASE a.status WHEN 'pending' THEN 0 ELSE 1 END, a.upd DESC LIMIT 200`) })));
app.get('/api/admin/agent/:id/doc', auth, adminOnly, wrap(async (req, res) => {
  const a = await q('SELECT doc,doc_mime,id FROM agent_apps WHERE id=?', Number(req.params.id) || 0);
  if (!a || !a.doc) return res.status(404).send('No document.');
  res.set({ 'Content-Type': a.doc_mime, 'Content-Disposition': 'inline; filename="agent-document-' + a.id + '"', 'Cache-Control': 'no-store' }); res.send(a.doc);
}));
app.post('/api/admin/agent/decide', adm, wrap(async (req, res) => {
  const a = await q('SELECT id,uid FROM agent_apps WHERE id=?', Number(req.body.id) || 0); if (!a) return res.json({ ok: false, msg: 'Application not found.' });
  const approve = !!req.body.approve, reason = String(req.body.reason || '').trim().slice(0, 300);
  if (!approve && reason.length < 5) return res.json({ ok: false, msg: 'Tell the applicant briefly why it was rejected.' });
  const done = await tx(async X => {
    if (!(await X.run("UPDATE agent_apps SET status=?,reason=?,decided_by=?,upd=now() WHERE id=? AND status='pending'", approve ? 'approved' : 'rejected', approve ? '' : reason, req.user.email, a.id)).changes) return false;
    await X.run('UPDATE users SET agent_status=? WHERE id=?', approve ? 'approved' : 'rejected', a.uid); return true;
  });
  if (!done) return res.json({ ok: false, msg: 'This application was already decided.' });
  await audit(req.user.email, approve ? 'approve_agent' : 'reject_agent', '#' + a.id + (approve ? '' : ': ' + reason));
  res.json({ ok: true, msg: approve ? 'Approved. The user can now use agent services.' : 'Rejected. The applicant can apply again.' });
}));
app.post('/api/admin/user/agent', adm, wrap(async (req, res) => {
  const u = await q('SELECT id,email FROM users WHERE id=?', Number(req.body.id) || 0); if (!u) return res.json({ ok: false, msg: 'User not found.' });
  const st = req.body.status === 'approved' ? 'approved' : 'none';
  await run('UPDATE users SET agent_status=? WHERE id=?', st, u.id); await audit(req.user.email, st === 'approved' ? 'make_agent' : 'revoke_agent', u.email);
  res.json({ ok: true, msg: st === 'approved' ? 'User is now a verified agent.' : 'Agent access removed.' });
}));
app.post('/api/admin/regmode', adm, wrap(async (req, res) => {
  const mode = ['open', 'invite', 'closed'].includes(req.body.mode) ? req.body.mode : null; if (!mode) return res.json({ ok: false, msg: 'Choose open, invite or closed.' });
  await setSet('reg_mode', mode); await audit(req.user.email, 'registration_mode', mode); res.json({ ok: true, msg: 'Registration is now ' + mode + '.' });
}));
app.post('/api/admin/invites', adm, wrap(async (req, res) => res.json({ ok: true, rows: await all('SELECT i.code,i.note,i.created,i.expires_at,i.used_at,u.email AS used_email FROM invites i LEFT JOIN users u ON u.id=i.used_by ORDER BY i.created DESC LIMIT 200') })));
app.post('/api/admin/invite/create', adm, limit('invite', 30, 60 * 60e3), wrap(async (req, res) => {
  const days = Math.min(Math.max(Math.floor(Number(req.body.days)) || 7, 1), 90), note = String(req.body.note || '').trim().slice(0, 80);
  const AL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = 'DV-' + Array.from(crypto.randomBytes(8), b => AL[b % AL.length]).join('');
  await run("INSERT INTO invites(code,note,expires_at) VALUES(?,?,now() + (?::int * interval '1 day'))", code, note, days);
  await audit(req.user.email, 'create_invite', code + (note ? ' (' + note + ')' : '')); res.json({ ok: true, code });
}));
app.post('/api/admin/invite/delete', adm, wrap(async (req, res) => { await run('DELETE FROM invites WHERE code=? AND used_by IS NULL', String(req.body.code || '')); res.json({ ok: true }); }));
app.post('/api/admin/users', adm, wrap(async (req, res) => {
  const s = '%' + String(req.body.q || '').trim().toLowerCase() + '%';
  res.json({ ok: true, rows: await all("SELECT id,name,email,phone,agent_status,bal,active FROM users WHERE lower(email) LIKE ? OR lower(COALESCE(name,'')) LIKE ? ORDER BY id DESC LIMIT 300", s, s) });
}));
app.post('/api/admin/user/status', adm, wrap(async (req, res) => {
  const u = await q('SELECT id,email FROM users WHERE id=?', Number(req.body.id) || 0); if (!u) return res.json({ ok: false, msg: 'User not found.' });
  if (isAdmin(u.email)) return res.json({ ok: false, msg: 'You cannot suspend the admin account.' });
  await run('UPDATE users SET active=? WHERE id=?', req.body.active ? 1 : 0, u.id); if (!req.body.active) await killSessions(u.id); await audit(req.user.email, req.body.active ? 'activate_user' : 'suspend_user', u.email);
  res.json({ ok: true, msg: req.body.active ? 'Account activated.' : 'Account suspended.' });
}));
app.post('/api/admin/user/reset', adm, wrap(async (req, res) => {
  const u = await q('SELECT id,email FROM users WHERE id=?', Number(req.body.id) || 0); if (!u) return res.json({ ok: false, msg: 'User not found.' });
  const temp = crypto.randomBytes(5).toString('hex');
  await run('UPDATE users SET pass=? WHERE id=?', await bcrypt.hash(temp, 10), u.id); await killSessions(u.id); await audit(req.user.email, 'reset_password', u.email);
  res.json({ ok: true, temp, msg: 'Temporary password set. Share it with the user privately.' });
}));
app.post('/api/admin/price', adm, wrap(async (req, res) => {
  const { key, price, priceInd, cost, active, agentOnly } = req.body, p = Math.floor(Number(price)), c = Math.floor(Number(cost) || 0), pi = priceInd == null || priceInd === '' ? 0 : Math.floor(Number(priceInd));
  if (!S[key] || !(p >= 0) || !(c >= 0) || !(pi >= 0)) return res.json({ ok: false, msg: 'Enter valid amounts.' });
  if (c > 0 && p < c) return res.json({ ok: false, msg: 'Agent price cannot be lower than the provider price (' + c + ').' });
  if (pi > 0 && pi < p) return res.json({ ok: false, msg: 'Individual price cannot be lower than the agent price (' + p + '). Individuals must pay more than agents.' });
  await run('UPDATE prices SET price=?,price_ind=?,cost=?,active=?,agent_only=COALESCE(?::int,agent_only) WHERE k=?', p, pi, c, active ? 1 : 0, agentOnly == null ? null : (agentOnly ? 1 : 0), key); await audit(req.user.email, 'set_price', `${key}: agent ${p}, individual ${pi || 'auto'}, provider ${c}, ${active ? 'on' : 'off'}${agentOnly == null ? '' : agentOnly ? ', agents only' : ', open to all'}`);
  res.json({ ok: true, msg: 'Saved.' });
}));
app.post('/api/admin/sync-prices', adm, wrap(async (req, res) => {
  const r = await vp('lookup.php', { service: 'list' });
  const src = r.services || r.data || r.list || r; let list = Array.isArray(src) ? src : (src && typeof src === 'object' ? Object.entries(src).map(([k, v]) => (v && typeof v === 'object' ? { service: k, ...v } : null)).filter(Boolean) : []);
  let n = 0;
  for (const e of list) { const k = e.service || e.key || e.name || e.id, p = Math.floor(Number(e.price ?? e.your_price ?? e.cost));
    if (S[k] && S[k].kind === 'lookup' && p >= 0 && Number.isFinite(p)) { await run('UPDATE prices SET cost=? WHERE k=?', p, k); n++; } }
  await audit(req.user.email, 'sync_prices', n + ' lookup prices updated');
  res.json({ ok: true, msg: n ? `${n} provider prices updated. Slip and agency prices must be entered by hand from your provider dashboard.` : 'Could not read prices from the provider. Enter them by hand.' });
}));
app.post('/api/admin/settings', adm, wrap(async (req, res) => {
  if (typeof req.body.whatsapp === 'string') await setSet('whatsapp', req.body.whatsapp.replace(/[^\d]/g, '').slice(0, 15));
  await audit(req.user.email, 'settings', 'support number changed'); res.json({ ok: true, msg: 'Saved.' });
}));

/* ---------- scheduled work: reconcile payments, poll requests, clean up old data ---------- */
async function jobs() {
  const out = { payments: 0, requests: 0 };
  try {
    if (E.PAYSTACK_SECRET) for (const p of await all("SELECT ref FROM pay WHERE status='pending' AND (at IS NULL OR (at > now() - interval '2 day' AND at < now() - interval '2 minute')) LIMIT 30")) { await settle(p.ref); out.payments++; }
    for (const r of await all("SELECT * FROM reqs WHERE status='pending' AND at < now() - interval '1 minute' AND (checked IS NULL OR checked < now() - interval '10 minute') ORDER BY COALESCE(checked, at) LIMIT 4")) { if (Date.now() < providerBusyUntil) break; await checkReq(r, true); out.requests++; }
    if (Date.now() - listAt > 24 * 36e5 && Date.now() >= providerBusyUntil) await refreshList().catch(() => {});
    await run("DELETE FROM results WHERE at < now() - interval '30 day'");
    await run("UPDATE transfers SET proof=NULL WHERE proof IS NOT NULL AND status IN ('approved','rejected','cancelled') AND upd < now() - interval '90 day'");
    await run("UPDATE reqs SET result=? WHERE status='completed' AND at < now() - interval '7 day' AND result NOT LIKE '%has expired%'", '{"data":{"note":"This result has expired and was deleted for your privacy."},"pdf":null}');
    await run("UPDATE agent_apps SET doc=NULL WHERE doc IS NOT NULL AND status='rejected' AND upd < now() - interval '90 day'");
    await run('DELETE FROM sess WHERE exp < ?', Date.now()); await run("DELETE FROM rate WHERE at < now() - interval '1 day'"); await run("DELETE FROM locks WHERE at < now() - interval '10 minutes'");
  } catch (e) { console.error('job error', e.message); out.error = true; }
  return out;
}

if (!ON_VERCEL) app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] })); // on Vercel the files in /public are served by Vercel itself
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err.status === 400) return res.status(400).json({ ok: false, msg: 'Bad request.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ ok: false, msg: 'That file is too large.' });
  console.error(new Date().toISOString(), err.message); res.status(500).json({ ok: false, msg: 'Something went wrong. Please try again.' });
});
process.on('unhandledRejection', e => console.error('unhandled', e && e.message));
module.exports = app;

if (require.main === module) { // running on your own computer: npm start
  initOnce().then(() => {
    if (!E.VP_API_KEY) console.warn('WARNING: VP_API_KEY is missing. No verification will work.');
    if (!ADMIN) console.warn('WARNING: ADMIN_EMAIL is missing. Nobody can open the admin pages.');
    if ((E.PAYSTACK_SECRET || '').startsWith('sk_live') && !PROD) console.warn('WARNING: you are using a LIVE Paystack key on http. Real money is involved. Use a test key (sk_test_) while testing.');
    setInterval(jobs, 5 * 60e3).unref(); setTimeout(jobs, 15e3).unref();
    const server = app.listen(E.PORT || 3000, () => console.log('DEBONE Digital Hub running on port ' + (E.PORT || 3000)));
    for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => server.close(() => pool.end().then(() => process.exit(0))));
  }).catch(e => { console.error('Could not start:', e.message); process.exit(1); });
}
