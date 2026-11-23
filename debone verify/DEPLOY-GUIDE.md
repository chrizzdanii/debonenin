# Put DEBONE Digital Hub live on Vercel + Supabase

Follow the steps in order. Do not skip the "Check" lines: they tell you each step worked.
Time needed: about 1 to 1.5 hours the first time.

> **Plans, honestly:** Vercel's free "Hobby" plan is for non-commercial use only, so a business site should use **Vercel Pro** (about $20/month). Supabase's free plan pauses a project after a week without use and has no backups, so a live site should use **Supabase Pro** (about $25/month). You can build and test everything on the free plans first and upgrade before real customers arrive.

---

## STEP 0. What you need
- A **GitHub** account (free), a **Supabase** account, a **Vercel** account (sign up with GitHub).
- Your **verifyplatform API key** (a NEW one, see Step 9), your **Paystack** keys (start with the *test* secret key `sk_test_...`).
- Your domain name (optional at first: Vercel gives you a free `something.vercel.app` address).
- **Turn on two-step login (2FA) on every account above and on your email.** If one of them is hacked, everything else is at risk.

---

## STEP 1. Make your secrets
You need two long random strings. On your computer, open Command Prompt and run this **twice**:

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Write the two results in a safe place (a password manager, not a chat). Call them `SESSION_SECRET` and `CRON_SECRET`.
Also invent a long random password (24+ letters and numbers, no symbols) for the database user, call it `DV_APP_PASSWORD`.

**Check:** you have 3 different long values written down.

---

## STEP 2. Create the Supabase project
1. Go to **supabase.com** -> **New project**.
2. Name: `debone-hub`. **Database password:** make a strong one and **save it** (this is the *postgres* password, different from `DV_APP_PASSWORD`).
3. **Region: "West EU (London)"** (closest good option for Nigeria). Click **Create new project** and wait 2 minutes.

**Check:** the project dashboard opens.

## STEP 3. Create the tables
1. Left menu -> **SQL Editor** -> **New query**.
2. Open the file `supabase/1-schema.sql` from this project in Notepad, copy everything, paste it into the editor, press **Run**.
3. You should see "Success. No rows returned".

**Check:** left menu -> **Table Editor**. You see tables `users`, `tx`, `pay`, `reqs`, `prices`, `settings`, ... and each shows a small **RLS enabled** label. That means the public Supabase web API can read nothing. 

## STEP 4. Create the restricted database user (important for security)
1. Open `supabase/2-app-user.sql` in Notepad. Find `CHANGE_THIS_PASSWORD` and replace it with your `DV_APP_PASSWORD`. Save.
2. SQL Editor -> New query -> paste the whole file -> **Run**. "Success" again.

Why: your website then connects as `dv_app`, which can only read and write its own tables. It cannot drop tables or touch anything else.

## STEP 5. Get the connection string
1. Top of the Supabase page, click **Connect**. Choose the **Transaction pooler** (port **6543**). Copy the string. It looks like:
   `postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`
2. Change **two things**:
   - `postgres.abcdefghijklmnop` becomes `dv_app.abcdefghijklmnop` (keep your own project code after the dot)
   - `[YOUR-PASSWORD]` becomes your `DV_APP_PASSWORD`
3. Do **not** add `?sslmode=...` to the end.

Example result: `postgresql://dv_app.abcdefghijklmnop:Kd82LmQ...@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`
This is your **DATABASE_URL**. Keep it safe.

## STEP 6 (only if you have old data). Copy your old SQLite data into Supabase
Skip this if the website is brand new. Otherwise, on your computer:
1. Extract this project to a folder, open Command Prompt there, run `npm install`, then `npm install better-sqlite3 --no-save`.
2. Copy your old `data.db` (and `data.db-wal`, `data.db-shm` if they exist) into the folder.
3. Create a file named `.env` in the folder with one line (this uses the **Session pooler**, port 5432, and the **postgres** user + password from Step 2; copy it from Connect -> Session pooler):
   `MIGRATE_URL=postgresql://postgres.abcdefghijklmnop:YOUR_POSTGRES_PASSWORD@aws-0-eu-west-2.pooler.supabase.com:5432/postgres`
4. Run: `npm run import -- data.db`
5. It prints how many rows were copied and "Import finished".
6. **Delete the `.env` file afterwards** and never upload it anywhere.

**Check:** Supabase -> Table Editor -> `users` shows your old accounts. Do this **before** Step 8 so the site never sees an empty database first.

---

