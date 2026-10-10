# Verification record

Updated 10 October 2026 (UTC), release 1.2.0. These results apply to the delivered source and lockfile, not an externally deployed service.

| Check                                       | Actual outcome                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Dependency installation                     | Passed; exact installed package versions pinned; npm lockfile included                                 |
| ESLint                                      | Passed, zero errors and zero warnings on final source                                                  |
| Strict TypeScript                           | Passed (`tsc --noEmit`)                                                                                |
| Vitest                                      | **37 tests passed** across four test files                                                            |
| Database execution                          | Full SQL migration executed in PGlite PostgreSQL with two members and one moderator                    |
| Production build                            | Passed with Next.js 16.4.0 default Turbopack on the username revision; the earlier version also built with webpack                   |
| Production dependency audit                 | `npm audit --omit=dev`: **0 reported vulnerabilities** at check time                                   |
| Live Supabase connection                    | Not configured; no hosted credentials supplied                                                         |
| Hosted username/password authentication     | Not run; needs hosted project and password Auth configuration                                          |
| Hosted PostgREST and JWT checks             | Not run; live verification script supplied                                                             |
| Multi-process concurrent database test      | Not run; embedded engine tests uniqueness/idempotency, hosted script submits simultaneous vote retries |
| Playwright / screenshot / mobile browser QA | Not run; no permitted browser QA facility in this authoring environment                                |
| 50/100 concurrent visitor load tests        | Not run; reproducible k6 harness and measurement plan supplied                                         |
| Deployment                                  | Not attempted; no Supabase or Vercel project provisioned                                               |
| Independent penetration test / legal review | Not performed                                                                                          |

## Build environment limitation

The workspace prohibits the `/proc` memory read used by Node's `process.memoryUsage()`. Both initial bundlers stopped with `uv_resident_set_memory: ENOENT` before completion. A **local-only preload**, outside the delivered application, allowed Next's build telemetry to read V8 heap statistics and the OS peak-RSS counter instead. With that preload, both production bundlers compiled successfully. It changes memory telemetry only, not application authorization or production source. A final default-Turbopack build was repeated after the username/password revision.

Normal supported Node/Vercel environments should run `npm run build` without this preload. It is not included in app scripts or deployed output. If your own environment has a similar sandbox restriction, use a normal supported build host; do not disable security controls to obtain process metrics.

## Important remaining release work

The app is implemented and locally checked but **the MVP cannot be declared operationally complete until external configuration and live release gates pass**. Follow DEPLOYMENT.md and LAUNCH-CHECKLIST.md. Especially verify real auth deletion/session revocation behavior, username/password Auth and current-password checks, provider grants/schema exposure, browser rendering and quota behavior.

The npm audit result is a point-in-time advisory database result, not a security guarantee. The official Next.js site announced an upstream critical/high security release for 14 October 2026; review the current announcement and use the applicable patched versions before public launch.

## Username/password revision

36 passing tests include mocked provider calls for signup, login and current-password changes; those mocks do not prove actual hosted Auth behavior. The complete initial SQL migration executes in the database tests. Database tests confirm no email-verification prerequisite, real-email signup rejection, immutable internal login identifiers and preserved privacy/ownership/moderation protections. Fresh live sign-in and browser verification remain required. No live deployment was changed.

## Complete fresh-install package

This package contains one complete username/password initial migration and an identical `supabase/schema.sql` for the SQL Editor. It contains no historical email-auth migrations or account-conversion instructions. The deployment guide begins with a new empty Supabase project. The schema-parity test compares the two copies in separate PostgreSQL instances. Runtime application code is unchanged from the successfully built username/password implementation. Hosted Auth, browser and deployment checks remain unrun here.

Fresh-install package validation: all 37 tests, ESLint and strict TypeScript passed after consolidating the initial schema and rewriting the deployment documentation.
