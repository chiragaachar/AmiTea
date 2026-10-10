import { beforeEach, describe, it, expect, vi } from "vitest";
import { credentialsSchema } from "../src/lib/auth-validation";
import { usernameIdentifier } from "../src/lib/credentials";
const mocks = vi.hoisted(() => ({
  db: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  revalidatePath: vi.fn(),
}));
vi.mock("../src/lib/supabase", () => ({ db: mocks.db }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import { authenticate, changePassword } from "../src/lib/auth-actions";
const password = "a long private passphrase";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.mockResolvedValue({ auth: mocks });
  mocks.signUp.mockResolvedValue({
    data: { session: { access_token: "secret" }, user: { email: "internal" } },
    error: null,
  });
  mocks.signInWithPassword.mockResolvedValue({
    data: { session: { access_token: "secret" } },
    error: null,
  });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "account" } },
    error: null,
  });
  mocks.updateUser.mockResolvedValue({ error: null });
});
describe("username/password accounts", () => {
  it("normalizes usernames consistently without exposing them in the internal identifier", () => {
    const id = usernameIdentifier(" Campus_Owl ");
    expect(id).toBe(usernameIdentifier("campus_owl"));
    expect(id).toMatch(/^[0-9a-f]{64}@accounts\.amitea\.invalid$/);
    expect(id).not.toContain("campus_owl");
    expect(id).not.toBe(usernameIdentifier("campus_owl2"));
  });
  it("rejects email addresses, whitespace and malformed usernames", () => {
    for (const name of [
      "a",
      "someone@example.com",
      "two names",
      "a/b",
      "Ａlice",
      "a".repeat(25),
    ])
      expect(() => usernameIdentifier(name)).toThrow();
  });
  it("rejects weak or mismatched passwords and never truncates Unicode passwords", () => {
    for (const p of ["short", "😀".repeat(25)])
      expect(
        credentialsSchema.safeParse({
          intent: "signup",
          username: "owl",
          password: p,
          confirmation: p,
        }).success,
      ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        intent: "signup",
        username: "owl",
        password,
        confirmation: password + "x",
      }).success,
    ).toBe(false);
  });
  it("creates an account using only the validated private identifier and password", async () => {
    const result = await authenticate({
      intent: "signup",
      username: "Campus_Owl",
      password,
      confirmation: password,
      email: "leak@example.com",
      role: "admin",
    });
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: usernameIdentifier("campus_owl"),
      password,
    });
    expect(result).toEqual({ ok: true, message: "Welcome to amiTea." });
    expect(JSON.stringify(result)).not.toMatch(
      /secret|internal|email|access_token/,
    );
  });
  it("signs in case-insensitively without changing the password", async () => {
    await authenticate({
      intent: "login",
      username: "CAMPUS_OWL",
      password: "  preserve spaces  ",
    });
    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: usernameIdentifier("campus_owl"),
      password: "  preserve spaces  ",
    });
    expect(mocks.signUp).not.toHaveBeenCalled();
  });
  it("does not call Auth for invalid input", async () => {
    const result = await authenticate({
      intent: "signup",
      username: "person@example.com",
      password,
      confirmation: password,
    });
    expect(result.ok).toBe(false);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("fails safely if confirmations were left enabled or signup is duplicated", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null }, error: null });
    expect(
      (
        await authenticate({
          intent: "signup",
          username: "owl",
          password,
          confirmation: password,
        })
      ).ok,
    ).toBe(false);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    mocks.signUp.mockResolvedValue({
      data: { session: null },
      error: { message: "private account details" },
    });
    expect(
      JSON.stringify(
        await authenticate({
          intent: "signup",
          username: "owl",
          password,
          confirmation: password,
        }),
      ),
    ).not.toContain("private account details");
  });
  it("returns a generic login failure for unknown users or wrong passwords", async () => {
    mocks.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: "provider-specific details" },
    });
    const r = await authenticate({
      intent: "login",
      username: "owl",
      password,
    });
    expect(r.ok).toBe(false);
    expect(r.message).toContain("username and password");
    expect(r.message).not.toContain("provider-specific");
  });
  it("requires a verified session and current password for password changes", async () => {
    const result = await changePassword({
      currentPassword: "old private password",
      password,
      confirmation: password,
    });
    expect(result.ok).toBe(true);
    expect(mocks.getUser).toHaveBeenCalled();
    expect(mocks.updateUser).toHaveBeenCalledWith({
      password,
      current_password: "old private password",
    });
  });
  it("does not allow signed-out or wrong-password changes", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect(
      (
        await changePassword({
          currentPassword: "old private password",
          password,
          confirmation: password,
        })
      ).ok,
    ).toBe(false);
    expect(mocks.updateUser).not.toHaveBeenCalled();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "account" } },
      error: null,
    });
    mocks.updateUser.mockResolvedValue({
      error: { message: "Invalid current password" },
    });
    expect(
      (
        await changePassword({
          currentPassword: "wrong password",
          password,
          confirmation: password,
        })
      ).ok,
    ).toBe(false);
  });
});
