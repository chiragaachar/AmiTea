# Testing amiTea

## Local automated checks

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

Vitest executes the real migration in PGlite (embedded PostgreSQL), with minimal `auth.users`, `auth.uid()`, anon and authenticated role emulation. It switches between two distinct members and a moderator. Tests verify SQL privileges, RLS flags, public projection privacy, ownership, role spoofing, username identity constraints and account existence, votes, bookmarks, comments/replies, poll integrity/closing, official suggestion status, reports/audit, suspension/reinstatement, rate limits, deletion, pagination and search. Zod tests cover forged fields, invalid input, errors and safe redirects.

These are executable database tests, not text matching against SQL. They **do not** prove hosted Auth, JWT signature verification, PostgREST configuration, password credential verification, connection behavior or concurrent transactions. Keep the hosted checks below as launch gates.

## Browser smoke tests

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright starts a local development server unless `E2E_BASE_URL` points at an existing staging deployment. Projects cover desktop Chrome and Pixel 7 dimensions. Tests cover public navigation, overflow, anonymous account/admin redirects, 404s and keyboard/username/password validation. No test seeds fake production feed records.

These browser tests were authored but **not run in the authoring environment**, which did not expose a permitted browser QA path. They run in the included GitHub Actions job. Browser tests do not yet automate the full signed-in UI workflow; perform the following manual checks against a staging Auth project.

## Hosted API verification

Use a separate staging Supabase project with the migration, two disposable username/password accounts, and a third trusted moderator account. Obtain short-lived bearer JWTs from those **test** accounts using a local Supabase client, the username identifier from `scripts/username-id.mjs`, and `signInWithPassword`. Store them in an ignored `.env.test` file, never logs or committed fixtures:

```text
NEXT_PUBLIC_SUPABASE_URL=your-staging-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-key
TEST_USER_A_JWT=temporary-student-a-token
TEST_USER_B_JWT=temporary-student-b-token
TEST_MOD_JWT=temporary-moderator-token
```

Run:

```bash
node --env-file=.env.test scripts/verify-live.mjs
```

The script creates disposable content, tests safe public fields, raw-table denial, cross-account edit rejection, six simultaneous retries of the same upvote, comments, reports, moderator visibility, polls and suggestions. It deletes its created content afterward. Audit/report remnants remain for normal staging retention; use a dedicated staging project. The script never prints bearer tokens. Do not use real student accounts or production for this check. It does not suspend accounts or delete Auth accounts automatically.

## Manual three-account release check

Use separate browser profiles/devices for A, B and moderator M, and a logged-out private window.

1. Signup each disposable user without an email; sign out and back in on another browser with the same username/password; ensure aliases are random and no login identifier/Auth ID appears in public HTML, RSC props, network responses or content cards.
2. A creates a post; B comments and adds a one-level reply. Attempt a second-level reply via RPC and expect rejection. A edits their own post; B cannot edit/delete it. Owners can edit/delete their comments.
3. Repeat an upvote rapidly and via simultaneous API calls; count stays one. Remove it and count goes to zero. Test suggestion upvotes the same way. Save/unsave as A; B's saved list stays separate.
4. Create a poll; choose one option as A. A cannot vote twice/change votes. Submit an option from another poll and expect a foreign-key rejection. Close or expire the poll and verify new votes fail.
5. Submit a suggestion. Only M can change official status; their explanation displays publicly.
6. B files a report. A cannot see it; M can inspect its preview, hide/restore content, dismiss/resolve the report and inspect the audit reason.
7. Hide a parent post/comment. Public APIs and nested replies must not reveal its text. Lock a discussion; new comments and edits fail.
8. M suspends B. Attempt create, edit, vote, bookmark, report and alias changes through the direct API: all fail. Reinstate and confirm writing resumes.
9. Exercise all rate budgets in staging with disposable users; exceed each by one. Verify a cooldown permits later writes. Do not confuse provider HTTP throttles with the database write budgets.
10. Change an alias, verify old visible contributions update, then attempt another change within seven days and expect rejection.
11. Delete disposable A from Settings, including while restricted. Their contributions and dependent rows disappear; stale credentials cannot write. Confirm the UI signs out. Do not delete the only moderator account.
12. On Android, check focus, dialogs, touch targets, text wrapping, bottom navigation, poll taps, keyboard opening, error recovery and safe-area spacing. Inspect contrast and screen-reader labels with actual assistive technology.
13. Simulate failed network submissions and retries. Drafts must remain after failure; content-creation retries should not duplicate contributions.
14. Change a password with the correct current password; sign out and check the old password fails and the new password works. Try an incorrect current password and a forged signed-out change; both must fail. Confirm case-insensitive username uniqueness and no email/reset-code UI.
15. Inspect production cookies, CSP and no-store headers. Send a cross-origin Server Action request and expect rejection. Confirm privileged pages/actions re-check authorization.

Record actual outcomes, date, commit and provider settings. Do not mark unchecked items as passing.

## 50/100 concurrent visitor load plan

Install k6 separately. Use an isolated **authorized staging deployment**, populated with realistic synthetic campus discussions and votes. No seed dataset is provided as real engagement. Create at least 100 disposable username/password accounts for write traffic, or explicitly label a run read-only.

The harness `tests/load/campus.js` uses a one-minute ramp, five-minute steady load and one-minute ramp-down, with 2–6 seconds think time. Traffic is approximately 95% public reads and 5% authenticated idempotent vote state changes when write configuration is present. It uses one test token per VU to stay within realistic per-account budgets. With no tokens, it intentionally runs read-only and must not be reported as testing writes.

```bash
k6 run -e TARGET_URL=https://YOUR-STAGING-DOMAIN -e VUS=50 \
  --summary-export=load-results-50.json tests/load/campus.js
k6 run -e TARGET_URL=https://YOUR-STAGING-DOMAIN -e VUS=100 \
  --summary-export=load-results-100.json tests/load/campus.js
```

For mixed traffic, supply `TOKEN_FILE` (a JSON array of one bearer token per VU), `SUPABASE_URL`, `PUBLIC_KEY`, and a dedicated public `POST_ID` using your local secret environment mechanism. Never commit token files or paste them into shared command logs. The `-e` examples above contain only public addresses/counts. Use test-only credentials. Abort if you approach provider quotas or affect other users.

Measure p50/p95/p99 HTTP latency, error rate, failed writes, achieved requests/sec, Vercel CPU/memory/invocations/transfer, Supabase CPU/egress/database size, slow-query timings and connection pressure. Use Supabase query inspection/`EXPLAIN (ANALYZE, BUFFERS)` on bounded feed functions in staging. Compare fresh and warm runs; report fixture sizes, region and plan.

Harness targets are p95 below 1.5 seconds and error/failed-write rate below 1%; these are **test goals, not measured results or service guarantees**. Determine actual launch thresholds with the operator. Investigate failures before increasing load. Successful microbenchmarks in PGlite are not a substitute for this test.

## Fresh-install schema consistency

`tests/schema-parity.test.ts` executes the SQL Editor schema and single initial migration in separate PostgreSQL instances and compares their schema/security definitions. Run `npm run schema:build` after changing migrations, then `npm test`. Never apply the fresh-install SQL and initial migration copy to the same installed database.
