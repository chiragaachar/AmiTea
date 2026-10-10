# amiTea

**Release 1.2.0 · Complete fresh-install package · 10 October 2026**

Start with [START-HERE.md](START-HERE.md) and the complete root-level [DEPLOYMENT.md](DEPLOYMENT.md). This release requires no student email or verification code.

**Your campus. Your stories. Your tea.**

A text-first, pseudonymous college community for fewer than 1,000 students. Public browsing, username-and-password participation, campus discussions, polls, improvement ideas, and private moderation.

## Delivery status

This is a real Next.js + Supabase application, with SQL migrations and live database calls. It is **not deployed or connected to a hosted Supabase project** in this delivery. No credentials were supplied. With no environment configuration, pages display a truthful setup/empty state; they do not invent posts or engagement. Write actions fail safely until configured.

The local database/validation tests pass and a production build was completed. Browser tests, hosted password/session and Supabase RLS/API integration, and 50/100-user load tests still require the environments described in [TESTING.md](docs/TESTING.md). See the precise evidence and limits in [VERIFICATION.md](docs/VERIFICATION.md). Do not treat this as launch approval.

## What is implemented

- Dark charcoal and tea-amber design, optional session-only light theme, responsive sidebar and mobile bottom navigation, accessible Radix dialogs, notifications, keyboard focus, loading, empty, error and 404 states.
- Username/password signup and login with Supabase Auth, no real email or verification codes; password changes with current-password verification; verified server sessions; random aliases; weekly alias regeneration; sign-out; account deletion.
- Public, paginated post feed; full-text search; category filters; latest, most-supported and time-decayed trending sorting.
- Post creation, author editing/deletion, confession mode, votes, bookmarks, shareable URLs, paginated comments and one-level replies.
- Poll creation with 2–6 unique options, optional closing time, single-choice voting and always-public counts/percentages.
- Suggestions with categories, upvotes, official moderator-controlled statuses and public explanations.
- Private reports, moderator report queue, content hide/remove/restore, discussion lock, poll close, seven-day account suspension/reinstatement, mandatory reasons and audit history.
- SQL-enforced ownership, constraints, account checks, rate limits and privileges. No browser database, service-role key, uploads, Realtime, chat, tracking or paid API.
- Privacy/terms/community templates, deployment instructions, security/launch checklists, unit/database tests, hosted API verification script, Playwright smoke tests and a k6 load harness.

Google OAuth and a PWA are optional in the brief and are not enabled. Author poll editing is deliberately omitted because changing voted options would invalidate results; authors may delete their polls. Current activity shows posts and comments; own polls/suggestions remain manageable in their boards.

## Stack and versions

Exact versions are pinned in `package.json` and `package-lock.json`. The checked baseline uses Next.js 16.4.0 (App Router), React 19.3.0, TypeScript 6.0.3 (strict), Tailwind 4.3.3, Radix Dialog 1.2.0, Lucide 1.54.0, Supabase JS 2.117.3 / SSR 0.12.7, Zod 4.6.5, Vitest 5.0.3, PGlite 0.5.8 and Playwright 1.64.0. Node 22 or later is required; Node 22 LTS is used in CI. Native form validation and Zod cover these short forms, so React Hook Form is unnecessary.

