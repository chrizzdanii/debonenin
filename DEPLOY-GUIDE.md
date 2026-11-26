# v12 update (balanced agent prices)
Agent prices rebalanced: IPE clearance N1,500 -> N1,100, NIN validation N800 -> N900, BVN + bank match N250 -> N200. Only prices still at the old default move (once); customer prices follow if automatic. Anything you typed in Admin -> Set Prices is untouched.

---

# v9 update (customers never see agent prices, higher customer prices)
No SQL needed. Customers (and the guide, tour and assistant they see) no longer show what agents pay; only verified agents and the admin see the agent price. Automatic customer prices: agent price up to N300 -> x3.5, up to N600 -> x2.7, up to N1,500 -> x1.8, above -> x1.4, rounded up to N50 and at least N150 more (e.g. agent N300 -> customer N1,050, agent N1,500 -> N2,700). Only prices you did not type yourself are moved. To set any price by hand: Admin -> Set Prices -> Individual price -> Save.

---

# v8 update (SEO, public pages, logo) - READ THIS FIRST
No SQL is needed. Upload everything to GitHub as before.

**What changed**
- `/` is now a public, Google-friendly home page. The app moved to `/app.html` (Login / Register buttons go there). Old links such as `/?paid=...` and `/#/dashboard` are redirected automatically, so Paystack returns still work.
- 8 service pages (NIN verification, NIN slip, BVN, IPE, NIN validation, personalisation, CAC/TIN, ID and vehicle) each with its own title, description, FAQ and structured data.
- Logo set (`logo.svg`, `logo.png`, `favicon.ico`, `favicon.svg`, icons, `og-image.png`), `sitemap.xml`, `robots.txt`, `manifest.webmanifest`.

**Do these things after it is live**
1. Your pages currently use the address https://deboneverify.vercel.app . When you get a custom domain, replace that address with the new one in `public/` (index.html, the service pages, sitemap.xml, robots.txt). A custom domain ranks better than `.vercel.app`.
2. Open `/sitemap.xml` and `/robots.txt` on your site to confirm they load.
3. Add the site to Google Search Console and Bing Webmaster Tools, submit `sitemap.xml`, and request indexing of the home page.
4. Create a Google Business Profile and share your link on WhatsApp, Facebook and X.
5. Add real customer reviews and contact details to the footer when you have them.

**Logo in search.** Google shows the site icon (`favicon.ico`) next to your name once it has crawled the home page. This usually takes days to a few weeks and Google decides when. Nobody can guarantee position 1.

**Editing the pages.** Public pages are plain HTML files in `public/` (`index.html`, `nin-verification.html`, ...). Edit the text directly; keep the `<title>` under 60 characters and the description under 160.

---

# v7 update (assistant, search, prices)
No SQL is needed. Upload the contents of the folder to GitHub as before and let Vercel redeploy. Then: (1) open the site and tap **Ask** at the bottom right; (2) open Guide & Tour and try the search box; (3) open Admin > Set Prices and look at the individual prices (untouched automatic ones moved to the new tiers; any price you typed yourself stayed).

# Put DEBONE Digital Hub live on Vercel + Supabase

Follow the steps in order. Do not skip the "Check" lines: they tell you each step worked.
Time needed: about 1 to 1.5 hours the first time.

> **Plans, honestly:** Vercel's free "Hobby" plan is for non-commercial use only, so a business site should use **Vercel Pro** (about $20/month). Supabase's free plan pauses a project after a week without use and has no backups, so a live site should use **Supabase Pro** (about $25/month). You can build and test everything on the free plans first and upgrade before real customers arrive.

---

# UPDATING A SITE THAT IS ALREADY LIVE (version 6: Guide Centre, Take a Tour, My Results, new individual prices)

**No database change is needed this time.** Do NOT run any SQL. Only upload the code.

**What is new**
- **Guide & Tour** page: a full guide for customers, agents and the admin. People can read it, search it, press **Listen** (the site reads it aloud until they press Stop) or **Download PDF**. The admin has an extra "For admin" tab that customers never receive.
- **Take a Tour**: a step-by-step tour of the real screens (customer tour and admin tour). New users are offered it once when they first sign in. There is also a "?" button in the top bar.
- **My Results**: every successful result is kept for 30 days and the customer can view or download it again for free. Closing the page by mistake no longer means paying again. (Before this, only you could see saved results.)
- **Individual prices are now higher.** The first version added 50%. Now cheap services get a bigger gap so agents really are better off: agent price up to N300 -> x1.8, N301-N1,500 -> x1.5, above N1,500 -> x1.4 (rounded up to the next N50).
- IPE clearance default agent price is now N1,500.
- Phone fixes: the top bar no longer runs off the screen and your account menu works on a phone.

**Your agent prices do not change.** Individual prices you typed yourself are not touched. Only individual prices that were still on the old automatic +50% are moved to the new tiers, once, the first time the site starts.

