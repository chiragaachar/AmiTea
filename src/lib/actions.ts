"use server";
import { db, session } from "./supabase";
import {
  mutations,
  moderation,
  safeMessage,
  type MutationKind,
} from "./validation";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./types";
export async function mutate(
  kind: MutationKind,
  input: unknown,
): Promise<ActionResult> {
  if (!Object.hasOwn(mutations, kind))
    return { ok: false, message: "Unknown action." };
  const parsed = mutations[kind].safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0].message };
  const client = await db();
  if (!client)
    return {
      ok: false,
      message:
        "amiTea is waiting for its campus connection. Please check back soon.",
    };
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return { ok: false, message: "Sign in to continue." };
  const { data, error } = await client.rpc("mutate", {
    kind,
    payload: parsed.data,
  });
  if (error) return { ok: false, message: safeMessage(error) };
  if (kind === "delete_account") await client.auth.signOut();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message:
      kind === "report"
        ? "Report sent privately to the moderation team."
        : kind === "delete_account"
          ? "Your account and contributions have been deleted."
          : "All set. Your change is saved.",
    id: data?.id,
  };
}
export async function moderate(input: unknown): Promise<ActionResult> {
  const parsed = moderation.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: parsed.error.issues[0].message };
  const profile = await session();
  if (!profile || profile.role === "member" || profile.suspension)
    return { ok: false, message: "Moderator access required." };
  const client = await db();
  if (!client) return { ok: false, message: "Connection unavailable." };
  const { error } = await client.rpc("moderate", { payload: parsed.data });
  if (error) return { ok: false, message: safeMessage(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Moderation action recorded." };
}
export async function signOut() {
  const client = await db();
  if (client) await client.auth.signOut();
  revalidatePath("/", "layout");
}
