/* The assistant (chatbot) engine: it must find the right part of the guide for real questions, in plain English, Pidgin and with typing mistakes. */
const test = require('node:test'), assert = require('node:assert/strict'), vm = require('vm'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), ctx = vm.createContext({});
for (const f of ['public/guide-content.js', 'public/guide-qa.js', 'public/chat-engine.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const adm = require('../guide-admin.js'), P = vm.runInContext('GUIDE_PARTS', ctx), QA = vm.runInContext('GUIDE_QA', ctx), E = vm.runInContext('DVChat', ctx);
const pub = [P.start, P.why, P.customer, P.agent];
const idxPub = E.build(pub, QA, []), idxAdm = E.build([...pub, { ...adm, admin: true }], QA, adm.qa);
const sections = [...pub.flatMap(p => p.sections), ...adm.sections];

const GOLD = [ // [question, chapter it must come from]
  ['how do i fund my wallet', 'c-fund-bank'], ['how can I add money', 'c-fund-bank'], ['i want to deposit', 'c-fund-bank'], ['top up my account', 'c-fund-bank'],
  ['how do i pay with card', 'c-fund-paystack'], ['paystack fee', 'c-fund-paystack'], ['paystack not working', 'c-fund-paystack'],
  ['what is the minimum amount i can deposit', 'c-wallet'], ['maximum deposit', 'c-wallet'],
  ['I clicked download pdf twice will I be charged again', 'c-slip'], ['do i pay again if i download the slip again', 'c-slip'],
  ['i closed the page by mistake where is my result', 'c-results'], ['i closed the page wetin i go do', 'c-results'], ['how long are results kept', 'c-results'],
  ['how do i find my old result', 'c-results'], ['can i delete my result', 'c-results'],
  ['why is diebone better than other sites', 'w-better'], ['what makes you different from other websites', 'w-better'],
  ['money was deducted but i got no result', 'c-slip'], ['they debited me but nothing came out', 'c-slip'],
  ['will i be charged if no record found', 'w-better'], ['i tapped verify twice', 'w-better'],
  ['how do i create an account', 'c-account'], ['how to sign up', 'c-account'], ['how do i login', 'c-account'],
  ['i forgot my password', 'c-account'], ['how do i change my password', 'c-profile'],
  ['what is an invite code', 'c-account'], ['my account was suspended', 'c-account'],
  ['how do i become an agent', 'a-apply'], ['how to become agnet', 'a-apply'], ['how can i get agent price', 'a-apply'],
  ['what documents do i need for agent verification', 'a-apply'], ['my agent application was rejected', 'a-status'],
  ['does it cost to become an agent', 'a-apply'], ['what are the rules for agents', 'a-rules'],
  ['what is ipe clearance', 'c-agency'], ['what is nin validation', 'c-agency'], ['what is personalisation', 'c-agency'],
  ['how do i track my request', 'c-agency'], ['my request is pending for days', 'c-faq'],
  ['how do i verify a company', 'c-services'], ['how to check cac', 'c-services'], ['how do i check a tin', 'c-services'],
  ['check voters card', 'c-services'], ['how do i check a drivers licence', 'c-services'], ['plate number check', 'c-services'],
  ['verify account name', 'c-services'], ['address from meter number', 'c-services'],
  ['what do i need for a nin slip', 'c-services'], ['difference between premium and standard slip', 'c-run'],
  ['how do i contact support', 'c-support'], ['whatsapp number for help', 'c-support'],
  ['what is a wallet', 's-words'], ['what does bvn mean', 's-words'], ['what is scuml', 's-words'],
  ['how do i switch to dark mode', 's-layout'], ['how do i open the menu on phone', 's-layout'], ['what is the bell for', 's-layout'],
  ['how to hide my balance', 's-layout'], ['quick start', 's-quick'], ['how do i take the tour', 's-quick'],
  ['can i listen to the guide', 's-quick'], ['can i download the guide as pdf', 's-quick'],
  ['my bank transfer has not been credited', 'c-fund-bank'], ['what do the transfer statuses mean', 'c-fund-bank'], ['my receipt was rejected', 'c-faq'],
  ['what receipt can i upload', 'c-fund-bank'], ['how long does bank transfer take', 'c-fund-bank'],
  ['is this site safe', 'w-better'], ['is it legit or scam', 'w-better'], ['keep my account safe', 'c-safety'],
  ['not enough balance', 'c-faq'], ['this request is already being processed', 'c-faq'],
  ['why two prices', 's-words'], ['what is the difference between agent and customer', 'a-what'],
  ['transactions history', 'c-history'], ['what does charged then refunded mean', 'c-history'],
  ['do i need to be verified to use services', 's-welcome'], ['what is hot on the dashboard', 'c-dashboard'],
  /* admin */
  ['how do i set prices', 'ad-prices'], ['how is the automatic individual price worked out', 'ad-prices'], ['how do i approve a bank transfer', 'ad-transfers'],
  ['how to approve agent', 'ad-agents'], ['how do i make someone an agent', 'ad-users'], ['reset a users password', 'ad-users'], ['create invite code', 'ad-agents'],
  ['setup two step login', 'ad-login'], ['i lost my phone authenticator', 'ad-faq'], ['what should i do every day as admin', 'ad-routine'],
  ['customers say temporarily unavailable', 'ad-faq'], ['check provider connection', 'ad-overview'], ['paystack webhook', 'ad-paystack'],
  ['refund a stuck request', 'ad-requests'], ['what are saved results', 'ad-results'], ['stop new registrations', 'ad-agents'], ['suspend a user', 'ad-users']
];
test('the assistant finds the right chapter for ' + GOLD.length + ' real questions', () => {
  const bad = [];
  for (const [q, sec] of GOLD) { const r = sec.startsWith('ad-') ? E.ask(idxAdm, q, { admin: true }) : E.ask(idxPub, q); if (r.kind !== 'answer' || r.src.id !== sec) bad.push(q + ' -> ' + r.kind + ' ' + (r.src && r.src.id) + ' (wanted ' + sec + ')') }
  assert.deepEqual(bad, [], bad.join('\n'));
});
test('every ready question is answered by itself', () => {
  const bad = []; for (const e of QA) { const r = E.ask(idxPub, e[0]); if (r.kind !== 'answer' || r.src.id !== e[2]) bad.push(e[0] + ' -> ' + (r.src && r.src.id)) }
  assert.deepEqual(bad, [], bad.join('\n'));
  const badA = []; for (const e of adm.qa) { const r = E.ask(idxAdm, e[0], { admin: true }); if (r.kind !== 'answer' || r.src.id !== e[2]) badA.push(e[0] + ' -> ' + (r.src && r.src.id)) }
  assert.deepEqual(badA, [], badA.join('\n'));
});
test('every chapter can be found by its own title (assistant and guide search)', () => {
  const bad = [];
  for (const s of sections) {
    const i = s.id.startsWith('ad-') ? idxAdm : idxPub, r = E.ask(i, s.title, { admin: true }), top = E.searchSections(i, s.title).slice(0, 3).map(x => x.id);
    if (!(r.src && r.src.id === s.id) && !top.includes(s.id)) bad.push(s.title + ' -> ' + (r.src && r.src.id) + ' / ' + top.join(','));
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});
test('every problem in the quick-fix tables gets its fix', () => {
  const bad = [];
  for (const [id, part] of [['c-faq', P.customer], ['ad-faq', { sections: adm.sections }]]) {
    const sec = part.sections.find(s => s.id === id); const rows = sec.blocks.find(b => b[0] === 'table')[2];
    const alt = { '“No record found”': ['w-better'], 'I sent a bank transfer but it is not credited': ['c-fund-bank'], 'I forgot my password': ['c-account'], 'A customer says Paystack paid but wallet is empty': ['ad-paystack'], 'A request is stuck': ['ad-requests', 'c-faq'], 'A customer forgot the password': ['ad-users'], 'A customer lost a slip': ['ad-results'] }; // the same fix is also explained in a better-fitting chapter
    for (const r of rows) { const res = E.ask(id === 'ad-faq' ? idxAdm : idxPub, r[0].replace(/[“”]/g, ''), { admin: true }); if (res.kind !== 'answer' || res.src.id !== id && !(alt[r[0]] || []).includes(res.src.id) && !res.blocks.some(b => JSON.stringify(b).includes(r[1].slice(0, 25)))) bad.push(r[0] + ' -> ' + (res.src && res.src.id)) }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});
test('the assistant says it is not sure about things outside the site, and never shows admin chapters to customers', () => {
  for (const q of ['who is the president of nigeria', 'best jollof rice recipe', 'what is the weather in lagos', 'asdf qwer zxcv']) assert.equal(E.ask(idxPub, q).kind, 'low', q);
  const r = E.ask(idxAdm, 'how do i approve a bank transfer', { admin: true }); assert.equal(r.src.id, 'ad-transfers');
  const c = E.ask(idxPub, 'how do i approve a bank transfer'); assert.ok(!c.src || !c.src.id.startsWith('ad-'));
  const leak = E.searchSections(idxPub, 'approve agent invite codes reset password two-step').filter(x => x.id.startsWith('ad-')); assert.equal(leak.length, 0);
});
test('small talk and the guide search', () => {
  assert.equal(E.smalltalk('hello').kind, 'hello'); assert.equal(E.smalltalk('thank you').kind, 'thanks'); assert.equal(E.smalltalk('who are you').kind, 'who'); assert.equal(E.smalltalk('what can you do').kind, 'can');
  assert.equal(E.smalltalk('how do i fund my wallet'), null); assert.equal(E.smalltalk('hello how do i become an agent'), null);
  assert.equal(E.searchSections(idxPub, 'refnd')[0].id.length > 0, true);
  const top = E.searchSections(idxPub, 'wallet').slice(0, 4).map(x => x.id); assert.ok(top.includes('c-wallet'));
  assert.equal(E.searchSections(idxPub, 'zzzzqqq').length, 0);
});
