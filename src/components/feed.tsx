import Link from "next/link";
import {
  Coffee,
  ArrowUpRight,
  ShieldCheck,
  MessageCircle,
  Lightbulb,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { CardActions, Composer } from "./forms";
import { PollOptions } from "./poll";
import type { Content } from "@/lib/types";
import { readFeed } from "@/lib/queries";
import { session } from "@/lib/supabase";
import { categories, statuses, suggestionCategories } from "@/lib/validation";
export function when(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}
export function PostCard({
  item,
  type = "post",
  detail = false,
}: {
  item: Content;
  type?: "post" | "poll" | "suggestion";
  detail?: boolean;
}) {
  return (
    <article className={`post-card ${detail ? "detail-card" : ""}`}>
      <div className="post-meta">
        <div className={`avatar ${item.confession ? "ghost" : ""}`}>
          {item.confession ? (
            <MessageCircle size={18} />
          ) : (
            item.alias.slice(0, 1)
          )}
        </div>
        <span className="alias">{item.alias}</span>
        <span className="meta-dot">·</span>
        <time dateTime={item.created_at}>{when(item.created_at)}</time>
        <span className={`category-tag ${type === "suggestion" ? "sage" : ""}`}>
          {type === "poll"
            ? item.status === "closed"
              ? "Poll closed"
              : "Campus poll"
            : item.category}
        </span>
      </div>
      {type === "post" && !detail ? (
        <h2>
          <Link href={`/post/${item.id}`}>{item.title}</Link>
        </h2>
      ) : (
        <h2>{item.title}</h2>
      )}
      <p className="post-body">{item.body}</p>
      {!detail && type === "post" && item.body.length >= 420 && (
        <Link className="text-link read-more" href={`/post/${item.id}`}>
          Keep reading <ArrowRight size={14} />
        </Link>
      )}
      {item.locked && (
        <p className="small-note">
          This conversation is locked. You can still read and report it.
        </p>
      )}
      {item.status && ["hidden", "removed"].includes(item.status) && (
        <p className="status-pill">{item.status} by moderation</p>
      )}
      {type === "poll" && <PollOptions item={item} />}{" "}
      {type === "suggestion" && (
        <div className="suggestion-status">
          <span className="status-pill">
            <span className="online-dot" />
            {item.official_status}
          </span>
          {item.response && (
            <p>
              <strong>Moderator response</strong>
              <br />
              {item.response}
            </p>
          )}
        </div>
      )}
      <CardActions item={item} type={type} detail={detail} />
    </article>
  );
}
export function RightRail() {
  return (
    <aside className="right-rail">
      <div className="rail-card welcome-card">
        <span className="eyebrow">A SEAT AT THE TABLE</span>
        <div className="tea-art" aria-hidden="true">
          <div className="steam s1" />
          <div className="steam s2" />
          <div className="tea-cup">
            <span>tea.</span>
          </div>
          <div className="saucer" />
        </div>
        <h3>
          Same campus.
          <br />A thousand stories.
        </h3>
        <p>
          The late-night thoughts. The tiny wins. The things we’re all thinking.
        </p>
        <Link href="/signup" className="text-link">
          You belong here <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="rail-card">
        <div className="rail-title">
          <ShieldCheck size={18} />
          <h3>Good tea. Good company.</h3>
        </div>
        <p>A few things that make this space ours.</p>
        <ol className="rules-list">
          <li>
            <span>01</span>Be kind. There’s a person behind every alias.
          </li>
          <li>
            <span>02</span>Keep names and private details out of it.
          </li>
          <li>
            <span>03</span>Disagree with ideas, not people.
          </li>
        </ol>
        <Link href="/rules" className="text-link">
          Our community guidelines <ArrowUpRight size={15} />
        </Link>
      </div>
      <Link href="/suggestions" className="idea-card">
        <Lightbulb size={22} />
        <div>
          <h3>A better campus starts small.</h3>
          <p>Have an idea? Let’s hear it.</p>
        </div>
        <ArrowUpRight size={18} />
      </Link>
      <p className="rail-footnote">
        Pseudonymous, always human.
        <br />
        Built for conversations that matter.
      </p>
    </aside>
  );
}
const headings: Record<
  string,
  { eyebrow: string; title: string; description: string }
> = {
  "/": {
    eyebrow: "THE CAMPUS COMMON ROOM",
    title: "Your campus. Your stories.",
    description: "A little honesty. A little chaos. A whole lot of tea.",
  },
  "/explore": {
    eyebrow: "FOLLOW YOUR CURIOSITY",
    title: "Find your kind of conversation.",
    description: "From lecture halls to late-night thoughts. Search it all.",
  },
  "/trending": {
    eyebrow: "FRESHLY BREWED",
    title: "The campus is talking about…",
    description:
      "The conversations picking up steam, with room for something new.",
  },
  "/confessions": {
    eyebrow: "OFF YOUR CHEST",
    title: "Some things need to be said.",
    description: "Your experiences. Your stories. A little less alone.",
  },
  "/polls": {
    eyebrow: "EVERY VOICE COUNTS",
    title: "What’s the campus saying?",
    description: "Big debates. Small decisions. Let the campus weigh in.",
  },
  "/suggestions": {
    eyebrow: "SMALL IDEAS. REAL CHANGE.",
    title: "Make campus a little better.",
    description: "One idea at a time. Share it, support it, see where it goes.",
  },
  "/saved": {
    eyebrow: "YOUR LITTLE COLLECTION",
    title: "Worth coming back to.",
    description: "The conversations you’ve tucked away for later.",
  },
  "/activity": {
    eyebrow: "YOUR CORNER OF AMITEA",
    title: "The conversations you started.",
    description: "Your contributions, all in one place.",
  },
};
export async function FeedPage({
  path,
  params,
}: {
  path: string;
  params: Record<string, string | undefined>;
}) {
  const profile = await session();
  const kind =
    path === "/polls"
      ? "polls"
      : path === "/suggestions"
        ? "suggestions"
        : path === "/saved"
          ? "saved"
          : path === "/activity"
            ? "activity"
            : "posts";
  const type =
    kind === "polls" ? "poll" : kind === "suggestions" ? "suggestion" : "post";
  const normalized = {
    ...params,
    sort: path === "/trending" ? "trending" : params.sort,
    category: path === "/confessions" ? "Confessions" : params.category,
  };
  const { items, configured, error } = await readFeed(kind, normalized);
  const heading = headings[path];
  const page = Math.max(1, Number(params.page) || 1);
  const query = (changes: Record<string, string>) => {
    const q = new URLSearchParams(
      Object.entries({ ...params, ...changes }).filter(
        (entry): entry is [string, string] => !!entry[1],
      ),
    );
    return `${path}?${q}`;
  };
  return (
    <div className="content-layout">
      <section className="feed-column">
        <div className="page-intro">
          <div className="eyebrow">
            <span className="online-dot" />
            {heading.eyebrow}
          </div>
          <h1>
            {heading.title}
            {path === "/" && (
              <>
                <br />
                <em>Your tea.</em>
                <span className="intro-spark">
                  <Sparkles size={34} />
                </span>
              </>
            )}
          </h1>
          <p>{heading.description}</p>
        </div>
        {path === "/" && (
          <div className="welcome-strip">
            <ShieldCheck size={18} />
            <span>
              A public space. A private identity.{" "}
              <Link href="/privacy">
                Here’s how it works <ArrowUpRight size={13} />
              </Link>
            </span>
          </div>
        )}
        <div className="feed-heading">
          <div>
            <h2>
              {path === "/"
                ? "What’s happening on campus?"
                : type === "poll"
                  ? "The campus vote"
                  : type === "suggestion"
                    ? "The idea board"
                    : "The conversation"}
            </h2>
            <p>
              {profile
                ? `Welcome back, ${profile.alias}.`
                : "Pull up a chair. Stay a while."}
            </p>
          </div>
          <Composer type={type} signedIn={!!profile} />
        </div>
        {["/explore", "/", "/trending", "/confessions"].includes(path) && (
          <form className="search-form" action={path}>
            <label className="sr-only" htmlFor="feed-search">
              Search conversations
            </label>
            <input
              id="feed-search"
              name="q"
              maxLength={100}
              defaultValue={params.q}
              placeholder="Find a conversation…"
            />
            <button className="button secondary" type="submit">
              Search
            </button>
          </form>
        )}
        <div className="feed-toolbar">
          <div className="sort-tabs" aria-label="Sort feed">
            {(path === "/trending"
              ? [["trending", "Trending"]]
              : [
                  ["latest", "Latest"],
                  [
                    "top",
                    type === "suggestion" ? "Most supported" : "Most upvoted",
                  ],
                ]
            ).map(([value, label]) => (
              <Link
                className={
                  (normalized.sort || "latest") === value ? "selected" : ""
                }
                key={value}
                href={query({ sort: value, page: "1" })}
              >
                {label}
              </Link>
            ))}
          </div>
          {type !== "post" && (
            <form action={path}>
              <select
                aria-label="Filter status"
                name="status"
                defaultValue={params.status || ""}
              >
                <option value="">All statuses</option>
                {(type === "poll" ? ["open", "closed"] : statuses).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <button className="quiet-button" type="submit">
                Apply
              </button>
            </form>
          )}
        </div>
        {type !== "poll" && path !== "/confessions" && (
          <nav className="category-chips" aria-label="Categories">
            <Link
              href={query({ category: "", page: "1" })}
              className={!params.category ? "selected" : ""}
            >
              All tea
            </Link>
            {(type === "suggestion" ? suggestionCategories : categories).map(
              (c) => (
                <Link
                  key={c}
                  href={query({ category: c, page: "1" })}
                  className={params.category === c ? "selected" : ""}
                >
                  {c}
                </Link>
              ),
            )}
          </nav>
        )}
        {error ? (
          <div className="empty-state" role="alert">
            <Coffee />
            <h3>The kettle needs a moment.</h3>
            <p>We couldn’t load the feed. The service may be busy or paused.</p>
            <Link href={path} className="button secondary">
              Try again
            </Link>
          </div>
        ) : items.length ? (
          items.map((item) => (
            <PostCard key={item.id} item={item} type={type} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Coffee size={32} />
            </div>
            <span className="eyebrow">A FRESH POT OF POSSIBILITIES</span>
            <h3>{params.q ? "No conversations found." : "It’s quiet here."}</h3>
            <p>
              {!configured
                ? "amiTea is getting ready for your campus. Conversations will appear once the community is connected."
                : params.q
                  ? "Try another word or clear your filters."
                  : "Start the conversation. Your story might be just what someone needs to hear."}
            </p>
            {configured && <Composer type={type} signedIn={!!profile} />}
            <Link className="text-link" href="/rules">
              Make yourself at home <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        <Pagination
          path={path}
          params={params}
          page={page}
          count={items.length}
          size={20}
        />
        {path === "/activity" && (
          <Link href="/activity?tab=comments" className="button secondary">
            View your comments
          </Link>
        )}
      </section>
      <RightRail />
    </div>
  );
}
export function Pagination({
  path,
  params,
  page,
  count,
  size,
}: {
  path: string;
  params: Record<string, string | undefined>;
  page: number;
  count: number;
  size: number;
}) {
  function url(n: number) {
    const q = new URLSearchParams(
      Object.entries(params).filter((a): a is [string, string] => !!a[1]),
    );
    q.set("page", String(n));
    return `${path}?${q}`;
  }
  return page > 1 || count >= size ? (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 && (
        <Link className="button secondary" href={url(page - 1)}>
          Previous
        </Link>
      )}
      <span>Page {page}</span>
      {count >= size && page < 500 && (
        <Link className="button secondary" href={url(page + 1)}>
          Next
        </Link>
      )}
    </nav>
  ) : null;
}
