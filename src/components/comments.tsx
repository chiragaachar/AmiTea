"use client";
import { useState } from "react";
import { MessageCircle, Pencil } from "lucide-react";
import { CommentForm, ReportButton, DeleteButton } from "./forms";
import type { Comment } from "@/lib/types";
export function CommentCard({
  comment,
  signedIn,
  locked,
}: {
  comment: Comment;
  signedIn: boolean;
  locked: boolean;
}) {
  const [mode, setMode] = useState<"reply" | "edit" | null>(null);
  return (
    <article className={`comment-card ${comment.parent_id ? "reply" : ""}`}>
      <div className="post-meta">
        <span className="avatar small">{comment.alias.slice(0, 1)}</span>
        <strong>{comment.alias}</strong>
        <time dateTime={comment.created_at}>
          {new Date(comment.created_at).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}
        </time>
      </div>
      {comment.parent_preview && (
        <blockquote>Replying to: {comment.parent_preview}</blockquote>
      )}
      <p className="post-body">{comment.body}</p>
      <div className="action-group">
        {signedIn && !locked && !comment.parent_id && (
          <button
            className="quiet-button"
            onClick={() => setMode(mode === "reply" ? null : "reply")}
          >
            <MessageCircle size={14} /> Reply
          </button>
        )}
        {comment.is_owner && (
          <>
            {!locked && (
              <button
                className="icon-button"
                aria-label="Edit comment"
                onClick={() => setMode(mode === "edit" ? null : "edit")}
              >
                <Pencil size={15} />
              </button>
            )}
            <DeleteButton id={comment.id} type="comment" />
          </>
        )}
        <ReportButton id={comment.id} type="comment" />
      </div>
      {mode && (
        <CommentForm
          post={comment.post_id}
          parent={mode === "reply" ? comment.id : null}
          edit={mode === "edit" ? comment : undefined}
          onDone={() => setMode(null)}
        />
      )}
    </article>
  );
}
