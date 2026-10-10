"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, LogOut, ShieldCheck } from "lucide-react";
import type { Profile } from "@/lib/supabase";
import { mutate, signOut } from "@/lib/actions";
import { Modal, Submit, useToast } from "./ui";
import { PasswordSettings } from "./auth";
import { ActionButton } from "./forms";
export function Settings({ profile }: { profile: Profile }) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState("");
  const router = useRouter(),
    notify = useToast();
  return (
    <div className="document-page">
      <div className="eyebrow">YOUR LITTLE CORNER</div>
      <h1>Private feels good.</h1>
      <p>Manage your amiTea identity and account.</p>
      <section className="settings-card">
        <h2>Your public alias</h2>
        <div className="identity">
          <span className="avatar">{profile.alias.slice(0, 1)}</span>
          <strong>{profile.alias}</strong>
        </div>
        <p>
          Your public identity is private to you. Your login username and
          internal account ID never appear in public content.
        </p>
        <ActionButton
          kind="regenerate_alias"
          payload={{}}
          label="Regenerate public alias"
          className="button secondary"
        >
          <RefreshCw size={16} /> A fresh alias
        </ActionButton>
        <p className="small-note">
          Available once every 7 days. Changes your alias on previous
          contributions too. Other people may still recognize your writing.
        </p>
      </section>
      <PasswordSettings />
      {profile.suspension && (
        <section className="notice">
          <h2>Your account is restricted</h2>
          <p>{profile.suspension.reason}</p>
          <p>
            Until{" "}
            {new Date(profile.suspension.expires_at).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            })}{" "}
            IST. See Get help to appeal.
          </p>
        </section>
      )}
      <section className="settings-card">
        <h2>
          <ShieldCheck size={20} /> Your privacy, honestly
        </h2>
        <p>
          amiTea is pseudonymous, not untraceable. Moderators can link
          contributions to an internal account to prevent abuse. Infrastructure
          administrators can access authentication information.
        </p>
        <button
          className="button secondary"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              await signOut();
              router.push("/");
            } catch {
              notify("Could not sign out. Try again.", false);
            } finally {
              setPending(false);
            }
          }}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </section>
      <section className="settings-card danger-zone">
        <h2>Leave the table</h2>
        <p>
          Delete your account and all your posts, comments, polls, suggestions,
          votes, and bookmarks. Replies on your deleted posts and comments will
          also be deleted. Moderation records remain without an account link,
          subject to retention.
        </p>
        <Modal
          trigger={<button className="button danger">Delete my account</button>}
          title="Leave amiTea permanently?"
          description="This cannot be undone. Type DELETE to confirm deletion of your account and contributions."
        >
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setPending(true);
              const f = new FormData(e.currentTarget);
              try {
                const r = await mutate("delete_account", {
                  confirmation: f.get("confirmation"),
                });
                if (r.ok) {
                  notify(r.message);
                  router.push("/");
                } else setError(r.message);
              } catch {
                setError("Could not delete your account. Try again.");
              } finally {
                setPending(false);
              }
            }}
          >
            <label>
              Confirmation
              <input
                name="confirmation"
                required
                pattern="DELETE"
                autoComplete="off"
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Submit pending={pending}>Permanently delete account</Submit>
          </form>
        </Modal>
      </section>
    </div>
  );
}
