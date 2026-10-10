import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { supabaseConfig } from "./config";
export const db = cache(async () => {
  const config = supabaseConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (items) => {
        try {
          for (const { name, value, options } of items)
            jar.set(name, value, {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
            });
        } catch {
          /* Server Components cannot write; proxy refreshes cookies. */
        }
      },
    },
  });
});
export const session = cache(async () => {
  const client = await db();
  if (!client) return null;
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) return null;
  const { data: profile, error: profileError } = await client.rpc("me");
  if (profileError)
    throw new Error("Your profile could not be loaded. Please try again.");
  return profile as Profile | null;
});
export type Profile = {
  alias: string;
  role: "member" | "moderator" | "admin";
  alias_changed_at: string | null;
  suspension: { expires_at: string; reason: string } | null;
};
