"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { mutate } from "@/lib/actions";
import { useToast } from "./ui";
import type { Content } from "@/lib/types";
export function PollOptions({ item }: { item: Content }) {
  const [pending, setPending] = useState(false);
  const notify = useToast(),
    router = useRouter();
  return (
    <div className="poll-options">
      {item.options?.map((o) => {
        const pct = item.votes ? Math.round((o.votes / item.votes) * 100) : 0;
        return (
          <button
            className={`poll-option ${item.selected_option === o.id ? "selected" : ""}`}
            key={o.id}
            disabled={
              pending || !!item.selected_option || item.status === "closed"
            }
            onClick={async () => {
              setPending(true);
              try {
                const r = await mutate("vote_poll", {
                  id: item.id,
                  option_id: o.id,
                });
                notify(r.message, r.ok);
                if (!r.ok && r.message === "Sign in to continue.")
                  router.push("/login");
              } catch {
                notify("Your vote could not be sent. Try again.", false);
              } finally {
                setPending(false);
              }
            }}
          >
            <span className="poll-fill" style={{ width: `${pct}%` }} />
            <span className="poll-label">
              {item.selected_option === o.id && <Check size={15} />} {o.label}
            </span>
            <span className="poll-percentage">
              {pct}% <small>({o.votes})</small>
            </span>
          </button>
        );
      })}
      <p className="small-note">
        <Clock size={13} />
        {item.status === "closed"
          ? "Voting is closed"
          : item.selected_option
            ? "Your vote is in. Results are public."
            : item.closes_at
              ? `Closes ${new Date(item.closes_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`
              : "One account. One vote. Results are public."}
      </p>
    </div>
  );
}
