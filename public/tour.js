/* DEBONE Digital Hub: guided tour. Spotlights the real parts of the site, one step at a time, and moves between pages by itself.
   Loaded before app.js; it uses app.js helpers (h, ic, ME, CF, $) only when a tour is started. */
'use strict';

function tourSteps(kind) {
  const agent = !!(ME.agent || ME.admin), wa = !!CF.whatsapp;
  if (kind === 'admin') return [
    { title: 'Welcome, Admin', text: 'This tour shows every admin page and what it is for. It takes about 3 minutes. Use Next, or the arrow keys on your keyboard. Press Esc to stop at any time.', go: '#/dashboard' },
    { sel: '.it[data-v="a/overview"]', side: true, title: 'The Admin menu', text: 'Only you see the Admin group in the menu. Every admin page is listed here. You also have an Admin tab on the Dashboard.' },
    { go: '#/a/overview', sel: 'main .sg', title: 'Admin Overview: your numbers', text: 'Registered users, the money customers hold in wallets, total funded, customer spending, pending requests and paid actions today.' },
    { has: 'Needs attention', title: 'Needs attention', text: 'When something needs you, a yellow box lists it and tells you which page to open: bank transfers waiting, agent applications, stuck requests, missing provider prices and more. If there is no box, nothing needs you.' },
    { txt: 'Check provider connection', title: 'Check the provider', text: 'Press this to see that the provider answers and how much money is left in your provider wallet. If that wallet runs low, customers see “temporarily unavailable” and are not charged.' },
    { go: '#/a/prices', sel: 'main .cd.pad.ov', title: 'Set Prices', text: 'One row per service. Provider price is what you pay. Agent price is what verified agents pay. Individual price is what everyone else pays and must be higher. The Margin column shows your profit at both prices. Press Save at the end of a row.' },
    { txt: 'Sync provider prices', title: 'Sync provider prices', text: 'Copies the provider’s latest prices for the look-up services (CAC, TIN, ID, vehicle, bank, meter). Slip and agency services are typed by hand.' },
    { go: '#/a/transfers', sel: 'main .cd.pad', title: 'Bank Transfers: your bank details', text: 'Type the account customers should send money to, and switch Paystack on or off for customers.' },
    { sel: 'main .cd.pad.ov', title: 'Approving deposits', text: 'Customers upload receipts here. View the receipt, check your own bank app, then press Approve and confirm the amount you actually received. Reject with a reason if it is wrong. Approving credits the wallet at once and cannot be undone.' },
    { go: '#/a/payments', sel: 'main .cd.pad.ov, main .empty', title: 'Paystack Payments', text: 'Every Paystack payment: credited, waiting or needs review. Press Re-check all waiting payments if a customer says they paid.' },
    { go: '#/a/requests', sel: 'main .cd.pad.ov, main .empty', title: 'Agency Requests', text: 'IPE, validation and personalisation requests. Check asks the provider. Refund customer returns the fee and closes a stuck request.' },
    { go: '#/a/results', sel: 'main .cd.pad.ov, main .empty', title: 'Saved Results', text: 'Every slip the provider returned, kept 30 days, even ones the customer never saw. View, download, delete, or copy the raw reply to send to provider support.' },
    { go: '#/a/agents', sel: 'main .cd.pad', title: 'Agents and Invites', text: 'Choose who can register: Open, Invite only or Closed. Below, review agent applications (view the ID, approve, or reject with a reason) and create one-time invite codes.' },
    { go: '#/a/users', sel: 'main .ig, main .cd', title: 'Users', text: 'Search any customer. Suspend or activate, reset a password (a temporary one is shown once), or make or remove an agent.' },
    { go: '#/a/settings', sel: 'main .cd.pad', title: 'Support Settings', text: 'Set the WhatsApp number for support, copy the Paystack webhook link, and set up two-step login for your admin account. Two-step login is strongly recommended.' },
    { go: '#/guide', sel: '.gbar', title: 'The Guide has an admin chapter', text: 'Open the “For admin” tab for the full admin manual. You can read it, listen to it or download it as a PDF.' },
    { sel: '.chatfab', title: 'The assistant knows the admin guide too', text: 'Tap Ask and type a question such as “How do I approve a bank transfer?”. As the admin, the assistant also answers from the admin chapters. Customers never see those answers.' },
    { title: 'You are ready', text: 'That is the whole admin side. You can run the customer tour any time from the Guide page to see what your customers see.', end: true, alt: ['Take the customer tour', 'customer'] }
  ];
  const s = [
    { title: 'Welcome to DEBONE Digital Hub', text: 'This tour shows you every part of the site on the real screens. It takes about 3 minutes. Use Next, or the arrow keys on your keyboard. Press Esc to stop at any time.', go: '#/dashboard' },
    { sel: '.sb', side: true, title: 'The menu', text: 'Everything you need is in this menu. Finance and Wallet is for money. Identity and Verifications is for NIN, BVN and more. NIN Services is for IPE, validation and personalisation. My Results and the Guide are near the bottom.' },
    { sel: '.hero', title: 'Your balance', text: 'This is your wallet. The balance shows dots for privacy. Tap the eye to see it and tap again to hide it.' },
    { sel: '.hero .bt', title: 'Fund Wallet and Wallet Hub', text: 'Fund Wallet is where you add money. Wallet Hub shows your totals and limits.' },
    { sel: '.tabs', title: 'Tabs and search', text: 'Tap a tab to show only Identity, NIN Agency or Business and ID services. Type in the search box to find a service fast.' },
    { sel: '.tiles', title: 'Service tiles', text: 'Each tile is a service. Tap one to open it. HOT marks popular ones. A tile marked AGENTS means the owner has limited it to verified agents.' },
    { sel: '.tbar .srch', title: 'Search from anywhere', text: 'Type here to jump to any service or page. On a computer press Ctrl and K to jump straight to this box.' },
    { sel: '.tbar button[aria-label="Switch light or dark mode"]', title: 'Light or dark', text: 'Tap the moon to switch between light and dark colours. The site remembers your choice.' },
    { sel: '.tbar a[href="#/requests"]', title: 'The bell', text: 'The bell opens My Requests. A red dot means you have requests that are still processing.' },
    { sel: '.tbar .uc', title: 'Your account menu', text: agent ? 'Tap your name for Profile Settings and Log Out. It shows that you are a verified agent.' : 'Tap your name for Profile Settings and Log Out. It shows “Personal” until you become a verified agent.' },
    ...(agent ? [] : [{ sel: '.banner', title: 'Become a verified agent', text: 'Everyone can use every service. Verified agents pay a lower price on all of them. Tap this banner to apply. It takes about 2 minutes.' }]),
    { go: '#/deposit', sel: '.mts', title: 'Two ways to add money', text: 'Bank transfer has no fee: you send money from your bank app and we confirm it. Paystack lets you pay with a card, bank transfer or USSD and credits your wallet at once.' },
    { sel: 'main .g21 > .cd.pad', title: 'Type the amount', text: 'Type how much to add (₦100 to ₦500,000) or tap a quick amount. For Paystack the page shows the small fee before you pay. Then press the button at the bottom.' },
    { sel: 'main .g21 > div:last-child', title: 'Limits and how it works', text: 'The limits and the steps are explained here. For bank transfer: send the exact amount with your reference, press “I have made the transfer”, upload your receipt, and wait for it to be credited.' },
    { go: '#/wallet', sel: 'main .wc', title: 'My Wallet', text: 'Your wallet card with your balance, funding method and name.' },
    { sel: 'main .s3', title: 'Your totals', text: 'Main balance, total funded and total spent. Refunds are taken off what you spent.' },
    { go: '#/nin', sel: 'main .two > .cd:first-child', title: 'A service page', text: 'All instant services look like this. Fill in the details on the left. The answer appears on the right.' },
    { sel: 'main .cb select', title: 'Choose the slip type', text: 'Some services have several slip types. The price of each is shown beside its name.' },
    { sel: 'main .fee', title: 'You see the price first', text: 'The Service Fee is shown before you press anything.' + (agent ? ' You are a verified agent, so this is the agent price.' : '') },
    { sel: 'main .two .btn.w', title: 'Verify Now', text: 'The fee is taken only when you press this. If the check fails or the provider is busy, the fee is returned automatically. Pressing twice cannot charge you twice.' },
    { sel: 'main .two > .cd:last-child', title: 'Your result', text: 'The result appears here with a Download slip (PDF) button. Download it as many times as you like. It is always free after you have paid once.' },
    { go: '#/ipe', sel: 'main .two', title: 'Agency services', text: 'IPE clearance, NIN validation and NIN personalisation are not instant. You submit the request, then follow it under My Requests. If it fails, your money is returned.' },
    { go: '#/more', sel: 'main .cd.pad', title: 'More verifications', text: 'CAC, tax and TIN, voter’s card, driver’s licence, passport, vehicle, bank account and electricity meter checks are all here, grouped by type.' },
    { go: '#/requests', sel: 'main .cd', title: 'My Requests', text: 'Follow your agency requests here. Press Check status to see whether it is pending, completed or failed. A completed request shows the result and the slip.' },
    { go: '#/results', sel: 'main .cd.pad', title: 'My Results: your safety net', text: 'Closed the page by mistake? Your result is saved here for 30 days. View it or download it again for free. You never pay twice for the same check.' },
    { go: '#/transactions', sel: 'main .cd', title: 'Transactions', text: 'Every naira that moves in your wallet, newest first. Green is money in, red is money out. Refunds show here too.' },
    { go: '#/agent', sel: 'main .cd.pad', title: 'Agent Verification', text: agent ? 'You are verified. This page confirms that you pay the lower agent price.' : 'Apply here to become a verified agent: your business details and an ID document. The owner reviews it by hand. Once approved, the lower agent price applies automatically.' },
    { go: '#/profile', sel: 'main .cd.pad', title: 'Profile Settings', text: 'Change your name or your password here. Changing your password signs out your other devices for safety.' },
    ...(wa ? [{ sel: '.sb a[href^="https://wa.me"]', side: true, title: 'Direct WhatsApp', text: 'Need help? This opens a chat with support. Never send your password to anyone.' }] : []),
    { go: '#/guide', sel: '.gbar', title: 'The Guide: read, listen or download', text: 'The full guide explains every page. Press Listen and the site reads it to you until you press Stop. Press Download PDF to keep a copy. Use the search box to find any topic.' },
    { sel: '.chatfab', title: 'The assistant: ask anything', text: 'Tap Ask at the bottom of the screen. The assistant has read the whole guide, so it answers any question in plain words: how to fund, why a check failed, what a word means. Ask it “How much is a NIN slip?” and it shows your real price. It also reads answers aloud if you want.' },
    { title: 'You are ready', text: 'That is the whole site. Fund your wallet, run a check, and remember: pay once, download as many times as you like, and find any result again in My Results for 30 days.', end: true }
  ];
  return s;
}

