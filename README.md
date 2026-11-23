# DEBONE Digital Hub (Vercel + Supabase edition)

NIN, BVN, CAC, TIN, ID, vehicle and bank verifications, IPE clearance, NIN validation and personalisation.
Wallet funding by Paystack and by bank transfer with receipt approval. Admin tools, two-step admin login.

**To put it live, follow `DEPLOY-GUIDE.md` step by step.**

## What is in this folder
| Path | Purpose |
|---|---|
| `server.js` | The whole backend (Express). Runs on Vercel as a serverless function, or on your computer with `npm start`. |
| `api/index.js` | Vercel entry point (just loads `server.js`). |
| `public/` | The website pages (served by Vercel's network). |
| `supabase/1-schema.sql` | Creates the tables and turns on Row Level Security. |
| `supabase/2-app-user.sql` | Creates the restricted `dv_app` database user the site uses. |
| `scripts/migrate.js` | Runs the SQL files from your computer (optional). |
| `scripts/import-sqlite.js` | One-time copy of an old `data.db` into Supabase. |
| `vercel.json` | Vercel settings: routing, security headers, region, daily job. |
| `tests/` | 79 automated tests (need a Postgres, see below). |

## Run on your own computer
1. Node 22, then `npm install`.
2. Copy `.env.example` to `.env`; set at least `DATABASE_URL` (a Supabase project, or a local Postgres where you ran the two SQL files), `ADMIN_EMAIL`, `VP_API_KEY`, `BASE_URL=http://localhost:3000`.
3. `npm start`, open http://localhost:3000.

## Run the tests
The tests create throw-away databases, so they need a Postgres account that may create databases (a local Postgres, not your live Supabase):
```
set TEST_DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/postgres
npm test
```
Without `TEST_DATABASE_URL` the database tests are skipped. The tests run the website as the restricted `dv_app` user, exactly as in production, and cover: money safety and refunds, Paystack crediting, provider reply formats, bank-transfer approval, cross-site blocking, two-step login (including reused codes), signing out other devices, shared rate limits across servers, protected cron endpoint, receipt limits, and the database's own Row Level Security.

## Agent and individual pricing, registration controls (version 5)
- Registration needs a mobile number (unique). Modes: open / invite only / closed, set by the admin. A hidden field traps simple bots.
- Every service is open to everyone. Verified agents pay the **agent price**; unverified individuals pay a higher **individual price**. Both are set per service in Admin -> Set Prices (individual price 0 = automatic: agent price + 50%, rounded up to N50, at least N100 more). Charging is decided in `server.js`, never in the browser.
- An optional "Agents only" switch per service can still lock a single service completely.
- Users apply under *Agent Verification* (business details + ID document, stored in the database, visible only to the admin). The admin approves or rejects under *Agents & Invites*.

## Key differences from the old SQLite version
- Database is Supabase Postgres (the old file `data.db` cannot work on Vercel). Use `npm run import` once to copy old data.
- Rate limits, request locks and sessions live in the database, because Vercel runs many copies of the server.
- Background jobs are triggered from outside (Supabase pg_cron, cron-job.org or Vercel Cron) via `/api/cron/jobs`, protected by `CRON_SECRET`.
- Receipt photos limited to 2.5 MB (Vercel's request limit is 4.5 MB).
- New: admin two-step login, per-account login limits, same-origin check, sessions revoked on password change/suspension.
