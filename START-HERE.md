# amiTea — complete fresh installation

You can deploy this package from zero. No earlier amiTea files, database, deployment or upgrade scripts are needed.

1. Open **DEPLOYMENT.md** at the project root.
2. Create a new Supabase project.
3. Run the entire **supabase/schema.sql** once in SQL Editor.
4. Configure username/password Auth as shown in the guide.
5. Copy `.env.example` to `.env.local`, fill your project values, and run `npm ci` then `npm run dev`.
6. Create your administrator account, complete the checks, push the full source to GitHub, and import it into Vercel.

Students sign up with username, password and password confirmation. They log in with username and password. No student email address, OTP, confirmation link or SMTP setup is required. Supabase's internal password provider uses a generated non-mailbox identifier; the guide explains the provider setting.

This ZIP includes all app source, the complete database schema, environment example, dependency lockfile, tests, CI workflow and deployment documentation. Dependencies are installed by `npm ci`. Your own project credentials must be supplied during setup.

Package: `amiTea-complete-fresh-install.zip` · Version 1.2.0 · 10 October 2026.