**Release review, checked 9 October 2026:** Next.js has announced an upstream security update for 14 October 2026 addressing critical/high issues. Recheck [Next.js security announcements](https://nextjs.org/blog/security) and upgrade to the applicable patched release before public launch. A clean npm audit is not a guarantee that no vulnerabilities exist.

## Structure

```text
src/app/                     App Router pages, error states, shared CSS
src/app/[section]/           Feed boards, account, authentication, policy pages
src/app/post/[id]/           Individual discussions
src/app/admin/               Server-protected moderation routes
src/components/              Shared accessible controls and feature UI
src/lib/                     Session checks, database calls, Zod schemas/actions
src/proxy.ts                 Session refresh, nonce CSP, private cache headers
supabase/schema.sql          Complete fresh-install schema and bounded RPC API
supabase/migrations/         Identical initial schema for migration tooling
supabase/maintenance.sql      Retention cleanup for trusted operators
scripts/verify-live.mjs       Staging PostgREST/Auth integration verification
tests/                       Validation, embedded PostgreSQL, Playwright, k6
.github/workflows/checks.yml  Checks, build and public browser smoke tests
```

## Quick local start

1. Install Node.js 22 LTS or later and Git. Extract this project into a directory you own.
2. In that directory run `npm ci`.
3. Copy `.env.example` to `.env.local`. Leave both Supabase fields empty only to inspect the disconnected UI.
4. Create and configure a Supabase project using [DEPLOYMENT.md](docs/DEPLOYMENT.md), then fill the project URL and **public anon/publishable key**. No service-role key is needed by this app.
5. Run `npm run dev` and open `http://localhost:3000`.
6. Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` before deployment. Run `npm start` to serve the production build.

Environment variables:

| Variable                        | Purpose                                       | Exposure                                                 |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                          | Public configuration                                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key or compatible publishable key | Public; access remains restricted by database grants/RLS |
| `SITE_URL`                      | Canonical origin, including scheme            | Server configuration; used in metadata                   |
| `COLLEGE_NAME`                  | Configurable campus display name              | Server configuration rendered publicly                   |
| `SUPPORT_EMAIL`                 | Monitored reporting/appeal/privacy contact    | Publicly displayed contact                               |

Partial or malformed Supabase configuration throws a configuration error. Both absent means disconnected mode. Do not place secrets in `NEXT_PUBLIC_*`, commit `.env.local`, or paste credentials into issue descriptions. The `.env.example` intentionally contains no service-role variable because the app does not need it.

## Database and security model

For your new Supabase project, run the complete `supabase/schema.sql` once, following the root DEPLOYMENT.md. This creates all 13 public tables, private rate counters, indexes, constraints, Auth triggers, RLS, trusted write functions, and safe read projections with username/password accounts from the start. The sole file in `supabase/migrations` is the identical initial schema for automated tooling, not an extra setup step. See [USERNAME-AUTH.md](docs/USERNAME-AUTH.md) for how usernames map to Supabase's password provider.

The public API is deliberately **RPC-only**. All base tables have RLS enabled and table access is revoked from `anon` and `authenticated`. Owner/moderator SELECT policies provide defense in depth; no direct INSERT/UPDATE/DELETE policy allows bypassing the write functions. Public reads go through bounded functions that explicitly require visible content and return only safe columns. This differs from direct public-table SELECT policies so internal author IDs cannot leak through PostgREST `select=*` or joins. Do not add raw table grants when integrating another client.

Every exposed write checks the JWT-derived `auth.uid()`, account existence, suspension, input constraints and rate budget. SECURITY DEFINER functions have an empty search path and fully qualified table/function references. The public execute allowlist is explicit. See [SECURITY.md](docs/SECURITY.md) for the trust boundary, review checklist and limitations.

No browser receives login usernames, internal Auth identifiers or account IDs as public application props. Moderator-only data intentionally includes internal account references, but never login identifiers or password hashes. The project owner can access Auth information in Supabase; this is pseudonymity, not guaranteed untraceability.

### Ranking and query costs

Trending considers posts from the last 30 days:

`score = (votes + 2 × visible_comments + 1) / (age_hours + 2)^1.5 + recent_comment_bonus`

The bonus is 0.15 if a visible comment was added in the last six hours. Older posts decay instead of permanently winning. Sorting uses database aggregate counts over indexed votes/comments. Latest/top lists return 20 cards, comment lists 30, and moderation lists 20. Offsets are clamped to 500 pages. Search uses a GIN full-text index with English stemming. Poll results are intentionally public, so there is no client-only result secrecy.

For the initial small community, indexed aggregate queries are simpler than mutable counters and avoid count races. Trending/top aggregation still scales with candidate data; inspect query plans as content grows. Move to a maintained scoring table/materialized aggregate if measured costs require it. There is no client-side N+1 fetching of vote records.

Pages are dynamically rendered because they contain session-aware buttons and ownership indicators. `Cache-Control: private, no-store` avoids shared-cache identity leaks. `React.cache` deduplicates session/client work within a server render. Public caching is a future optimization that must separate truly anonymous projections first. No Realtime or repeated polling runs.

### Limits and configuration

Successful content creations share a 12/hour per-account budget; edits/deletes 40/hour; votes/bookmarks 120/hour; reports 5/hour. Alias changes are limited to once per seven days. All use database transactions and bounded persistent counters. Invalid requests that roll back do not consume a successful-write budget. Auth signup/password/session rate limits are supplied by Supabase. Server-side calls share hosting egress IPs; load-test those limits before launch. Anonymous read volumetric abuse should be handled with Vercel/Supabase controls and monitoring.

Titles/questions: 3–160 characters; posts/suggestions: 1–5,000; comments: 1–2,000; poll descriptions: up to 2,000; option labels: 1–100; report/moderation descriptions: up to 2,000. To change limits, update `src/lib/validation.ts`, relevant HTML attributes and a new database migration together. Change SQL rate budgets with a new migration. No client-supplied role, count, owner or moderation flag is trusted.

## Free-tier capacity and operational reality

Current reference figures checked 9 October 2026; verify again at deployment:

| Service                    | Included allowances / restrictions                                                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supabase Free              | 500 MB database; 50,000 monthly active Auth users; 5 GB uncached and 5 GB cached egress; 1 GB file storage; two active projects; pause after a week of inactivity                       |
| Supabase optional services | Published Free allowances include 2 million Realtime messages, 200 peak Realtime connections and 500,000 Edge Function invocations; this app uses none of them                          |
| Vercel Hobby               | 100 GB Fast Data Transfer; 10 GB Fast Origin Transfer; 1 million CDN requests; 1 million function invocations; 4 active CPU-hours; 360 GB-hours provisioned memory; 100 deployments/day |
| Vercel eligibility         | Hobby is for personal, non-commercial use. An institutional deployment is not automatically eligible. Confirm with Vercel; a suitable paid plan would exceed the ₹0 target              |
| Email delivery             | Not used for accounts. No SMTP setup, mailbox, OTP, or password-reset email is required. `SUPPORT_EMAIL` is only an optional operator contact address.                                  |

Sources: [Supabase pricing](https://supabase.com/pricing), [Supabase password Auth](https://supabase.com/docs/guides/auth/passwords), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel fair use](https://vercel.com/docs/limits/fair-use-guidelines).

The design can fit a small personal community on free allowances; **₹0 public operation is not guaranteed**, especially for institutional hosting eligibility. No storage uploads, Edge Functions or Realtime are provisioned. There is no guaranteed uptime or concurrent-user capacity. Supabase Free does not provide the paid backup/PITR guarantees; maintain a tested, encrypted export/restore process. Observe provider retention policies for infrastructure logs and backups.

## Next steps and roadmap

Follow [DEPLOYMENT.md](docs/DEPLOYMENT.md) and [LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md). Future work, if justified by use: reviewed legal/operator details; stricter age/eligibility policy; optional OAuth; verified official announcements; multilingual search; privacy-preserving aggregate caching; configurable suspension durations; deletion/export request workflow; independent accessibility/security review. Do not add uploads, DMs or live chat without a new abuse/security review.
