// Runs on every Vercel build. Replaces the __SITE__ placeholder in the public pages with your real web address.
// Set SITE_URL in Vercel (Settings > Environment Variables), e.g. https://verify.yourdomain.com . If you do not,
// Vercel's own production address is used.
const fs = require('fs'), path = require('path');
let site = (process.env.SITE_URL || '').trim().replace(/\/+$/, '');
if (!site && process.env.VERCEL_PROJECT_PRODUCTION_URL) site = 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL;
if (!site) { console.log('inject-site: no SITE_URL set, leaving __SITE__ as it is (local run).'); process.exit(0); }
if (!/^https?:\/\//.test(site)) site = 'https://' + site;
const host = site.replace(/^https?:\/\//, ''), dir = path.join(__dirname, '..', 'public');
let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (!/\.(html|xml|txt|webmanifest)$/.test(f)) continue;
  const p = path.join(dir, f), a = fs.readFileSync(p, 'utf8'), b = a.replace(/https:\/\/__SITE__/g, site).replace(/__SITE__/g, host);
  if (a !== b) { fs.writeFileSync(p, b); n++; }
}
console.log('inject-site: set', site, 'in', n, 'files');
