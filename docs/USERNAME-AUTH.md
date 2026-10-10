# Username and password, without email

Students register with a private username and password, then sign in with the same credentials on any device. There are no email fields, OTPs, confirmation messages, SMTP dependency or email password resets. Public aliases remain independent and can be regenerated without changing the login username.

## Supabase compatibility adapter

Supabase's password API accepts an email or phone identifier, not a native username. To retain its password hashing and session security without collecting either contact detail, the **server** computes:

```text
normalized = trim(username).toLowerCase()
identifier = hex(SHA-256("amitea-username-v1:" + normalized))
             + "@accounts.amitea.invalid"
```

The domain is reserved `.invalid`, not a mailbox or a domain to purchase. This is an internal adapter, not email authentication from the student's perspective. No real user email is generated, requested or used. Supabase's Email/password provider must remain enabled with **Confirm email OFF** so a password signup returns a session immediately. The app never calls OTP, magic-link, confirmation or password-reset APIs. No service-role key or extra secret is required.

The deterministic identifier is **not encryption**, a secret, or the password hash. It does not make a username unguessable to an administrator with Auth access. It avoids putting the raw login username into Auth's identifier or public app state. Supabase hashes/checks the actual password; amiTea does not store or implement password hashes. API role grants continue to prevent public reads of profiles and credentials. Server actions return only success/errors, never provider user objects, tokens or identifiers.

Usernames are 3–24 ASCII letters/numbers/underscores and case-insensitive. New passwords are 15–64 characters and at most 72 UTF-8 bytes, with no trimming or forced character classes. Set the same minimum length in Supabase's password settings. Database triggers reject new accounts outside the internal identifier namespace and prohibit changing an existing Auth identifier via the public Auth API. The server validates username shape before deriving identifiers. Provider rate limits protect signup, password token and account-update endpoints; failed authentication returns generic errors.

Settings password changes require an authenticated session and send `current_password` to Supabase's `updateUser`. The provider checks the old password before accepting the new one. The installed SDK supports this field; verify the hosted Auth server behavior before launch. Do not enable provider email-based secure password-change reauthentication or notification emails for this no-mailbox deployment.

## Account recovery and identity limits

There is **no automatic account recovery**. Users are told to save usernames/passwords in a password manager. Knowing a public alias or a claimed username is not sufficient evidence for an administrator reset. No unauthenticated reset endpoint is provided. A future recovery-code feature requires a separate reviewed design.

A username does not establish real-world identity or campus enrollment. Email domain restrictions have been removed intentionally. Multiple-account abuse still requires moderation and platform protections. No promise of one account per real student is made.

## Fresh installation

Run the entire `supabase/schema.sql` once on your new Supabase project, then configure the password provider as documented in the root `DEPLOYMENT.md`. Username/password accounts and identity protections are part of this initial schema. No previous version or account conversion is needed.

## Operator helper

Run `node scripts/username-id.mjs` locally, enter the username, and match its resulting internal identifier in the trusted Supabase Auth dashboard to set up the first moderator. The helper never asks for a password. Do not change the namespace string or mapping algorithm after accounts exist: that would change login lookup.

References: [Supabase password Auth](https://supabase.com/docs/guides/auth/passwords), [signup](https://supabase.com/docs/reference/javascript/auth-signup), [rate limits](https://supabase.com/docs/guides/auth/rate-limits). Hosted Auth integration remains an explicit launch check.
