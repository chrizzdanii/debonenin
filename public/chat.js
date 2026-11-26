/* DEBONE Digital Hub: the assistant (chat window). Answers from the full guide (see chat-engine.js and guide-qa.js)
   and from the live site: your real prices, your balance and your agent status.
   Loaded before app.js. Page helpers (h, ic, I, ME, CF, SV, N, api, toast, G, render ...) are used only when it runs. */
'use strict';
const CHAT = { open: false, msgs: [], lastQ: '', lastPrice: false, speak: false, busy: false, el: null, wa: '' };
const cLs = { get: k => { try { return sessionStorage.getItem(k) } catch { return null } }, set: (k, v) => { try { sessionStorage.setItem(k, v) } catch {} } };
const cMe = () => (typeof ME !== 'undefined' && ME) ? ME : null;

/* ---------- the knowledge the assistant reads ---------- */
function chatIndex() {
  const me = cMe(), adm = !!(me && me.admin && typeof GADMIN !== 'undefined' && GADMIN), key = adm ? 'a' : 'p';
  if (chatIndex.k === key && chatIndex.v) return chatIndex.v;
  const P = GUIDE_PARTS, parts = [P.start, P.why, P.customer, P.agent].concat(adm ? [{ ...GADMIN, admin: true }] : []);
  chatIndex.v = DVChat.build(parts, GUIDE_QA, adm ? GADMIN.qa : []); chatIndex.k = key; return chatIndex.v;
}

/* ---------- live answers: prices, balance, status, services ---------- */
const GENERIC = new Set(DVChat.tokens('price slip verify check search number service charge fee cost agent individual verification lookup get about'));
const ALIAS = { voters_card: 'pvc voter card', drivers_license: 'driver licence license', passport: 'international passport', plate_number: 'vehicle car plate', plate_advance: 'vehicle car plate', vin_chassis: 'vehicle car vin chassis', meter_address: 'electricity nepa disco light meter',
  cac_basic: 'company business name registration', cac_advance: 'company business name registration directors', cac_premium: 'company business name registration', scuml: 'company', tin_by_cac: 'company', tcc: 'tax clearance certificate', bank_account: 'account name', bank_account_match: 'account name match',
  nin_demo: 'name dob date birth demographic demographics', ipe: 'ipe clearance', validation: 'validate', personalization: 'personalisation personalise' };
