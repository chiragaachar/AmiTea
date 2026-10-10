"use server";
import { db } from "./supabase";
import { revalidatePath } from "next/cache";
import { credentialsSchema, changePasswordSchema } from "./auth-validation";
import { usernameIdentifier } from "./credentials";

export async function authenticate(input: unknown) {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0].message };
  const client = await db();
  if (!client)
    return {
      ok: false,
      message: "amiTea is getting connected. Sign-in will be available soon.",
    };
  const { username, password, intent } = parsed.data;
  const credentials = { email: usernameIdentifier(username), password };
  // No caller-provided email, user ID, role or profile metadata is forwarded.
  const { data, error } =
    intent === "signup"
      ? await client.auth.signUp(credentials)
      : await client.auth.signInWithPassword(credentials);
  if (error || !data.session)
    return {
      ok: false,
      message:
        intent === "signup"
          ? "We couldn’t create this account. Try another username or try again later."
          : "Couldn’t sign in. Check your username and password, or try again later.",
    };
  revalidatePath("/", "layout");
  // Never serialize the Auth user, synthetic identifier or access token.
  return { ok: true, message: "Welcome to amiTea." };
}

export async function changePassword(input: unknown) {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0].message };
  const client = await db();
  if (!client) return { ok: false, message: "Sign-in is not available yet." };
  const {
    data: { user },
    error: sessionError,
  } = await client.auth.getUser();
  if (sessionError || !user)
    return { ok: false, message: "Sign in to continue." };
  // Supabase verifies the current password on the server. No recovery email.
  const { error } = await client.auth.updateUser({
    password: parsed.data.password,
    current_password: parsed.data.currentPassword,
  });
  if (error)
    return {
      ok: false,
      message:
        "Couldn’t change your password. Check your current password and try again.",
    };
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Your password has been changed. Save it somewhere safe.",
  };
}
