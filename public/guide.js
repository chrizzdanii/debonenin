/* DEBONE Digital Hub: Guide Centre (read, search, listen, download PDF) and My Results.
   Loaded BEFORE app.js. It only uses helpers from app.js (h, ic, api, N, fmt, modal, toast, crumb, titleRow, emptyBox, resultCard, ME, SV ...)
   at the moment a page is opened, so the load order is safe. */
'use strict';

/* ---------- extra icons (added once, at start-up, because app.js defines the icon set after this file loads) ---------- */
function guideInit() { if (guideInit.done) return; guideInit.done = 1; Object.assign(I, {
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7M8 11h7"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1"/>',
  speaker: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>'
}); if (typeof chatInit === 'function') chatInit(); }
const lsGet = k => { try { return localStorage.getItem(k) } catch { return null } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v) } catch {} };

/* ---------- the guide model ---------- */
const GUIDE_TABS = () => [
  ['full', 'Full guide', 'Everything in one place'],
  ['customer', 'For customers', 'Start here, why DEBONE, using the site'],
  ['agent', 'For agents', 'Becoming and being a verified agent'],
  ...(ME && ME.admin ? [['admin', 'For admin', 'Running the whole site']] : [])];
let GADMIN = null, G = { tab: 'full', q: '', units: [], secs: [] };
async function loadAdminPart() { if (GADMIN || !(ME && ME.admin)) return GADMIN; const r = await api('guide/admin'); if (r.ok) GADMIN = r.part; return GADMIN; }
function partsFor(tab) {
  const P = GUIDE_PARTS, a = GADMIN;
  const list = tab === 'customer' ? [P.start, P.why, P.customer] : tab === 'agent' ? [P.agent] : tab === 'admin' ? [a] : [P.start, P.why, P.customer, P.agent, a];
  return list.filter(Boolean);
}
/* live blocks: prices and the viewer's own status are never typed by hand, so they cannot go out of date */
function resolveBlock(b) {
  if (b[0] !== 'dyn') return [b];
  const act = Object.values(SV).filter(s => s.active);
  if (b[1] === 'services') return [['table', ['Service', 'Group', 'What you type', 'Agent price', 'Individual price'], act.map(s => [s.label, s.group, Object.entries(s.fields).map(([k, l]) => l + ((s.optional || []).includes(k) && !/optional/i.test(l) ? ' (optional)' : '')).join(', '), N(s.agentPrice), N(s.indPrice)])]];
  if (b[1] === 'savings') return [['table', ['Service', 'Individual price', 'Agent price', 'You save per check'], act.filter(s => s.indPrice > s.agentPrice).map(s => [s.label, N(s.indPrice), N(s.agentPrice), N(s.indPrice - s.agentPrice)])]];
  if (b[1] === 'myprice') return [ME.admin ? ['tip', 'You are signed in as the admin, so you pay the provider price with no markup.'] : ME.agent ? ['good', 'You are a verified agent. You already pay the lower agent price on every service.'] : ['tip', 'You are not a verified agent yet, so you pay the individual price. Apply under Agent Verification to pay the lower agent price.']];
  return [];
}
const secBlocks = s => s.blocks.flatMap(resolveBlock);

/* **bold** helper */
const rich = t => String(t).split('**').map((x, i) => i % 2 ? h('b', {}, x) : x);
const plain = t => String(t).replace(/\*\*/g, '');

/* ---------- text for the voice: pronounce things the way people say them ---------- */
const SPELL = ['NIN', 'VNIN', 'BVN', 'CAC', 'TIN', 'TCC', 'SCUML', 'IPE', 'PDF', 'RC', 'BN', 'LGA', 'PVC', 'VIN', 'USSD', 'OTP', 'ID', 'API', 'POS', 'IT', 'LP', 'LLP', 'SIM'];
function speechText(s) {
  let t = plain(s);
  t = t.replace(/₦\s?([\d,]+(?:\.\d+)?)/g, '$1 naira').replace(/₦/g, 'naira ');
  t = t.replace(/\b(DT|DV)-[A-Z0-9]{4,}\b/g, 'your code').replace(/\b0\d{10}\b/g, m => m.split('').join(' ')).replace(/\+234/g, 'plus two three four');
  t = t.replace(/V\.NIN/g, 'V N I N').replace(/Ctrl and K/g, 'Control and K').replace(/\bDD-MM-YYYY\b/g, 'day month year');
  t = t.replace(new RegExp('\\b(' + SPELL.join('|') + ')\\b', 'g'), m => m.split('').join(' '));
  t = t.replace(/\bDEBONE\b/g, 'Debone').replace(/\s*[••]\s*/g, '. ').replace(/\s+/g, ' ');
  return t.trim();
}
function chunkText(t, max = 190) { // short pieces: long ones get cut off by some browsers
  const out = []; const sent = t.match(/[^.!?;:]+[.!?;:]*\s*/g) || [t]; let cur = '';
  for (let s of sent) {
    while (s.length > max) { let k = s.lastIndexOf(' ', max); if (k < 40) k = max; if (cur) { out.push(cur); cur = '' } out.push(s.slice(0, k)); s = s.slice(k).trim(); }
    if ((cur + s).length > max) { out.push(cur); cur = s } else cur += s;
  }
  if (cur.trim()) out.push(cur); return out.map(x => x.trim()).filter(Boolean);
}

