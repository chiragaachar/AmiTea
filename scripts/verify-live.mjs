// Run against a dedicated staging project with disposable test accounts.
// Uses bearer tokens supplied in the environment; never prints token or account data.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const tokens = ["TEST_USER_A_JWT", "TEST_USER_B_JWT", "TEST_MOD_JWT"].map(
  (k) => process.env[k],
);
if (!url || !key || tokens.some((t) => !t))
  throw new Error(
    "Supply URL, public key and three temporary staging JWTs. See docs/TESTING.md.",
  );
const make = (token) =>
  createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
const [a, b, m] = tokens.map(make),
  anon = make();
let post, poll, suggestion;
async function rpc(client, fn, args = {}) {
  const { data, error } = await client.rpc(fn, args);
  if (error) throw new Error(`${fn} failed (${error.code || "unknown"})`);
  return data;
}
async function write(client, kind, payload) {
  return rpc(client, "mutate", { kind, payload });
}
try {
  post = (
    await write(a, "create_post", {
      request_id: crypto.randomUUID(),
      title: "amiTea staging verification",
      body: "Disposable automated test contribution.",
      category: "General",
      confession: false,
    })
  ).id;
  const detail = await rpc(anon, "post_detail", { post });
  assert.equal(detail.title, "amiTea staging verification");
  assert(!("author_id" in detail));
  assert(!("email" in detail));
  const raw = await b.from("profiles").select("*");
  assert(raw.error, "Raw profiles must be denied");
  const hijack = await b.rpc("mutate", {
    kind: "edit_post",
    payload: { id: post, title: "Hijack attempt", body: "Must fail" },
  });
  assert(hijack.error, "Cross-account editing must fail");
  await Promise.all(
    Array.from({ length: 6 }, () =>
      write(b, "vote_post", { id: post, active: true }),
    ),
  );
  assert.equal((await rpc(anon, "post_detail", { post })).votes, 1);
  await write(b, "create_comment", {
    request_id: crypto.randomUUID(),
    post_id: post,
    parent_id: null,
    body: "Disposable test comment",
  });
  await write(b, "report", {
    id: post,
    target_type: "post",
    reason: "Other",
    description: "Automated staging test report",
  });
  const denied = await b.rpc("admin_data", { section: "reports" });
  assert(denied.error, "Member moderation access must fail");
  const reports = await rpc(m, "admin_data", { section: "reports" });
  assert(Array.isArray(reports));
  await rpc(m, "moderate", {
    payload: {
      id: post,
      target_type: "post",
      action: "hide",
      reason: "Automated staging verification",
    },
  });
  assert.equal(await rpc(anon, "post_detail", { post }), null);
  await rpc(m, "moderate", {
    payload: {
      id: post,
      target_type: "post",
      action: "restore",
      reason: "Finish automated staging verification",
    },
  });
  poll = (
    await write(a, "create_poll", {
      request_id: crypto.randomUUID(),
      question: "Staging test poll?",
      description: "Disposable",
      options: ["One", "Two"],
      closes_at: null,
    })
  ).id;
  const polls = await rpc(b, "feed", { kind: "polls" });
  const item = polls.find((p) => p.id === poll);
  assert(item);
  await write(b, "vote_poll", { id: poll, option_id: item.options[0].id });
  suggestion = (
    await write(a, "create_suggestion", {
      request_id: crypto.randomUUID(),
      title: "Staging test idea",
      body: "Disposable",
      category: "Other",
    })
  ).id;
  await write(b, "vote_suggestion", { id: suggestion, active: true });
  console.log(
    "PASS: hosted API privacy, ownership, concurrent vote retries, comments, polls, suggestions, reporting and moderator visibility.",
  );
} finally {
  for (const [type, id] of [
    ["post", post],
    ["poll", poll],
    ["suggestion", suggestion],
  ])
    if (id) await write(a, `delete_${type}`, { id });
}
