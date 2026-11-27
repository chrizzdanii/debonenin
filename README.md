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
| `tests/` | 91 automated tests (need a Postgres, see below). |

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
- Every service is open to everyone. Verified agents pay the **agent price**; unverified individuals pay a higher **individual price**. Both are set per service in Admin -> Set Prices (individual price 0 = automatic and tiered: agent price up to N300 -> x1.8, N301-N1,500 -> x1.5, above N1,500 -> x1.4; rounded up to the next N50). Charging is decided in `server.js`, never in the browser.
- An optional "Agents only" switch per service can still lock a single service completely.
- Users apply under *Agent Verification* (business details + ID document, stored in the database, visible only to the admin). The admin approves or rejects under *Agents & Invites*.

## Key differences from the old SQLite version
- Database is Supabase Postgres (the old file `data.db` cannot work on Vercel). Use `npm run import` once to copy old data.
- Rate limits, request locks and sessions live in the database, because Vercel runs many copies of the server.
- Background jobs are triggered from outside (Supabase pg_cron, cron-job.org or Vercel Cron) via `/api/cron/jobs`, protected by `CRON_SECRET`.
- Receipt photos limited to 2.5 MB (Vercel's request limit is 4.5 MB).
- New: admin two-step login, per-account login limits, same-origin check, sessions revoked on password change/suspension.

## Guide Centre, Take a Tour and My Results (version 6)
- `public/guide-content.js` holds the guide text for everyone (start, why DEBONE, customers, agents). Edit it to change the guide; the web page, the read-aloud voice and the PDF all come from it, and the price tables inside are built live from the site's real prices.
- `guide-admin.js` holds the admin chapters. It sits OUTSIDE `public/` on purpose and is sent only to the signed-in admin (`POST /api/guide/admin`).
- `public/guide.js` is the Guide page, search, read-aloud (browser speech, no outside service), the built-in PDF writer and the My Results page. `public/tour.js` is the guided tour (customer and admin versions).
- My Results: `POST /api/results/list|get|delete`. A customer sees only their own results with outcome `success` or `completed`, from the last 30 days. Opening or downloading never calls the provider and never touches the wallet. Results marked `needs review` stay admin-only.
- No database change is needed for version 6.



## v7: assistant (chatbot), smarter guide search, market-checked prices
- **Assistant:** a chat window on every page (even before sign-in). Files: `public/chat-engine.js` (search brain), `public/chat.js` (window + live prices/balance/status), `public/guide-qa.js` (ready answers; admin answers live in `guide-admin.js`). It reads the whole guide too, so anything written in the guide is answerable. Nothing is sent to a server; no AI service or API key is needed. To teach it something new: add a line to `GUIDE_QA`, or add text to the guide.
- **Guide search:** ranked, forgives spelling mistakes, highlights matches, and has an "Ask the assistant" button.
- **Prices:** automatic individual tiers are now x1.8 (agent price up to N300), x1.5 (N301 to N1,500), x1.4 (above). Migration `ind_price_v3` moves only untouched automatic prices; prices an admin typed are never changed.
- Tests: `tests/chat.test.js` checks 97 real questions, every ready answer, every chapter title and every quick-fix row.


## Data, TV, electricity and exam pins (EasyAccess)

Customers buy data, cable TV, electricity tokens and exam pins from their wallet. The code is in `easyaccess.js` (server) and `public/vtu.js` (pages).

| Variable | Needed | What it does |
|---|---|---|
| `EA_API_KEY` | yes | Your EasyAccess token. Without it the pages open but every order says "temporarily unavailable" and the admin overview shows a warning. |
| `EA_WEBHOOK_KEY` | recommended | Secret added to the webhook URL as `?key=`. |
| `EA_EXTRA_DISCOS` | for more electricity companies | The documentation lists only EKEDC=1, IKEDC=2, PHEDC=3 and KEDCO=4 (then "etc."). Add the others from EasyAccess's Plan IDs page, e.g. `5:BEDC - Benin,6:AEDC - Abuja`. |
| `EA_MODE` | optional | `test` uses EasyAccess's test endpoints (no real orders). Default is live. |
| `EA_PRICE_GUARD` | optional | `0` stops sending `max_amount_payable`. Leave it on unless EasyAccess rejects normal orders for that reason. |

**Prices:** open **Admin → Data & Bills Pricing**. Provider cost comes from EasyAccess; you set your profit (percent + fixed naira) for agents and for customers. The defaults are only a starting point, so review them before going live.

**Safety rules built in:** the card or meter is verified before any money is taken; a clear failure refunds at once; a timeout or server error is *not* treated as failure (the order is held under Agency Requests so nobody gets free data); the webhook is never trusted without asking EasyAccess what really happened.

Tests: `tests/vtu.test.js` (needs `TEST_DATABASE_URL`, like the others).