/* ---------- voice: reads the guide on screen, section by section, until the person stops it ---------- */
const TTS = { ok: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window, state: 'idle', i: 0, tok: 0, rate: Number(lsGet('dv_rate')) || 1, voiceName: lsGet('dv_voice') || '', ui: null };
function ttsVoices() { try { return speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) } catch { return [] } }
function ttsPick() {
  const vs = ttsVoices(); if (!vs.length) return null;
  return vs.find(v => v.name === TTS.voiceName) || ['en-NG', 'en-GB', 'en-ZA', 'en-US'].map(l => vs.find(v => v.lang.replace('_', '-') === l)).find(Boolean) || vs[0];
}
function ttsPaint() {
  const u = TTS.ui; if (!u) return;
  const bar = document.querySelector('.gbar'); if (bar) bar.classList.toggle('reading', TTS.state !== 'idle'); // on a phone the toolbar stays on screen only while reading, so Stop is always reachable
  u.play.classList.toggle('hide', TTS.state === 'playing'); u.pause.classList.toggle('hide', TTS.state !== 'playing'); u.stop.classList.toggle('hide', TTS.state === 'idle');
  u.play.lastChild.textContent = TTS.state === 'paused' ? 'Resume' : 'Listen';
  u.stat.textContent = TTS.state === 'playing' ? 'Reading: ' + ((G.units[TTS.i] || {}).sec || '') : TTS.state === 'paused' ? 'Paused. Press Resume to carry on.' : '';
}
function ttsMark(i) {
  document.querySelectorAll('.speaking').forEach(e => e.classList.remove('speaking'));
  const u = G.units[i]; if (!u) return; u.el.classList.add('speaking');
  const r = u.el.getBoundingClientRect(); if (r.top < 120 || r.bottom > innerHeight - 40) u.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function ttsSay(i) {
  const my = ++TTS.tok; TTS.i = i;
  if (i >= G.units.length) { ttsStop(); toast('Finished reading.'); return }
  ttsMark(i); ttsPaint();
  const chunks = chunkText(speechText(G.units[i].text)); let k = 0;
  const next = () => {
    if (my !== TTS.tok) return;
    if (k >= chunks.length) return ttsSay(i + 1);
    const u = new SpeechSynthesisUtterance(chunks[k++]); const v = ttsPick();
    if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'en-GB';
    u.rate = TTS.rate; u.onend = next; u.onerror = e => { if (my === TTS.tok && e.error !== 'interrupted' && e.error !== 'canceled') next() };
    speechSynthesis.speak(u);
  };
  try { speechSynthesis.cancel() } catch {} setTimeout(next, 60);
}
function ttsStart(from) {
  if (!TTS.ok) return toast('This browser cannot read aloud. Try Google Chrome.');
  if (!G.units.length) return toast('Nothing to read here.');
  TTS.state = 'playing'; ttsSay(from || 0);
}
function ttsPause() { if (TTS.state !== 'playing') return; TTS.tok++; try { speechSynthesis.cancel() } catch {} TTS.state = 'paused'; ttsPaint(); } // stop now, remember where we were
function ttsResume() { TTS.state = 'playing'; ttsSay(TTS.i); }
function ttsStop() { TTS.tok++; try { speechSynthesis.cancel() } catch {} TTS.state = 'idle'; document.querySelectorAll('.speaking').forEach(e => e.classList.remove('speaking')); ttsPaint(); }
window.addEventListener('hashchange', () => { if (curView() !== 'guide' && TTS.state !== 'idle') ttsStop() });
window.addEventListener('beforeunload', () => { try { speechSynthesis.cancel() } catch {} });

/* ---------- PDF: a small writer built in, so it works offline and needs no outside library ---------- */
const PDFW = {
  reg: [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],
  bold: [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584]
};
const pdfAscii = s => String(s).replace(/\*\*/g, '').replace(/₦/g, 'N').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...').replace(/→/g, '->').replace(/×/g, 'x').replace(/[•·]/g, '-').replace(/[  ]/g, ' ').replace(/[^\x20-\x7e]/g, '');
const pdfEsc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const tw = (s, b, size) => { const t = b ? PDFW.bold : PDFW.reg; let w = 0; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i) - 32; w += (c >= 0 && c < 95 ? t[c] : 556) } return w * size / 1000; };
const C = { pur: [.357, .129, .714], pl: [.941, .914, .992], txt: [.106, .082, .188], mut: [.435, .408, .533], ok: [.055, .624, .431], okl: [.89, .965, .933], er: [.863, .204, .278], erl: [.992, .918, .925], yl: [1, .957, .839], yt: [.631, .384, .027], ln: [.88, .86, .93], wh: [1, 1, 1] };
const rg = c => c.map(x => +x.toFixed(3)).join(' ');
function pdfRuns(text) { return String(text).split('**').map((t, i) => ({ t: pdfAscii(t), b: i % 2 === 1 })).filter(r => r.t) }
function pdfWrap(runs, size, maxW, boldAll) { // greedy word wrap, keeps bold runs
  const lines = []; let line = [], w = 0, pend = false;
  const push = (t, b) => { const L = line[line.length - 1]; if (L && L.b === b) L.t += t; else line.push({ t, b }) };
  const flush = () => { if (line.length) { line[line.length - 1].t = line[line.length - 1].t.replace(/\s+$/, ''); lines.push(line) } line = []; w = 0; pend = false };
  for (const r of runs) { const b = boldAll || r.b;
    for (const tok of r.t.split(/(\s+)/)) { if (!tok) continue; if (/^\s+$/.test(tok)) { pend = line.length > 0; continue }
      let word = tok; const sp = pend ? tw(' ', b, size) : 0;
      while (tw(word, b, size) > maxW) { let k = word.length - 1; while (k > 1 && tw(word.slice(0, k), b, size) > maxW) k--; if (line.length) flush(); push(word.slice(0, k), b); flush(); word = word.slice(k) }
      const ww = tw(word, b, size);
      if (line.length && w + sp + ww > maxW) { flush(); push(word, b); w = ww } else { push((pend ? ' ' : '') + word, b); w += sp + ww }
      pend = false } }
  flush(); return lines;
}
function buildPdf(title, parts) {
  const PW = 595.28, PH = 841.89, M = 50, CW = PW - 2 * M, BOT = 56;
  const pages = []; let ops, y;
  const newPage = () => { ops = []; pages.push(ops); y = PH - 60; return pages.length - 1 };
  const rect = (x, yy, w, hh, c) => ops.push(rg(c) + ' rg ' + [x, yy, w, hh].map(v => +v.toFixed(2)).join(' ') + ' re f');
  const text = (x, yy, runs, size, c, boldAll) => { let cx = x; ops.push(rg(c) + ' rg'); for (const r of runs) { const b = boldAll || r.b; ops.push('BT /F' + (b ? 2 : 1) + ' ' + size + ' Tf ' + (+cx.toFixed(2)) + ' ' + (+yy.toFixed(2)) + ' Td (' + pdfEsc(r.t) + ') Tj ET'); cx += tw(r.t, b, size) } };
  const lineOf = (x1, y1, x2, y2, c) => ops.push(rg(c) + ' RG 0.6 w ' + [x1, y1, x2, y2].map(v => +v.toFixed(2)).join(' ').replace(/^(\S+) (\S+) (\S+) (\S+)$/, '$1 $2 m $3 $4 l S'));
  const need = hh => { if (y - hh < BOT) newPage() };
  const para = (runs, size, lead, x, w, c, boldAll) => { for (const ln of pdfWrap(runs, size, w, boldAll)) { need(lead); y -= lead; text(x, y, ln, size, c, boldAll) } };
  const flat = []; // table of contents entries
  newPage(); // 0: cover
  const secCount = parts.reduce((n, p) => n + p.sections.length + 1, 0), tocPages = Math.max(1, Math.ceil(secCount / 36));
  for (let i = 0; i < tocPages; i++) newPage();
  for (const part of parts) {
    newPage(); rect(0, PH - 150, PW, 150, C.pur); text(M, PH - 78, [{ t: 'PART', b: true }], 10, [.85, .8, 1]); text(M, PH - 112, pdfRuns(part.title), 26, C.wh, true); y = PH - 190;
    flat.push({ part: true, t: part.title, p: pages.length });
    for (const sec of part.sections) {
      need(110); y -= 10; const top = y; flat.push({ t: sec.title, p: pages.length });
      const hl = pdfWrap(pdfRuns(sec.title), 15, CW - 14, true), hh = hl.length * 19 + 8; rect(M, y - hh, 4, hh, C.pur);
      let yy = y; for (const l of hl) { yy -= 19; text(M + 14, yy + 2, l, 15, C.pur, true) } y = top - hh - 8;
      for (const b of secBlocks(sec)) {
        const k = b[0];
        if (k === 'p') { para(pdfRuns(b[1]), 10, 14.5, M, CW, C.txt); y -= 6 }
        else if (k === 'h') { need(44); y -= 8; para(pdfRuns(b[1]), 11.5, 15, M, CW, C.pur, true); y -= 3 }
        else if (k === 'list') { for (const it of b[1]) { const L = pdfWrap(pdfRuns(it), 10, CW - 20); need(L.length * 14.5 + 2); let first = true; for (const ln of L) { y -= 14.5; if (first) { rect(M + 5, y + 3.2, 3.2, 3.2, C.pur); first = false } text(M + 16, y, ln, 10, C.txt) } y -= 2.5 } y -= 5 }
        else if (k === 'steps') { b[1].forEach((it, n) => { const L = pdfWrap(pdfRuns(it), 10, CW - 28); need(Math.max(L.length * 14.5, 16) + 3); const sy = y; L.forEach((ln, j) => { y -= 14.5; text(M + 26, y, ln, 10, C.txt) }); rect(M, sy - 17.8, 16, 15, C.pur); const num = String(n + 1); text(M + 8 - tw(num, true, 8.5) / 2, sy - 13.6, [{ t: num, b: true }], 8.5, C.wh); y -= 3.5 }); y -= 5 }
        else if (k === 'tip' || k === 'warn' || k === 'good') {
          const bg = k === 'warn' ? C.yl : k === 'good' ? C.okl : C.pl, fg = k === 'warn' ? C.yt : k === 'good' ? C.ok : C.pur, lab = k === 'warn' ? 'Important' : k === 'good' ? 'Good to know' : 'Tip';
          const L = pdfWrap(pdfRuns(b[1]), 9.8, CW - 28), bh = L.length * 13.8 + 28; need(bh + 8); y -= 4; rect(M, y - bh, CW, bh, bg); rect(M, y - bh, 3.5, bh, fg);
          text(M + 14, y - 15, [{ t: lab, b: true }], 9.5, fg, true); let ly = y - 15; for (const ln of L) { ly -= 13.8; text(M + 14, ly - 0, ln, 9.8, C.txt) } y -= bh + 10 }
        else if (k === 'table') {
          const head = b[1], rows = b[2], n = head.length;
          const wts = head.map((_, c) => Math.min(Math.max(Math.sqrt(Math.max(String(head[c]).length, ...rows.map(r => pdfAscii(r[c]).length)) + 4), 4.2), 11));
          const sum = wts.reduce((a, z) => a + z, 0), cw = wts.map(z => z / sum * CW), pad = 5, fs = 8.8, lead = 11.6, b0 = n > 1 && rows.length && rows.reduce((a, r) => a + pdfAscii(r[0]).length, 0) / rows.length <= 38; // a short first column is shown in bold
          const drawHead = () => { const L = head.map((x, c) => pdfWrap(pdfRuns(x), fs, cw[c] - 2 * pad, true)), rh = Math.max(...L.map(l => l.length)) * lead + 2 * pad; need(rh + 30); rect(M, y - rh, CW, rh, C.pur); let x = M; L.forEach((ls, c) => { let yy = y - pad; for (const l of ls) { yy -= lead; text(x + pad, yy + 2.6, l, fs, C.wh, true) } x += cw[c] }); y -= rh };
          drawHead(); y -= 0;
          rows.forEach((r, ri) => {
            const L = r.map((x, c) => pdfWrap(pdfRuns(x), fs, cw[c] - 2 * pad, c === 0 && b0)), rh = Math.max(...L.map(l => l.length)) * lead + 2 * pad;
            if (y - rh < BOT) { newPage(); drawHead() }
            if (ri % 2) rect(M, y - rh, CW, rh, [.975, .968, .995]);
            let x = M; L.forEach((ls, c) => { let yy = y - pad; for (const l of ls) { yy -= lead; text(x + pad, yy + 2.6, l, fs, C.txt, c === 0 && b0) } x += cw[c] });
            lineOf(M, y - rh, M + CW, y - rh, C.ln); y -= rh });
          y -= 12 }
      }
      y -= 8;
    }
  }
  /* cover page */
  ops = pages[0]; y = PH; rect(0, PH - 330, PW, 330, C.pur); rect(0, PH - 336, PW, 6, [.55, .36, .95]);
  text(M, PH - 120, [{ t: 'DEBONE', b: true }], 15, [.85, .8, 1], true); text(M, PH - 168, [{ t: 'Digital Hub', b: true }], 38, C.wh, true);
  text(M, PH - 215, [{ t: 'User Guide', b: true }], 24, C.wh, true); text(M, PH - 250, pdfRuns(title), 13, [.9, .86, 1]);
  const when = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  y = PH - 400; para(pdfRuns('How to use every part of the website, in plain words. Check, fund, download and get help. Customers, agents and the admin.'), 12, 18, M, CW - 60, C.txt);
  y -= 20; para(pdfRuns('**Prices in this guide are the prices on the site on ' + when + '.** They can change. The site always shows the true price before you press a button.'), 10, 15, M, CW - 60, C.mut);
  y -= 10; para(pdfRuns('Pay once per check. Download your slip as many times as you like. Find your result again for 30 days.'), 10, 15, M, CW - 60, C.ok, true);
  /* contents pages */
  const per = Math.ceil(flat.length / tocPages);
  for (let t = 0; t < tocPages; t++) { ops = pages[1 + t]; y = PH - 60; if (!t) { text(M, y - 10, [{ t: 'Contents', b: true }], 22, C.pur, true); y -= 44 }
    for (const e of flat.slice(t * per, (t + 1) * per)) { y -= e.part ? 24 : 17.5; const num = String(e.p);
      if (e.part) { text(M, y, pdfRuns(e.t), 11.5, C.pur, true) } else text(M + 14, y, pdfRuns(e.t), 10, C.txt);
      text(PW - M - tw(num, false, 10), y, [{ t: num, b: false }], 10, C.mut); if (!e.part) { const x1 = M + 18 + tw(pdfAscii(e.t), false, 10), x2 = PW - M - tw(num, false, 10) - 6; if (x2 > x1) lineOf(x1, y + 3, x2, y + 3, C.ln) } } }
  /* footers */
  pages.forEach((p, i) => { if (!i) return; ops = p; lineOf(M, 40, PW - M, 40, C.ln); text(M, 26, [{ t: 'DEBONE Digital Hub - User Guide', b: false }], 8, C.mut); const s = 'Page ' + (i + 1) + ' of ' + pages.length; text(PW - M - tw(s, false, 8), 26, [{ t: s, b: false }], 8, C.mut) });
  /* assemble the file */
  const objs = []; const add = s => objs.push(s) && objs.length;
  add('<< /Type /Catalog /Pages 2 0 R >>'); add(''); add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach(p => { const body = p.join('\n'); const cid = objs.length + 2; kids.push(objs.length + 1); add('<< /Type /Page /Parent 2 0 R /Contents ' + cid + ' 0 R >>'); add('<< /Length ' + body.length + ' >>\nstream\n' + body + '\nendstream') });
  objs[1] = '<< /Type /Pages /Kids [' + kids.map(k => k + ' 0 R').join(' ') + '] /Count ' + kids.length + ' /MediaBox [0 0 ' + PW + ' ' + PH + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>';
  const info = add('<< /Title (' + pdfEsc(pdfAscii('DEBONE Digital Hub - User Guide')) + ') /Producer (DEBONE Digital Hub) >>');
  let out = '%PDF-1.4\n'; const off = []; objs.forEach((o, i) => { off.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n' });
  const x = out.length; out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + off.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R /Info ' + info + ' 0 R >>\nstartxref\n' + x + '\n%%EOF';
  const u = new Uint8Array(out.length); for (let i = 0; i < out.length; i++) u[i] = out.charCodeAt(i) & 255; return u;
}
function saveBlob(u8, name, type) { const a = h('a', { href: URL.createObjectURL(new Blob([u8], { type })), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 4000) }
function downloadB64Pdf(b64, name) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); saveBlob(u, name, 'application/pdf') }

/* ---------- the Guide page ---------- */
function renderBlock(b, push) {
  const k = b[0];
  if (k === 'p') { const e = h('p', { class: 'gp' }, rich(b[1])); push(e, b[1]); return e }
  if (k === 'h') { const e = h('h4', { class: 'gh' }, b[1]); push(e, b[1]); return e }
  if (k === 'list') return h('ul', { class: 'gl' }, b[1].map(t => { const li = h('li', {}, rich(t)); push(li, t); return li }));
  if (k === 'steps') return h('ol', { class: 'gst' }, b[1].map((t, n) => { const li = h('li', {}, h('span', { class: 'n' }, String(n + 1)), h('div', {}, rich(t))); push(li, 'Step ' + (n + 1) + '. ' + t); return li }));
  if (k === 'tip' || k === 'warn' || k === 'good') { const lab = k === 'warn' ? 'Important' : k === 'good' ? 'Good to know' : 'Tip'; const e = h('div', { class: 'gc ' + k }, h('b', {}, lab), h('div', {}, rich(b[1]))); push(e, lab + '. ' + b[1]); return e }
  if (k === 'table') { const [, head, rows] = b, t = h('table', { class: 'tbl gt' }, h('tr', {}, head.map(x => h('th', {}, x))));
    rows.forEach(r => { const tr = h('tr', {}, r.map((c, i) => h(i ? 'td' : 'th', { class: i ? '' : 'rh', 'data-l': head[i] }, rich(c)))); t.append(tr); push(tr, head.length > 2 ? r.map((c, i) => head[i] + ': ' + c).join('. ') : r.join('. ')) });
    return h('div', { class: 'ov gtw' }, t) }
  return h('span');
}
function buildGuideBody(tab, q) {
  const body = h('div', { class: 'gbody' }), units = [], toc = []; const ql = q.trim();
  let order = null, plist = partsFor(tab);
  if (ql) { const allowed = new Set(plist.flatMap(p => p.sections.map(s => s.id))); order = new Map(DVChat.searchSections(chatIndex(), ql, allowed).map((x, n) => [x.id, n]));
    const best = p => Math.min(99, ...p.sections.filter(s => order.has(s.id)).map(s => order.get(s.id))); plist = plist.filter(p => p.sections.some(s => order.has(s.id))).sort((a, b) => best(a) - best(b));
    const nOk = order.size; body.append(h('div', { class: 'gsr' }, h('b', {}, nOk ? nOk + (nOk === 1 ? ' chapter matches “' : ' chapters match “') + ql + '”, best first' : 'Nothing in the guide matches “' + ql + '”'), h('button', { class: 'btn sm', on: { click: () => chatOpen(ql) } }, ic('spark', 14), 'Ask the assistant instead'))) }
  for (const part of plist) {
    const secs = ql ? part.sections.filter(s => order.has(s.id)).sort((a, b) => order.get(a.id) - order.get(b.id)) : part.sections;
    if (!secs.length) continue;
    body.append(h('div', { class: 'gpart' }, h('span', {}, 'PART'), h('b', {}, part.title))); toc.push({ part: true, t: part.title });
    for (const s of secs) {
      const id = 'g-' + s.id, card = h('section', { class: 'cd pad gsec', id });
      const hd = h('div', { class: 'gsh' }, h('h2', {}, s.title)); card.append(hd);
      const here = units.length; const rd = h('button', { class: 'gread', 'aria-label': 'Read from here: ' + s.title, title: 'Read aloud from here', on: { click: () => { if (!TTS.ok) return toast('This browser cannot read aloud. Try Google Chrome.'); G.units = units; ttsStart(here) } } }, ic('speaker', 15)); hd.append(rd);
      const push = (el, text) => units.push({ el, text, sec: s.title }); units.push({ el: hd, text: s.title + '.', sec: s.title });
      secBlocks(s).forEach(b => card.append(renderBlock(b, push))); body.append(card); toc.push({ t: s.title, id });
    }
  }
  if (ql && toc.length) hilite(body, DVChat.hiWords(chatIndex(), ql));
  if (!toc.length) body.append(emptyBox('search', 'Nothing found', 'No chapter matches “' + q + '”. Try a shorter word such as “wallet”, “slip” or “agent”.'));
  return { body, units, toc };
}
function hilite(root, words) {
  if (!words.length) return; const src = '\\b(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\w*';
  const test = new RegExp(src, 'i'), nodes = [], wk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = wk.nextNode(); n; n = wk.nextNode()) { const p = n.parentElement; if (p && !/^(SCRIPT|STYLE|BUTTON|MARK|H1)$/.test(p.tagName) && !p.closest('.gsr') && test.test(n.nodeValue)) nodes.push(n) }
  for (const n of nodes) { const f = document.createDocumentFragment(); let last = 0; const re = new RegExp(src, 'gi'), t = n.nodeValue; let m;
    while ((m = re.exec(t))) { if (m.index > last) f.append(t.slice(last, m.index)); f.append(h('mark', { class: 'gm' }, m[0])); last = m.index + m[0].length; if (!m[0].length) re.lastIndex++ }
    if (last < t.length) f.append(t.slice(last)); n.replaceWith(f) }
}
async function guidePage(m) {
  if (ME.admin) await loadAdminPart();
  const tabs = GUIDE_TABS(); if (!tabs.some(t => t[0] === G.tab)) G.tab = 'full';
  m.append(crumb(['Dashboard'], ['Guide & Tour']), titleRow('book', 'Guide & Tour', 'Learn the whole site'));
  m.append(h('p', { class: 'mut', style: 'margin:-8px 0 16px;max-width:820px' }, 'Everything about DEBONE Digital Hub in plain words: read it, search it, listen to it, or download it as a PDF. Or press Take a Tour to be shown the real screens one step at a time.'));
  const stat = h('span', { class: 'gstat', 'aria-live': 'polite' });
  const play = h('button', { class: 'btn' }, ic('play', 15), 'Listen'), pause = h('button', { class: 'btn out hide' }, ic('pause', 15), 'Pause'), stop = h('button', { class: 'btn out hide' }, ic('stop', 15), 'Stop');
  TTS.ui = { play, pause, stop, stat };
  const rate = h('select', { 'aria-label': 'Reading speed' }, [[0.8, 'Slow'], [1, 'Normal'], [1.2, 'Fast'], [1.5, 'Very fast']].map(([v, l]) => h('option', { value: v, selected: v === TTS.rate ? '' : null }, l)));
  rate.onchange = () => { TTS.rate = Number(rate.value); lsSet('dv_rate', String(TTS.rate)); if (TTS.state === 'playing') ttsSay(TTS.i) };
  const voice = h('select', { 'aria-label': 'Voice' }); const fillVoices = () => { const vs = ttsVoices(); voice.replaceChildren(...vs.map(v => h('option', { value: v.name, selected: (ttsPick() || {}).name === v.name ? '' : null }, v.name.replace(/Microsoft |Google /g, '') + ' (' + v.lang + ')'))); voice.classList.toggle('hide', vs.length < 2) };
  fillVoices(); try { speechSynthesis.onvoiceschanged = fillVoices } catch {}
  voice.onchange = () => { TTS.voiceName = voice.value; lsSet('dv_voice', voice.value); if (TTS.state === 'playing') ttsSay(TTS.i) };
  play.onclick = () => { if (TTS.state === 'paused') ttsResume(); else { G.units = cur.units; ttsStart(0) } }; pause.onclick = ttsPause; stop.onclick = ttsStop;
  const pdfBtn2 = h('button', { class: 'btn out' }, ic('down', 15), 'Download PDF');
  const tourBtn = h('button', { class: 'btn out', on: { click: () => startTour(ME.admin && G.tab === 'admin' ? 'admin' : 'customer') } }, ic('route', 15), 'Take a Tour');
  const bar = h('div', { class: 'cd gbar' }, h('div', { class: 'gbtns' }, play, pause, stop, pdfBtn2, tourBtn), h('div', { class: 'gopts' }, h('label', {}, 'Speed ', rate), voice), stat);
  if (!TTS.ok) { play.disabled = true; stat.textContent = 'Reading aloud is not supported in this browser. Use Google Chrome, or download the PDF.' }
  const tabsEl = h('div', { class: 'tabs gtabs' }); const q = h('input', { placeholder: 'Search the guide, e.g. wallet, slip, refund…', value: G.q, 'aria-label': 'Search the guide' });
  const wrap = h('div', { class: 'gd' }); let cur = null;
  const draw = () => {
    ttsStop(); cur = buildGuideBody(G.tab, G.q); G.units = cur.units;
    const toc = h('nav', { class: 'gtoc cd pad', 'aria-label': 'Chapters' }, h('b', { style: 'font-size:12px;letter-spacing:.06em;color:var(--mut)' }, 'CHAPTERS'), cur.toc.map(e => e.part ? h('div', { class: 'tp' }, e.t) : h('a', { href: 'javascript:void(0)', on: { click: () => document.getElementById(e.id).scrollIntoView({ behavior: 'smooth', block: 'start' }) } }, e.t)));
    const jump = h('select', { class: 'gjump', 'aria-label': 'Jump to chapter', on: { change: e => { const v = e.target.value; if (v) document.getElementById(v).scrollIntoView({ behavior: 'smooth', block: 'start' }); e.target.value = '' } } }, h('option', { value: '' }, 'Jump to a chapter…'), cur.toc.filter(e => !e.part).map(e => h('option', { value: e.id }, e.t)));
    const words = cur.units.reduce((n, u) => n + u.text.split(/\s+/).length, 0);
    wrap.replaceChildren(h('div', { class: 'gside' }, toc), h('div', { class: 'gmain' }, jump, h('p', { class: 'mut gmeta' }, cur.toc.filter(e => !e.part).length + ' chapters · about ' + Math.max(1, Math.round(words / 170)) + ' minutes to read or listen'), cur.body));
    tabsEl.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.k === G.tab)); pdfBtn2.lastChild.textContent = 'Download PDF';
  };
  tabs.forEach(([k, l, d]) => tabsEl.append(h('button', { class: 'tab', 'data-k': k, title: d, on: { click: () => { G.tab = k; draw() } } }, l)));
  let tm; q.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(() => { G.q = q.value; draw() }, 250) });
  tabsEl.append(h('div', { class: 'ig' }, ic('search', 16), q));
  pdfBtn2.onclick = () => { pdfBtn2.disabled = true; try { const label = (tabs.find(t => t[0] === G.tab) || [])[1] || 'Guide'; const u = buildPdf(label, partsFor(G.tab)); saveBlob(u, 'DEBONE-User-Guide-' + G.tab + '.pdf', 'application/pdf'); toast('Guide downloaded as PDF.') } catch (e) { console.error(e); toast('Could not make the PDF. Please try again.') } pdfBtn2.disabled = false };
  m.append(bar, h('div', { class: 'cd pad', style: 'margin-bottom:16px;padding-bottom:8px' }, tabsEl), wrap); draw();
  if (G.jump) { const id = 'g-' + G.jump; G.jump = null; setTimeout(() => { const el = document.getElementById(id); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('gflash') } }, 80) }
}

