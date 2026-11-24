/* DEBONE Digital Hub: the assistant's brain (no libraries, no outside services, nothing leaves the browser).
   It reads the whole guide plus the ready answers in guide-qa.js, understands everyday wording, Nigerian Pidgin, typing mistakes
   and word variations, and picks the best answer. It also powers the search box in the guide.
   Pure logic only: no page code here, so it can be tested on its own. */
var DVChat = (function () {
  'use strict';
  const STOP = new Set(('a an the is are was were be been being am i me my mine we our you your yours it its of to in on at for with and or but if so do does did can could should would will shall may might have has had ' +
    'this that these those there here nigeria nigerian what whats wat wats wht hw take which who whom why how when where please pls plz abeg oga sir madam hello hi hey dear thanks thank just also as by from into out up not dont doesnt cant wont im ive id u ur ' +
    'then than too very really na dey wetin go abi sef oh ok okay yes tell about like want need let know i\'m it\'s what\'s don\'t can\'t').split(' '));

  /* words that mean the same thing for our purposes. The first word of each row is the one we keep. */
  const GROUPS = [
    ['fund', 'deposit', 'recharge', 'load', 'topup', 'credit', 'add'],
    ['wallet', 'balance', 'money', 'naira'],
    ['charge', 'pay', 'paid', 'payment', 'debit', 'deduct', 'bill'],
    ['price', 'fee', 'cost', 'rate', 'tariff', 'pricing'],
    ['refund', 'reverse', 'reversal', 'return'],
    ['slip', 'pdf', 'printout', 'print'],
    ['agent', 'reseller', 'cafe', 'pos'],
    ['signin', 'login'], ['signout', 'logout'],
    ['register', 'signup', 'join', 'create', 'registration'],
    ['password', 'passcode', 'pwd'],
    ['support', 'whatsapp', 'contact', 'helpline', 'complain', 'complaint', 'reach'],
    ['safe', 'secure', 'security', 'legit', 'genuine', 'trust', 'scam', 'fraud', 'fake', 'reliable', 'real', 'safety'],
    ['pending', 'process', 'processing', 'wait', 'waiting', 'delay', 'late', 'slow', 'stuck'],
    ['problem', 'error', 'fail', 'failure', 'issue', 'wahala', 'trouble', 'bug'],
    ['mistake', 'mistaken', 'wrong', 'typo', 'mistype'],
    ['lost', 'lose', 'close', 'vanish', 'disappear', 'gone', 'missing'],
    ['cac', 'company', 'rc', 'bn', 'corporate'],
    ['tax', 'tin', 'firs', 'tcc'],
    ['voter', 'pvc', 'voters'],
    ['licence', 'license', 'driver'],
    ['vehicle', 'car', 'plate', 'chassis'],
    ['meter', 'electricity', 'nepa', 'disco'],
    ['validation', 'validate'],
    ['personalisation', 'personalization', 'personalise', 'personalize'],
    ['enrolment', 'enrollment', 'enrol'],
    ['receipt', 'proof', 'screenshot'],
    ['delete', 'remove', 'erase'],
    ['suspend', 'ban', 'block', 'deactivate', 'disable'],
    ['invite', 'referral'],
    ['twofa', 'authenticator', 'totp'],
    ['admin', 'owner', 'boss'],
    ['individual', 'unverified', 'ordinary', 'personal'],
    ['cheap', 'cheaper', 'lower', 'discount', 'reduce'],
    ['nin', 'nimc'], ['phone', 'mobile', 'gsm', 'telephone'],
    ['dark', 'night', 'theme'],
    ['apply', 'application'],
    ['verify', 'verification', 'verified', 'buy', 'purchase'],
    ['guide', 'manual', 'tutorial', 'learn', 'teach', 'instruction'],
    ['tour', 'walkthrough', 'demo'],
    ['voice', 'audio', 'listen', 'speaker'],
    ['send', 'sent'], ['reference', 'ref'], ['bank', 'banks']
  ];
  const PHRASES = [
    [/\blog[\s-]?in\b/g, ' signin '], [/\bsign[\s-]?in\b/g, ' signin '], [/\b(log|sign)[\s-]?out\b/g, ' signout '],
    [/\bsign[\s-]?up\b/g, ' register '], [/\btop[\s-]?up\b/g, ' fund '], [/\bmoney back\b/g, ' refund '], [/\bhow much\b/g, ' price '],
    [/\btwo[\s-]?step\b/g, ' twofa '], [/\b2[\s-]?fa\b/g, ' twofa '], [/\bpay(ing|ed)? again\b/g, ' charge again '],
    [/\bpay (me )?twice\b/g, ' charge twice '], [/\bi go pay\b/g, ' charge '], [/\bdem don (collect|take)\b/g, ' debit '],
    [/\bno (de|dey) (work|show|come)\b/g, ' problem '], [/\bhow far\b/g, ' '], [/\bno fit\b/g, ' problem '], [/\bwetin be\b/g, ' ']
  ];

  /* ---- words: lowercase, remove endings, merge synonyms ---- */
  function stem(w) {
    if (w.length < 4) return w; let s = w;
    if (/ies$/.test(s) && s.length > 4) s = s.slice(0, -3) + 'y';
    else if (/(sses|xes|zes|ches|shes)$/.test(s)) s = s.slice(0, -2);
    else if (/ing$/.test(s) && s.length > 5) s = s.slice(0, -3);
    else if (/ed$/.test(s) && s.length > 4) { s = s.slice(0, -2); if (/i$/.test(s)) s = s.slice(0, -1) + 'y'; }
    else if (/s$/.test(s) && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);
    if (/(.)\1$/.test(s) && !/(ll|ss|zz)$/.test(s)) s = s.slice(0, -1);
    if (s.length > 3 && /e$/.test(s)) s = s.slice(0, -1);
    return s;
  }
  const SYN = Object.create(null), SYNKEYS = [];
  GROUPS.forEach(g => { const c = stem(g[0]); g.forEach(w => { const k = stem(w); if (!SYN[k]) { SYN[k] = c; SYNKEYS.push(k) } }) });
  const canon = w => SYN[w] || w;
  function norm(s) {
    let t = ' ' + String(s || '').toLowerCase().replace(/₦/g, ' naira ').replace(/[’']/g, '') + ' ';
    for (const [re, to] of PHRASES) t = t.replace(re, to);
    return t.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const STOPN = new Set([...STOP].map(w => w.replace(/[’']/g, '')));
  function rawWords(s) { return norm(s).split(' ').filter(Boolean) }
  function tokens(s) { return rawWords(s).filter(w => !STOPN.has(w)).map(w => canon(stem(w))) }

  /* ---- typing mistakes: find the nearest known word ---- */
  function dist(a, b, max) { // Damerau-Levenshtein, stops early
    const al = a.length, bl = b.length; if (Math.abs(al - bl) > max) return max + 1;
    let p2 = null, p1 = Array.from({ length: bl + 1 }, (_, j) => j);
    for (let i = 1; i <= al; i++) {
      const c = [i]; let lo = i;
      for (let j = 1; j <= bl; j++) {
        let v = Math.min(p1[j] + 1, c[j - 1] + 1, p1[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1);
        c[j] = v; if (v < lo) lo = v;
      }
      if (lo > max) return max + 1; p2 = p1; p1 = c;
    }
    return p1[bl];
  }

  /* ---- build the index from the guide chapters + ready answers ---- */
  function build(parts, qa, adminQa) {
    const docs = []; const secs = {};
    const add = d => { d.i = docs.length; docs.push(d); (secs[d.sec] = secs[d.sec] || { id: d.sec, title: d.secTitle, docs: [] }).docs.push(d) };
    for (const part of parts) for (const s of part.sections) {
      let hd = '';
      for (const b of s.blocks) {
        const k = b[0], base = { sec: s.id, secTitle: s.title, hd, admin: !!part.admin };
        if (k === 'h') { hd = b[1]; continue }
        if (k === 'dyn') continue;
        if (k === 'p') add({ ...base, type: 'p', title: s.title + ' ' + hd, body: b[1], text: b[1] });
        else if (k === 'tip' || k === 'warn' || k === 'good') add({ ...base, type: 'note', kind: k, title: s.title + ' ' + hd, body: b[1], text: b[1] });
        else if (k === 'steps') add({ ...base, type: 'steps', title: s.title + ' ' + hd, body: b[1].join(' '), items: b[1], lead: hd });
        else if (k === 'list') b[1].forEach(t => add({ ...base, type: 'li', title: s.title + ' ' + hd, body: t, text: t }));
        else if (k === 'table') { const head = b[1]; b[2].forEach(r => add({ ...base, type: 'row', title: s.title + ' ' + hd + ' ' + r[0] + ' ' + r[0], body: r.slice(1).join(' ') + ' ' + head.join(' '), row: r, head })) }
      }
    }
    const addQa = (list, admin) => (list || []).forEach(e => add({ sec: e[2], secTitle: '', hd: '', admin: !!admin, type: 'qa', q: e[0], title: e[0] + ' ' + e[0] + ' ' + (e[3] || ''), body: e[1], text: e[1], qa: true }));
    addQa(qa, false); addQa(adminQa, true);
    for (const d of docs) if (d.type === 'qa' && secs[d.sec]) d.secTitle = secs[d.sec].title;
    /* statistics */
    const vocab = Object.create(null), df = Object.create(null); let tot = 0;
    for (const d of docs) {
      const tt = tokens(d.title), bt = tokens(d.body), tf = Object.create(null);
      const wt = d.type === 'qa' ? 3 : d.type === 'row' ? 2.5 : 1.8;
      tt.forEach(w => tf[w] = (tf[w] || 0) + wt); bt.forEach(w => tf[w] = (tf[w] || 0) + 1);
      d.tf = tf; d.len = tt.length * 0.5 + bt.length + 4; tot += d.len;
      const uniq = Object.keys(tf); uniq.forEach(w => { df[w] = (df[w] || 0) + 1; vocab[w] = 1 });
      const seq = tt.concat(bt); d.bi = new Set(); for (let i = 1; i < seq.length; i++) d.bi.add(seq[i - 1] + ' ' + seq[i]);
    }
    const N = docs.length, idf = w => Math.log(1 + (N - (df[w] || 0) + 0.5) / ((df[w] || 0) + 0.5));
    const words = Object.keys(vocab);
    return { docs, secs, N, avg: tot / N, df, idf, vocab, words };
  }

  /* map each query word to a word the guide knows: exact, start-of-word, or a close spelling */
  function resolve(idx, w) {
    if (idx.vocab[w]) return w;
    if (w.length >= 3 && !/^\d+$/.test(w)) {
      const pre = idx.words.filter(x => x.length > w.length && x.startsWith(w)).sort((a, b) => (idx.df[b] || 0) - (idx.df[a] || 0));
      if (pre.length && w.length >= 4) return pre[0];
    }
    if (w.length >= 4 && !/^\d+$/.test(w)) {
      const max = w.length <= 7 ? 1 : 2; let best = null, bd = max + 1, bdf = -1;
      for (const x of idx.words) { const d = dist(w, x, max); if (d < bd || (d === bd && (idx.df[x] || 0) > bdf)) { best = x; bd = d; bdf = idx.df[x] || 0 } }
      for (const x of SYNKEYS) { const d = dist(w, x, max); if (d < bd) { best = canon(x); bd = d; bdf = 0 } }
      if (best && bd <= max) return best;
    }
    return null;
  }
  function queryTokens(idx, q) {
    const out = [], unknown = [];
    for (const w of tokens(q)) { const r = resolve(idx, w); if (r) out.push(r); else unknown.push(w) }
    return { toks: [...new Set(out)], all: out, unknown };
  }
  const K1 = 1.4, B = 0.72;
  function scoreDocs(idx, qt) {
    const res = [];
    const qb = []; for (let i = 1; i < qt.all.length; i++) qb.push(qt.all[i - 1] + ' ' + qt.all[i]);
    let totalIdf = qt.toks.reduce((a, w) => a + idx.idf(w), 0) + qt.unknown.length * idx.idf('x_unknown_') * 0.55;
    for (const d of idx.docs) {
      let sc = 0, hit = 0;
      for (const w of qt.toks) { const tf = d.tf[w]; if (!tf) continue; const i = idx.idf(w); sc += i * (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * d.len / idx.avg)); hit += i }
      if (!sc) continue;
      for (const b of qb) if (d.bi.has(b)) sc += 1.1;
      if (d.type === 'qa') sc *= 1.25;
      res.push({ d, sc, cov: totalIdf ? hit / totalIdf : 0 });
    }
    return res.sort((a, b) => b.sc - a.sc);
  }

  /* ---- search for the guide's search box: chapters in order of how well they match ---- */
  function searchSections(idx, q, allowed) {
    const qt = queryTokens(idx, q); if (!qt.toks.length) return [];
    const by = {};
    for (const r of scoreDocs(idx, qt)) { const s = r.d.sec; if (allowed && !allowed.has(s)) continue; (by[s] = by[s] || []).push(r.sc) }
    const list = Object.entries(by).map(([id, a]) => ({ id, score: a[0] + 0.25 * (a[1] || 0) + 0.1 * (a[2] || 0) })).sort((a, b) => b.score - a.score);
    if (!list.length) return [];
    return list.filter(x => x.score >= list[0].score * 0.3).slice(0, 12);
  }
  const hiWords = (idx, q) => { const raw = rawWords(q).filter(w => !STOPN.has(w) && w.length >= 3 && !/^\d+$/.test(w)), fix = idx ? queryTokens(idx, q).toks.filter(w => w.length >= 4) : []; return [...new Set(raw.concat(fix))].slice(0, 10) };

  /* ---- small talk ---- */
  function smalltalk(q) {
    const t = norm(q), n = t.split(' ').filter(Boolean).length, core = tokens(q).length;
    if (!t) return null;
    if (n <= 7 && /^(hi|hello|hey|hiya|howdy|yo|sup|good (morning|afternoon|evening|day)|greetings|salam|how are you|how you dey|wetin dey happen|whats up)\b/.test(t) && !tokens(t.replace(/^(hi|hello|hey|hiya|howdy|yo|sup|good (morning|afternoon|evening|day)|greetings|salam|how are you|how you dey|wetin dey happen|whats up)\b/, '')).length) return { kind: 'hello' };
    if (n <= 8 && /\b(thank|thanks|thx|appreciate|nice one|well done|great job|you are good|god bless)\b/.test(t) && core <= 2) return { kind: 'thanks' };
    if (n <= 4 && /^(bye|goodbye|see you|later|cheers|ok bye|that is all|thats all)\b/.test(t)) return { kind: 'bye' };
    if (/\b(who|what) are you\b|\byour name\b|\bare you (a )?(bot|robot|human|real|person|ai)\b|\bwho (made|built|created) you\b/.test(t)) return { kind: 'who' };
    if (/\bwhat can you (do|help)|\bhow can you help|\bwhat do you know|\bwhat can i ask|^help$|^help me$|^menu$|^options$/.test(t)) return { kind: 'can' };
    if (n <= 3 && /^(ok|okay|alright|fine|cool|nice|great|good|yes|no|oh|hmm|k)$/.test(t)) return { kind: 'ack' };
    return null;
  }

  /* ---- answer a question from the guide ---- */
  function show(d) { // turn one piece of the guide into something to show
    if (d.type === 'steps') return { t: 'steps', lead: d.lead, items: d.items };
    if (d.type === 'row') { const r = d.row, hd = d.head; return { t: 'p', text: hd.length === 2 ? '**' + r[0] + '**\n' + r[1] : r.map((c, i) => i ? hd[i] + ': ' + c : '**' + c + '**').join('\n') } }
    if (d.type === 'note') return { t: 'note', kind: d.kind, text: d.text };
    return { t: 'p', text: d.text };
  }
  function ask(idx, q, opt) {
    opt = opt || {}; const qt = queryTokens(idx, q), allow = d => opt.admin || !d.admin;
    if (!qt.toks.length) return { kind: 'low', blocks: [], related: [], conf: 0 };
    const def = /^\s*(wh?at'?s?|wats?)\s+(is|are|does|means?)\b|\bmeaning of\b|\bdefine\b/i.test(q);
    const rank = scoreDocs(idx, qt).filter(r => allow(r.d));
    if (def) { for (const r of rank) if (r.d.type === 'qa' && /^what (is|are|does)\b/i.test(r.d.q)) r.sc *= 1.35; rank.sort((a, b) => b.sc - a.sc) }
    if (!rank.length) return { kind: 'low', blocks: [], related: [], conf: 0 };
    const top = rank[0], conf = top.sc, cov = top.cov;
    const ok = conf >= 2.0 && cov >= 0.55 || conf >= 12 && cov >= 0.4;
    /* suggestions: other good questions or chapters, one per chapter */
    const seen = new Set([top.d.sec]), related = [];
    for (const r of rank.slice(1, 40)) { if (seen.has(r.d.sec) || r.sc < top.sc * 0.3) continue; seen.add(r.d.sec); related.push(r.d.type === 'qa' ? { label: r.d.q, q: r.d.q } : { label: r.d.secTitle, q: r.d.secTitle }); if (related.length >= 3) break }
    const src = top.d.sec ? { id: top.d.sec, title: top.d.secTitle } : null;
    if (!ok) return { kind: 'low', blocks: [], related, conf, cov, src };
    const blocks = [];
    if (top.d.type === 'qa') {
      blocks.push({ t: 'p', text: top.d.text });
    } else {
      const same = rank.filter(r => r.d.sec === top.d.sec && r.sc >= top.sc * 0.62).slice(0, 5).sort((a, b) => a.d.i - b.d.i);
      const items = same.filter(r => r.d.type === 'li');
      if (top.d.type === 'li' || items.length > 1) { if (top.d.hd) blocks.push({ t: 'p', text: '**' + top.d.hd + '**' }); blocks.push({ t: 'list', items: (items.length ? items : [top]).map(r => r.d.text) }); same.filter(r => r.d.type !== 'li' && r.d.type !== 'steps').slice(0, 1).forEach(r => blocks.push(show(r.d))); }
      else same.slice(0, top.d.type === 'steps' ? 2 : 3).forEach(r => blocks.push(show(r.d)));
    }
    return { kind: 'answer', blocks, src, related, conf, cov, qa: top.d.type === 'qa', docId: top.d.i };
  }

  return { build, ask, searchSections, hiWords, tokens, stem, norm, smalltalk, queryTokens, scoreDocs, resolve };
})();
if (typeof module !== 'undefined') module.exports = DVChat;
