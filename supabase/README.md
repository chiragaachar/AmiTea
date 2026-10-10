# Database setup for your first deployment

Open `schema.sql`, copy the entire file into your new Supabase project's SQL Editor, and run it once. This creates the complete username/password application database in one transaction.

No earlier database version is required. There is no email-OTP schema or conversion script in this package.

`migrations/202610100001_initial.sql` contains the identical schema for automated migration tooling. Do not run both copies against the same database. The main deployment guide uses only `schema.sql`.

`npm run schema:build` refreshes `schema.sql` from the single initial migration. Tests execute this baseline in embedded PostgreSQL and verify that both copies install the same database definitions.

`maintenance.sql` is a separate operational cleanup script, not an installation step. Read `../DEPLOYMENT.md` for the complete setup.