/* ---------- My Results ---------- */
async function resultsPage(m) {
  m.append(crumb(['Dashboard'], ['My Results']), titleRow('file', 'My Results', 'Free to reopen'));
  m.append(h('div', { class: 'cd pad gc good', style: 'margin-bottom:18px;display:flex;flex-direction:row;gap:12px;align-items:flex-start' }, ic('shield', 22), h('div', {}, h('b', {}, 'Paid once. Open it again any time for 30 days.'), h('div', { class: 'mut', style: 'margin-top:4px;font-size:13px' }, 'Every successful result is saved here. Viewing or downloading again is free: it never touches your wallet and never contacts the provider. After 30 days it is deleted automatically for your privacy.'))));
  const c = h('div', { class: 'cd pad ov' }); m.append(c);
  const r = await api('results/list'); if (!r.ok) return c.append(h('p', {}, r.msg || 'Could not load your results.'));
  if (!r.rows.length) return c.append(emptyBox('file', 'No saved results yet', 'After you run a check, the result is saved here for 30 days.'));
  const t = h('table', { class: 'tbl' }, h('tr', {}, ['Date', 'Service', 'Number', 'Time left', ''].map(x => h('th', {}, x))));
  const left = at => { const d = Math.max(0, 30 - Math.floor((Date.now() - new Date(/(Z|[+-]\d\d:?\d\d)$/.test(String(at)) ? at : String(at).replace(' ', 'T') + 'Z').getTime()) / 864e5)); return d + (d === 1 ? ' day' : ' days') };
  r.rows.forEach(x => {
    const view = h('button', { class: 'btn out sm' }, 'View'), dl = h('button', { class: 'btn sm' }, ic('down', 14), 'Download'), del = h('button', { class: 'btn out sm' }, 'Delete');
    view.onclick = async () => { view.disabled = true; const d = await api('results/get', { id: x.id }); view.disabled = false; if (!d.ok) return toast(d.msg); modal(x.label + ' · ' + fmt(d.at), resultCard({ data: d.data || {}, photo: d.photo, pdf: d.pdf }, 'slip')) };
    dl.onclick = async () => { dl.disabled = true; const d = await api('results/get', { id: x.id }); dl.disabled = false; if (!d.ok) return toast(d.msg); if (!d.pdf) return toast('This result has no PDF slip. Use View to see the details.'); downloadB64Pdf(d.pdf, x.label.replace(/\W+/g, '_') + '_' + x.id + '.pdf'); toast('Downloaded. No charge.') };
    del.onclick = async () => { if (!confirm('Delete this result now? It cannot be recovered.')) return; const d = await api('results/delete', { id: x.id }); toast(d.msg); if (d.ok) render() };
    t.append(h('tr', {}, h('td', { class: 'mut' }, fmt(x.at)), h('td', { style: 'font-weight:600' }, x.label), h('td', { class: 'mut' }, x.hint || '—'), h('td', {}, h('span', { class: 'badge y' }, left(x.at))), h('td', { style: 'white-space:nowrap;display:flex;gap:8px' }, view, x.has_pdf ? dl : h('span', { class: 'mut', style: 'align-self:center' }, 'no PDF'), del)));
  });
  c.append(t);
}