const PRICE_RE = /\b(price|prices|pricing|cost|costs|how much|fee|fees|charges?|rates?|naira|pay for|amount)\b|₦/i;
function svcMatch(q) {
  if (typeof SV === 'undefined' || !SV) return [];
  const qt = [...new Set(DVChat.tokens(q))]; if (!qt.length) return [];
  const real = qt.filter(w => !GENERIC.has(w)); if (!real.length) return [];
  const rows = Object.values(SV).filter(s => s.active).map(s => {
    const lt = new Set(DVChat.tokens(s.label)), gt = new Set(DVChat.tokens(s.group)), at = new Set(DVChat.tokens(ALIAS[s.key] || ''));
    let sc = 0; for (const w of real) sc += (lt.has(w) || at.has(w)) ? 1 : gt.has(w) ? 0.5 : 0;
    for (const w of qt) if (GENERIC.has(w) && lt.has(w)) sc += 0.25;
    return { s, sc };
  });
  const max = Math.max(0, ...rows.map(r => r.sc)); if (max < 1) return [];
  return rows.filter(r => r.sc >= max - 0.01).map(r => r.s).slice(0, 14);
}
function priceBlocks(list) {
  const me = cMe(), agent = !!(me && me.agent && !me.admin), admin = !!(me && me.admin);
  const rows = list.map(s => ({ label: s.label, mine: s.price, agent: s.agentPrice, ind: s.indPrice, off: !s.active, locked: !!s.locked }));
  const b = [{ t: 'prices', rows, mode: admin ? 'admin' : agent ? 'agent' : 'ind' }];
  if (admin) b.unshift({ t: 'p', text: 'You are the admin, so you pay the provider price. Agents and individuals pay the prices on the right.' });
  else if (agent) b.unshift({ t: 'p', text: 'You are a **verified agent**, so you pay the agent price.' });
  else b.unshift({ t: 'p', text: 'This is what you pay now, as an individual. **Verified agents pay less.** The price is always shown on the service page before you press the button.' });
  if (list.some(s => s.locked)) b.push({ t: 'note', kind: 'warn', text: 'A service marked agents only is restricted by the owner to verified agents.' });
  return b;
}
function liveAnswer(q) {
  const t = DVChat.norm(q), me = cMe();
  if (/\b(my|current)\s+(wallet\s+)?balance\b|\bhow much (money )?(do i have|have i got)\b|\bhow much is (in )?my (wallet|account|balance)\b|\bcheck (my )?balance\b/.test(t)) {
    if (!me) return { blocks: [{ t: 'p', text: 'Sign in to see your wallet balance.' }], chips: ['How do I create an account?'] };
    return { blocks: [{ t: 'p', text: 'Your wallet balance is **' + N(me.bal || 0) + '**.' }, { t: 'p', text: 'Tap the eye on the Dashboard card to show or hide it there.' }], chips: ['How do I add money to my wallet?', 'What can I do with my wallet?'] };
  }
  if (/\bam i (a |an )?(verified )?agent\b|\bmy agent (status|application)\b|\b(is|has) my (agent )?(application|verification) (been )?(approved|rejected|accepted|verified)\b|\bwhich price (do )?i pay\b/.test(t)) {
    if (!me) return { blocks: [{ t: 'p', text: 'Sign in and I can tell you your status.' }], chips: [] };
    const st = me.admin ? 'admin' : me.agent ? 'approved' : (me.agentStatus || 'none');
    const msg = { admin: 'You are the **admin**. You pay the provider price on every service.', approved: 'You are a **verified agent**. You pay the lower agent price on every service.', pending: 'Your agent application is **under review**. Until the owner decides, you use every service at the individual price.', rejected: 'Your last agent application was **rejected**. Open **Agent Verification** to read the reason, fix it and apply again.', none: 'You are an **individual**: you can use every service at the individual price. You have not applied to be a verified agent yet.' }[st] || 'I could not read your status.';
    return { blocks: [{ t: 'p', text: msg }], chips: st === 'none' || st === 'rejected' ? ['How do I become a verified agent?'] : [], go: st === 'none' || st === 'rejected' ? { label: 'Open Agent Verification', hash: '#/agent' } : null };
  }
  if (typeof SV !== 'undefined' && SV && Object.keys(SV).length && /\b(what|which|list|show|all)\b.*\b(services|verifications)\b|\bservices (do you|you) (have|offer|provide)\b/.test(t) && !/\b(price|cost|how much)\b/.test(t)) {
    const g = {}; Object.values(SV).filter(s => s.active).forEach(s => (g[s.group] = g[s.group] || []).push(s.label));
    return { blocks: [{ t: 'p', text: 'Everything below is switched on right now. Ask me the price of any of them.' }, { t: 'list', items: Object.entries(g).map(([k, v]) => '**' + k + ':** ' + v.join(', ')) }], chips: ['How do I run a verification?', 'How much is a NIN slip?'] };
  }
  if (/\b(talk|speak|chat|connect)\b.*\b(human|person|someone|support|staff|customer care|real)\b|\bcontact (you|support)\b|\bwhatsapp (number|link)\b|\bcall (you|support)\b/.test(t)) return { blocks: [{ t: 'p', text: 'I am an automated helper, but our support team is on WhatsApp. Tell them what you were doing, the service and the time. Never send your password or PIN.' }], wa: true, chips: [] };
  const list = svcMatch(q), tokensN = DVChat.tokens(q).length;
  if (list.length && (PRICE_RE.test(q) || tokensN <= 2 || (CHAT.lastPrice && tokensN <= 4))) return { blocks: priceBlocks(list), chips: cMe() && !cMe().agent && !cMe().admin ? ['How do I become a verified agent?'] : ['How do I run a verification?'], price: true };
  if (PRICE_RE.test(q) && !list.length && (!me || !Object.keys(SV || {}).length) && /\b(nin|bvn|cac|tin|slip|ipe|validation|voter|passport|licen[cs]e|plate|chassis|meter|account)\b/i.test(q))
    return { blocks: [{ t: 'p', text: 'Sign in or create a free account and every service shows its exact price before you pay. Verified agents pay less than individuals.' }], chips: ['How do I create an account?', 'Why are there two prices?'] };
  return null;
}