let TOUR = null;
const tourWait = (find, ms = 3000) => new Promise(res => { const t0 = Date.now(); const tick = () => { const e = find(); if (e) return res(e); if (Date.now() - t0 > ms) return res(null); setTimeout(tick, 100) }; tick() });
const tourFind = s => () => {
  if (s.sel) { for (const q of s.sel.split(',')) { const e = document.querySelector(q.trim()); if (e && e.getClientRects().length) return e } return null }
  if (s.has) return [...document.querySelectorAll('main .cd')].find(b => b.textContent.includes(s.has) && b.getClientRects().length) || null;
  if (s.txt) return [...document.querySelectorAll('main button, main a')].find(b => b.textContent.includes(s.txt) && b.getClientRects().length) || null;
  return null;
};
function tourEnd(quiet) {
  if (!TOUR) return; const k = TOUR.kind; document.removeEventListener('keydown', TOUR.key, true); window.removeEventListener('resize', TOUR.place); window.removeEventListener('scroll', TOUR.place, true);
  [TOUR.ov, TOUR.spot, TOUR.pop].forEach(e => e && e.remove()); if (innerWidth <= 900) $('#app') && $('#app').classList.remove('open'); lsSet('dv_tour_' + k, '1'); lsSet('dv_welcome_seen', '1'); TOUR = null;
}
async function startTour(kind) {
  if (typeof ttsStop === 'function') ttsStop();
  tourEnd(true); const steps = tourSteps(kind);
  const ov = h('div', { class: 'tour-ov' }), spot = h('div', { class: 'tour-spot' }), pop = h('div', { class: 'tour-pop', role: 'dialog', 'aria-modal': 'true', 'aria-live': 'polite' });
  document.body.append(ov, spot, pop);
  TOUR = { kind, steps, i: 0, ov, spot, pop, target: null, busy: false };
  TOUR.place = () => tourPlace();
  TOUR.key = e => { if (!TOUR) return; if (e.key === 'Escape') { e.preventDefault(); tourEnd() } else if (e.key === 'ArrowRight' || e.key === 'Enter') { if (e.target.tagName === 'BUTTON' && e.key === 'Enter') return; e.preventDefault(); tourGo(1) } else if (e.key === 'ArrowLeft') { e.preventDefault(); tourGo(-1) } };
  document.addEventListener('keydown', TOUR.key, true); window.addEventListener('resize', TOUR.place); window.addEventListener('scroll', TOUR.place, true);
  tourShow(0);
}
function tourGo(d) { if (!TOUR) return; if (TOUR.busy) { TOUR.pending = d; return } const n = TOUR.i + d; if (n < 0) return; if (n >= TOUR.steps.length) return tourEnd(); tourShow(n) }
async function tourShow(i) {
  const T = TOUR; if (!T) return; T.busy = true; T.i = i; const s = T.steps[i];
  T.pop.classList.add('wait'); T.spot.style.opacity = '0';
  if (s.go && location.hash !== s.go) { location.hash = s.go; await new Promise(r => setTimeout(r, 120)) }
  else if (innerWidth <= 900 && !s.side) $('#app') && $('#app').classList.remove('open');
  let el = null; if (s.sel || s.txt || s.has) el = await tourWait(tourFind(s), 3200);
  if (!TOUR || TOUR.i !== i) return;
  if (s.side && innerWidth <= 900) { $('#app').classList.add('open'); await new Promise(r => setTimeout(r, 260)); el = tourFind(s)() || el }
  if (el) { el.scrollIntoView({ block: 'center', inline: 'nearest' }); await new Promise(r => setTimeout(r, 80)) }
  T.target = el; T.busy = false; T.pop.classList.remove('wait');
  if (T.pending) { const d = T.pending; T.pending = 0; return tourGo(d) } // a key pressed while this step was loading
  tourDraw(); tourPlace(); setTimeout(tourPlace, 500); setTimeout(tourPlace, 1600); // pages that load data finish a moment later
}
function tourDraw() {
  const T = TOUR, s = T.steps[T.i], n = T.steps.length, last = T.i === n - 1;
  const back = h('button', { class: 'btn out sm', disabled: T.i === 0 ? '' : null, on: { click: () => tourGo(-1) } }, 'Back');
  const next = h('button', { class: 'btn sm', on: { click: () => (last ? tourEnd() : tourGo(1)) } }, last ? 'Finish' : 'Next');
  const skip = h('button', { class: 'tour-skip', on: { click: () => tourEnd() } }, last ? 'Close' : 'Skip tour');
  const alt = s.alt ? h('button', { class: 'btn out sm', on: { click: () => startTour(s.alt[1]) } }, s.alt[0]) : null;
  const guide = s.end ? h('a', { class: 'btn out sm', href: '#/guide', on: { click: () => tourEnd() } }, ic('book', 14), 'Open the Guide') : null;
  T.pop.replaceChildren(h('div', { class: 'tour-prog' }, h('i', { style: 'width:' + Math.round((T.i + 1) / n * 100) + '%' })), h('div', { class: 'tour-step' }, 'Step ' + (T.i + 1) + ' of ' + n), h('h3', {}, s.title), h('p', {}, s.text),
    h('div', { class: 'tour-btns' }, skip, h('span', { style: 'flex:1' }), alt, guide, back, next));
  next.focus({ preventScroll: true });
}
function tourPlace() {
  const T = TOUR; if (!T) return; if (!T.busy && !(T.target && document.body.contains(T.target))) T.target = tourFind(T.steps[T.i])(); const el = T.target, pop = T.pop, vw = innerWidth, vh = innerHeight;
  const pw = Math.min(380, vw - 24); pop.style.width = pw + 'px';
  if (!el) { T.spot.style.opacity = '0'; T.ov.classList.add('solid'); pop.style.left = Math.max(12, (vw - pw) / 2) + 'px'; pop.style.top = Math.max(12, (vh - pop.offsetHeight) / 2) + 'px'; return }
  T.ov.classList.remove('solid'); const r = el.getBoundingClientRect(), pad = 8;
  let x = Math.max(4, r.left - pad), y = Math.max(4, r.top - pad), w = Math.min(vw - 8, r.right + pad) - x, hh = Math.min(vh - 8, r.bottom + pad) - y;
  Object.assign(T.spot.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: hh + 'px', opacity: '1' });
  const ph = pop.offsetHeight, gap = 14; let px, py;
  const below = y + hh + gap, above = y - gap - ph, right = x + w + gap, left = x - gap - pw;
  if (vw > 760 && right + pw <= vw - 8 && hh < vh * .9 && w < vw * .5) { px = right; py = Math.min(Math.max(8, y), vh - ph - 8) }
  else if (vw > 760 && left >= 8 && hh < vh * .9 && w < vw * .5) { px = left; py = Math.min(Math.max(8, y), vh - ph - 8) }
  else if (below + ph <= vh - 8) { px = Math.min(Math.max(8, x), vw - pw - 8); py = below }
  else if (above >= 8) { px = Math.min(Math.max(8, x), vw - pw - 8); py = above }
  else { px = Math.max(8, (vw - pw) / 2); py = (y + hh / 2 > vh / 2) ? 12 : vh - ph - 12 } // a very tall target: dock the card at the top or bottom of the screen
  pop.style.left = Math.round(px) + 'px'; pop.style.top = Math.round(py) + 'px';
}