**Steps**
1. Unzip the file. Open your repository on GitHub -> **Add file -> Upload files**. Drag in everything that is INSIDE the folder (not the folder itself). Replace files with the same names. Commit.
2. Wait for Vercel to say **Ready**, then open `https://your-site/health`. It must show `{"ok":true}`.
3. Sign in as admin -> **Admin -> Set Prices**. Look at the **Individual price** column and change any you want. Press **Save** on each row you change.
4. Open **Guide & Tour** and press **Download PDF** to check it. Press **Listen** to hear it.
5. Sign in as a normal customer (or open a private window) and press **Take a Tour** once to see what your customers see.

**Reading aloud uses the visitor's own browser voices.** It works best in Google Chrome. A phone reads in whatever voice is installed on it.

**Editing the guide later.** Ask your developer to edit `public/guide-content.js` (customers and agents) or `guide-admin.js` (admin only). Prices in the guide are live and update by themselves.

---

# UPDATING A SITE THAT IS ALREADY LIVE (version 5: agent price and individual price)

**What changed.** Every service is now open to everyone. There are two prices:
- **Agent price** = the price you already had. It does not change. Only verified agents pay it.
- **Individual price** = a higher price for people who are not verified. They can use every service straight away; if they want the lower price they apply under *Agent Verification*.

**1. Update the database (Supabase) - do this BEFORE uploading the code.**
- SQL Editor -> **New query** -> paste the whole of `supabase/1-schema.sql` -> **Run**. (It adds one column, `price_ind`, to the `prices` table. It is safe to run again.)
- You do not need to run `2-app-user.sql` again.

**2. Update the code (GitHub).** Repository -> **Add file -> Upload files**, drag in everything from the new folder -> **Commit changes**.

**3. Wait for Vercel** to say Ready, then open `https://your-site/health`: it must show `{"ok":true}`. (An error mentioning "missing the newest tables" means step 1 was not done.)

**4. Check the new prices (as admin): Admin -> Set Prices.** The first time the site starts it fills in the individual prices for you: agent price + 50%, rounded up to the next N50, and at least N100 more. For example:

| Agent price | Individual price |
|---|---|
| N150 | N250 |
| N200 | N300 |
| N300 | N450 |
| N400 | N600 |
| N800 | N1,200 |
| N1,800 | N2,700 |

Change any **Individual price** box you like and press **Save**. Rules: an individual price can never be lower than the agent price, and the agent price can never be lower than your provider price. Entering 0 in the Individual price box puts that service back on the automatic formula.

**What else changed**
- All services were unlocked once, so unverified users can use them. The **Agents only** switch still exists if you ever want to lock one service completely.
- Customers who are not agents see a small note on each service: "Verified agents pay N___ for this".
- The admin still pays the provider price. Existing verified agents keep paying the agent price.
- A request's price is fixed when it is made, so refunds always return exactly what the person paid.

---

# UPDATING A SITE THAT IS ALREADY LIVE (version 4: agent verification)

Do these in this exact order. If you upload the code before running the SQL, the site shows errors until you run it.

**1. Update the database (Supabase).**
- SQL Editor -> **New query** -> paste the whole of `supabase/1-schema.sql` -> **Run**.
- SQL Editor -> **New query** -> paste the whole of `supabase/2-app-user.sql` -> **Run**. Do not change anything in it: the `dv_app` user already exists, so your password keeps working.
- **Check:** Table Editor now also shows `agent_apps` and `invites`.
- Your existing users are automatically marked as verified agents, so nobody is suddenly locked out. Remove any you do not trust later in **Admin -> Users -> Remove agent**.

**2. Update the code (GitHub).** Open your repository -> **Add file -> Upload files**, drag in everything from the new folder (same file names are replaced) -> **Commit changes**.

**3. Wait for Vercel.** It redeploys by itself. Open the **Deployments** tab until it says Ready, then open `https://your-site/health`: it must show `{"ok":true}`. (If it shows an error mentioning "missing the newest tables", step 1 was not done.)

**4. Set up the new controls (as admin).**
- **Admin -> Agents & Invites -> Who can register:** choose **Open** (anyone can register, but locked services stay blocked until you verify them), **Invite only** (a person needs a one-time code from you) or **Closed**.
- **Admin -> Set Prices -> "Agents only" switch:** shows which services are locked for unverified users. NIN, BVN, phone, demographic, IPE, validation, personalisation, voter's card, driver's licence, passport, TIN-by-NIN/phone and BVN+bank are locked to start with. Change any you like.

**What is new**
- Everyone must give a mobile number when registering (one account per number). A hidden trap field stops simple bots.
- Registration modes: open, invite only, closed (the admin email can always register).
- Agent verification: a user applies with business details and an ID document; you approve or reject in Admin -> Agents & Invites. Until approved, locked services are blocked on the server, not just hidden.
- The site opens in the purple theme by default (people can still switch to dark mode, and it remembers their choice).
- The wallet balance is hidden until the eye icon is pressed.

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
4. **Admin -> Set Prices:** check the provider prices, the agent prices and the individual prices.
5. **Admin -> Agents & Invites:** choose who can register (Open / Invite only / Closed).
6. **Admin -> Admin Overview -> Check provider connection:** it should say verifyplatform replied. Fund your verifyplatform wallet if needed.

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