/* ---------- small talk ---------- */
const WELCOME_CHIPS = () => { const me = cMe(); return me && me.admin ? ['How do I approve a bank transfer?', 'How do I set prices?', 'How do I approve an agent?', 'What should I do every day?'] : me && me.agent ? ['How much is a NIN slip?', 'I closed the page. Do I pay again?', 'How do I add money to my wallet?', 'What are the rules for agents?'] : ['How do I add money to my wallet?', 'How much is a NIN slip?', 'I closed the page. Do I pay again?', 'How do I become a verified agent?'] };
const TALK = {
  hello: () => ({ blocks: [{ t: 'p', text: 'Hello! I am the DEBONE assistant. Ask me anything about the site: funding your wallet, running a check, prices, agents, problems. I answer from the full guide.' }], chips: WELCOME_CHIPS() }),
  thanks: () => ({ blocks: [{ t: 'p', text: 'You are welcome! Ask me anything else any time.' }], chips: [] }),
  bye: () => ({ blocks: [{ t: 'p', text: 'Goodbye! Come back any time you have a question.' }], chips: [] }),
  ack: () => ({ blocks: [{ t: 'p', text: 'Okay. What else would you like to know?' }], chips: WELCOME_CHIPS() }),
  who: () => ({ blocks: [{ t: 'p', text: 'I am the **DEBONE assistant**, an automated helper (not a person). I have read the whole user guide, so I can explain every part of the site to customers, agents and the admin, and I can tell you your live prices. For account or payment problems that need a person, use Direct WhatsApp.' }], chips: WELCOME_CHIPS(), wa: true }),
  can: () => ({ blocks: [{ t: 'p', text: 'I can help with:' }, { t: 'list', items: ['**Using the site:** sign up, fund your wallet, run any check, download slips, My Results, My Requests.', '**Prices:** ask “How much is a NIN slip?” and I show your real price and the agent price.', '**Agents:** how to become a verified agent and what changes.', '**Problems:** money deducted, wallet not credited, closed the page, failed checks.', '**Your account:** your balance and your agent status.'] }], chips: WELCOME_CHIPS() })
};

/* ---------- the answer ---------- */
async function chatReply(q) {
  const me = cMe(); if (me && me.admin && typeof loadAdminPart === 'function') { try { await loadAdminPart() } catch {} }
  const idx = chatIndex(), st = DVChat.smalltalk(q);
  if (st) return TALK[st.kind]();
  const live = liveAnswer(q);
  if (live) { CHAT.lastPrice = !!live.price; return { blocks: live.blocks, chips: live.chips || [], wa: live.wa, go: live.go, src: null, live: true } }
  CHAT.lastPrice = false;
  const adm = !!(me && me.admin); let r = DVChat.ask(idx, q, { admin: adm });
  if (CHAT.lastQ && (/^(and|what about|how about|also|then|so|for|why|what of|is it|does it|can i)\b/i.test(q.trim()) || (DVChat.tokens(q).length <= 2 && r.kind !== 'answer'))) { // a short follow-up: read it together with the last question
    const r2 = DVChat.ask(idx, CHAT.lastQ + ' ' + q, { admin: adm }); if (r2.kind === 'answer' && (r.kind !== 'answer' || r2.conf > r.conf)) r = r2;
  }
  if (r.kind === 'answer') { CHAT.lastQ = q; return { blocks: r.blocks, chips: r.related.map(x => x.q), src: r.src, wa: false } }
  return { blocks: [{ t: 'p', text: 'I am not sure I understood that. I can only answer questions about DEBONE Digital Hub. Try asking in other words, or pick one of these:' }], chips: r.related.length ? r.related.map(x => x.q) : WELCOME_CHIPS(), src: null, wa: true, low: true };
}

