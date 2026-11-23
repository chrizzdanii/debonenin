// Creates the tables. Usage:  npm run migrate         (uses MIGRATE_URL, or DATABASE_URL if that is not set)
//                             npm run migrate -- --app-user    (also creates the restricted dv_app user)
require('dotenv').config();
const fs = require('fs'), path = require('path'), { Client } = require('pg');
const url = (process.env.MIGRATE_URL || process.env.DATABASE_URL || '').replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
if (!url) { console.error('Set MIGRATE_URL (or DATABASE_URL) in .env first.'); process.exit(1); }
const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
(async () => {
  const c = new Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });
  await c.connect();
  const files = ['1-schema.sql', ...(process.argv.includes('--app-user') ? ['2-app-user.sql'] : [])];
  for (const f of files) { await c.query(fs.readFileSync(path.join(__dirname, '..', 'supabase', f), 'utf8')); console.log('ran', f); }
  await c.end(); console.log('Done.');
})().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
