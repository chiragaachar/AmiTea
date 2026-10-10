import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { FeedPage, Pagination } from "@/components/feed";
import { AuthForm } from "@/components/auth";
import { Settings } from "@/components/settings";
import { Legal, Help } from "@/components/legal";
import { session, db } from "@/lib/supabase";
const feeds = [
  "explore",
  "trending",
  "confessions",
  "polls",
  "suggestions",
  "saved",
  "activity",
];
const routes = [
  ...feeds,
  "settings",
  "rules",
  "privacy",
  "terms",
  "report",
  "login",
  "signup",
];
export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  return {
    title: section.charAt(0).toUpperCase() + section.slice(1),
    robots: ["settings", "saved", "activity"].includes(section)
      ? { index: false, follow: false }
      : undefined,
  };
}
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { section } = await params;
  if (!routes.includes(section)) notFound();
  const query = await searchParams;
  if (["settings", "saved", "activity"].includes(section) && !(await session()))
    redirect(`/login?next=/${section}`);
  if (section === "activity" && query.tab === "comments") {
    const client = await db();
    const page = Number(query.page) || 1;
    const { data, error } = await client!.rpc("my_comments", {
      page_number: page,
    });
    if (error) throw new Error("Could not load your comments.");
    const comments = data as {
      id: string;
      post_id: string;
      body: string;
      status: string;
    }[];
    return (
      <div className="document-page">
        <h1>Your comments</h1>
        <Link href="/activity" className="text-link">
          View your posts
        </Link>
        {comments.map((c) => (
          <article className="post-card" key={c.id}>
            <p className="post-body">{c.body}</p>
            <p className="small-note">{c.status}</p>
            <Link href={`/post/${c.post_id}`} className="text-link">
              Open conversation →
            </Link>
          </article>
        ))}
        {!comments.length && <p>No comments yet. Join a conversation.</p>}
        <Pagination
          path="/activity"
          params={query}
          page={page}
          count={comments.length}
          size={20}
        />
      </div>
    );
  }
  if (feeds.includes(section))
    return <FeedPage path={`/${section}`} params={query} />;
  if (section === "settings") return <Settings profile={(await session())!} />;
  if (["rules", "privacy", "terms"].includes(section))
    return <Legal section={section} />;
  if (section === "report") return <Help />;
  return <AuthForm signup={section === "signup"} next={query.next} />;
}
