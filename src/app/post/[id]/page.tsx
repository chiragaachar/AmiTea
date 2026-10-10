import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { readPost, readComments } from "@/lib/queries";
import { session } from "@/lib/supabase";
import { PostCard, RightRail, Pagination } from "@/components/feed";
import { CommentCard } from "@/components/comments";
import { CommentForm } from "@/components/forms";
export const metadata = { title: "A campus conversation" };
export default async function Post({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const [post, comments, profile] = await Promise.all([
    readPost(id),
    readComments(id, page),
    session(),
  ]);
  if (!post) notFound();
  return (
    <div className="content-layout">
      <section className="feed-column">
        <Link href="/" className="text-link back-link">
          ← Back to campus
        </Link>
        <PostCard item={post} detail />
        <section id="comments" className="comments-section">
          <h2>
            Around the table <span className="muted">{post.comments}</span>
          </h2>
          {post.locked ? (
            <p className="notice">
              This discussion is locked by the moderation team.
            </p>
          ) : profile ? (
            <CommentForm post={id} />
          ) : (
            <p className="notice">
              <Link href="/login" className="text-link">
                Sign in
              </Link>{" "}
              to add your voice.
            </p>
          )}
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              signedIn={!!profile}
              locked={!!post.locked}
            />
          ))}
          {!comments.length && (
            <p className="small-note">
              No comments yet. Be the first to pull up a chair.
            </p>
          )}
          <Pagination
            path={`/post/${id}`}
            params={query}
            page={page}
            count={comments.length}
            size={30}
          />
        </section>
      </section>
      <RightRail />
    </div>
  );
}
