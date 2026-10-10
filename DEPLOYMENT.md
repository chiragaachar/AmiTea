# amiTea — Deploy from scratch

**Complete fresh-install package · 10 October 2026 · Version 1.2.0**

These instructions assume you have never deployed amiTea and are creating a new, empty Supabase project. Everything required is included in this ZIP; start at Step 1 and follow the steps in order.

Students create an account using **Username, Password, and Confirm password**. Returning students enter **Username and Password**. There is no student email field, OTP, confirmation link, SMTP setup or email password reset. Posts display a separate random public alias.

Start with the complete `amiTea-complete-fresh-install.zip`. Extract it into a **new folder** for this deployment. The project root contains `package.json`, `START-HERE.md`, and this `DEPLOYMENT.md`; the same guide is also in `docs/DEPLOYMENT.md`.

## Why Supabase still has a setting called “Email/password”

The app uses Supabase to hash passwords and issue secure sessions. Supabase's password API expects an email-shaped identifier, so amiTea privately converts a username to a deterministic hash ending in `@accounts.amitea.invalid`. It is **not a real email address or mailbox**, and students never type it.

Therefore, keep Supabase's internal **Email/password provider enabled** and turn **Confirm email OFF**. This is a username compatibility adapter; Supabase is not being represented as having a native username API. No verification message is part of this app. Technical details are in `docs/USERNAME-AUTH.md`.

| Student action        | Current behavior                                        |
| --------------------- | ------------------------------------------------------- |
| Sign up               | Choose a private username and password; repeat password |
| Log in                | Enter username and password                             |
| Public identity       | Independent, random public alias                        |
| Change password       | Settings → enter current password and a new password    |
| Forgot password       | No automatic recovery; save credentials securely        |
| Verify student status | Not performed; usernames do not prove campus enrollment |

## 1. Check prerequisites

You need Node.js 22 or later, npm, Git, and Supabase/GitHub/Vercel accounts you control. Confirm the intended Vercel plan permits your use: Hobby's personal/non-commercial eligibility does not automatically cover an institutional deployment. Review current dependency security advisories before launch. No hosted project has been provisioned by this package.

The source includes no real keys, database credentials, live student records, `node_modules`, or build output. Install dependencies locally rather than expecting those folders in the ZIP.

## 2. Create a Supabase project

1. Open https://supabase.com/dashboard and create a project in the intended organization and region.
2. Choose a strong database password and store it securely. The application does not need that password in its source or `.env.local`.
3. Wait until the project is ready.
4. Open Connect or Project Settings → API and obtain the **Project URL** and **public anon/publishable key**. Never put a service-role or secret key in this app.

## 3. Install the complete database

1. Open `supabase/schema.sql` from this package in a text editor.
2. Copy the **entire file contents**.
3. In your new Supabase project, open SQL Editor → New query, paste the contents, and click **Run** once.
4. Confirm it succeeds. This single file creates every community table, index, RLS policy, RPC function, moderation rule and username-account check.
5. Continue to Step 4. No other installation SQL needs to be run.

The `supabase/migrations` directory contains one identical initial schema for automated database tooling. The SQL Editor instructions above are the installation method used throughout this guide; **do not run the migration copy as an additional step**.

Verify RLS on all 13 public tables and keep the `private` schema out of exposed schemas. Raw table access by `anon` and `authenticated` is intentionally revoked; use the supplied RPCs rather than granting table access.

## 4. Configure username/password Auth

In Supabase Authentication settings (labels may vary slightly):

| Setting                                             | Required value                                                 |
| --------------------------------------------------- | -------------------------------------------------------------- |
| Email/password provider                             | **Enabled**, only for the internal identifier/password adapter |
| Confirm email                                       | **OFF**                                                        |
| Allow new user signups                              | **ON**                                                         |
| Minimum password length                             | **15 characters**                                              |
| Phone / social OAuth / anonymous sign-in            | **OFF** for this version                                       |
| Unneeded identity linking                           | **OFF**                                                        |
| Email-based secure password-change reauthentication | **OFF**; the app verifies `current_password` instead           |
| Optional Auth email notifications                   | **OFF**                                                        |
| Auth signup/token/account-update rate limits        | Keep enabled                                                   |
| SMTP and email templates                            | **Not needed** for this app                                    |

Set Auth Site URL to `http://localhost:3000` during local setup and to the canonical HTTPS origin for production. If maintaining redirect allowlists, allow only exact trusted origins. This username flow has no email callback route.

Do not enable an OTP/magic-link flow or ask students to verify a mailbox. A correctly configured signup returns a session immediately. Test the reserved `.invalid` identifier with your hosted Auth version; hosted integration was not run in the authoring workspace.

New passwords are 15–64 characters and at most 72 UTF-8 bytes. Usernames are case-insensitive and contain 3–24 ASCII letters, numbers or underscores. Configure the provider's password minimum too, so direct API calls cannot bypass the app's minimum.

Server-side Auth calls can share the hosting server's egress IP. Keep rate limits active and check them under realistic login load; do not forward arbitrary browser-supplied IP headers or remove limits to resolve throttling.

## 5. Configure and run locally

Open a terminal in the extracted project directory containing `package.json`:

```bash
npm ci
```

Copy `.env.example` to `.env.local` in your editor. On macOS/Linux you can use `cp .env.example .env.local`; in PowerShell use `Copy-Item .env.example .env.local`.

