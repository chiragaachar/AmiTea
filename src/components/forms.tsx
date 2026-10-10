"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  ArrowUp,
  Bookmark,
  Flag,
  Share2,
  Trash2,
  Pencil,
  MessageCircle,
  Send,
} from "lucide-react";
import { Modal, Submit, useToast } from "./ui";
import { mutate } from "@/lib/actions";
import {
  categories,
  suggestionCategories,
  reasons,
  type MutationKind,
} from "@/lib/validation";
import type { Content } from "@/lib/types";
export function Composer({
  type = "post",
  signedIn,
  edit,
  trigger,
}: {
  type?: "post" | "poll" | "suggestion";
  signedIn: boolean;
  edit?: Content;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const notify = useToast(),
    router = useRouter();
  const request = useRef("");
  if (!signedIn)
    return (
      <Link className="button primary" href="/login">
        <Plus size={18} />
        {type === "poll"
          ? "Create a poll"
          : type === "suggestion"
            ? "Share an idea"
            : "Spill the tea"}
      </Link>
    );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    request.current ||= crypto.randomUUID();
    let payload: Record<string, unknown> = {
      request_id: request.current,
      title: form.get("title"),
      body: form.get("body"),
      category: form.get("category"),
      confession: form.get("confession") === "on",
    };
    if (type === "poll")
      payload = {
        request_id: request.current,
        question: form.get("title"),
        description: form.get("body"),
        options: String(form.get("options"))
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        closes_at: form.get("closes_at")
          ? new Date(String(form.get("closes_at"))).toISOString()
          : null,
      };
    if (edit)
      payload = {
        id: edit.id,
        title: form.get("title"),
        body: form.get("body"),
      };
    try {
      const result = await mutate(
        `${edit ? "edit" : "create"}_${type}` as MutationKind,
        payload,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      request.current = "";
      notify(result.message);
      if (type === "post" && result.id) router.push(`/post/${result.id}`);
    } catch {
      setError("Connection interrupted. Your draft is still here. Try again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      trigger={
        trigger || (
          <button className="button primary">
            <Plus size={18} />
            {type === "poll"
              ? "Create a poll"
              : type === "suggestion"
                ? "Share an idea"
                : "Spill the tea"}
          </button>
        )
      }
      title={
        edit
          ? "A little edit"
          : type === "poll"
            ? "What’s the campus saying?"
            : type === "suggestion"
              ? "Make campus a little better."
              : "Got something to share?"
      }
      description="Keep it real. Keep it respectful. Your login username is never shown."
    >
      <form onSubmit={submit} className="form-stack">
        <label>
          {type === "poll" ? "Your question" : "Give it a title"}
          <input
            name="title"
            required
            minLength={3}
            maxLength={160}
            defaultValue={edit?.title}
            placeholder={
              type === "poll"
                ? "A question for the campus…"
                : "What’s on your mind?"
            }
          />
        </label>
        <label>
          {type === "poll" ? "A little context (optional)" : "Your story"}
          <textarea
            name="body"
            required={type !== "poll"}
            maxLength={type === "poll" ? 2000 : 5000}
            rows={5}
            defaultValue={edit?.body}
            placeholder="This is your space. Make it a kind one."
          />
        </label>
        {!edit &&
          (type === "poll" ? (
            <>
              <label>
                Options · one per line
                <textarea
                  name="options"
                  rows={4}
                  required
                  placeholder={"Option one\nOption two"}
                  maxLength={606}
                />
              </label>
              <label>
                Closes at (your local time, optional)
                <input name="closes_at" type="datetime-local" />
              </label>
            </>
          ) : (
            <label>
              Find its corner
              <select
                name="category"
                defaultValue={type === "suggestion" ? "Other" : "Campus Life"}
              >
                {(type === "suggestion"
                  ? suggestionCategories
                  : categories
                ).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          ))}
        {!edit && type === "post" && (
          <label className="checkbox">
            <input type="checkbox" name="confession" />
            Confession mode · hide my public alias on this post
          </label>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-footer">
          <span>No names. No personal details.</span>
          <Submit pending={pending}>
            {edit
              ? "Save changes"
              : type === "poll"
                ? "Publish poll"
                : type === "suggestion"
                  ? "Submit idea"
                  : "Let it brew"}{" "}
            <Send size={16} />
          </Submit>
        </div>
      </form>
    </Modal>
  );
}
export function ActionButton({
  kind,
  payload,
  children,
  className = "",
  label,
  pressed,
}: {
  kind: MutationKind;
  payload: unknown;
  children: React.ReactNode;
  className?: string;
  label: string;
  pressed?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const notify = useToast(),
    router = useRouter();
  return (
    <button
      disabled={pending}
      aria-label={label}
      aria-pressed={pressed}
      className={className}
      onClick={async () => {
        if (pending) return;
        setPending(true);
        try {
          const r = await mutate(kind, payload);
          notify(r.message, r.ok);
          if (!r.ok && r.message === "Sign in to continue.")
            router.push("/login");
        } catch {
          notify("Connection interrupted. Please try again.", false);
        } finally {
          setPending(false);
        }
      }}
    >
      {children}
    </button>
  );
}
export function ReportButton({
  id,
  type,
}: {
  id: string;
  type: "post" | "comment" | "poll" | "suggestion";
}) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const notify = useToast();
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button className="icon-button" aria-label={`Report ${type}`}>
          <Flag size={16} />
        </button>
      }
      title="Help keep amiTea kind."
      description="Reports are private and reviewed by the moderation team."
    >
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending) return;
          setPending(true);
          setError("");
          const form = new FormData(e.currentTarget);
          try {
            const r = await mutate("report", {
              id,
              target_type: type,
              reason: form.get("reason"),
              description: form.get("description"),
            });
            if (r.ok) {
              notify(r.message);
              setOpen(false);
            } else setError(r.message);
          } catch {
            setError("Connection interrupted. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          What’s going on?
          <select name="reason">
            {reasons.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label>
          Anything else we should know? (optional)
          <textarea name="description" rows={3} maxLength={2000} />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Submit pending={pending}>Send report</Submit>
        <Link href="/report" className="text-link">
          Reporting, urgent help & appeals
        </Link>
      </form>
    </Modal>
  );
}
export function DeleteButton({
  id,
  type,
  after,
}: {
  id: string;
  type: "post" | "comment" | "poll" | "suggestion";
  after?: string;
}) {
  const [open, setOpen] = useState(false),
    [pending, setPending] = useState(false);
  const notify = useToast(),
    router = useRouter();
  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button className="icon-button" aria-label={`Delete ${type}`}>
          <Trash2 size={16} />
        </button>
      }
      title={`Delete this ${type}?`}
      description="This permanently deletes this contribution and its dependent replies or votes. This cannot be undone."
    >
      <button
        className="button danger"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          try {
            const r = await mutate(`delete_${type}` as MutationKind, { id });
            notify(r.message, r.ok);
            if (r.ok) {
              setOpen(false);
              if (after) router.push(after);
            }
          } catch {
            notify("Could not delete. Please try again.", false);
          } finally {
            setPending(false);
          }
        }}
      >
        Yes, delete {type}
      </button>
    </Modal>
  );
}
export function CardActions({
  item,
  type = "post",
  detail = false,
}: {
  item: Content;
  type?: "post" | "poll" | "suggestion";
  detail?: boolean;
}) {
  const notify = useToast();
  return (
    <div className="card-actions">
      <div className="action-group">
        {type !== "poll" && (
          <ActionButton
            kind={type === "post" ? "vote_post" : "vote_suggestion"}
            payload={{ id: item.id, active: !item.voted }}
            label={item.voted ? "Remove upvote" : "Upvote"}
            pressed={!!item.voted}
            className={`vote-button ${item.voted ? "selected" : ""}`}
          >
            <ArrowUp size={17} />
            {item.votes}
          </ActionButton>
        )}
        {type === "post" && (
          <Link className="comment-link" href={`/post/${item.id}#comments`}>
            <MessageCircle size={17} />
            {item.comments || 0}
            <span> comments</span>
          </Link>
        )}
        {type === "poll" && (
          <span className="muted">
            {item.votes} vote{item.votes === 1 ? "" : "s"}
          </span>
        )}
      </div>
      <div className="action-group">
        {item.is_owner && (
          <>
            {type !== "poll" && (detail || type === "suggestion") && (
              <Composer
                type={type}
                edit={item}
                signedIn
                trigger={
                  <button className="icon-button" aria-label="Edit content">
                    <Pencil size={16} />
                  </button>
                }
              />
            )}
            <DeleteButton
              type={type}
              id={item.id}
              after={detail ? "/" : undefined}
            />
          </>
        )}
        {type === "post" && (
          <>
            <ActionButton
              kind="bookmark"
              payload={{ id: item.id, active: !item.saved }}
              label={item.saved ? "Remove bookmark" : "Save post"}
              pressed={!!item.saved}
              className={`icon-button ${item.saved ? "selected" : ""}`}
            >
              <Bookmark size={17} />
            </ActionButton>
            <button
              className="icon-button"
              aria-label="Share post"
              onClick={async () => {
                try {
                  const url = `${location.origin}/post/${item.id}`;
                  if (navigator.share)
                    await navigator.share({ title: item.title, url });
                  else {
                    await navigator.clipboard.writeText(url);
                    notify("Link copied.");
                  }
                } catch {
                  notify(
                    "Sharing cancelled or unavailable. Copy the URL from the post page.",
                    false,
                  );
                }
              }}
            >
              <Share2 size={16} />
            </button>
          </>
        )}
        <ReportButton type={type} id={item.id} />
      </div>
    </div>
  );
}
export function CommentForm({
  post,
  parent = null,
  edit,
  onDone,
}: {
  post: string;
  parent?: string | null;
  edit?: { id: string; body: string };
  onDone?: () => void;
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const request = useRef(""),
    notify = useToast();
  return (
    <form
      className="form-stack comment-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        const el = e.currentTarget;
        const data = new FormData(el);
        request.current ||= crypto.randomUUID();
        setPending(true);
        setError("");
        try {
          const r = await mutate(
            edit ? "edit_comment" : "create_comment",
            edit
              ? { id: edit.id, body: data.get("body") }
              : {
                  request_id: request.current,
                  post_id: post,
                  parent_id: parent,
                  body: data.get("body"),
                },
          );
          if (!r.ok) {
            setError(r.message);
            return;
          }
          el.reset();
          request.current = "";
          notify("Your words are in.");

          onDone?.();
        } catch {
          setError("Connection interrupted. Your draft is still here.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        {edit ? "Edit your comment" : parent ? "Your reply" : "Add your voice"}
        <textarea
          name="body"
          rows={3}
          maxLength={2000}
          required
          defaultValue={edit?.body}
          placeholder="A little kindness goes a long way…"
        />
      </label>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="form-footer">
        <span>Keep it thoughtful.</span>
        <Submit pending={pending}>{edit ? "Save edit" : "Post comment"}</Submit>
      </div>
    </form>
  );
}
