# amiTea launch checklist

## Required configuration

- [ ] Confirm hosting eligibility. No email-delivery service is needed for accounts.
- [ ] Choose the operator, moderator team, support inbox and escalation/appeal process.
- [ ] Review current Next.js/React security advisories and upgrade the pinned baseline as needed.
- [ ] Create separate staging and production Supabase projects with the intended regions.
- [ ] Run the complete `supabase/schema.sql` once on the new project and inspect RLS, function allowlists and private schema exposure.
- [ ] Configure username/password Auth with Confirm email OFF, password minimum 15, rate limits and exact site URLs.
- [ ] Acknowledge that usernames do not verify enrollment and there is no automatic password recovery.
- [ ] Bootstrap the first administrator through trusted SQL after verifying their identity.
- [ ] Set all application environment variables in the correct Vercel environments.
- [ ] Replace/review operator-specific privacy and terms language and publish support contact.

## Verification gates

- [ ] Install from the lockfile; lint, strict type check, database tests and production build pass.
- [ ] Browser tests pass on desktop and Android.
- [ ] Complete manual keyboard, screen-reader, contrast and mobile form review.
- [ ] Live PostgREST verification passes with two member accounts and a moderator.
- [ ] Test account deletion and all restriction/moderation paths with disposable users.
- [ ] Confirm no passwords, login identifiers or account IDs leak through public content/HTML/API responses.
- [ ] Review CSP, secure cookies, CSRF rejection, private caching and failure states in production.
- [ ] Run and record 50/100-VU load tests, including real write traffic; inspect query costs.
- [ ] Complete an independent security review commensurate with the launch size.

## Operations gates

- [ ] Set and document retention schedules; schedule the supplied cleanup safely.
- [ ] Establish encrypted backups and a tested restore procedure.
- [ ] Verify private report queue coverage and emergency/escalation wording.
- [ ] Configure quota monitoring and explain downtime/free-plan pauses to operators.
- [ ] Test the final deployed domain, college name, username/password login and support inbox.
- [ ] Record deployment commit, date, region, plan, verification results and rollback procedure.

No external-service gate is pre-checked: those actions were not performed in this delivery.
