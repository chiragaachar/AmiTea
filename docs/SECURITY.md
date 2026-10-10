# amiTea security and privacy review

## Trust boundaries

Browsers are untrusted. Next.js validates action input with Zod and verifies the Supabase user server-side; PostgreSQL revalidates ownership/account existence/constraints so direct Data API calls cannot bypass protection. All public text renders as React text, never HTML. No Markdown HTML, embedded links, rich media, external images or user-supplied script execution is supported.

Table grants are denied to both API roles and RLS is enabled on all 13 exposed-schema tables. Owner/moderator SELECT policies exist as defense in depth, while safe RPC projections implement public browsing. PostgreSQL function ownership is a privileged boundary: never let application members alter schemas, functions, grants, triggers or profiles. Fixed empty search paths and qualified names prevent search-path substitution. The Supabase `postgres` owner remains trusted and can bypass RLS. No service-role key is shipped or required.

| API                                   | Allowed callers               | Important restriction                                                               |
| ------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| `feed`, `post_detail`, `comments_for` | anon/authenticated            | Visibility and parent visibility; bounded pagination; no login identifiers/auth IDs |
| `feed` saved/activity modes           | authenticated                 | JWT owner only                                                                      |
| `me`, `my_comments`                   | authenticated                 | Caller's own safe projection                                                        |
| `mutate`                              | authenticated                 | Account existence, suspension, ownership, validation, transactional rate limits     |
| `moderate`, `admin_data`              | authenticated moderator/admin | Role and active-suspension checks; mandatory audit reasons                          |
| Raw public tables, private schema     | none of the API roles         | No direct reads/writes, including profiles, votes, reports and audit                |

## Integrity and concurrency

Composite primary keys enforce one post/suggestion vote and bookmark per account/item. Poll votes additionally have a composite foreign key ensuring the option belongs to the voted poll. Poll choices cannot be changed in version 1. Vote set/unset is idempotent; the browser never supplies a count. Content creation uses `(author_id, request_id)` uniqueness and a per-account transaction advisory lock so a retry returns the original item.

Writes and rate updates occur in the same database function transaction. Advisory locks serialize each account's writes; the rate table has one row per action bucket/account. Constraints and explicit checks also apply when the browser bypasses Next.js. Counter budgets limit successful writes, not all failed request attempts. Public-read flooding and multi-account abuse need provider-level controls and active moderation; this MVP does not claim to solve them.

Post lock checks and poll-open checks acquire a row share lock. Moderator changes conflict with that lock. A vote/write already in progress may finish before a newly issued restriction takes effect; subsequent calls recheck status. The embedded test engine executes SQL correctly but does not reproduce multi-process network concurrency. The live verification script exercises simultaneous retry requests against actual PostgREST.

## Session, CSRF and browser safety

Supabase SSR cookies are HttpOnly, SameSite=Lax and Secure in production. No browser Supabase client is used. Proxy refresh uses verified Auth calls; actions also call `getUser`, rather than trusting an unverified session cookie. Next.js Server Actions perform Origin/Host checks and POST handling. Direct RPCs need bearer JWTs and do not accept application cookies as authority. No mutating GET endpoints exist.

Responses carry private/no-store headers; private/profile data never enters a public CDN cache. Nonce CSP restricts scripts, objects, framing and base URLs; inline styles are allowed for framework styles and poll bars. Development allows eval; production does not. Additional headers include nosniff, HSTS, referrer restrictions, and disabled camera/microphone/geolocation. HSTS assumes production is HTTPS. User errors are sanitized and credentials are never intentionally logged.

Safe return URLs must be local relative paths and reject protocol-relative, backslash and newline variants. Sign-in uses usernames and passwords with no redirect callback endpoint. Supabase's signup/password/token rate limits remain enabled. Password hashes are managed by Supabase, never application SQL. Account existence does not prove campus enrollment. See USERNAME-AUTH.md for normalization, the internal identifier adapter, password changes and no-recovery limitations.

## Deletion and retention

Account deletion is an explicit authenticated action with typed confirmation. It remains available during suspension. The database deletes the caller's Auth account, cascading through their profile, content, votes and saves. Other users' replies underneath deleted posts/comments also cascade; this is disclosed before confirmation. Reports and audit actor/reporter links are set NULL; audit target references and supplied descriptions may remain until scheduled retention cleanup. Provider backups/logs may retain deleted data; the app does not claim otherwise.

## Security checklist

- [ ] Verify all 13 public tables have RLS and no raw anon/authenticated privileges in the **deployed** project.
- [ ] Run two-member and moderator tests through the real Data API, not only the UI.
- [ ] Confirm each public payload/HTML/RSC stream omits login usernames, internal identifiers, authentication UUIDs and role-bearing profile records.
- [ ] Verify private queues/audit/admin pages reject members and logged-out users.
- [ ] Test owned/unowned edits, all content types, hidden parents, poll deadlines and invalid option membership.
- [ ] Test duplicate votes, rapid request retries, rate budgets and suspended direct RPC calls.
- [ ] Verify role assignment only through trusted SQL/admin procedure.
- [ ] Confirm CSP, session cookies, Origin checks and cache headers on the real deployment.
- [ ] Confirm account deletion, sign-out and denied reuse of deleted-account write authority.
- [ ] Enable staff provider-account MFA and least privilege; app moderator MFA enforcement is future work.
- [ ] Review patched dependency versions/security advisories, not just npm audit.
- [ ] Turn email confirmation OFF, enforce the password minimum in Supabase, and monitor Auth abuse limits.
- [ ] Publish operator identity, legal review, support address and eligibility policy.
- [ ] Schedule retention cleanup, backups and a restore drill.
- [ ] Conduct an independent application security review before broad campus use.

No penetration test or legal compliance certification is implied by these implementation checks.