/* ---------- small cards that point people to the guide ---------- */
function guideCard() {
  if (lsGet('dv_gcard_off')) return null;
  const x = h('button', { class: 'gx', 'aria-label': 'Hide this', on: { click: () => { lsSet('dv_gcard_off', '1'); box.remove() } } }, '×');
  const box = h('div', { class: 'cd pad gcard' }, ic('book', 26), h('div', { style: 'flex:1;min-width:200px' }, h('b', {}, 'New here? Learn the whole site in minutes'), h('div', { class: 'mut', style: 'font-size:13px' }, 'Take a guided tour of the real screens, or read or listen to the full guide. You can also download it as a PDF.')),
    h('button', { class: 'btn sm', on: { click: () => startTour(ME.admin ? 'admin' : 'customer') } }, ic('route', 15), 'Take a Tour'), h('a', { class: 'btn out sm', href: '#/guide' }, 'Open Guide'), x);
  return box;
}
function maybeWelcome() {
  if (lsGet('dv_welcome_seen') || !ME) return;
  setTimeout(() => {
    if (document.querySelector('.modal') || document.querySelector('.tour-pop')) return;
    const done = v => { lsSet('dv_welcome_seen', '1'); md.remove(); if (v === 'tour') startTour(ME.admin ? 'admin' : 'customer'); else if (v === 'guide') location.hash = '#/guide' };
    const md = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Welcome' }, h('div', { class: 'cd pad mbox', style: 'text-align:center' }, h('div', { class: 'ci', style: 'margin:0 auto 10px' }, ic('route', 34)), h('h2', {}, 'Welcome to DEBONE Digital Hub'), h('p', { class: 'mut', style: 'margin:8px 0 18px' }, 'Would you like a quick tour? It takes about 3 minutes and shows you every part of the site, step by step.'),
      h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap;justify-content:center' }, h('button', { class: 'btn', on: { click: () => done('tour') } }, ic('route', 16), 'Take the tour'), h('button', { class: 'btn out', on: { click: () => done('guide') } }, 'Read the guide'), h('button', { class: 'btn out', on: { click: () => done('later') } }, 'Maybe later'))));
    document.body.append(md);
  }, 1200);
}
