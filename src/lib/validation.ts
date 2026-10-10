import { z } from "zod";
export const categories = [
  "Confessions",
  "Campus Life",
  "Academics",
  "Placements",
  "Events",
  "Suggestions",
  "General",
] as const;
export const suggestionCategories = [
  "Infrastructure",
  "Food",
  "Wi-Fi",
  "Library",
  "Academics",
  "Events",
  "Transport",
  "Other",
] as const;
export const statuses = [
  "Submitted",
  "Under Review",
  "Accepted",
  "In Progress",
  "Completed",
  "Declined",
] as const;
export const reasons = [
  "Harassment or bullying",
  "Personal information",
  "Threats",
  "Spam",
  "Impersonation",
  "Inappropriate content",
  "Targeted accusations",
  "Other",
] as const;
const id = z.uuid(),
  title = z.string().trim().min(3).max(160),
  body = z.string().trim().min(1).max(5000),
  target = z.enum(["post", "comment", "poll", "suggestion"]);
const base = { id };
export const mutations = {
  create_post: z.object({
    request_id: id,
    title,
    body,
    category: z.enum(categories),
    confession: z.boolean(),
  }),
  create_comment: z.object({
    request_id: id,
    post_id: id,
    parent_id: id.nullable(),
    body: body.max(2000),
  }),
  create_poll: z.object({
    request_id: id,
    question: title,
    description: z.string().trim().max(2000),
    options: z
      .array(z.string().trim().min(1).max(100))
      .min(2)
      .max(6)
      .refine(
        (a) => new Set(a).size === a.length,
        "Options must be different.",
      ),
    closes_at: z.string().datetime().nullable(),
  }),
  create_suggestion: z.object({
    request_id: id,
    title,
    body,
    category: z.enum(suggestionCategories),
  }),
  edit_post: z.object({ ...base, title, body }),
  edit_comment: z.object({ ...base, body: body.max(2000) }),
  edit_suggestion: z.object({ ...base, title, body }),
  delete_post: z.object(base),
  delete_comment: z.object(base),
  delete_poll: z.object(base),
  delete_suggestion: z.object(base),
  vote_post: z.object({ ...base, active: z.boolean() }),
  vote_suggestion: z.object({ ...base, active: z.boolean() }),
  bookmark: z.object({ ...base, active: z.boolean() }),
  vote_poll: z.object({ ...base, option_id: id }),
  report: z.object({
    ...base,
    target_type: target,
    reason: z.enum(reasons),
    description: z.string().trim().max(2000),
  }),
  regenerate_alias: z.object({}),
  delete_account: z.object({ confirmation: z.literal("DELETE") }),
};
export type MutationKind = keyof typeof mutations;
export const moderation = z.object({
  id,
  target_type: z.enum([
    "post",
    "comment",
    "poll",
    "suggestion",
    "report",
    "user",
  ]),
  action: z.enum([
    "hide",
    "remove",
    "restore",
    "lock",
    "unlock",
    "close",
    "status",
    "dismiss",
    "resolve",
    "suspend",
    "reinstate",
  ]),
  reason: z.string().trim().min(3).max(2000),
  official_status: z.enum(statuses).optional(),
});
export function safeNext(value: string | null | undefined) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\x00-\x20]/.test(value)
    ? value
    : "/";
}
export function safeMessage(error: { message: string; code?: string }) {
  const allowed = [
    "Sign in to continue.",
    "Your account is temporarily restricted.",
    "You are doing that too quickly. Please try again later.",
    "This discussion is unavailable or locked.",
    "Reply to a visible top-level comment.",
    "Closing time must be in the future.",
    "Content unavailable or permission denied.",
    "Content unavailable.",
    "This poll is closed.",
    "You can change your alias once every 7 days.",
    "Moderator access required.",
    "Content no longer exists.",
    "Only member accounts can be restricted here.",
  ];
  return allowed.includes(error.message)
    ? error.message
    : "We couldn’t complete that request. Please check your input and try again.";
}
