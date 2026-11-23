// One-time copy of your OLD data.db (SQLite) into Supabase. Usage:
//   npm install better-sqlite3 --no-save
//   npm run import -- path/to/data.db
// Needs DATABASE_URL (or MIGRATE_URL) in .env. Run it only once, on an empty database.
require('dotenv').config();
const { Client } = require('pg');
let Sqlite; try { Sqlite = require('better-sqlite3'); } catch { console.error('Run first:  npm install better-sqlite3 --no-save'); process.exit(1); }
const file = process.argv[2]; if (!file) { console.error('Usage: npm run import -- path/to/data.db'); process.exit(1); }
const url = (process.env.MIGRATE_URL || process.env.DATABASE_URL || '').replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
const TABLES = { // table: [columns, timestamp columns]
  users: [['id', 'name', 'email', 'pass', 'bal', 'active', 'agreed_at', 'created'], ['agreed_at', 'created']],
  tx: [['id', 'uid', 'svc', 'amt', 'status', 'at'], ['at']],
  pay: [['ref', 'uid', 'amt', 'charged', 'status', 'at'], ['at']],
  reqs: [['id', 'uid', 'svc', 'label', 'ref', 'price', 'status', 'result', 'input', 'checked', 'at'], ['checked', 'at']],
  prices: [['k', 'price', 'cost', 'active'], []],
  settings: [['k', 'v'], []],
  admin_log: [['id', 'at', 'admin', 'action', 'detail'], ['at']],
  results: [['id', 'at', 'uid', 'email', 'svc', 'label', 'hint', 'outcome', 'price', 'pdf', 'raw', 'info', 'photo'], ['at']],
  transfers: [['id', 'ref', 'uid', 'amt', 'credited', 'status', 'reason', 'proof', 'proof_name', 'proof_mime', 'proof_hash', 'decided_by', 'at', 'upd'], ['at', 'upd']],
};
const ts = v => (typeof v === 'string' && /^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/.test(v)) ? v.replace(' ', 'T') + 'Z' : v;
(async () => {
  const src = new Sqlite(file, { readonly: true }), c = new Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
  await c.connect();
  const existing = (await c.query('SELECT COUNT(*)::int n FROM users')).rows[0].n;
  if (existing > 0) { console.error('The database already has users. Import only into an empty database.'); process.exit(1); }
  await c.query('BEGIN');
  try {
    for (const [t, [cols, tcols]] of Object.entries(TABLES)) {
      const have = new Set(src.prepare(`PRAGMA table_info(${t})`).all().map(r => r.name)); if (!have.size) { console.log('skip', t, '(not in old file)'); continue; }
      const use = cols.filter(x => have.has(x)); let n = 0;
      for (const row of src.prepare(`SELECT ${use.join(',')} FROM ${t}`).all()) {
        if (t === 'settings' && row.k === 'secret') continue; // a fresh session secret is created for the new site
        const vals = use.map(k => tcols.includes(k) ? ts(row[k]) : row[k]);
        await c.query(`INSERT INTO ${t}(${use.join(',')}) VALUES(${use.map((_, i) => '$' + (i + 1)).join(',')}) ON CONFLICT DO NOTHING`, vals); n++;
      }
      console.log('copied', n, 'row(s) of', t);
    }
    for (const t of ['users', 'tx', 'reqs', 'admin_log', 'results', 'transfers'])
      await c.query(`SELECT setval(pg_get_serial_sequence('${t}','id'), GREATEST((SELECT COALESCE(MAX(id),0) FROM ${t}),1), (SELECT MAX(id) IS NOT NULL FROM ${t}))`);
    await c.query('COMMIT'); console.log('Import finished. Check the Admin Overview: wallet records should match balances.');
  } catch (e) { await c.query('ROLLBACK'); throw e; }
  await c.end();
})().catch(e => { console.error('Import failed (nothing was changed):', e.message); process.exit(1); });