Fill these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-OR-PUBLISHABLE-KEY
SITE_URL=http://localhost:3000
COLLEGE_NAME=Your campus name
SUPPORT_EMAIL=
```

`SUPPORT_EMAIL` is an optional public contact address for the operator's help/appeals inbox. It is **not a student login field or an authentication service**. Set a monitored contact before opening the community; otherwise the help page shows a configuration notice.

Never commit `.env.local`, passwords, SMTP credentials from other projects, bearer tokens, or service-role keys. The app needs no server service-role key.

Run:

```bash
npm run dev
```

Open http://localhost:3000. Visit `/signup`, choose a username and password, then sign out and log back in at `/login`. Test with two disposable accounts. No email code screen should appear.

## 6. Set up the first administrator

1. Register a dedicated moderator account through this app's `/signup` page.
2. In a local terminal, run:

```bash
node scripts/username-id.mjs
```

3. Enter that account's **login username**, not its public alias. The helper prints its internal identifier and never asks for a password.
4. In Supabase Authentication → Users, find the exact matching identifier and copy that account's UUID.
5. In SQL Editor, substitute the exact UUID below:

```sql
update public.profiles
set role = 'admin'
where id = 'REPLACE-WITH-THE-CORRECT-ACCOUNT-UUID'::uuid
returning id, alias, role;
```

Exactly one row should be returned. If zero rows are returned, fix the account lookup; do not remove the WHERE condition. Open `/admin` in the promoted account. Member accounts must still be denied access. Future staff roles use the same trusted process with `role = 'moderator'`.

The application never allows members to grant themselves roles or moderators to impersonate users. Use MFA and least privilege on the provider-administration accounts.

## 7. Run checks before deployment

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit --omit=dev --audit-level=high
```

`npm test` includes the fresh-schema versus initial-migration equivalence check. Browser tests and hosted Auth tests still need to run in your environment. Follow `docs/TESTING.md` for the live three-account test and optional load tests; never use real student data for fixtures.

Test correct/incorrect passwords, case-insensitive username uniqueness, signup without confirmation, current-password changes, private aliases, cross-account editing denial, reports, suspensions, votes and account deletion. Check mobile navigation and CSP/cookies on the actual deployment.

## 8. Push the full source to GitHub

Create an empty repository you control. From the project directory:

```bash
git init
git add .
git commit -m "Build amiTea username-password release"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/amitea.git
git push -u origin main
```

Substitute your actual repository URL. Push the extracted source, not just the ZIP. Check that no `.env.local` or test tokens are staged.

## 9. Deploy to Vercel

1. Open Vercel in the intended account/team and import the GitHub repository.
2. Choose the directory containing `package.json` as Root Directory.
3. Framework: **Next.js**. Runtime: **Node 22** or a supported later version.
4. Install command: `npm ci`. Build command: `npm run build`. Keep the framework's default output directory.
5. Add the five variables from Step 5 to the appropriate Vercel environment. Set `SITE_URL` to the actual canonical HTTPS URL.
6. Use a separate Supabase staging project for Preview deployments; do not point untrusted preview branches at production data.
7. Deploy and inspect build/function logs. Set Supabase Auth Site URL to the actual deployed HTTPS origin.
8. On the deployed site, repeat signup, login, password-change, public privacy and three-account moderation checks. Confirm students never encounter an email field, code or confirmation link.

A successful Vercel build does not prove the database and Auth settings are correct. This package contains deployment instructions, not an already deployed service.

## 10. Operations and troubleshooting

Schedule `supabase/maintenance.sql` through a trusted operator or database scheduler after reviewing its retention periods. Keep encrypted backups and test restoration. Monitor Supabase database size, query activity, Auth throttling and egress; monitor Vercel transfer, invocations and CPU/memory. Free allowances may pause service and do not guarantee uptime.

| Problem                                                                         | What to check                                                                                                                                                                      |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Signup has no session or asks for confirmation                                  | Confirm email must be OFF. Check Step 4. A test account previously created while it was ON may need trusted operator cleanup/confirmation; never add an email-code UI.             |
| Wrong username/password                                                         | Usernames ignore case; passwords do not. Errors intentionally do not disclose whether the username exists.                                                                         |
| Forgot credentials                                                              | No automatic recovery. Do not reset an account based solely on a claimed username or alias.                                                                                        |
| Current-password change fails                                                   | Check the current password and provider settings; email-based reauthentication must be OFF, and the hosted Auth server must support `current_password`.                            |
| “Relation already exists” during setup                                          | You applied a fresh-install script to an installed database. Stop and check whether schema.sql has already run; do not drop production tables.                                                 |
| Permission denied for a raw table                                               | Expected. Use RPCs; do not grant unrestricted table access.                                                                                                                        |
| RPC not found                                                                   | Check the correct Supabase project, successful execution of the entire schema.sql, exposed schemas and function grants.                                                                        |
| Feed unavailable                                                                | Check missing variables, service pauses, quotas and project health.                                                                                                                |
| Moderator page unavailable                                                      | Confirm the exact dedicated account was promoted in the same project.                                                                                                              |

Read `docs/LAUNCH-CHECKLIST.md` before inviting students. All live configuration, browser, hosted Auth and load-test gates remain operator tasks until actually run.
