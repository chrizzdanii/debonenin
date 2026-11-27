/* DEBONE Digital Hub - Data, Cable TV, Electricity and Exam Pins (EasyAccess API).
   Plugged into server.js with install(ctx). Uses the same wallet, ledger, locks, results and request tracking as every other service.
   Needs EA_API_KEY in the environment (never put the key in the code). See README.md, "Data, TV, electricity and exam pins". */
'use strict';
const crypto = require('crypto');

module.exports = function install(c) {
  const { app, auth, adm, wrap, limit, q, all, run, tx, charge, refund, bal, log, audit, getSet, setSet, lockKey, getLock, freeLock, normPhone, safeEq, checkedAgo, COOLDOWN, E } = c;
  const EA_BASE = (E.EA_BASE || 'https://easyaccessapi.com.ng/api').replace(/\/$/, '');
  const EA_MODE = E.EA_MODE === 'test' ? 'test' : 'live'; // test = the provider's test endpoints (no real orders)
  const GUARD = E.EA_PRICE_GUARD !== '0';                 // send max_amount_payable so an unexpected price rise is refused, not paid

  /* ---------- what the provider sells (codes come from the provider's documentation) ---------- */
  const NETS = { 1: 'MTN', 2: 'GLO', 3: 'AIRTEL', 4: '9MOBILE' };
  const DATA = { 1: { sme: 'mtn_sme', gifting: 'mtn_gifting', cg: 'mtn_cg', awoof: 'mtn_awoof' }, 2: { gifting: 'glo_gifting', cg: 'glo_cg', awoof: 'glo_awoof' },
    3: { gifting: 'airtel_gifting', cg: 'airtel_cg', awoof: 'airtel_awoof' }, 4: { sme: '9mobile_sme', gifting: '9mobile_gifting' } };
  const TYPE_LABEL = { sme: 'SME', gifting: 'Gifting', cg: 'Corporate Gifting (CG)', awoof: 'Awoof deals' };
  const TV = { 1: ['DSTV', 'dstv'], 2: ['GOTV', 'gotv'], 3: ['STARTIMES', 'startimes'] };
  const EXAM = { 1: ['WAEC', 'waec'], 2: ['NECO', 'neco'], 3: ['NABTEB', 'nabteb'], 4: ['NBAIS', 'nbais'] };
  // Only the electricity codes written in the provider's documentation are built in. Add the others in Vercel as
  // EA_EXTRA_DISCOS, for example:  5:BEDC - Benin,6:AEDC - Abuja   (copy the codes from the provider's "Plan IDs" page)
  const DISCOS_BASE = [[1, 'EKEDC - Eko'], [2, 'IKEDC - Ikeja'], [3, 'PHEDC - Port Harcourt'], [4, 'KEDCO - Kano']];
  const discos = () => { const out = [...DISCOS_BASE];
    for (const part of String(E.EA_EXTRA_DISCOS || '').split(',')) { const m = part.trim().match(/^(\d{1,3})\s*:\s*([\w .&'-]{2,40})$/); if (m && !out.some(d => d[0] === +m[1])) out.push([+m[1], m[2].trim()]); }
    return out; };
  const GROUPS = [...Object.entries(NETS).map(([n, name]) => ['data_' + name.toLowerCase(), 'Data - ' + name, 'data']),
    ...Object.values(TV).map(([name]) => ['tv_' + name.toLowerCase(), 'Cable TV - ' + name, 'tv']),
    ['electricity', 'Electricity bills', 'electricity'], ...Object.values(EXAM).map(([name]) => ['exam_' + name.toLowerCase(), 'Exam pins - ' + name, 'exam'])];

  /* ---------- talking to the provider ---------- */
  async function ea(path, { method = 'POST', body, live = false, timeout = 40000 } = {}) {
    if (!E.EA_API_KEY) return { http: 0, json: null, nokey: true };
    const url = `${EA_BASE}/${live || EA_MODE === 'live' ? 'live' : 'test'}/v1/${path}`; // plans and balance exist only on the live side
    try {
      const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + E.EA_API_KEY.trim(), 'Cache-Control': 'no-cache', Accept: 'application/json', ...(method === 'GET' ? {} : { 'Content-Type': 'application/json' }) },
        body: method === 'GET' ? undefined : JSON.stringify(body || {}), signal: AbortSignal.timeout(timeout) });
      let json = null; try { json = await r.json(); } catch {}
      return { http: r.status, json };
    } catch { return { http: 0, json: null }; }
  }
  const OKS = new Set(['success', 'successful']), BAD = new Set(['failed', 'failure', 'error']);
  /* success | failed | pending | unknown. The status text decides; the numeric code is only used when there is no status.
     "unknown" (no reply, timeout, server error, unreadable reply) is NOT a failure: the order may really have gone through, so it is never auto-refunded. */
  function cls(r) {
    const j = r && r.json; if (!j || typeof j !== 'object' || r.http >= 500) return 'unknown';
    const st = String(j.status ?? '').toLowerCase(), code = Number(j.code ?? r.http);
    if (OKS.has(st)) return 'success'; if (BAD.has(st)) return 'failed'; if (st) return 'pending';
    if (code === 200 || code === 201) return 'success'; if (code >= 400 && code < 500) return 'failed'; return 'unknown';
  }
  const INTERNAL = /insufficient|wallet|balance|fund|token|authori[sz]|forbidden|whitelist|ip address|maintenance|suspend|disabled|rate limit|too many|api key/i;
  function why(r, admin, fallback) { // customers never see the provider's own money or account problems
    const j = (r && r.json) || {}, raw = String(j.true_response || j.message || '').slice(0, 200);
    const internal = !!(r && r.nokey) || !r.json || r.http === 401 || r.http === 429 || Number(j.code) === 401 || INTERNAL.test(raw);
    const guard = /max(imum)?[ _]?amount|exceed/i.test(raw);
    if (internal) return { internal: true, raw, msg: 'This service is temporarily unavailable. You were not charged. Please try again later.' + (admin ? ` [Admin only: ${r && r.nokey ? 'EA_API_KEY is not set in your environment' : 'provider replied "' + (raw || 'HTTP ' + r.http) + '"'}]` : '') };
    if (guard) return { internal: true, guard: true, raw, msg: 'The price just changed. Please try again in a minute. You were not charged.' + (admin ? ` [Admin only: provider replied "${raw}". Prices were refreshed.]` : '') };
    return { internal: false, raw, msg: raw || fallback };
  }
  async function eaQuery(ref) { // asks the provider what happened to one order
    let r = await ea('query-transactions', { body: { reference: ref }, timeout: 15000 });
    if (!r.json || r.http === 405) r = await ea('query-transactions?reference=' + encodeURIComponent(ref), { method: 'GET', timeout: 15000 });
    return r;
  }
  function eaState(j) { // the state of the ORDER (not of the lookup): the lookup's own status says only that the lookup worked
    if (!j || typeof j !== 'object') return 'unknown';
    const s = String(j.retrieved_status ?? '').toLowerCase();
    if (/^(success|successful|completed|delivered)$/.test(s)) return 'success';
    if (/fail|reject|refund|revers|declin/.test(s)) return 'failed';
    return 'pending'; // includes "no records found": never refunded automatically
  }

  /* ---------- plan catalogue: kept in the database and refreshed when stale ---------- */
  let PLANS = { at: 0, p: {} }, plansP = null, planTry = 0;
  const pid = x => x && (x.plan_id ?? x.id ?? x.variation_code ?? x.code ?? x.planId);
  const findArr = (o, d = 0) => { if (Array.isArray(o)) return o.some(x => pid(x) != null) ? o : null; if (d > 3 || !o || typeof o !== 'object') return null; for (const v of Object.values(o)) { const f = findArr(v, d + 1); if (f) return f; } return null; };
  const parsePlans = j => (findArr(j) || []).map(p => ({ id: String(pid(p)), name: String(p.name ?? p.plan_name ?? p.title ?? p.package ?? pid(p)).slice(0, 80), price: Math.ceil(Number(String(p.price ?? p.amount ?? p.cost ?? '').replace(/[^\d.]/g, ''))), validity: String(p.validity ?? p.duration ?? '').slice(0, 30) }))
    .filter(p => Number.isFinite(p.price) && p.price > 0).sort((a, b) => a.price - b.price);
  const allTypes = () => [...Object.values(DATA).flatMap(o => Object.values(o)), ...Object.values(TV).map(x => x[1]), ...Object.values(EXAM).map(x => x[1])];
  function refreshPlans() {
    if (plansP) return plansP;
    plansP = (async () => {
      const types = allTypes(), next = { ...PLANS.p }, bad = [];
      for (let i = 0; i < types.length; i += 5) await Promise.all(types.slice(i, i + 5).map(async t => { const r = await ea('get-plans?product_type=' + t, { method: 'GET', live: true, timeout: 20000 }), list = parsePlans(r.json); if (list.length) next[t] = list; else bad.push(t + ' (' + (r.nokey ? 'no key' : !r.http ? 'no reply' : 'HTTP ' + r.http) + (r.json && r.json.message ? ': ' + String(r.json.message).slice(0, 60) : r.json ? ': reply had no readable plans' : '') + ')'); }));
      if (bad.length < types.length) { PLANS = { at: Date.now(), p: next }; await setSet('ea_plans', JSON.stringify(PLANS)); }
      return { ok: types.length - bad.length, total: types.length, bad };
    })().finally(() => { plansP = null; });
    return plansP;
  }
  const stale = () => !Object.keys(PLANS.p).length || Date.now() - PLANS.at > 12 * 36e5;
  async function ensurePlans() {
    if (!stale()) return;
    try { const d = JSON.parse((await getSet('ea_plans')) || '{}'); if (d.p && d.at > PLANS.at) PLANS = d; } catch {}
    if (stale() && E.EA_API_KEY && Date.now() - planTry > 120e3) { planTry = Date.now(); await refreshPlans().catch(() => {}); }
  }
  const plansOf = t => PLANS.p[t] || [];
  const findPlan = (types, id) => { for (const t of types) { const x = plansOf(t).find(p => p.id === String(id)); if (x) return { ...x, type: t }; } return null; };

  /* ---------- prices: provider price + your profit. Agents pay less than individuals; the admin pays the provider price. ---------- */
  const DEFM = g => g.startsWith('data_') ? { ap: 3, af: 0, ip: 8, if: 0 } : g.startsWith('tv_') || g === 'electricity' ? { ap: 0, af: 50, ip: 0, if: 100 } : { ap: 0, af: 50, ip: 0, if: 150 };
  async function cfg() {
    let d = {}; try { d = JSON.parse((await getSet('vtu_cfg')) || '{}'); } catch {}
    const on = { data: 1, tv: 1, electricity: 1, exam: 1, ...(d.on || {}) }, m = {};
    for (const [g] of GROUPS) m[g] = { ...DEFM(g), ...((d.m || {})[g] || {}) };
    return { on, m };
  }
  const margin = (cost, m, agent) => cost + Math.ceil(cost * (agent ? m.ap : m.ip) / 100) + (agent ? m.af : m.if);
  const priceFor = (cost, m, u) => u.admin ? cost : u.agent ? margin(cost, m, true) : Math.max(margin(cost, m, false), margin(cost, m, true));
  const N = n => '₦' + Number(n).toLocaleString('en-NG');

  /* ---------- reading what the customer typed ---------- */
  const intIn = (x, lo, hi) => { const n = Number(x); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; };
  const vTv = b => { const company = intIn(b.company, 1, 3); if (!company) return { err: 'Choose a TV provider.' };
    const iucno = String(b.iucno || '').replace(/[\s-]/g, ''); if (!/^\d{8,15}$/.test(iucno)) return { err: 'Enter a valid smart card / IUC number (digits only).' }; return { company, iucno }; };
  const vEl = b => { const company = intIn(b.company, 1, 999); if (!company || !discos().some(d => d[0] === company)) return { err: 'Choose an electricity company.' };
    const metertype = intIn(b.metertype, 1, 2); if (!metertype) return { err: 'Choose prepaid or postpaid.' };
    const meterno = String(b.meterno || '').replace(/[\s-]/g, ''); if (!/^\d{6,20}$/.test(meterno)) return { err: 'Meter number must be 6 to 20 digits.' };
    const amount = intIn(b.amount, 1000, 500000); if (!amount) return { err: 'Amount must be a whole number from ₦1,000 to ₦500,000.' }; return { company, metertype, meterno, amount }; };

  /* ---------- catalogue for the pages (each person gets only their own price) ---------- */
  app.post('/api/vtu/catalog', auth, wrap(async (req, res) => {
    const [g] = await Promise.all([cfg(), ensurePlans()]), u = req.user;
    const pl = (arr, m) => arr.map(p => ({ id: p.id, name: p.name, validity: p.validity, price: priceFor(p.price, m, u) }));
    const out = { ok: true, ready: !!E.EA_API_KEY, on: g.on, bal: u.bal };
    if (g.on.data) out.data = Object.entries(DATA).map(([n, types]) => ({ code: +n, name: NETS[n], types: Object.entries(types).map(([k, t]) => ({ key: k, label: TYPE_LABEL[k], plans: pl(plansOf(t), g.m['data_' + NETS[n].toLowerCase()]) })).filter(t => t.plans.length) })).filter(n => n.types.length);
    if (g.on.tv) out.tv = Object.entries(TV).map(([n, [name, t]]) => ({ code: +n, name, plans: pl(plansOf(t), g.m['tv_' + name.toLowerCase()]) })).filter(t => t.plans.length);
    if (g.on.electricity) out.electricity = { discos: discos(), min: 1000, max: 500000 };
    if (g.on.exam) out.exam = Object.entries(EXAM).map(([n, [name, t]]) => { const p = plansOf(t)[0]; return p ? { code: +n, name, plan: p.name, unit: priceFor(p.price, g.m['exam_' + name.toLowerCase()], u) } : null; }).filter(Boolean);
    res.json(out);
  }));

  /* ---------- verify a smart card or a meter (free, and the provider insists on it before paying) ---------- */
  app.post('/api/vtu/verify', auth, limit('vtuv', 30, 60e3), wrap(async (req, res) => {
    const b = req.body || {}, g = await cfg();
    if (b.kind === 'tv') {
      if (!g.on.tv) return res.json({ ok: false, msg: 'This service is switched off right now.' });
      const v = vTv(b); if (v.err) return res.json({ ok: false, msg: v.err });
      const r = await ea('verify-tv', { body: { company: v.company, iucno: v.iucno }, timeout: 25000 });
      if (cls(r) !== 'success') { const f = why(r, req.user.admin, 'Verification failed. Check the smart card number and try again.'); if (f.internal) await audit('system', 'vtu_unavailable', 'verify TV: ' + f.raw); return res.json({ ok: false, msg: f.msg.replace(' You were not charged.', '') }); }
      const j = r.json; return res.json({ ok: true, info: { name: j.customer_name, package: j.current_package, status: j.customer_status, due: j.due_date, renewal: j.renewal_amount, balance: j.current_balance } });
    }
    if (b.kind === 'electricity') {
      if (!g.on.electricity) return res.json({ ok: false, msg: 'This service is switched off right now.' });
      const v = vEl(b); if (v.err) return res.json({ ok: false, msg: v.err });
      const r = await ea('verify-electricity', { body: { company: v.company, metertype: v.metertype, meterno: v.meterno, amount: v.amount }, timeout: 25000 });
      if (cls(r) !== 'success') { const f = why(r, req.user.admin, 'Verification failed. Check the meter number and try again.'); if (f.internal) await audit('system', 'vtu_unavailable', 'verify meter: ' + f.raw); return res.json({ ok: false, msg: f.msg.replace(' You were not charged.', '') }); }
      const j = r.json; return res.json({ ok: true, info: { name: j.customer_name, address: j.customer_address, type: j.customer_metertype, arrears: j.customer_arrears }, price: priceFor(v.amount, g.m.electricity, req.user) });
    }
    res.json({ ok: false, msg: 'Unknown request.' });
  }));

  /* ---------- turning a request into an order ---------- */
  const cref = () => 'DEB' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString('hex').toUpperCase();
  function order(kind, b, g, u) {
    const done = (o) => ({ ...o, kind, svc: 'vtu_' + kind, price: o.units ? priceFor(o.cost / o.units, o.m, u) * o.units : priceFor(o.cost, o.m, u) }); // exam pins: the profit is per pin
    if (kind === 'data') {
      const net = intIn(b.network, 1, 4), phone = normPhone(b.mobileno); if (!net) return { err: 'Choose a network.' }; if (!phone) return { err: 'Enter a valid 11-digit phone number, like 08012345678.' };
      const p = findPlan(Object.values(DATA[net]), String(b.dataplan || '')); if (!p) return { err: 'That data plan is not available. Refresh the page and choose again.' };
      const ref = cref(), id = Number.isFinite(+p.id) ? +p.id : p.id;
      return done({ cost: p.price, m: g.m['data_' + NETS[net].toLowerCase()], label: `Data - ${NETS[net]} ${p.name}`.slice(0, 80), ident: phone, cref: ref, path: 'purchase-data',
        body: { network: net, dataplan: id, mobileno: phone, client_reference: ref, ...(GUARD ? { max_amount_payable: p.price } : {}) },
        info: { Network: NETS[net], Plan: p.name + (p.validity ? ' · ' + p.validity : ''), 'Phone number': phone } });
    }
    if (kind === 'tv') {
      const v = vTv(b); if (v.err) return v; const [name, type] = TV[v.company], p = findPlan([type], String(b.package || '')); if (!p) return { err: 'That package is not available. Refresh the page and choose again.' };
      return done({ cost: p.price, m: g.m['tv_' + name.toLowerCase()], label: `TV - ${name} ${p.name}`.slice(0, 80), ident: v.iucno, path: 'pay-tv', verify: { path: 'verify-tv', body: { company: v.company, iucno: v.iucno } },
        body: { company: v.company, package: Number.isFinite(+p.id) ? +p.id : p.id, iucno: v.iucno, ...(GUARD ? { max_amount_payable: p.price } : {}) },
        info: { Provider: name, Package: p.name, 'Smart card / IUC': v.iucno } });
    }
    if (kind === 'electricity') {
      const v = vEl(b); if (v.err) return v; const d = discos().find(x => x[0] === v.company);
      return done({ cost: v.amount, m: g.m.electricity, label: `Electricity - ${d[1].split(' ')[0]} ${v.metertype === 1 ? 'prepaid' : 'postpaid'}`, ident: v.meterno, path: 'pay-electricity',
        verify: { path: 'verify-electricity', body: v }, body: { ...v, ...(GUARD ? { max_amount_payable: v.amount } : {}) },
        info: { Company: d[1], 'Meter number': v.meterno, 'Meter type': v.metertype === 1 ? 'Prepaid' : 'Postpaid', 'Token value': N(v.amount) } });
    }
    if (kind === 'exam') {
      const board = intIn(b.exam_board, 1, 4), n = intIn(b.no_of_pins, 1, 50); if (!board) return { err: 'Choose an exam board.' }; if (!n) return { err: 'Number of pins must be from 1 to 50.' };
      const [name, type] = EXAM[board], p = plansOf(type)[0]; if (!p) return { err: 'These exam pins are not available right now.' };
      return done({ cost: p.price * n, units: n, m: g.m['exam_' + name.toLowerCase()], label: `Exam pins - ${name} x${n}`, ident: String(n), path: 'exam-pins', body: { exam_board: board, no_of_pins: n, ...(GUARD ? { max_amount_payable: p.price * n } : {}) },
        info: { 'Exam board': name, 'Number of pins': n } });
    }
    return { err: 'Unknown service.' };
  }
  function delivered(o, j, price) { // what the customer is shown, in a fixed, readable order
    const d = { ...o.info };
    if (o.kind === 'data') { if (j.true_response) d.Message = String(j.true_response).slice(0, 300); }
    if (o.kind === 'tv') { if (o.cname) d['Customer name'] = o.cname; }
    if (o.kind === 'electricity') { const t = j.token || j.meter_token; if (t) d.Token = String(t); if (j.customer_name) d['Customer name'] = j.customer_name; if (j.customer_address) d.Address = j.customer_address; if (!t && j.true_response) d.Message = String(j.true_response).slice(0, 300); }
    if (o.kind === 'exam') { const pins = Array.isArray(j.pins) ? j.pins.map(String) : []; if (pins.length) d.Pins = pins; else if (j.true_response) d.Message = String(j.true_response).slice(0, 300); }
    d['Amount paid'] = N(price); return d;
  }
  async function archive(u, o, outcome, info, j) {
    try { const raw = JSON.stringify(j || {}, (k, v) => /^(balance_before|balance_after|api_key)$/.test(k) ? undefined : v).slice(0, 4000);
      await run('INSERT INTO results(uid,email,svc,label,hint,outcome,price,pdf,raw,info,photo) VALUES(?,?,?,?,?,?,?,NULL,?,?,NULL)', u.id, u.email, o.svc, o.label, '...' + String(o.ident || '').slice(-4), outcome, o.price, raw, JSON.stringify(info)); }
    catch (e) { console.error('archive error', e.message); }
  }

  /* ---------- buy ---------- */
  app.post('/api/vtu/buy', auth, limit('vtubuy', 20, 60e3), wrap(async (req, res) => {
    const b = req.body || {}, kind = String(b.kind || ''), u = req.user, g = await cfg();
    if (!['data', 'tv', 'electricity', 'exam'].includes(kind)) return res.json({ ok: false, msg: 'Unknown service.' });
    if (!g.on[kind]) return res.json({ ok: false, msg: 'This service is switched off right now.' });
    if (!E.EA_API_KEY) return res.json({ ok: false, msg: 'This service is temporarily unavailable. You were not charged. Please try again later.' + (u.admin ? ' [Admin only: EA_API_KEY is not set in your environment]' : '') });
    await ensurePlans();
    const o = order(kind, b, g, u); if (o.err) return res.json({ ok: false, msg: o.err });
    if (o.verify) { // the provider refuses payment for a card or meter that was not verified, so verify now, before any money moves
      const v = await ea(o.verify.path, { body: o.verify.body, timeout: 25000 });
      if (cls(v) !== 'success') { const f = why(v, u.admin, 'Verification failed. Check the number and try again.'); if (f.internal) await audit('system', 'vtu_unavailable', o.label + ': ' + f.raw); return res.json({ ok: false, msg: f.msg.replace(' You were not charged.', '') }); }
      o.cname = v.json.customer_name;
    }
    const lock = lockKey(u.id + '|' + o.svc + '|' + JSON.stringify(o.body));
    if (!(await getLock(lock))) return res.json({ ok: false, msg: 'This request is already being processed.' });
    let debited = false, settled = false, sent = false;
    const hold = async (status, ref, r) => { // money stays with us, the order is tracked, and it is settled by the webhook, the scheduled job or the admin
      await run('INSERT INTO reqs(uid,svc,label,ref,price,status,input) VALUES(?,?,?,?,?,?,?)', u.id, o.svc, o.label, String(ref || o.cref || 'REVIEW'), o.price, status, JSON.stringify({ kind, info: o.info, cref: o.cref || null, cname: o.cname || null, ident: o.ident }));
      settled = true; // only after the order is safely recorded
      await log(u.id, o.label, -o.price, 'submitted'); await audit('system', 'vtu_' + status, `${o.label} for ${u.email}: provider answered "${String((r && r.json && (r.json.message || r.json.status)) || (r && r.http) || 'no reply').slice(0, 100)}"`);
    };
    try {
      if (!(await charge(u.id, o.price))) return res.json({ ok: false, msg: 'Not enough balance. Fund your wallet first.', bal: await bal(u.id) });
      debited = true; sent = true;
      const r = await ea(o.path, { body: o.body }), k = cls(r), j = r.json || {};
      if (k === 'failed') {
        const f = why(r, u.admin, 'The order could not be completed.'); if (f.internal) await audit('system', f.guard ? 'vtu_price_changed' : 'vtu_provider_problem', o.label + ': ' + f.raw);
        if (f.guard) { planTry = 0; refreshPlans().catch(() => {}); }
        settled = true; await refund(u.id, o.price); await log(u.id, o.label, -o.price, 'charged'); await log(u.id, o.label, o.price, 'refunded');
        return res.json({ ok: false, msg: f.msg + (f.internal ? '' : ' You were not charged.'), bal: await bal(u.id) });
      }
      if (k === 'success') {
        settled = true; await log(u.id, o.label, -o.price, 'success'); const info = delivered(o, j, o.price); await archive(u, o, 'success', info, j);
        return res.json({ ok: true, data: info, bal: await bal(u.id) });
      }
      await hold(k === 'pending' && j.reference ? 'pending' : 'review', j.reference, r); // pending or unknown: never refund on a guess
      return res.json({ ok: true, submitted: true, msg: 'Your order was received and is being confirmed. If it cannot be delivered you are refunded automatically; if it needs a manual check our team will handle it. Track it under My Requests.', bal: await bal(u.id) });
    } catch (e) {
      if (debited && !settled) { if (!sent) await refund(u.id, o.price).catch(() => {}); else await hold('review', null, null).catch(() => {}); } // once the order was sent, an internal error must not refund
      throw e;
    } finally { await freeLock(lock); }
  }));

  /* ---------- finishing orders that were not final at once (poll, webhook, admin) ---------- */
  const isVtu = s => /^vtu_/.test(s || '');
  async function settle(row, state, j) {
    if (state === 'failed') return tx(async X => { if ((await X.run("UPDATE reqs SET status='failed' WHERE id=? AND status IN ('pending','review')", row.id)).changes) { await refund(row.uid, row.price, X); await log(row.uid, row.label, row.price, 'refunded', X); return 'failed'; } return 'closed'; });
    if (state !== 'success') return 'pending';
    let meta = {}; try { meta = JSON.parse(row.input || '{}'); } catch {}
    const data = { ...(meta.info || {}) }, note = String((j && j.true_response) || '').slice(0, 300);
    if (meta.cname) data['Customer name'] = meta.cname;
    if (meta.kind === 'electricity' || meta.kind === 'exam') data.Message = note || 'Your order was delivered, but the token or PINs did not reach us automatically. Contact support and quote this order.';
    else if (note) data.Message = note;
    data['Amount paid'] = N(row.price);
    if (!(await run("UPDATE reqs SET status='completed', result=? WHERE id=? AND status IN ('pending','review')", JSON.stringify({ data, pdf: null }), row.id)).changes) return 'closed';
    if (meta.kind === 'electricity' || meta.kind === 'exam') await audit('system', 'vtu_delivered_check_token', row.label + ' #' + row.id + ': delivered, but the token/PINs must be sent to the customer from the provider dashboard');
    const u = (await q('SELECT id,email FROM users WHERE id=?', row.uid)) || { id: row.uid, email: '' };
    await archive(u, { svc: row.svc, label: row.label, ident: meta.ident, price: row.price }, 'completed', data, j); return 'completed';
  }
  async function check(row, force) { // used by the customer's "Check status", the admin and the scheduled job
    if (!force && checkedAgo(row) < COOLDOWN) return { status: 'pending', msg: 'Checked a moment ago and still processing. Check again shortly.' };
    await run('UPDATE reqs SET checked=now() WHERE id=?', row.id);
    const r = await eaQuery(row.ref); await settle(row, eaState(r.json), r.json);
    const f = await q('SELECT status,result FROM reqs WHERE id=?', row.id);
    if (f.status === 'completed') return { status: 'completed', ...JSON.parse(f.result) };
    if (f.status === 'failed') return { status: 'failed', msg: 'This order failed and your money was returned.' };
    return { status: 'pending', msg: 'Still processing. Check again in a few minutes.' };
  }
  /* The provider tells us when an order changes (data orders). We never trust the message itself: we ask the provider, with our own key, what really happened. */
  app.post('/api/easyaccess/webhook', limit('eawh', 120, 60e3), wrap(async (req, res) => {
    if (E.EA_WEBHOOK_KEY && !safeEq(String(req.query.key || ''), E.EA_WEBHOOK_KEY)) return res.sendStatus(401);
    const b = req.body || {}, pref = String(b.reference || '').slice(0, 80), cr = String(b.client_reference || '').slice(0, 80);
    if (pref || cr) for (const row of await all("SELECT * FROM reqs WHERE svc LIKE 'vtu\\_%' AND status IN ('pending','review') AND (ref=? OR ref=?) LIMIT 3", pref || '-', cr || '-')) {
      const ref = pref || row.ref; if (!ref || ref === 'REVIEW') continue;
      const r = await eaQuery(ref); await settle(row, eaState(r.json), r.json);
    }
    res.sendStatus(200);
  }));

  /* ---------- admin ---------- */
  const counts = () => { const n = {}; for (const [g, , s] of GROUPS) { if (s === 'data') n[g] = Object.values(DATA[Object.keys(NETS).find(k => 'data_' + NETS[k].toLowerCase() === g)]).reduce((a, t) => a + plansOf(t).length, 0);
    else if (s === 'tv') n[g] = plansOf(TV[Object.keys(TV).find(k => 'tv_' + TV[k][0].toLowerCase() === g)][1]).length;
    else if (s === 'exam') { const p = plansOf(EXAM[Object.keys(EXAM).find(k => 'exam_' + EXAM[k][0].toLowerCase() === g)][1])[0]; n[g] = p ? p.price : 0; } } return n; };
  app.post('/api/admin/vtu/get', adm, wrap(async (req, res) => { const [g] = await Promise.all([cfg(), ensurePlans()]);
    res.json({ ok: true, key: !!E.EA_API_KEY, mode: EA_MODE, guard: GUARD, webhookKey: !!E.EA_WEBHOOK_KEY, on: g.on, groups: GROUPS.map(([k, label, svc]) => ({ key: k, label, svc, ...g.m[k] })), counts: counts(), plansAt: PLANS.at || 0, discos: discos(), extraDiscos: DISCOS_BASE.length < discos().length }); }));
  app.post('/api/admin/vtu/save', adm, wrap(async (req, res) => {
    const on = {}, m = {}, bi = req.body || {};
    for (const s of ['data', 'tv', 'electricity', 'exam']) on[s] = (bi.on || {})[s] ? 1 : 0;
    for (const [g] of GROUPS) { const x = (bi.m || {})[g] || {}, v = { ap: Number(x.ap), af: Math.floor(Number(x.af)), ip: Number(x.ip), if: Math.floor(Number(x.if)) };
      if (![v.ap, v.ip].every(z => z >= 0 && z <= 50) || ![v.af, v.if].every(z => Number.isInteger(z) && z >= 0 && z <= 100000)) return res.json({ ok: false, msg: 'Enter valid amounts for ' + g + ' (percent 0 to 50, naira whole numbers).' });
      if (v.ip < v.ap || v.if < v.af) return res.json({ ok: false, msg: 'Customer profit cannot be lower than agent profit (' + g + '). Individuals must pay more than agents.' });
      m[g] = v; }
    await setSet('vtu_cfg', JSON.stringify({ on, m })); await audit(req.user.email, 'vtu_prices', Object.entries(on).map(([k, v]) => k + ':' + (v ? 'on' : 'off')).join(' '));
    res.json({ ok: true, msg: 'Saved.' });
  }));
  app.post('/api/admin/vtu/refresh', adm, wrap(async (req, res) => {
    if (!E.EA_API_KEY) return res.json({ ok: false, msg: 'EA_API_KEY is not set in your environment.' });
    const r = await refreshPlans(); await audit(req.user.email, 'vtu_refresh_plans', r.ok + '/' + r.total + ' lists');
    res.json({ ok: r.ok > 0, msg: r.ok ? `${r.ok} of ${r.total} plan lists updated.` + (r.bad.length ? ' Not updated: ' + r.bad.join(', ') + '.' : '') : 'The provider did not return any plans. Check EA_API_KEY and try again.' });
  }));
  app.post('/api/admin/vtu/balance', adm, wrap(async (req, res) => {
    const r = await ea('wallet-balance', { method: 'GET', live: true, timeout: 20000 }), j = r.json || {};
    if (cls(r) !== 'success' || j.balance == null) return res.json({ ok: false, msg: r.nokey ? 'EA_API_KEY is not set in your environment.' : String(j.message || (r.http ? 'The provider answered with an error (HTTP ' + r.http + ').' : 'No reply from the provider.')).slice(0, 160) });
    res.json({ ok: true, balance: Number(j.balance), email: j.email, accounts: [1, 2, 3].map(i => ({ bank: j['funding_bank' + i], number: j['funding_acctno' + i] })).filter(a => a.bank && a.number), name: j.funding_acctname });
  }));
  app.post('/api/admin/vtu/query', adm, limit('vtuq', 30, 60e3), wrap(async (req, res) => {
    const ref = String(req.body.reference || '').trim().slice(0, 80); if (!/^[\w.-]{6,80}$/.test(ref)) return res.json({ ok: false, msg: 'Enter the provider reference, for example DATA1a2b3c...' });
    const r = await eaQuery(ref), j = r.json; if (!j) return res.json({ ok: false, msg: 'No reply from the provider.' });
    res.json({ ok: true, found: Number(j.code) !== 404, state: eaState(j), status: j.retrieved_status || null, amount: j.amount ?? null, date: j.transaction_date || null, response: String(j.true_response || j.message || '').slice(0, 300) });
  }));
  app.post('/api/admin/req/complete', adm, wrap(async (req, res) => { // for an order you checked with the provider and know was delivered
    const row = await q('SELECT * FROM reqs WHERE id=?', Number(req.body.id) || 0); if (!row) return res.json({ ok: false, msg: 'Request not found.' });
    let meta = {}; try { meta = JSON.parse(row.input || '{}'); } catch {}
    const data = { ...(meta.info || {}), 'Amount paid': N(row.price), Message: String(req.body.note || 'Delivered.').slice(0, 300) };
    if (!(await run("UPDATE reqs SET status='completed', result=? WHERE id=? AND status IN ('pending','review')", JSON.stringify({ data, pdf: null }), row.id)).changes) return res.json({ ok: false, msg: 'This request is already closed.' });
    await audit(req.user.email, 'complete_request', row.label + ' #' + row.id); res.json({ ok: true, msg: 'Marked as delivered. The customer keeps the charge.' });
  }));

  return { isVtu, check, ensurePlans, ready: () => !!E.EA_API_KEY, cfgOn: async () => (await cfg()).on };
};
