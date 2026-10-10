import { PGlite } from "@electric-sql/pglite";
import { usernameIdentifier } from "../src/lib/credentials";
import { readdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, afterAll, describe, it, expect } from "vitest";
let db: PGlite;
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  mod = "33333333-3333-4333-8333-333333333333";
async function as(user: string | null, sql: string, params: unknown[] = []) {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
    user || "",
  ]);
  await db.exec(`set role ${user ? "authenticated" : "anon"}`);
  try {
    return await db.query(sql, params);
  } finally {
    await db.exec("reset role");
  }
}
async function call(user: string | null, fn: string, args: unknown[] = []) {
  const result = await as(
    user,
    `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) as result`,
    args,
  );
  return (result.rows[0] as { result: unknown }).result;
}
async function mutate(user: string, kind: string, payload: object = {}) {
  return (await call(user, "mutate", [kind, JSON.stringify(payload)])) as {
    id: string;
  };
}
async function post(user = alice, extra: object = {}) {
  return (
    await mutate(user, "create_post", {
      request_id: randomUUID(),
      title: "An honest campus thought",
      body: "A useful conversation for everyone.",
      category: "Campus Life",
      ...extra,
    })
  ).id;
}
async function poll(user = alice) {
  return (
    await mutate(user, "create_poll", {
      request_id: randomUUID(),
      question: "Best study spot?",
      options: ["Library", "Garden"],
      description: "",
    })
  ).id;
}
async function moderate(
  type: string,
  id: string,
  action: string,
  extra: object = {},
) {
  return call(mod, "moderate", [
    JSON.stringify({
      target_type: type,
      id,
      action,
      reason: "Community guidelines review",
      ...extra,
    }),
  ]);
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`,
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
});
beforeEach(async () => {
  await db.exec(
    "reset role;delete from auth.users;truncate public.reports,public.moderation_actions;",
  );
  await db.query(
    "insert into auth.users values($1,$2,now()),($3,$4,now()),($5,$6,now())",
    [
      alice,
      usernameIdentifier("alice"),
      bob,
      usernameIdentifier("bob"),
      mod,
      usernameIdentifier("moderator"),
    ],
  );
  await db.query("update public.profiles set role='moderator' where id=$1", [
    mod,
  ]);
});
afterAll(async () => {
  await db.close();
});
describe("amiTea database authorization and privacy", () => {
  it("enables RLS on all 13 public tables", async () => {
    const { rows } = await db.query<{
      relname: string;
      relrowsecurity: boolean;
    }>(
      "select relname,relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='public' and relkind='r'",
    );
    expect(rows).toHaveLength(13);
    expect(rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  it("public feed excludes emails, internal IDs and unpublished content", async () => {
    const id = await post();
    let feed = await call(null, "feed", []);
    expect(JSON.stringify(feed)).toContain(id);
    for (const value of [
      alice,
      usernameIdentifier("alice"),
      "author_id",
      "user_id",
      "request_id",
    ])
      expect(JSON.stringify(feed)).not.toContain(value);
    await moderate("post", id, "hide");
    feed = await call(null, "feed");
    expect(feed).toEqual([]);
    expect(await call(null, "post_detail", [id])).toBeNull();
  });
  it("blocks raw SELECT INSERT UPDATE DELETE and privilege escalation", async () => {
    for (const sql of [
      "select * from public.profiles",
      "select * from public.posts",
      "select * from public.reports",
      "select * from public.moderation_actions",
      "update public.profiles set role='admin'",
      "delete from public.posts",
      `insert into public.profiles(id,role) values(gen_random_uuid(),'admin')`,
    ])
      await expect(as(bob, sql)).rejects.toThrow(/permission denied/);
    await expect(as(bob, "select private.actor()")).rejects.toThrow(
      /permission denied/,
    );
  });
  it("requires an existing authenticated account without email verification", async () => {
    await expect(call(null, "mutate", ["create_post", "{}"])).rejects.toThrow(
      /permission denied/,
    );
    await db.query(
      "update auth.users set email_confirmed_at=null where id=$1",
      [alice],
    );
    expect(await post()).toBeTruthy();
    await db.query("delete from auth.users where id=$1", [alice]);
    await expect(post()).rejects.toThrow("Sign in");
  });
  it("rejects email signup identities and keeps usernames private and immutable", async () => {
    await expect(
      db.query("insert into auth.users values($1,$2,null)", [
        randomUUID(),
        "someone@example.com",
      ]),
    ).rejects.toThrow("username registration");
    await expect(
      db.query("update auth.users set email=$1 where id=$2", [
        usernameIdentifier("hijack"),
        alice,
      ]),
    ).rejects.toThrow("cannot be changed");
    await post();
    for (const api of [await call(null, "feed"), await call(alice, "me")]) {
      expect(JSON.stringify(api)).not.toContain(usernameIdentifier("alice"));
      expect(JSON.stringify(api)).not.toContain('"username"');
    }
  });
  it("uses random aliases and hides confession aliases", async () => {
    const id = await post(alice, { confession: true });
    const profile = (await call(alice, "me")) as { alias: string };
    expect(profile.alias).not.toContain("alice");
    expect(profile.alias).not.toContain(alice);
    const detail = await call(null, "post_detail", [id]);
    expect(JSON.stringify(detail)).toContain("CampusConfession");
    expect(JSON.stringify(detail)).not.toContain(profile.alias);
  });
  it("enforces ownership on editing and deletion", async () => {
    const id = await post();
    await expect(
      mutate(bob, "edit_post", { id, title: "Hijacked", body: "No" }),
    ).rejects.toThrow("permission denied");
    await expect(mutate(bob, "delete_post", { id })).rejects.toThrow(
      "permission denied",
    );
    await mutate(alice, "edit_post", {
      id,
      title: "Updated title",
      body: "Updated body",
    });
    expect(JSON.stringify(await call(null, "post_detail", [id]))).toContain(
      "Updated title",
    );
    await mutate(alice, "delete_post", { id });
    expect(await call(null, "post_detail", [id])).toBeNull();
  });
  it("ignores client ownership, counts and moderation flags", async () => {
    const id = await post(alice, {
      author_id: bob,
      status: "hidden",
      votes: 1000,
      role: "admin",
    });
    const detail = (await call(alice, "post_detail", [id])) as {
      votes: number;
      is_owner: boolean;
    };
    expect(detail.votes).toBe(0);
    expect(detail.is_owner).toBe(true);
    expect(((await call(alice, "me")) as { role: string }).role).toBe("member");
  });
  it("is idempotent for duplicate creation and vote retries", async () => {
    const request_id = randomUUID();
    const a = await post(alice, { request_id });
    const b = await post(alice, { request_id });
    expect(a).toBe(b);
    await mutate(bob, "vote_post", { id: a, active: true });
    await mutate(bob, "vote_post", { id: a, active: true });
    expect(
      ((await call(null, "post_detail", [a])) as { votes: number }).votes,
    ).toBe(1);
    await mutate(bob, "vote_post", { id: a, active: false });
    expect(
      ((await call(null, "post_detail", [a])) as { votes: number }).votes,
    ).toBe(0);
  });
  it("keeps bookmarks private and unique", async () => {
    const id = await post();
    await mutate(bob, "bookmark", { id, active: true });
    await mutate(bob, "bookmark", { id, active: true });
    expect(await call(alice, "feed", ["saved"])).toEqual([]);
    expect(await call(bob, "feed", ["saved"])).toHaveLength(1);
    await expect(call(null, "feed", ["saved"])).rejects.toThrow("Sign in");
    await mutate(bob, "bookmark", { id, active: false });
    expect(await call(bob, "feed", ["saved"])).toEqual([]);
  });
  it("allows only one reply level and protects removed parent text", async () => {
    const id = await post();
    const root = await mutate(bob, "create_comment", {
      request_id: randomUUID(),
      post_id: id,
      body: "Parent secret",
    });
    const reply = await mutate(alice, "create_comment", {
      request_id: randomUUID(),
      post_id: id,
      parent_id: root.id,
      body: "A reply",
    });
    await expect(
      mutate(bob, "create_comment", {
        request_id: randomUUID(),
        post_id: id,
        parent_id: reply.id,
        body: "Too deep",
      }),
    ).rejects.toThrow("top-level");
    const other = await post();
    await expect(
      mutate(bob, "create_comment", {
        request_id: randomUUID(),
        post_id: other,
        parent_id: root.id,
        body: "Wrong post",
      }),
    ).rejects.toThrow("top-level");
    await moderate("comment", root.id, "hide");
    expect(await call(null, "comments_for", [id])).toEqual([]);
    await moderate("comment", root.id, "restore");
    expect(await call(null, "comments_for", [id])).toHaveLength(2);
    await mutate(bob, "delete_comment", { id: root.id });
    expect(await call(null, "comments_for", [id])).toEqual([]);
  });
  it("locks discussions, authorizes comment edits and hides replies under hidden posts", async () => {
    const id = await post();
    const c = await mutate(bob, "create_comment", {
      request_id: randomUUID(),
      post_id: id,
      body: "Initial comment",
    });
    await expect(
      mutate(alice, "edit_comment", { id: c.id, body: "Hijack" }),
    ).rejects.toThrow("permission denied");
    await mutate(bob, "edit_comment", { id: c.id, body: "Updated comment" });
    await moderate("post", id, "lock");
    await expect(
      mutate(alice, "create_comment", {
        request_id: randomUUID(),
        post_id: id,
        body: "No",
      }),
    ).rejects.toThrow("locked");
    await expect(
      mutate(bob, "edit_comment", { id: c.id, body: "No" }),
    ).rejects.toThrow("permission denied");
    await moderate("post", id, "hide");
    expect(await call(null, "comments_for", [id])).toEqual([]);
  });
  it("enforces poll option membership, one vote and closure", async () => {
    const a = await poll(),
      b = await poll(bob);
    const options = await db.query<{ id: string; poll_id: string }>(
      "select id,poll_id from public.poll_options order by position",
    );
    const oa = options.rows.find((x) => x.poll_id === a)!.id,
      ob = options.rows.find((x) => x.poll_id === b)!.id;
    await expect(
      mutate(bob, "vote_poll", { id: a, option_id: ob }),
    ).rejects.toThrow(/foreign key/);
    await mutate(bob, "vote_poll", { id: a, option_id: oa });
    await mutate(bob, "vote_poll", { id: a, option_id: oa });
    const feed = (await call(null, "feed", ["polls"])) as {
      id: string;
      votes: number;
    }[];
    expect(feed.find((x) => x.id === a)!.votes).toBe(1);
    await moderate("poll", b, "close");
    await expect(
      mutate(alice, "vote_poll", { id: b, option_id: ob }),
    ).rejects.toThrow("closed");
    await db.query(
      "update public.polls set closes_at=now()-interval '1 second' where id=$1",
      [a],
    );
    await expect(
      mutate(alice, "vote_poll", { id: a, option_id: oa }),
    ).rejects.toThrow("closed");
  });
  it("rejects invalid polls atomically", async () => {
    for (const options of [[], ["one"], ["one", "one"]])
      await expect(
        mutate(alice, "create_poll", {
          request_id: randomUUID(),
          question: "A valid question?",
          options,
        }),
      ).rejects.toThrow();
    expect(await call(null, "feed", ["polls"])).toEqual([]);
  });
  it("supports suggestions and moderator-only official status", async () => {
    const { id } = await mutate(alice, "create_suggestion", {
      request_id: randomUUID(),
      title: "More water fountains",
      body: "Near the library",
      category: "Infrastructure",
      official_status: "Accepted",
    });
    await mutate(bob, "vote_suggestion", { id, active: true });
    await mutate(bob, "vote_suggestion", { id, active: true });
    let feed = (await call(null, "feed", ["suggestions"])) as {
      votes: number;
      official_status: string;
    }[];
    expect(feed[0].votes).toBe(1);
    expect(feed[0].official_status).toBe("Submitted");
    await expect(
      call(bob, "moderate", [
        JSON.stringify({
          id,
          target_type: "suggestion",
          action: "status",
          official_status: "Accepted",
          reason: "A good idea",
        }),
      ]),
    ).rejects.toThrow("Moderator access");
    await moderate("suggestion", id, "status", {
      official_status: "Under Review",
    });
    feed = (await call(null, "feed", ["suggestions"])) as {
      votes: number;
      official_status: string;
    }[];
    expect(feed[0].official_status).toBe("Under Review");
  });
  it("protects reports, queues and audit with moderator authorization", async () => {
    const id = await post();
    await mutate(bob, "report", {
      id,
      target_type: "post",
      reason: "Spam",
      description: "Please review",
    });
    await mutate(bob, "report", { id, target_type: "post", reason: "Spam" });
    await expect(call(bob, "admin_data", ["reports"])).rejects.toThrow(
      "Moderator access",
    );
    const reports = (await call(mod, "admin_data", ["reports"])) as {
      id: string;
      preview: string;
    }[];
    expect(reports).toHaveLength(1);
    expect(reports[0].preview).toContain("honest campus");
    await moderate("report", reports[0].id, "dismiss");
    const audit = await call(mod, "admin_data", ["audit"]);
    expect(JSON.stringify(audit)).toContain("dismiss");
    await expect(
      call(mod, "moderate", [
        JSON.stringify({ id, target_type: "post", action: "hide", reason: "" }),
      ]),
    ).rejects.toThrow("reason");
  });
  it("blocks every suspended write via direct RPC and allows reinstatement", async () => {
    const id = await post();
    await moderate("user", bob, "suspend");
    for (const [kind, payload] of [
      ["vote_post", { id, active: true }],
      ["bookmark", { id, active: true }],
      ["report", { id, target_type: "post", reason: "Spam" }],
      ["regenerate_alias", {}],
      [
        "create_comment",
        { request_id: randomUUID(), post_id: id, body: "Hello" },
      ],
    ] as [string, object][])
      await expect(mutate(bob, kind, payload)).rejects.toThrow("restricted");
    await moderate("user", bob, "reinstate");
    await mutate(bob, "vote_post", { id, active: true });
  });
  it("prevents member moderation and restrictions on moderator accounts", async () => {
    await expect(
      call(alice, "moderate", [
        JSON.stringify({
          id: bob,
          target_type: "user",
          action: "suspend",
          reason: "Abuse",
        }),
      ]),
    ).rejects.toThrow("Moderator access");
    await expect(moderate("user", mod, "suspend")).rejects.toThrow(
      "Only member",
    );
  });
  it("enforces database rate limits and alias cooldown", async () => {
    for (let i = 0; i < 12; i++) await post();
    await expect(post()).rejects.toThrow("too quickly");
    await mutate(alice, "regenerate_alias");
    await expect(mutate(alice, "regenerate_alias")).rejects.toThrow("7 days");
  });
  it("rate limits reports without leaking private descriptions", async () => {
    for (let i = 0; i < 6; i++) {
      const id = await post();
      if (i < 5)
        await mutate(bob, "report", {
          id,
          target_type: "post",
          reason: "Spam",
          description: "Private note",
        });
      else
        await expect(
          mutate(bob, "report", { id, target_type: "post", reason: "Spam" }),
        ).rejects.toThrow("too quickly");
    }
    expect(JSON.stringify(await call(null, "feed"))).not.toContain(
      "Private note",
    );
  });
  it("deletes account content and dependent records even when suspended", async () => {
    const id = await post();
    await poll();
    await mutate(bob, "create_comment", {
      request_id: randomUUID(),
      post_id: id,
      body: "Reply will cascade",
    });
    await mutate(alice, "bookmark", { id, active: true });
    await expect(mutate(alice, "delete_account", {})).rejects.toThrow(
      "Confirm",
    );
    await expect(
      mutate(alice, "delete_account", { confirmation: null }),
    ).rejects.toThrow("Confirm");
    await moderate("user", alice, "suspend");
    await mutate(alice, "delete_account", { confirmation: "DELETE" });
    for (const table of [
      "profiles",
      "posts",
      "comments",
      "polls",
      "bookmarks",
      "user_suspensions",
    ]) {
      const { rows } = await db.query<{ n: number }>(
        `select count(*)::int as n from public.${table}`,
      );
      expect(rows[0].n).toBe(table === "profiles" ? 2 : 0);
    }
    expect(await call(alice, "me")).toBeNull();
  });
  it("bounds pagination and search and supports category filters", async () => {
    await post(alice, {
      category: "Academics",
      title: "Wonderful quantum physics",
    });
    await post(bob, { category: "Events" });
    expect(
      await call(null, "feed", ["posts", "latest", "Academics"]),
    ).toHaveLength(1);
    expect(
      await call(null, "feed", ["posts", "latest", "", "quantum"]),
    ).toHaveLength(1);
    expect(await call(null, "feed", ["posts", "latest", "", "", 500])).toEqual(
      [],
    );
    await expect(
      call(null, "feed", ["posts", "latest", "", "x".repeat(101)]),
    ).rejects.toThrow("too long");
  });
});