## STEP 7. Put the code on GitHub
1. github.com -> **New repository** -> name `debone-hub` -> **Private** -> Create.
2. Click **uploading an existing file**. Drag in **everything inside this project folder** (`api`, `public`, `scripts`, `supabase`, `tests`, `server.js`, `package.json`, `package-lock.json`, `vercel.json`, `.gitignore`, `.vercelignore`, `README.md`, `DEPLOY-GUIDE.md`, `.env.example`).
   - **Never upload** `.env`, `data.db`, or `node_modules`.
3. **Commit changes**.

**Check:** the repository page lists those files and **no** `.env` or `data.db`.

## STEP 8. Deploy on Vercel
1. vercel.com -> **Add New... -> Project** -> import `debone-hub`.
2. **Framework Preset: Other.** Leave Build Command and Output Directory empty/default (the project's `vercel.json` handles it).
3. Open **Environment Variables** and add these (name = value). Tick Production, Preview and Development for each:

| Name | Value |
|---|---|
| `DATABASE_URL` | the string from Step 5 |
| `VP_API_KEY` | your **new** verifyplatform key |
| `PAYSTACK_SECRET` | `sk_test_...` for now |
| `PAYSTACK_ENABLED` | `1` |
| `ADMIN_EMAIL` | your admin email |
| `BASE_URL` | `https://your-project.vercel.app` for now (change to your real domain in Step 11) |
| `SESSION_SECRET` | the first random value from Step 1 |
| `CRON_SECRET` | the second random value from Step 1 |

4. Click **Deploy**. Wait for "Congratulations".

**Check:** open `https://your-project.vercel.app/health`. You must see `{"ok":true}`. Then open the main address: the sign-in page appears.
If `/health` says `{"ok":false}`, see "Troubleshooting" below (almost always the DATABASE_URL).

## STEP 9. Rotate any key that was ever shared
Any key that was ever pasted in a chat, emailed, or placed inside a zip/rar must be treated as stolen:
- **verifyplatform:** generate a new API key in their dashboard, put it in Vercel `VP_API_KEY`, delete the old one.
- **Paystack:** Settings -> API Keys -> roll/regenerate the secret key. Use the new one.
After changing an environment variable in Vercel: **Deployments -> the latest -> ... -> Redeploy**.

## STEP 10. First sign-in and admin setup
1. Open your site, click **Create one now**, register with exactly your `ADMIN_EMAIL`. This account is the admin.
2. **Admin -> Support Settings -> Two-step login -> Set up.** Install Google Authenticator on your phone, add the key shown, enter the 6-digit code. From now on admin sign-in needs a code. **Write the setup key down and keep it safe.**
3. **Admin -> Bank transfer details:** enter your account(s) if you accept bank transfers.
4. **Admin -> Set Prices:** check provider prices and your customer prices.
5. **Admin -> Admin Overview -> Check provider connection:** it should say verifyplatform replied. Fund your verifyplatform wallet if needed.

## STEP 11. Your own domain
1. Vercel -> project -> **Settings -> Domains** -> add `verify.yourdomain.com` and follow the DNS instructions at your domain registrar.
2. Change the Vercel variable `BASE_URL` to `https://verify.yourdomain.com` and **Redeploy**.

## STEP 12. Paystack webhook
Paystack dashboard -> Settings -> API Keys & Webhooks -> **Webhook URL**:
`https://verify.yourdomain.com/api/paystack/webhook` -> Save.
(Test mode and live mode each have their own webhook field; set both when you go live.)

## STEP 13. The background jobs (important)
The site must run a small job every 5 minutes: confirm Paystack payments that were not confirmed at once, poll IPE/validation/personalisation requests, and clean old data. Without it payments are still credited when the customer returns or by webhook, but stuck items wait longer. Pick **one**:

**Option A (free, recommended): Supabase pg_cron.**
1. Supabase -> **Database -> Extensions** -> enable **pg_cron** and **pg_net**.
2. SQL Editor -> New query, paste (replace the two UPPERCASE parts), Run:
```sql
select cron.schedule('dv-jobs', '*/5 * * * *', $$
  select net.http_get(
    url := 'https://verify.yourdomain.com/api/cron/jobs',
    headers := jsonb_build_object('Authorization', 'Bearer YOUR_CRON_SECRET')
  );
$$);
```
**Option B: cron-job.org (free).** Create a job, URL `https://verify.yourdomain.com/api/cron/jobs`, every 5 minutes, add a header `Authorization` = `Bearer YOUR_CRON_SECRET`.

(The project already includes one daily Vercel Cron as a safety net. On the Vercel Pro plan you can change `0 3 * * *` in `vercel.json` to `*/5 * * * *` instead and skip A/B.)

**Check:** open the URL in a browser: you get "Unauthorized" (good, it is protected). In Admin -> Overview, "Recent admin activity" later shows normal activity.

## STEP 14. Test everything with test money (before real customers)
Use the Paystack **test** key first, with Paystack's test card (see Paystack docs: "Test cards"):
1. Register a second account (a "customer"). Fund the wallet: you should see "Payment received" and the balance rise (a Paystack fee is added at checkout by design).
2. Run one NIN check with a real NIN you own. Confirm the PDF downloads and the balance drops by your price.
3. Try a wrong NIN: it should refund.
4. Submit a bank-transfer top-up with a receipt photo, and approve it as admin.
5. Admin -> Payments / Agency Requests / Saved Results all open without errors.
6. **Going live:** put the live `sk_live_...` key in Vercel, redeploy, set the live webhook, and repeat step 1 with a small real amount.

---

## What is protected (so you know what you have)
- **Database:** Row Level Security on every table; public Supabase web API reads nothing. Website uses a restricted `dv_app` user that cannot change the database structure. Encrypted connection.
- **Accounts:** passwords hashed (bcrypt). Admin two-step login with one-time codes that cannot be reused. Sessions stored in the database, cookies are secure + httpOnly + SameSite. Admin sessions end after 12 hours. Changing a password or suspending a user signs them out everywhere.
- **Attacks:** login limits per address **and per account** (stops guessing from many addresses), shared across all Vercel server copies. Requests from other websites are blocked. JSON-only API. Strict Content-Security-Policy, no clickjacking, HSTS.
- **Money:** every charge is refunded on failure, payments credited once, Paystack and webhook signatures verified, wallets can never go negative, duplicate clicks blocked across servers, receipts checked for real file type and size.
- **Secrets:** only in Vercel environment variables. Never in the code or browser.
- **Privacy:** consent at sign-up; results kept for limited days then deleted automatically.

## Your part of the security (important)
- 2FA on GitHub, Vercel, Supabase, Paystack, verifyplatform and your email.
- Keep the GitHub repository **private**. Never commit `.env`.
- Rotate keys if a laptop is lost or a developer leaves.
- Supabase **Pro** gives daily backups. On the free plan, export your data regularly (Database -> Backups, or ask for a manual export).
- Check Admin -> Overview "Needs attention" daily.
- Have a Nigerian lawyer review the Terms & Privacy text and your NDPC (data protection) duties. You handle NIN/BVN data.

## Troubleshooting
| What you see | Cause and fix |
|---|---|
| `/health` shows `{"ok":false}` or pages say "Something went wrong" | `DATABASE_URL` is wrong. Check: user is `dv_app.YOURPROJECTREF` (with the dot), port is **6543**, password is `DV_APP_PASSWORD`, no `?sslmode=`. Look at Vercel -> project -> **Logs**. |
| Logs: `password authentication failed` | Wrong dv_app password. Step 4 must have used the same password as in the URL. |
| Logs: `Tenant or user not found` | Missing `.YOURPROJECTREF` after `dv_app` in the URL. |
| Logs: `permission denied for table` | Step 4 (2-app-user.sql) was not run, or was run before Step 3. Run Step 3 then Step 4 again. |
| Registration works but you are sent back to sign-in | `SESSION_SECRET` missing/changed, or `BASE_URL` wrong. Redeploy after fixing. |
| Admin pages say "Admins only" | You registered with an email that is not exactly `ADMIN_EMAIL`. |
| Paystack payment succeeds but wallet unchanged | Webhook URL not set (Step 12) or wrong. The customer can press "Check now"; the background job also fixes it (Step 13). |
| Cron job returns 401 | `CRON_SECRET` in Vercel differs from the one in the job's header. |
| Provider checks fail only on Vercel | The provider may only accept requests from fixed IP addresses. Vercel's addresses change. Ask verifyplatform whether they restrict by IP; if they do you need Vercel "Static IPs" (paid add-on) or a VPS. |
| Lost your authenticator phone | In Supabase SQL Editor run: `update users set totp_on=0, totp_secret=null where email='YOUR_ADMIN_EMAIL';` then sign in and set up again. |
| A service times out | Slips take a few seconds. Functions are allowed 60 seconds. If it keeps happening, check verifyplatform status. |

## Limits to know about
- Receipt uploads are limited to **2.5 MB** (Vercel accepts requests up to 4.5 MB, and a photo grows by one third when sent).
- Vercel serverless: the site runs as many short copies; this project keeps limits, locks and sessions in the database so that is safe.
