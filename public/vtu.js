/* DEBONE Digital Hub - Buy Data, Cable TV, Electricity, Exam Pins, and the admin pricing page.
   Loaded before app.js; uses its helpers (h, ic, N, api, crumb, titleRow, emptyBox, toast, copyBtn ...) when a page is opened. */
window.VTU = (() => {
  const SVC = [['data', 'Buy Data', 'phone', 1], ['tv', 'Cable TV', 'tv', 0], ['electricity', 'Electricity', 'bolt', 0], ['exam', 'Exam Pins', 'cap', 0]];
  const on = k => !(CF && CF.vtu) || CF.vtu[k] !== 0;
  const tiles = () => SVC.filter(s => on(s[0])).map(s => ({ id: s[0], t: s[1], i: s[2], hot: s[3], tab: 'Data & Bills' }));
  const navItems = () => SVC.filter(s => on(s[0])).map(s => [s[0], s[1], s[2]]);
  const head = (m, id, title, pill) => { const s = SVC.find(x => x[0] === id); m.append(crumb(['Dashboard'], ['Data & Bills', '#/dashboard'], [title]), titleRow(s[2], title, pill)); };
  const catalog = async (m, key) => { // loads prices and plans; shows a friendly message instead of a broken page
    const box = h('div'); m.append(box);
    const r = await api('vtu/catalog');
    if (!r.ok) { box.append(h('p', {}, r.msg || 'Could not load this page.')); return null; }
    if (r.bal != null) setBal(r.bal);
    if (!r.on[key]) { box.append(h('div', { class: 'cd pad', style: 'max-width:620px' }, emptyBox('clock', 'Switched off for now', 'This service is not available right now. Please check back later.'))); return null; }
    if (!r[key] || !r[key].length && Array.isArray(r[key])) { box.append(h('div', { class: 'cd pad', style: 'max-width:620px' }, emptyBox('clock', 'Not available right now', 'Prices are being updated. Please try again in a few minutes.'), r.diag ? h('p', { style: 'color:var(--y);padding:0 24px 20px;font-size:13px' }, 'Admin only: ' + r.diag) : null)); return null; }
    box.remove(); return r;
  };
  const put = (el, ...kids) => el.replaceChildren(...kids.flat(9).filter(x => x != null && x !== false)); // replaceChildren does not flatten arrays like h() does
  const chips = (items, cur, pick) => { const w = h('div', { class: 'tabs', style: 'margin:0 0 4px' }); items.forEach(([v, l]) => w.append(h('button', { type: 'button', class: 'tab' + (v === cur ? ' on' : ''), on: { click: () => pick(v) } }, l))); return w; };
  const field = (label, icon, input, hint) => [h('label', { class: 'lbl' }, label, ' ', h('i', {}, '*')), h('div', { class: 'ig' }, ic(icon, 17), input), hint ? h('div', { class: 'mut', style: 'font-size:12px;margin-top:6px' }, hint) : null];
  const feeRow = (feeV) => h('div', { class: 'fee' }, ic('tag', 18), h('span', { style: 'font-weight:600' }, ME.admin ? 'Provider price (no markup):' : ME.agent ? 'Agent price:' : 'You pay:'), feeV);
  const walletRow = () => h('div', { class: 'sub' }, h('span', {}, 'Prepaid wallet deduction'), h('span', {}, 'Wallet Balance: ', h('b', { class: 'balv' }, balTxt())));

  /* the "are you sure" step: a wrong phone number or meter cannot be undone */
  function confirmBuy(title, rows, price, go) {
    const ok = h('button', { class: 'btn' }, 'Confirm and pay ' + N(price)), no = h('button', { class: 'btn out', style: 'margin-left:10px' }, 'Cancel');
    const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title, on: { click: e => { if (e.target === m) m.remove(); } } },
      h('div', { class: 'cd pad mbox' }, h('h2', { style: 'margin-bottom:6px' }, title), h('p', { class: 'mut', style: 'margin-bottom:12px' }, 'Check the details. This cannot be undone once it is delivered.'),
        h('dl', { class: 'kv' }, rows.map(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])), h('div', { style: 'margin-top:14px' }, ok, no)));
    no.onclick = () => m.remove(); ok.onclick = () => { m.remove(); go(); }; document.body.append(m); ok.focus();
  }

  /* ---------- result card: token, pins and details ---------- */
  function card(d) {
    const dl = h('dl', { class: 'kv' }), extra = [];
    Object.entries(d).forEach(([k, v]) => {
      if (k === 'Token') { extra.push(h('div', { class: 'tokb' }, h('small', {}, 'ELECTRICITY TOKEN'), h('b', {}, v), copyBtn(String(v).replace(/\D/g, ''), 'Copy token'))); return; }
      if (k === 'Pins' && Array.isArray(v)) { extra.push(h('div', { class: 'tokb' }, h('small', {}, 'YOUR PINS (' + v.length + ')'), v.map(p => h('b', { class: 'pinl' }, p)), copyBtn(v.join('\n'), 'Copy all pins'), h('div', { class: 'mut', style: 'font-size:12px;margin-top:8px' }, 'The two parts of each line are separated by <=>. Keep these safe: they are also saved in My Results for 30 days.'))); return; }
      dl.append(h('dt', {}, k), h('dd', {}, String(v)));
    });
    return h('div', { class: 'cb' }, h('span', { class: 'badge' }, ic('check', 13), 'Successful'), h('div', { style: 'height:14px' }), extra, dl);
  }
  function show(box, x) {
    box.replaceChildren();
    if (x.submitted) return box.append(emptyBox('clock', 'Order received', x.msg), h('div', { style: 'text-align:center;padding-bottom:26px' }, h('a', { class: 'btn', href: '#/requests' }, 'Track order')));
    box.append(card(x.data), h('p', { class: 'mut', style: 'font-size:12.5px;margin:-6px 20px 18px' }, 'Saved in ', h('a', { href: '#/results', style: 'color:var(--y);font-weight:700' }, 'My Results'), ' for 30 days.'));
  }
  const resultBox = (title, hint) => { const body = h('div'), res = h('div', { class: 'cd' }, h('div', { class: 'ch r' }, ic('check', 18), title), body); body.append(emptyBox('file', 'Your receipt will appear here', hint)); return { res, body }; };
  const buy = async (btn, msg, body, rb) => { btn.disabled = true; msg.className = 'msg'; msg.textContent = ''; const x = await api('vtu/buy', body); btn.disabled = false; if (x.bal != null) setBal(x.bal);
    if (!x.ok) { msg.textContent = x.msg || 'Something went wrong.'; return false; } show(rb.body, x); if (x.submitted) CF.pending = (CF.pending || 0) + 1; return true; };
  const planGrid = (plans, cur, pick) => h('div', { class: 'pgrid' }, plans.map(p => h('button', { type: 'button', class: 'plan' + (cur && cur.id === p.id ? ' on' : ''), on: { click: () => pick(p) } }, h('b', {}, p.name), p.validity ? h('small', {}, p.validity) : null, h('span', {}, N(p.price)))));

  /* ---------- Buy Data ---------- */
  async function data(m) {
    head(m, 'data', 'Buy Data', 'Instant delivery'); const r = await catalog(m, 'data'); if (!r) return;
    let net = r.data[0], typ = net.types[0], plan = null; const left = h('div', { class: 'cb' }), feeV = h('b', {}, '—'), msg = h('div', { class: 'msg' });
    const phone = h('input', { placeholder: '08012345678', inputmode: 'numeric', autocomplete: 'off', maxlength: 14 }), go = h('button', { class: 'btn w' }, ic('phone', 17), 'Buy Data'), rb = resultBox('Receipt', 'Choose a plan, enter the phone number and press Buy Data.');
    const draw = () => { put(left, h('p', { class: 'd' }, 'Pick a network and plan, then enter the phone number that should receive the data.'),
      h('label', { class: 'lbl' }, 'Network'), chips(r.data.map(n => [n.code, n.name]), net.code, c => { net = r.data.find(n => n.code === c); typ = net.types[0]; plan = null; draw(); }),
      net.types.length > 1 ? [h('label', { class: 'lbl' }, 'Plan type'), chips(net.types.map(t => [t.key, t.label]), typ.key, k => { typ = net.types.find(t => t.key === k); plan = null; draw(); })] : null,
      h('label', { class: 'lbl' }, 'Choose a plan ', h('i', {}, '*')), planGrid(typ.plans, plan, p => { plan = p; draw(); }),
      field('Phone number', 'phone', phone), feeRow(feeV), walletRow(), msg, go); feeV.textContent = plan ? N(plan.price) : '—'; };
    go.onclick = () => { msg.className = 'msg'; msg.textContent = ''; if (!plan) return msg.textContent = 'Choose a data plan first.'; if (!/^(\+?234|0)[789]\d{9}$/.test(phone.value.replace(/[\s-]/g, ''))) return msg.textContent = 'Enter a valid 11-digit phone number.';
      confirmBuy('Confirm data purchase', [['Network', net.name], ['Plan', plan.name + (plan.validity ? ' · ' + plan.validity : '')], ['Phone number', phone.value.trim()], ['You pay', N(plan.price)]], plan.price,
        () => buy(go, msg, { kind: 'data', network: net.code, dataplan: plan.id, mobileno: phone.value.trim() }, rb)); };
    draw(); m.append(h('div', { class: 'two' }, h('div', { class: 'cd' }, h('div', { class: 'ch' }, ic('phone', 18), 'Buy Data', h('span', { class: 'pl2' }, 'Instant')), left), rb.res));
  }

  /* ---------- Cable TV ---------- */
  async function tv(m) {
    head(m, 'tv', 'Cable TV', 'DSTV · GOtv · Startimes'); const r = await catalog(m, 'tv'); if (!r) return;
    let co = r.tv[0], plan = null, verified = null; const left = h('div', { class: 'cb' }), feeV = h('b', {}, '—'), msg = h('div', { class: 'msg' }), vbox = h('div');
    const iuc = h('input', { placeholder: 'Smart card / IUC number', inputmode: 'numeric', autocomplete: 'off', maxlength: 20 }), vb = h('button', { class: 'btn out', type: 'button', style: 'margin-top:12px' }, ic('shieldck', 16), 'Verify smart card'), go = h('button', { class: 'btn w' }, ic('tv', 17), 'Pay subscription'), rb = resultBox('Receipt', 'Verify the smart card, choose a package and press Pay.');
    const paint = () => { vbox.replaceChildren(); if (verified) vbox.append(h('div', { class: 'vinfo' }, h('b', {}, verified.name || 'Customer found'), h('div', { class: 'mut' }, [verified.package ? 'Current package: ' + verified.package : null, verified.status ? 'Status: ' + verified.status : null, verified.due ? 'Due: ' + verified.due : null, verified.renewal ? 'Renewal: ' + N(verified.renewal) : null, verified.balance != null ? 'Balance: ' + N(verified.balance) : null].filter(Boolean).join(' · ')))); go.disabled = !(verified && plan); feeV.textContent = plan ? N(plan.price) : '—'; };
    const draw = () => { put(left, h('p', { class: 'd' }, 'Enter the smart card number, verify it, then choose the package to pay for.'), h('label', { class: 'lbl' }, 'TV provider'),
      chips(r.tv.map(c => [c.code, c.name]), co.code, c => { co = r.tv.find(x => x.code === c); plan = null; verified = null; draw(); }), field('Smart card / IUC number', 'tv', iuc), vb, vbox,
      h('label', { class: 'lbl' }, 'Choose a package ', h('i', {}, '*')), planGrid(co.plans, plan, p => { plan = p; draw(); }), feeRow(feeV), walletRow(), msg, go); paint(); };
    iuc.addEventListener('input', () => { if (verified) { verified = null; paint(); } });
    vb.onclick = async () => { msg.textContent = ''; vb.disabled = true; const x = await api('vtu/verify', { kind: 'tv', company: co.code, iucno: iuc.value }); vb.disabled = false; if (!x.ok) { verified = null; paint(); msg.className = 'msg'; return msg.textContent = x.msg; } verified = x.info; paint(); };
    go.onclick = () => { msg.textContent = ''; confirmBuy('Confirm TV subscription', [['Provider', co.name], ['Package', plan.name], ['Smart card', iuc.value.trim()], ['Customer', verified.name || '—'], ['You pay', N(plan.price)]], plan.price,
      () => buy(go, msg, { kind: 'tv', company: co.code, package: plan.id, iucno: iuc.value }, rb)); };
    draw(); m.append(h('div', { class: 'two' }, h('div', { class: 'cd' }, h('div', { class: 'ch' }, ic('tv', 18), 'Cable TV', h('span', { class: 'pl2' }, 'Instant')), left), rb.res));
  }

  /* ---------- Electricity ---------- */
  async function electricity(m) {
    head(m, 'electricity', 'Electricity', 'Prepaid & postpaid'); const r = await catalog(m, 'electricity'); if (!r) return; const E_ = r.electricity;
    let type = 1, verified = null, total = null; const left = h('div', { class: 'cb' }), feeV = h('b', {}, '—'), msg = h('div', { class: 'msg' }), vbox = h('div');
    const co = h('select', {}, [h('option', { value: '' }, 'Choose your electricity company…'), ...E_.discos.map(d => h('option', { value: d[0] }, d[1]))]), meter = h('input', { placeholder: 'Meter number', inputmode: 'numeric', autocomplete: 'off', maxlength: 24 }), amt = h('input', { placeholder: 'Amount (minimum ₦' + E_.min.toLocaleString() + ')', inputmode: 'numeric', autocomplete: 'off', maxlength: 7 });
    const vb = h('button', { class: 'btn out', type: 'button', style: 'margin-top:12px' }, ic('shieldck', 16), 'Verify meter'), go = h('button', { class: 'btn w' }, ic('bolt', 17), 'Buy electricity'), rb = resultBox('Receipt', 'Verify the meter and press Buy electricity. Your token appears here.');
    const body = () => ({ company: +co.value, metertype: type, meterno: meter.value, amount: +amt.value.replace(/\D/g, '') });
    const paint = () => { vbox.replaceChildren(); if (verified) vbox.append(h('div', { class: 'vinfo' }, h('b', {}, verified.name || 'Meter found'), h('div', { class: 'mut' }, [verified.address, verified.type, verified.arrears ? 'Arrears: ' + N(verified.arrears) : null].filter(Boolean).join(' · ')))); go.disabled = !verified; feeV.textContent = total != null ? N(total) : '—'; };
    const reset = () => { if (verified) { verified = null; total = null; paint(); } };
    [co, meter, amt].forEach(x => x.addEventListener('input', reset)); co.addEventListener('change', reset);
    const draw = () => { put(left, h('p', { class: 'd' }, 'Verify the meter first, then pay. Your token is shown here and saved in My Results.'), h('label', { class: 'lbl' }, 'Electricity company ', h('i', {}, '*')), h('div', { class: 'ig' }, ic('bolt', 17), co),
      h('label', { class: 'lbl' }, 'Meter type'), chips([[1, 'Prepaid'], [2, 'Postpaid']], type, v => { type = v; reset(); draw(); }), field('Meter number', 'file', meter), field('Amount (₦)', 'tag', amt), vb, vbox, feeRow(feeV), walletRow(), msg, go); paint(); };
    vb.onclick = async () => { msg.textContent = ''; vb.disabled = true; const x = await api('vtu/verify', { kind: 'electricity', ...body() }); vb.disabled = false; if (!x.ok) { verified = null; total = null; paint(); msg.className = 'msg'; return msg.textContent = x.msg; } verified = x.info; total = x.price; paint(); };
    go.onclick = () => { msg.textContent = ''; const b = body(); confirmBuy('Confirm electricity payment', [['Company', co.options[co.selectedIndex].text], ['Meter', b.meterno + ' (' + (type === 1 ? 'Prepaid' : 'Postpaid') + ')'], ['Customer', verified.name || '—'], ['Token value', N(b.amount)], ['You pay', N(total)]], total, () => buy(go, msg, { kind: 'electricity', ...b }, rb)); };
    draw(); m.append(h('div', { class: 'two' }, h('div', { class: 'cd' }, h('div', { class: 'ch' }, ic('bolt', 18), 'Electricity', h('span', { class: 'pl2' }, 'Instant')), left), rb.res));
  }

  /* ---------- Exam pins ---------- */
  async function exam(m) {
    head(m, 'exam', 'Exam Pins', 'WAEC · NECO · NABTEB · NBAIS'); const r = await catalog(m, 'exam'); if (!r) return;
    let b = r.exam[0]; const left = h('div', { class: 'cb' }), feeV = h('b', {}, '—'), msg = h('div', { class: 'msg' }), qty = h('input', { type: 'number', min: 1, max: 50, value: 1, inputmode: 'numeric' }), go = h('button', { class: 'btn w' }, ic('cap', 17), 'Buy pins'), rb = resultBox('Your pins', 'Choose the exam and how many pins you need, then press Buy pins.');
    const n = () => Math.max(0, Math.min(50, Math.floor(+qty.value) || 0)), upd = () => { feeV.textContent = n() ? N(b.unit * n()) : '—'; };
    qty.addEventListener('input', upd);
    const draw = () => { put(left, h('p', { class: 'd' }, 'Result-checker and registration pins are delivered instantly and saved in My Results.'), h('label', { class: 'lbl' }, 'Exam board'), chips(r.exam.map(e => [e.code, e.name + ' · ' + N(e.unit)]), b.code, c => { b = r.exam.find(e => e.code === c); draw(); }),
      field('Number of pins (1 to 50)', 'badge', qty), feeRow(feeV), walletRow(), msg, go); upd(); };
    go.onclick = () => { msg.textContent = ''; if (!n()) return msg.textContent = 'Enter how many pins you need (1 to 50).'; confirmBuy('Confirm exam pins', [['Exam', b.name], ['Number of pins', n()], ['Price per pin', N(b.unit)], ['You pay', N(b.unit * n())]], b.unit * n(), () => buy(go, msg, { kind: 'exam', exam_board: b.code, no_of_pins: n() }, rb)); };
    draw(); m.append(h('div', { class: 'two' }, h('div', { class: 'cd' }, h('div', { class: 'ch' }, ic('cap', 18), 'Exam Pins', h('span', { class: 'pl2' }, 'Instant')), left), rb.res));
  }

  /* ---------- admin: connection, prices, plans ---------- */
  async function admin(m) {
    m.append(crumb(['Dashboard'], ['Admin'], ['Data & Bills Pricing']), titleRow('tag', 'Data & Bills Pricing', 'Admin'));
    const r = await api('admin/vtu/get'); if (!r.ok) return m.append(h('p', {}, r.msg || 'Could not load.'));
    m.append(h('p', { class: 'mut', style: 'margin:-8px 0 18px;max-width:820px' }, 'The provider sets the cost of every plan; you add your profit on top. Profit = a percentage of the cost plus a fixed naira amount (per pin for exam pins). Your own admin account always pays the provider cost. Customers can never pay less than agents.'));
    const st = h('div', { class: 'cd pad', style: 'margin-bottom:20px' }), balOut = h('span', { class: 'mut' });
    const bb = h('button', { class: 'btn out sm' }, ic('wallet', 14), 'Check provider balance'), rf = h('button', { class: 'btn out sm' }, ic('swap', 14), 'Refresh plans now');
    bb.onclick = async () => { bb.disabled = true; const x = await api('admin/vtu/balance'); bb.disabled = false; balOut.replaceChildren(x.ok ? h('span', {}, 'Provider wallet: ', h('b', {}, N(x.balance)), x.accounts && x.accounts.length ? h('span', { class: 'mut' }, ' · Fund it by transfer to ' + x.accounts.map(a => a.bank + ' ' + a.number).join(' / ')) : null) : h('span', { style: 'color:var(--er)' }, x.msg)); };
    rf.onclick = async () => { rf.disabled = true; const x = await api('admin/vtu/refresh'); rf.disabled = false; toast(x.msg); if (x.ok) { m.replaceChildren(); admin(m); } };
    const hook = location.origin + '/api/easyaccess/webhook' + (r.webhookKey ? '?key=YOUR_EA_WEBHOOK_KEY' : '');
    st.append(h('div', {}, h('div', { style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap' }, h('span', { class: 'badge ' + (r.key ? '' : 'r') }, r.key ? 'API key connected' : 'EA_API_KEY missing'), h('span', { class: 'badge ' + (r.mode === 'live' ? '' : 'y') }, r.mode === 'live' ? 'LIVE orders' : 'TEST mode: no real orders'), h('span', { class: 'mut' }, r.plansAt ? 'Plans updated ' + fmt(new Date(r.plansAt).toISOString()) : 'Plans not loaded yet'), h('div', { class: 'sp', style: 'margin-left:auto;display:flex;gap:8px' }, bb, rf)),
      h('div', { style: 'margin-top:10px' }, balOut), r.diag ? h('p', { style: 'color:var(--er);margin-top:10px;font-size:13px;word-break:break-word' }, 'Last plan refresh problem: ' + r.diag) : null, r.key ? null : h('p', { style: 'color:var(--y);margin-top:10px' }, 'Add EA_API_KEY in your Vercel Environment Variables (never in the code), then redeploy. See the README.'),
      h('p', { class: 'mut', style: 'margin-top:12px;font-size:12.5px' }, 'Webhook URL to save in the provider dashboard: ', h('b', { style: 'word-break:break-all' }, hook), ' ', copyBtn(hook, 'Copy')),
      r.guard ? null : h('p', { class: 'mut', style: 'font-size:12.5px' }, 'Price guard is OFF (EA_PRICE_GUARD=0).')));
    m.append(st);
    const onv = { ...r.on }, sw = h('div', { style: 'display:flex;gap:22px;flex-wrap:wrap;margin-bottom:16px' });
    [['data', 'Data'], ['tv', 'Cable TV'], ['electricity', 'Electricity'], ['exam', 'Exam pins']].forEach(([k, l]) => { const b = h('button', { class: 'sw' + (onv[k] ? ' on' : ''), 'aria-label': l + ' on or off', on: { click: () => { onv[k] = onv[k] ? 0 : 1; b.classList.toggle('on', !!onv[k]); } } }); sw.append(h('label', { style: 'display:flex;gap:8px;align-items:center;font-weight:600' }, b, l)); });
    const c = h('div', { class: 'cd pad ov' }), t = h('table', { class: 'tbl' }, h('tr', {}, ['Service', 'Provider cost', 'Agent profit %', 'Agent profit ₦', 'Customer profit %', 'Customer profit ₦'].map(x => h('th', {}, x)))), inp = {};
    r.groups.forEach(g => { const mk = v => h('input', { type: 'number', min: 0, step: 'any', value: v, 'aria-label': g.label }); inp[g.key] = { ap: mk(g.ap), af: mk(g.af), ip: mk(g.ip), if: mk(g.if) };
      const cost = g.svc === 'exam' ? (r.counts[g.key] ? N(r.counts[g.key]) + ' / pin' : 'not loaded') : g.svc === 'electricity' ? 'the amount' : (r.counts[g.key] || 0) + ' plans';
      t.append(h('tr', {}, h('td', { style: 'font-weight:600' }, g.label), h('td', { class: 'mut' }, cost), h('td', {}, inp[g.key].ap), h('td', {}, inp[g.key].af), h('td', {}, inp[g.key].ip), h('td', {}, inp[g.key].if))); });
    const save = h('button', { class: 'btn', style: 'margin-top:16px' }, 'Save prices');
    save.onclick = async () => { const mm = {}; r.groups.forEach(g => { const x = inp[g.key]; mm[g.key] = { ap: x.ap.value, af: x.af.value, ip: x.ip.value, if: x.if.value }; }); save.disabled = true; const x = await api('admin/vtu/save', { on: onv, m: mm }); save.disabled = false; toast(x.msg); if (x.ok) { const me = await api('me'); if (me.ok) CF = me; } };
    c.append(sw, t, save); m.append(c);
    const q = h('div', { class: 'cd pad', style: 'margin-top:20px' }), ref = h('input', { placeholder: 'Provider reference, for example DATAeb84c154007…' }), qb = h('button', { class: 'btn out' }, ic('search', 16), 'Check order'), qo = h('div', { style: 'margin-top:12px' });
    qb.onclick = async () => { qb.disabled = true; const x = await api('admin/vtu/query', { reference: ref.value }); qb.disabled = false; qo.replaceChildren(x.ok ? h('div', {}, h('span', { class: 'badge ' + (x.state === 'success' ? '' : x.state === 'failed' ? 'r' : 'y') }, x.found ? (x.status || x.state) : 'No record found'), x.amount != null ? ' ' + N(x.amount) : '', x.date ? h('span', { class: 'mut' }, ' · ' + x.date) : null, x.response ? h('p', { class: 'mut', style: 'margin-top:8px' }, x.response) : null) : h('span', { style: 'color:var(--er)' }, x.msg)); };
    q.append(h('h3', { style: 'margin:0 0 10px;font-size:15px' }, 'Look up an order with the provider'), h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, h('div', { class: 'ig', style: 'flex:1;min-width:240px' }, ic('search', 17), ref), qb), qo); m.append(q);
  }

  return { data, tv, electricity, exam, admin, card, tiles, navItems };
})();
