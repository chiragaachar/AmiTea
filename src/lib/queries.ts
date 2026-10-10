import "server-only";
import { db } from "./supabase";
import type { Content, Comment } from "./types";
export async function readFeed(
  kind: string,
  params: Record<string, string | undefined> = {},
) {
  const client = await db();
  if (!client)
    return { items: [] as Content[], configured: false, error: false };
  const { data, error } = await client.rpc("feed", {
    kind,
    sort_by: params.sort || "latest",
    category_filter: params.category || "",
    query_text: (params.q || "").slice(0, 100),
    page_number: Number(params.page) || 1,
    status_filter: params.status || "",
  });
  return { items: (data || []) as Content[], configured: true, error: !!error };
}
export async function readPost(id: string) {
  const client = await db();
  if (!client) return null;
  const { data, error } = await client.rpc("post_detail", { post: id });
  if (error)
    throw new Error("This discussion could not be loaded. Please try again.");
  return data as Content | null;
}
export async function readComments(id: string, page: number) {
  const client = await db();
  if (!client) return [];
  const { data, error } = await client.rpc("comments_for", {
    post: id,
    page_number: page,
  });
  if (error) throw new Error("Comments could not be loaded. Please try again.");
  return (data || []) as Comment[];
}
