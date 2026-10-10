import { describe, it, expect } from "vitest";
import { mutations, safeNext, safeMessage } from "../src/lib/validation";
describe("request validation", () => {
  it("blocks external and malformed return URLs", () => {
    for (const url of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "/\nX-Test:yes",
      "/\t/evil.test",
    ])
      expect(safeNext(url)).toBe("/");
    expect(safeNext("/saved")).toBe("/saved");
  });
  it("rejects oversized content and duplicate poll options", () => {
    expect(
      mutations.create_post.safeParse({
        request_id: crypto.randomUUID(),
        title: "Hi",
        body: "text",
        category: "General",
        confession: false,
      }).success,
    ).toBe(false);
    expect(
      mutations.create_poll.safeParse({
        request_id: crypto.randomUUID(),
        question: "A question?",
        description: "",
        options: ["Same", "Same"],
        closes_at: null,
      }).success,
    ).toBe(false);
  });
  it("strips forged role and owner fields", () => {
    const result = mutations.create_post.parse({
      request_id: crypto.randomUUID(),
      title: "A title",
      body: "A body",
      category: "General",
      confession: false,
      role: "admin",
      author_id: "forged",
    });
    expect(result).not.toHaveProperty("role");
    expect(result).not.toHaveProperty("author_id");
  });
  it("sanitizes database details", () => {
    expect(
      safeMessage({ message: "relation profiles secret does not exist" }),
    ).not.toContain("profiles");
  });
});