/* ---------- the window ---------- */
function chatInit() {
  if (chatInit.done) return; chatInit.done = 1;
  Object.assign(I, { chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 11h7M8.5 14h4"/>', send: '<path d="M4 12l16-8-6 16-3-6.5z"/>', bin: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>', xx: '<path d="M6 6l12 12M18 6L6 18"/>', spark: '<path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>' });
  const fab = h('button', { class: 'chatfab', 'aria-label': 'Ask the assistant', title: 'Ask the assistant', on: { click: () => chatToggle() } }, ic('chat', 22), h('span', {}, 'Ask'));
  document.body.append(fab); CHAT.fab = fab;
  try { fetch('/api/public', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.json()).then(j => { CHAT.wa = String(j.whatsapp || '').replace(/\D/g, '') }).catch(() => {}) } catch {}
  addEventListener('keydown', e => { if (e.key === 'Escape' && CHAT.open && !document.querySelector('.tour-pop')) chatToggle(false) });
}
const chatUid = () => (cMe() && cMe().id) || 'guest';
function chatLoad() { try { const s = JSON.parse(cLs.get('dv_chat_v1') || 'null'); if (s && s.uid === chatUid() && Array.isArray(s.msgs)) CHAT.msgs = s.msgs; else CHAT.msgs = [] } catch { CHAT.msgs = [] } }
const chatSave = () => cLs.set('dv_chat_v1', JSON.stringify({ uid: chatUid(), msgs: CHAT.msgs.slice(-40) }));
function chatBuild() {
  if (CHAT.el) return CHAT.el;
  const log = h('div', { class: 'chatlog', role: 'log', 'aria-live': 'polite', 'aria-label': 'Conversation' }), chips = h('div', { class: 'chatchips' });
  const input = h('input', { type: 'text', placeholder: 'Ask anything about the site…', 'aria-label': 'Type your question', maxlength: '300', autocomplete: 'off', enterkeyhint: 'send' });
  const send = h('button', { class: 'chatsend', type: 'submit', 'aria-label': 'Send' }, ic('send', 18));
  const speak = h('button', { class: 'chatic', title: 'Read replies aloud', 'aria-label': 'Read replies aloud', 'aria-pressed': 'false', on: { click: () => { CHAT.speak = !CHAT.speak; speak.setAttribute('aria-pressed', String(CHAT.speak)); speak.classList.toggle('on', CHAT.speak); if (!CHAT.speak) chatStopSpeech(); else toast('Replies will be read aloud') } } }, ic('speaker', 17));
  if (typeof TTS === 'undefined' || !TTS.ok) speak.classList.add('hide');
  const clear = h('button', { class: 'chatic', title: 'Clear chat', 'aria-label': 'Clear chat', on: { click: () => { CHAT.msgs = []; CHAT.lastQ = ''; chatSave(); chatStopSpeech(); chatPaint(true) } } }, ic('bin', 17));
  const close = h('button', { class: 'chatic', title: 'Close', 'aria-label': 'Close the assistant', on: { click: () => chatToggle(false) } }, ic('xx', 18));
  const form = h('form', { class: 'chatform', on: { submit: e => { e.preventDefault(); const v = input.value.trim(); if (v) { input.value = ''; chatAsk(v) } } } }, input, send);
  const el = h('section', { class: 'chatp hide', role: 'dialog', 'aria-label': 'DEBONE assistant' },
    h('header', { class: 'chath' }, h('span', { class: 'chata' }, ic('spark', 18)), h('div', { style: 'flex:1;min-width:0' }, h('b', {}, 'DEBONE Assistant'), h('small', {}, 'Answers from the full guide · instant')), speak, clear, close),
    log, chips, form, h('div', { class: 'chatfoot' }, 'Automated helper, not a person. Never share your password or PIN.'));
  CHAT.el = el; CHAT.log = log; CHAT.chips = chips; CHAT.input = input; document.body.append(el); return el;
}
function chatToggle(on) {
  chatInit(); const el = chatBuild(), was = CHAT.open; CHAT.open = on == null ? !CHAT.open : !!on;
  el.classList.toggle('hide', !CHAT.open); CHAT.fab.classList.toggle('hide', CHAT.open && matchMedia('(max-width:600px)').matches);
  if (CHAT.open && was) return;
  if (CHAT.open) { chatLoad(); chatPaint(true); setTimeout(() => { try { CHAT.input.focus({ preventScroll: true }) } catch {} }, 60) } else chatStopSpeech();
}
function chatOpen(q) { chatToggle(true); if (q) chatAsk(q) }
function chatStopSpeech() { try { speechSynthesis.cancel() } catch {} }
function chatSay(blocks) {
  if (typeof TTS === 'undefined' || !TTS.ok) return; chatStopSpeech();
  const text = blocks.map(b => b.t === 'prices' ? b.rows.map(r => r.label + ' ' + N(r.mine)).join('. ') : b.t === 'list' || b.t === 'steps' ? (b.items || []).join('. ') : b.text || '').join('. ');
  chunkText(speechText(text)).forEach(piece => { const u = new SpeechSynthesisUtterance(piece); const v = ttsPick(); if (v) { u.voice = v; u.lang = v.lang } u.rate = TTS.rate || 1; speechSynthesis.speak(u) });
}
function chatRows(b) {
  const f = x => N(x), r = b.rows, mode = b.mode, head = mode === 'ind' ? ['Service', 'You pay'] : mode === 'agent' ? ['Service', 'You pay', 'Individual pays'] : ['Service', 'You pay', 'Agent', 'Individual'];
  const t = h('table', { class: 'tbl chatpr' }, h('tr', {}, head.map(x => h('th', {}, x))));
  r.forEach(x => t.append(h('tr', { class: x.off ? 'off' : '' }, h('td', {}, x.label + (x.off ? ' (off)' : x.locked ? ' (agents only)' : '')), h('td', { class: 'pm' }, f(x.mine)),
    ...(mode === 'ind' ? [] : mode === 'agent' ? [h('td', {}, f(x.ind))] : [h('td', {}, f(x.agent)), h('td', {}, f(x.ind))]))));
  return h('div', { class: 'ov' }, t);
}
function chatBlock(b) {
  if (b.t === 'p') return h('p', {}, String(b.text).split('\n').flatMap((l, i) => i ? [h('br'), ...rich(l)] : rich(l)));
  if (b.t === 'list') return h('ul', {}, b.items.map(x => h('li', {}, rich(x))));
  if (b.t === 'steps') return h('div', {}, b.lead ? h('p', {}, h('b', {}, b.lead)) : '', h('ol', {}, b.items.map(x => h('li', {}, rich(x)))));
  if (b.t === 'note') return h('div', { class: 'chatnote ' + b.kind }, h('b', {}, b.kind === 'warn' ? 'Important' : b.kind === 'good' ? 'Good to know' : 'Tip'), h('span', {}, rich(b.text)));
  if (b.t === 'prices') return chatRows(b);
  return h('span');
}
function chatWaHref() { return CF && CF.whatsapp ? 'https://wa.me/' + CF.whatsapp : CHAT.wa ? 'https://wa.me/' + CHAT.wa : '' }
function chatMsg(m) {
  if (m.r === 'u') return h('div', { class: 'cm u' }, h('div', { class: 'cb' }, m.t));
  const body = h('div', { class: 'cb' }, m.blocks.map(chatBlock)), acts = h('div', { class: 'cact' });
  if (m.src && m.src.id && cMe()) acts.append(h('button', { class: 'btn out sm', on: { click: () => { chatToggle(false); G.tab = 'full'; G.q = ''; G.jump = m.src.id; if (location.hash === '#/guide') render(); else location.hash = '#/guide' } } }, ic('book', 14), 'Read in the guide'));
  if (m.go) acts.append(h('a', { class: 'btn out sm', href: m.go.hash, on: { click: () => chatToggle(false) } }, m.go.label));
  if (m.wa && chatWaHref()) acts.append(h('a', { class: 'btn out sm', href: chatWaHref(), target: '_blank', rel: 'noopener' }, ic('wa', 14), 'Chat with support'));
  if (typeof TTS !== 'undefined' && TTS.ok) acts.append(h('button', { class: 'btn out sm', 'aria-label': 'Read this answer aloud', on: { click: () => chatSay(m.blocks) } }, ic('speaker', 14), 'Listen'));
  return h('div', { class: 'cm b' }, h('span', { class: 'chata sm' }, ic('spark', 14)), h('div', { style: 'min-width:0;flex:1' }, body, acts.children.length ? acts : ''));
}
function chatPaint(greet) {
  if (!CHAT.el) return; CHAT.log.replaceChildren();
  if (!CHAT.msgs.length && greet) { const g = TALK.hello(); CHAT.msgs.push({ r: 'b', blocks: g.blocks, chips: g.chips, greet: 1 }) }
  CHAT.msgs.forEach(m => CHAT.log.append(chatMsg(m)));
  const last = CHAT.msgs[CHAT.msgs.length - 1]; CHAT.chips.replaceChildren(...((last && last.chips) || []).slice(0, 4).map(c => h('button', { class: 'chatchip', on: { click: () => chatAsk(c) } }, c)));
  CHAT.log.scrollTop = CHAT.log.scrollHeight;
}
async function chatAsk(q) {
  q = String(q).slice(0, 300); if (CHAT.busy) return; CHAT.busy = true; chatToggle(true);
  CHAT.msgs.push({ r: 'u', t: q }); CHAT.chips.replaceChildren(); chatPaint(false);
  const dots = h('div', { class: 'cm b' }, h('span', { class: 'chata sm' }, ic('spark', 14)), h('div', { class: 'cb typing', 'aria-label': 'Typing' }, h('i'), h('i'), h('i'))); CHAT.log.append(dots); CHAT.log.scrollTop = CHAT.log.scrollHeight;
  let r; try { r = await chatReply(q) } catch (e) { r = { blocks: [{ t: 'p', text: 'Sorry, something went wrong on my side. Please try again, or open the Guide.' }], chips: WELCOME_CHIPS(), wa: true } }
  await new Promise(ok => setTimeout(ok, 280));
  CHAT.msgs.push({ r: 'b', blocks: r.blocks, chips: r.chips, src: r.src || null, wa: !!r.wa, go: r.go || null }); chatSave(); CHAT.busy = false; chatPaint(false);
  if (CHAT.speak) chatSay(r.blocks);
}
