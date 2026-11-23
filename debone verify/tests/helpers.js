// Test helper: makes a throw-away Postgres database for each test file (needs TEST_DATABASE_URL, see README).
const { Client } = require('pg'), fs = require('fs'), path = require('path');
const ADMIN_URL = process.env.TEST_DATABASE_URL;
exports.skip = ADMIN_URL ? false : 'Set TEST_DATABASE_URL to a Postgres you can create databases in (see README) to run these tests.';
const conv = s => { let i = 0; return s.replace(/\?/g, () => '$' + (++i)); };
exports.newDb = async () => {
  const name = 'dvt_' + Date.now() + '_' + Math.floor(Math.random() * 1e6), admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect(); await admin.query('CREATE DATABASE ' + name);
  const u = new URL(ADMIN_URL); u.pathname = '/' + name;
  const c = new Client({ connectionString: u.toString() }); await c.connect();
  for (const f of ['1-schema.sql', '2-app-user.sql']) await c.query(fs.readFileSync(path.join(__dirname, '..', 'supabase', f), 'utf8'));
  const app = new URL(u.toString()); app.username = 'dv_app'; app.password = 'CHANGE_THIS_PASSWORD'; // tests run the website as the restricted user
  return {
    url: app.toString(), adminUrl: u.toString(),
    q: async (s, ...a) => (await c.query(conv(s), a)).rows,
    x: async (s, ...a) => { await c.query(conv(s), a); },
    drop: async () => { await c.end(); await admin.query('DROP DATABASE IF EXISTS ' + name + ' WITH (FORCE)'); await admin.end(); },
  };
};
