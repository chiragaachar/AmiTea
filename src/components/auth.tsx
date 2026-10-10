"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, ShieldCheck, ArrowRight } from "lucide-react";
import { authenticate, changePassword } from "@/lib/auth-actions";
import { Submit, useToast } from "./ui";
import { safeNext } from "@/lib/validation";
export function AuthForm({ signup, next }: { signup: boolean; next?: string }) {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <div className="auth-layout">
      <div className="auth-story">
        <div className="eyebrow">YOUR SEAT IS SAVED</div>
        <h1>
          Your campus.
          <br />
          Your stories.
          <br />
          <em>Your tea.</em>
        </h1>
        <p>
          For the thoughts between lectures.
          <br />
          For the people behind the aliases.
          <br />
          For a campus that feels a little closer.
        </p>
        <Coffee size={80} strokeWidth={1} />
      </div>
      <section className="auth-card">
        <span className="brand-icon">
          <Coffee />
        </span>
        <h2>Welcome {signup ? "" : "back "}to amiTea.</h2>
        <p>
          {signup
            ? "Pick a username. Make a password. Find your people."
            : "Your username and password are all you need."}
        </p>
        <form
          className="form-stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pending) return;
            setPending(true);
            setMessage("");
            const f = new FormData(e.currentTarget);
            try {
              const result = await authenticate({
                intent: signup ? "signup" : "login",
                username: f.get("username"),
                password: f.get("password"),
                ...(signup ? { confirmation: f.get("confirmation") } : {}),
              });
              if (result.ok) router.push(safeNext(next));
              else setMessage(result.message);
            } catch {
              setMessage("Connection interrupted. Please try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <label>
            Username
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              placeholder="your_private_username"
              aria-describedby="username-hint"
            />
          </label>
          <p id="username-hint" className="small-note">
            3–24 letters, numbers or underscores. Usernames aren’t
            case-sensitive and never appear on the feed.
          </p>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={signup ? 15 : 1}
              maxLength={64}
              aria-describedby={signup ? "password-hint" : undefined}
            />
          </label>
          {signup && (
            <>
              <p id="password-hint" className="small-note">
                Use 15–64 characters. A long, memorable passphrase works well.
              </p>
              <label>
                Confirm password
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={15}
                  maxLength={64}
                />
              </label>
            </>
          )}
          {message && (
            <p className="form-error" role="alert">
              {message}
            </p>
          )}
          <Submit pending={pending}>
            {signup ? "Create my account" : "Log in"}
            <ArrowRight size={16} />
          </Submit>
        </form>
        <div className="auth-privacy">
          <ShieldCheck size={18} />
          <span>
            No email required. Campus sees your random alias, not your login
            username.
          </span>
        </div>
        <p className="small-note">
          Save your username and password. There’s no email reset or automatic
          account recovery.
        </p>
        <p className="small-note">
          By continuing, you agree to the <Link href="/terms">terms</Link> and
          have read our <Link href="/privacy">privacy policy</Link>.
        </p>
        <p className="auth-switch">
          {signup ? "Already found your seat?" : "New around here?"}{" "}
          <Link className="text-link" href={signup ? "/login" : "/signup"}>
            {signup ? "Log in" : "Join amiTea"}
          </Link>
        </p>
      </section>
    </div>
  );
}
export function PasswordSettings() {
  const [pending, setPending] = useState(false),
    [message, setMessage] = useState("");
  const notify = useToast();
  return (
    <section className="settings-card">
      <h2>Change your password</h2>
      <p>
        Your login username stays the same when you change your public alias.
        Save your login details: account recovery by email is not available.
      </p>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending) return;
          setPending(true);
          setMessage("");
          const form = e.currentTarget,
            f = new FormData(form);
          try {
            const result = await changePassword({
              currentPassword: f.get("currentPassword"),
              password: f.get("password"),
              confirmation: f.get("confirmation"),
            });
            if (result.ok) {
              form.reset();
              notify(result.message);
            } else setMessage(result.message);
          } catch {
            setMessage("Connection interrupted. Please try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <label>
          Current password
          <input
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            maxLength={64}
          />
        </label>
        <label>
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={15}
            maxLength={64}
          />
        </label>
        <label>
          Confirm new password
          <input
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={15}
            maxLength={64}
          />
        </label>
        {message && (
          <p role="alert" className="form-error">
            {message}
          </p>
        )}
        <Submit pending={pending}>Update password</Submit>
      </form>
    </section>
  );
}
