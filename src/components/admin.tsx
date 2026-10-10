"use client";
import { useState } from "react";
import { moderate } from "@/lib/actions";
import { Modal, Submit, useToast } from "./ui";
import { statuses } from "@/lib/validation";
export function ModerateButton({
  id,
  type,
  action,
  label,
}: {
  id: string;
  type: string;
  action: string;
  label: string;
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
        <button
          className={`button small-button ${action === "remove" || action === "suspend" ? "danger" : "secondary"}`}
        >
          {label}
        </button>
      }
      title={label}
      description="This action affects the community and will be recorded in the private audit history."
    >
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending) return;
          setPending(true);
          const form = new FormData(e.currentTarget);
          try {
            const r = await moderate({
              id,
              target_type: type,
              action,
              reason: form.get("reason"),
              ...(action === "status"
                ? { official_status: form.get("official_status") }
                : {}),
            });
            if (r.ok) {
              notify(r.message);
              setOpen(false);
            } else setError(r.message);
          } catch {
            setError("Could not save. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        {action === "status" && (
          <label>
            Official status
            <select name="official_status">
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          {action === "status" ? "Public explanation" : "Reason (required)"}
          <textarea
            name="reason"
            required
            minLength={3}
            maxLength={2000}
            rows={4}
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <Submit pending={pending}>Confirm {label.toLowerCase()}</Submit>
      </form>
    </Modal>
  );
}
