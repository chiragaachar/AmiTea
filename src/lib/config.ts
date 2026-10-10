import { z } from "zod";
const schema = z.object({ url: z.url(), key: z.string().min(10) });
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url && !key) return null;
  const parsed = schema.safeParse({ url, key });
  if (!parsed.success)
    throw new Error("Invalid Supabase configuration. Check .env.local.");
  return parsed.data;
}
export function siteConfig() {
  return z
    .object({
      url: z.url(),
      college: z.string().min(1).max(100),
      support: z.union([z.email(), z.literal("")]),
    })
    .parse({
      url: process.env.SITE_URL || "http://localhost:3000",
      college: process.env.COLLEGE_NAME || "Your campus",
      support: process.env.SUPPORT_EMAIL || "",
    });
}
