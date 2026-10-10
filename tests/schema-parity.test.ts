import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { it, expect } from "vitest";
const bootstrap = `create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`;
it("fresh username schema matches the single initial migration, including policies, constraints and privileges", async () => {
  const fresh = new PGlite(),
    initial = new PGlite();
  try {
    await fresh.exec(bootstrap);
    await initial.exec(bootstrap);
    await fresh.exec(readFileSync("supabase/schema.sql", "utf8"));
    for (const file of readdirSync("supabase/migrations")
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await initial.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
    const queries = [
      `select n.nspname,c.relname,c.relrowsecurity,c.relacl::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' order by 1,2`,
      `select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname in ('public','private') order by 1,2,3`,
      `select n.nspname,p.proname,p.prosrc,p.prosecdef,p.proconfig,p.proacl::text from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private') order by 1,2`,
      `select n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid) as definition from pg_constraint k join pg_class c on c.oid=k.conrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') order by 1,2,3`,
      `select event_object_schema,event_object_table,trigger_name,action_timing,event_manipulation,action_statement from information_schema.triggers where trigger_schema in ('auth','public','private') order by 1,2,3,5`,
      `select schemaname,tablename,indexname,indexdef from pg_indexes where schemaname in ('public','private') order by 1,2,3`,
    ];
    for (const query of queries)
      expect((await fresh.query(query)).rows).toEqual(
        (await initial.query(query)).rows,
      );
  } finally {
    await fresh.close();
    await initial.close();
  }
});
