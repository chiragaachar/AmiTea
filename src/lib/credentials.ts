import { createHash } from "node:crypto";
import { usernameSchema } from "./auth-validation";
/** Supabase requires an email-shaped identifier. This reserved .invalid address
 * is an internal username adapter, never a mailbox or a user's email address.
 * This hash is NOT password hashing or encryption; Supabase handles passwords.
 */
export function usernameIdentifier(input: string) {
  const username = usernameSchema.parse(input);
  return `${createHash("sha256").update(`amitea-username-v1:${username}`).digest("hex")}@accounts.amitea.invalid`;
}
