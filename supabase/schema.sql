-- amiTea: complete username/password database for a NEW Supabase project.
-- Run this entire file ONCE in Supabase SQL Editor.
-- No previous installation or database script is required.
-- amiTea: tables are not directly exposed. Bounded RPCs are the public API.
-- Every SECURITY DEFINER function has a fixed empty search_path.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 alias text not null unique default ('ChaiLover' || substr(replace(gen_random_uuid()::text,'-',''),1,10)),
 role text not null default 'member' check(role in ('member','moderator','admin')),
 alias_changed_at timestamptz, created_at timestamptz not null default now()
);
create table public.posts (
 id uuid primary key default gen_random_uuid(), author_id uuid references public.profiles(id) on delete cascade,
 request_id uuid not null, title text not null check(char_length(title) between 3 and 160),
 body text not null check(char_length(body) between 1 and 5000),
 category text not null check(category in ('Confessions','Campus Life','Academics','Placements','Events','Suggestions','General')),
 confession boolean not null default false, status text not null default 'published' check(status in ('published','hidden','removed')),
 locked boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(author_id,request_id)
);
create table public.comments (
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
 author_id uuid references public.profiles(id) on delete cascade, parent_id uuid references public.comments(id) on delete cascade,
 request_id uuid not null, body text not null check(char_length(body) between 1 and 2000),
 status text not null default 'published' check(status in ('published','hidden','removed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(author_id,request_id)
);
create table public.post_votes (post_id uuid references public.posts(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,created_at timestamptz not null default now(),primary key(post_id,user_id));
create table public.bookmarks (post_id uuid references public.posts(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,created_at timestamptz not null default now(),primary key(post_id,user_id));
create table public.polls (
 id uuid primary key default gen_random_uuid(),author_id uuid references public.profiles(id) on delete cascade,request_id uuid not null,
 question text not null check(char_length(question) between 3 and 160),description text not null default '' check(char_length(description)<=2000),
 status text not null default 'open' check(status in ('open','closed','hidden','removed')),
 closes_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(author_id,request_id)
);
create table public.poll_options (
 id uuid primary key default gen_random_uuid(),poll_id uuid not null references public.polls(id) on delete cascade,
 label text not null check(char_length(label) between 1 and 100),position smallint not null check(position between 0 and 5),unique(poll_id,position),unique(poll_id,id),unique(poll_id,label)
);
create table public.poll_votes (
 poll_id uuid not null references public.polls(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,option_id uuid not null,
 created_at timestamptz not null default now(),primary key(poll_id,user_id),foreign key(poll_id,option_id) references public.poll_options(poll_id,id) on delete cascade
);
create table public.suggestions (
 id uuid primary key default gen_random_uuid(),author_id uuid references public.profiles(id) on delete cascade,request_id uuid not null,
 title text not null check(char_length(title) between 3 and 160),body text not null check(char_length(body) between 1 and 5000),
 category text not null check(category in ('Infrastructure','Food','Wi-Fi','Library','Academics','Events','Transport','Other')),
 status text not null default 'published' check(status in ('published','hidden','removed')),
 official_status text not null default 'Submitted' check(official_status in ('Submitted','Under Review','Accepted','In Progress','Completed','Declined')),
 response text check(char_length(response)<=2000),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(author_id,request_id)
);
create table public.suggestion_votes (suggestion_id uuid references public.suggestions(id) on delete cascade,user_id uuid references public.profiles(id) on delete cascade,created_at timestamptz not null default now(),primary key(suggestion_id,user_id));
create table public.reports (
 id uuid primary key default gen_random_uuid(),reporter_id uuid references public.profiles(id) on delete set null,
 target_type text not null check(target_type in ('post','comment','poll','suggestion')),target_id uuid not null,
 reason text not null check(reason in ('Harassment or bullying','Personal information','Threats','Spam','Impersonation','Inappropriate content','Targeted accusations','Other')),
 description text not null default '' check(char_length(description)<=2000),status text not null default 'pending' check(status in ('pending','dismissed','resolved')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(reporter_id,target_type,target_id)
);
create table public.moderation_actions (
 id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles(id) on delete set null,
 action text not null,target_type text not null,target_id uuid not null,reason text not null check(char_length(reason) between 3 and 2000),created_at timestamptz not null default now()
);
create table public.user_suspensions (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 expires_at timestamptz not null,reason text not null check(char_length(reason) between 3 and 2000),
 moderator_id uuid references public.profiles(id) on delete set null,created_at timestamptz not null default now()
);
create table private.rate_limits (user_id uuid references public.profiles(id) on delete cascade,bucket text,window_start timestamptz not null,hits integer not null,primary key(user_id,bucket));
create index posts_feed on public.posts(status,created_at desc);
create index posts_category on public.posts(category,status,created_at desc);
create index posts_author on public.posts(author_id,created_at desc);
create index posts_search on public.posts using gin(to_tsvector('english',title || ' ' || body));
create index comments_post on public.comments(post_id,created_at);
create index comments_parent on public.comments(parent_id);
create index comments_author on public.comments(author_id);
create index post_votes_user on public.post_votes(user_id);
create index bookmarks_user on public.bookmarks(user_id,created_at desc);
create index polls_feed on public.polls(status,created_at desc);
create index polls_author on public.polls(author_id);
create index poll_votes_option on public.poll_votes(option_id);
create index poll_votes_user on public.poll_votes(user_id);
create index suggestions_feed on public.suggestions(status,official_status,created_at desc);
create index suggestions_author on public.suggestions(author_id);
create index suggestion_votes_user on public.suggestion_votes(user_id);
create index reports_queue on public.reports(status,created_at);
create index reports_reporter on public.reports(reporter_id);
create index audit_created on public.moderation_actions(created_at desc);
create index audit_actor on public.moderation_actions(actor_id);
create index suspensions_moderator on public.user_suspensions(moderator_id);

create function private.is_moderator() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.role in ('moderator','admin'))
 and not exists(select 1 from public.user_suspensions s where s.user_id=auth.uid() and s.expires_at>now());
$$;
-- Defense in depth: no table grants to API roles. RPCs below implement safe projections.
-- These policies also restrict future accidental table grants to owners/moderators.
do $$ declare t text; begin
 foreach t in array array['profiles','posts','comments','post_votes','polls','poll_options','poll_votes','suggestions','suggestion_votes','bookmarks','reports','moderation_actions','user_suspensions'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from public, anon, authenticated',t);
 execute format('create policy moderator_read on public.%I for select to authenticated using (private.is_moderator())',t);
 end loop;
end $$;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy own_posts on public.posts for select to authenticated using(author_id=auth.uid());
create policy own_comments on public.comments for select to authenticated using(author_id=auth.uid());
create policy own_polls on public.polls for select to authenticated using(author_id=auth.uid());
create policy own_suggestions on public.suggestions for select to authenticated using(author_id=auth.uid());
create policy own_votes on public.post_votes for select to authenticated using(user_id=auth.uid());
create policy own_votes on public.poll_votes for select to authenticated using(user_id=auth.uid());
create policy own_votes on public.suggestion_votes for select to authenticated using(user_id=auth.uid());
create policy own_bookmarks on public.bookmarks for select to authenticated using(user_id=auth.uid());
create policy own_reports on public.reports for select to authenticated using(reporter_id=auth.uid());
create policy own_suspension on public.user_suspensions for select to authenticated using(user_id=auth.uid());
-- No INSERT/UPDATE/DELETE policies or grants: every write MUST pass the RPC checks.
create or replace function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 -- Supabase's identifier is an opaque SHA-256-based address on reserved .invalid.
 -- Reject alternate signup identities; no mailbox or supplied email is required.
 if new.email is null or new.email !~ '^[0-9a-f]{64}@accounts\.amitea\.invalid$' then
   raise exception 'Use amiTea username registration.';
 end if;
 insert into public.profiles(id) values(new.id);
 return new;
 end;
$$;
create trigger amitea_new_user after insert on auth.users for each row execute function private.new_profile();
-- Existing accounts get aliases too.
insert into public.profiles(id) select id from auth.users on conflict(id) do nothing;

create or replace function private.actor() returns uuid language plpgsql security definer set search_path='' as $$
 declare u uuid:=auth.uid();
 begin
 if u is null or not exists(select 1 from auth.users where id=u) then
   raise exception 'Sign in to continue.' using errcode='P0001';
 end if;
 if exists(select 1 from public.user_suspensions where user_id=u and expires_at>now()) then
   raise exception 'Your account is temporarily restricted.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 return u;
 end;
$$;
create function private.rate(u uuid,b text,maximum integer,seconds integer) returns void language plpgsql security definer set search_path='' as $$
 declare n integer;
 begin
 insert into private.rate_limits(user_id,bucket,window_start,hits) values(u,b,now(),1)
 on conflict(user_id,bucket) do update set
 hits=case when private.rate_limits.window_start <= now()-make_interval(secs=>seconds) then 1 else private.rate_limits.hits+1 end,
 window_start=case when private.rate_limits.window_start <= now()-make_interval(secs=>seconds) then now() else private.rate_limits.window_start end returning hits into n;
 if n>maximum then raise exception 'You are doing that too quickly. Please try again later.'; end if;
 end;
$$;
create function private.target_visible(k text,t uuid) returns boolean language sql stable security definer set search_path='' as $$
 select case k
 when 'post' then exists(select 1 from public.posts where id=t and status='published')
 when 'comment' then exists(select 1 from public.comments c join public.posts p on p.id=c.post_id where c.id=t and c.status='published' and p.status='published' and (c.parent_id is null or exists(select 1 from public.comments parent where parent.id=c.parent_id and parent.status='published')))
 when 'poll' then exists(select 1 from public.polls where id=t and status in ('open','closed'))
 when 'suggestion' then exists(select 1 from public.suggestions where id=t and status='published') else false end;
$$;
create function public.me() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('alias',p.alias,'role',p.role,'alias_changed_at',p.alias_changed_at,'suspension',
 (select jsonb_build_object('expires_at',s.expires_at,'reason',s.reason) from public.user_suspensions s where s.user_id=p.id and s.expires_at>now()))
 from public.profiles p where p.id=auth.uid();
$$;

create function public.mutate(kind text,payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare u uuid; result_id uuid; target uuid; parent uuid; request uuid; opts jsonb; opt jsonb; idx integer:=0; k text; wanted boolean;
 begin
 -- Deletion remains possible even for suspended/ineligible accounts.
 if kind='delete_account' then
 u:=auth.uid();
 if u is null or payload->>'confirmation'<>'DELETE' then raise exception 'Confirm account deletion.'; end if;
 -- Use an explicit SQL NULL-safe check (JSON missing confirmation must not delete).
 if payload->>'confirmation' is distinct from 'DELETE' then raise exception 'Confirm account deletion.'; end if;
 delete from auth.users where id=u;
 return jsonb_build_object('ok',true);
 end if;
 u:=private.actor();
 target:=nullif(payload->>'id','')::uuid;
 if kind in ('create_post','create_comment','create_poll','create_suggestion') then
 request:=(payload->>'request_id')::uuid;
 if request is null then raise exception 'A request identifier is required.'; end if;
 if kind='create_post' then select id into result_id from public.posts where author_id=u and request_id=request;
 elsif kind='create_comment' then select id into result_id from public.comments where author_id=u and request_id=request;
 elsif kind='create_poll' then select id into result_id from public.polls where author_id=u and request_id=request;
 else select id into result_id from public.suggestions where author_id=u and request_id=request; end if;
 if result_id is not null then return jsonb_build_object('id',result_id); end if;
 perform private.rate(u,'content',12,3600);
 if kind='create_post' then
 insert into public.posts(author_id,request_id,title,body,category,confession) values(u,request,btrim(payload->>'title'),btrim(payload->>'body'),payload->>'category',coalesce((payload->>'confession')::boolean,false)) returning id into result_id;
 elsif kind='create_comment' then
 perform 1 from public.posts where id=(payload->>'post_id')::uuid and status='published' and not locked for share;
 if not found then raise exception 'This discussion is unavailable or locked.'; end if;
 parent:=nullif(payload->>'parent_id','')::uuid;
 if parent is not null and not exists(select 1 from public.comments where id=parent and post_id=(payload->>'post_id')::uuid and parent_id is null and status='published') then raise exception 'Reply to a visible top-level comment.'; end if;
 insert into public.comments(author_id,request_id,post_id,parent_id,body) values(u,request,(payload->>'post_id')::uuid,parent,btrim(payload->>'body')) returning id into result_id;
 elsif kind='create_poll' then
 opts:=payload->'options';
 if jsonb_typeof(opts) is distinct from 'array' or jsonb_array_length(opts) not between 2 and 6 then raise exception 'Choose 2–6 poll options.'; end if;
 if nullif(payload->>'closes_at','')::timestamptz<=now() then raise exception 'Closing time must be in the future.'; end if;
 insert into public.polls(author_id,request_id,question,description,closes_at) values(u,request,btrim(payload->>'question'),coalesce(btrim(payload->>'description'),''),nullif(payload->>'closes_at','')::timestamptz) returning id into result_id;
 for opt in select value from jsonb_array_elements(opts) loop
 insert into public.poll_options(poll_id,label,position) values(result_id,btrim(opt#>>'{}'),idx); idx:=idx+1;
 end loop;
 else
 insert into public.suggestions(author_id,request_id,title,body,category) values(u,request,btrim(payload->>'title'),btrim(payload->>'body'),payload->>'category') returning id into result_id;
 end if;
 return jsonb_build_object('id',result_id);
 elsif kind in ('edit_post','edit_comment','edit_suggestion','delete_post','delete_comment','delete_poll','delete_suggestion') then
 perform private.rate(u,'edit',40,3600);
 if kind='edit_post' then update public.posts set title=btrim(payload->>'title'),body=btrim(payload->>'body'),updated_at=now() where id=target and author_id=u and status='published' and not locked;
 elsif kind='edit_comment' then update public.comments c set body=btrim(payload->>'body'),updated_at=now() where c.id=target and c.author_id=u and c.status='published' and exists(select 1 from public.posts p where p.id=c.post_id and p.status='published' and not p.locked) and private.target_visible('comment',c.id);
 elsif kind='edit_suggestion' then update public.suggestions set title=btrim(payload->>'title'),body=btrim(payload->>'body'),updated_at=now() where id=target and author_id=u and status='published';
 elsif kind='delete_post' then delete from public.posts where id=target and author_id=u;
 elsif kind='delete_comment' then delete from public.comments where id=target and author_id=u;
 elsif kind='delete_poll' then delete from public.polls where id=target and author_id=u;
 else delete from public.suggestions where id=target and author_id=u; end if;
 if not found then raise exception 'Content unavailable or permission denied.'; end if;
 elsif kind in ('vote_post','vote_suggestion','bookmark') then
 perform private.rate(u,'interaction',120,3600);
 wanted:=(payload->>'active')::boolean;
 if wanted is null then raise exception 'Choose a vote state.'; end if;
 k:=case when kind='vote_suggestion' then 'suggestion' else 'post' end;
 if not private.target_visible(k,target) then raise exception 'Content unavailable.'; end if;
 if kind='vote_post' then
 if wanted then insert into public.post_votes values(target,u,now()) on conflict do nothing; else delete from public.post_votes where post_id=target and user_id=u; end if;
 elsif kind='bookmark' then
 if wanted then insert into public.bookmarks values(target,u,now()) on conflict do nothing; else delete from public.bookmarks where post_id=target and user_id=u; end if;
 else
 if wanted then insert into public.suggestion_votes values(target,u,now()) on conflict do nothing; else delete from public.suggestion_votes where suggestion_id=target and user_id=u; end if;
 end if;
 elsif kind='vote_poll' then
 perform private.rate(u,'interaction',120,3600);
 perform 1 from public.polls where id=target and status='open' and (closes_at is null or closes_at>now()) for share;
 if not found then raise exception 'This poll is closed.'; end if;
 insert into public.poll_votes(poll_id,user_id,option_id) values(target,u,(payload->>'option_id')::uuid) on conflict(poll_id,user_id) do nothing;
 elsif kind='report' then
 perform private.rate(u,'report',5,3600);
 k:=payload->>'target_type';
 if not private.target_visible(k,target) then raise exception 'Content unavailable.'; end if;
 insert into public.reports(reporter_id,target_type,target_id,reason,description) values(u,k,target,payload->>'reason',coalesce(payload->>'description','')) on conflict(reporter_id,target_type,target_id) do nothing;
 elsif kind='regenerate_alias' then
 update public.profiles set alias='CampusGhost'||substr(replace(gen_random_uuid()::text,'-',''),1,10),alias_changed_at=now() where id=u and (alias_changed_at is null or alias_changed_at<now()-interval '7 days');
 if not found then raise exception 'You can change your alias once every 7 days.'; end if;
 else raise exception 'Unknown action.';
 end if;
 return jsonb_build_object('ok',true);
 end;
$$;

create function public.feed(kind text default 'posts',sort_by text default 'latest',category_filter text default '',query_text text default '',page_number integer default 1,status_filter text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
 declare result jsonb; skip integer:= (greatest(1,least(coalesce(page_number,1),500))-1)*20;
 begin
 if char_length(query_text)>100 then raise exception 'Search is too long.'; end if;
 if kind in ('saved','activity') and auth.uid() is null then raise exception 'Sign in to continue.'; end if;
 if kind in ('posts','saved','activity') then
 select coalesce(jsonb_agg(to_jsonb(x)-'rank'), '[]'::jsonb) into result from (
 select p.id,p.title,left(p.body,420) as body,p.category,p.confession,p.locked,p.status,p.created_at,p.updated_at,
 case when p.confession then 'CampusConfession' else a.alias end as alias,(p.author_id=auth.uid()) as is_owner,
 v.n as votes,c.n as comments,
 exists(select 1 from public.post_votes where post_id=p.id and user_id=auth.uid()) as voted,
 exists(select 1 from public.bookmarks where post_id=p.id and user_id=auth.uid()) as saved,
 (v.n+2*c.n+1)/power(extract(epoch from (now()-p.created_at))/3600+2,1.5)
 + case when c.last_at>now()-interval '6 hours' then 0.15 else 0 end as rank
 from public.posts p join public.profiles a on a.id=p.author_id
 cross join lateral(select count(*) as n from public.post_votes where post_id=p.id) v
 cross join lateral(select count(*) as n,max(created_at) as last_at from public.comments c where post_id=p.id and private.target_visible('comment',c.id)) c
 where (p.status='published' or (kind='activity' and p.author_id=auth.uid()))
 and (kind<>'saved' or exists(select 1 from public.bookmarks b where b.post_id=p.id and b.user_id=auth.uid()))
 and (kind<>'activity' or p.author_id=auth.uid())
 and (coalesce(category_filter,'')='' or p.category=category_filter)
 and (coalesce(query_text,'')='' or to_tsvector('english',p.title||' '||p.body) @@ websearch_to_tsquery('english',query_text))
 and (sort_by<>'trending' or p.created_at>now()-interval '30 days')
 order by case when sort_by='top' then v.n end desc,
 case when sort_by='trending' then (v.n+2*c.n+1)/power(extract(epoch from (now()-p.created_at))/3600+2,1.5)+case when c.last_at>now()-interval '6 hours' then 0.15 else 0 end end desc,p.created_at desc,p.id
 limit 20 offset skip) x;
 elsif kind='polls' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into result from (
 select p.id,p.question as title,p.description as body,p.created_at,p.closes_at,a.alias,p.author_id=auth.uid() as is_owner,
 case when p.status='closed' or p.closes_at<=now() then 'closed' else 'open' end as status,
 (select option_id from public.poll_votes where poll_id=p.id and user_id=auth.uid()) as selected_option,
 (select count(*) from public.poll_votes where poll_id=p.id) as votes,
 (select jsonb_agg(jsonb_build_object('id',o.id,'label',o.label,'votes',(select count(*) from public.poll_votes pv where pv.option_id=o.id)) order by o.position) from public.poll_options o where o.poll_id=p.id) as options
 from public.polls p join public.profiles a on a.id=p.author_id where p.status in ('open','closed')
 and (status_filter='' or (case when p.status='closed' or p.closes_at<=now() then 'closed' else 'open' end)=status_filter)
 order by case when sort_by='top' then (select count(*) from public.poll_votes where poll_id=p.id) end desc,p.created_at desc,p.id limit 20 offset skip) x;
 elsif kind='suggestions' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into result from (
 select s.id,s.title,s.body,s.category,s.created_at,s.official_status,s.response,a.alias,s.author_id=auth.uid() as is_owner,
 (select count(*) from public.suggestion_votes where suggestion_id=s.id) as votes,
 exists(select 1 from public.suggestion_votes where suggestion_id=s.id and user_id=auth.uid()) as voted
 from public.suggestions s join public.profiles a on a.id=s.author_id where s.status='published' and (status_filter='' or s.official_status=status_filter)
 and (category_filter='' or s.category=category_filter)
 order by case when sort_by='top' then (select count(*) from public.suggestion_votes where suggestion_id=s.id) end desc,s.created_at desc,s.id limit 20 offset skip) x;
 else raise exception 'Unknown feed.'; end if;
 return result;
 end;
$$;
create function public.post_detail(post uuid) returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',p.id,'title',p.title,'body',p.body,'category',p.category,'confession',p.confession,'locked',p.locked,'created_at',p.created_at,'updated_at',p.updated_at,'alias',case when p.confession then 'CampusConfession' else a.alias end,'is_owner',p.author_id=auth.uid(),'votes',(select count(*) from public.post_votes where post_id=p.id),'comments',(select count(*) from public.comments c where c.post_id=p.id and private.target_visible('comment',c.id)),'voted',exists(select 1 from public.post_votes where post_id=p.id and user_id=auth.uid()),'saved',exists(select 1 from public.bookmarks where post_id=p.id and user_id=auth.uid()))
 from public.posts p join public.profiles a on a.id=p.author_id where p.id=post and p.status='published';
$$;
create function public.comments_for(post uuid,page_number integer default 1) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
 select c.id,c.post_id,c.parent_id,c.body,c.created_at,c.updated_at,a.alias,c.author_id=auth.uid() as is_owner,
 (select left(parent.body,100) from public.comments parent where parent.id=c.parent_id and parent.status='published') as parent_preview
 from public.comments c join public.profiles a on a.id=c.author_id where c.post_id=post and private.target_visible('comment',c.id)
 order by c.created_at,c.id limit 30 offset ((greatest(1,least(coalesce(page_number,1),500))-1)*30)) x;
$$;
create function public.my_comments(page_number integer default 1) returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) from (
 select c.id,c.post_id,c.body,c.created_at,c.status from public.comments c where c.author_id=auth.uid()
 order by c.created_at desc,c.id limit 20 offset ((greatest(1,least(coalesce(page_number,1),500))-1)*20)) x;
$$;

create function public.moderate(payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
 declare u uuid:=private.actor(); k text:=payload->>'target_type'; t uuid:=(payload->>'id')::uuid; a text:=payload->>'action'; why text:=btrim(payload->>'reason'); old_status text; target_role text;
 begin
 if not private.is_moderator() then raise exception 'Moderator access required.'; end if;
 if why is null or char_length(why) not between 3 and 2000 then raise exception 'Provide a moderation reason.'; end if;
 if a in ('hide','remove','restore','lock','unlock','close','status') then
 if k='post' and a in ('hide','remove','restore','lock','unlock') then
 update public.posts set status=case a when 'hide' then 'hidden' when 'remove' then 'removed' when 'restore' then 'published' else status end,locked=case a when 'lock' then true when 'unlock' then false else locked end,updated_at=now() where id=t;
 elsif k='comment' and a in ('hide','remove','restore') then update public.comments set status=case a when 'hide' then 'hidden' when 'remove' then 'removed' else 'published' end,updated_at=now() where id=t;
 elsif k='poll' and a in ('hide','remove','restore','close') then update public.polls set status=case a when 'hide' then 'hidden' when 'remove' then 'removed' when 'close' then 'closed' else 'open' end,updated_at=now() where id=t;
 elsif k='suggestion' and a in ('hide','remove','restore','status') then update public.suggestions set status=case a when 'hide' then 'hidden' when 'remove' then 'removed' when 'restore' then 'published' else status end,official_status=case when a='status' then payload->>'official_status' else official_status end,response=case when a='status' then why else response end,updated_at=now() where id=t;
 else raise exception 'Invalid moderation action.'; end if;
 if not found then raise exception 'Content no longer exists.'; end if;
 elsif k='report' and a in ('dismiss','resolve') then
 update public.reports set status=case a when 'dismiss' then 'dismissed' else 'resolved' end,updated_at=now() where id=t;
 if not found then raise exception 'Report no longer exists.'; end if;
 elsif k='user' and a in ('suspend','reinstate') then
 select role into target_role from public.profiles where id=t;
 if target_role is null or target_role<>'member' then raise exception 'Only member accounts can be restricted here.'; end if;
 if a='suspend' then
 insert into public.user_suspensions(user_id,expires_at,reason,moderator_id) values(t,now()+interval '7 days',why,u)
 on conflict(user_id) do update set expires_at=excluded.expires_at,reason=excluded.reason,moderator_id=u,created_at=now();
 else delete from public.user_suspensions where user_id=t; end if;
 else raise exception 'Invalid moderation action.'; end if;
 insert into public.moderation_actions(actor_id,action,target_type,target_id,reason) values(u,a,k,t,why);
 return jsonb_build_object('ok',true);
 end;
$$;
create function public.admin_data(section text,page_number integer default 1,state text default '',reason_filter text default '',type_filter text default '') returns jsonb language plpgsql stable security definer set search_path='' as $$
 declare result jsonb; skip integer:=(greatest(1,least(coalesce(page_number,1),500))-1)*20;
 begin
 if not private.is_moderator() then raise exception 'Moderator access required.'; end if;
 if section='reports' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into result from (
 select r.id,r.target_type,r.target_id,r.reason,r.description,r.status,r.created_at,
 case r.target_type when 'post' then (select left(title||' — '||body,1500) from public.posts where id=r.target_id)
 when 'comment' then (select left(body,1500) from public.comments where id=r.target_id)
 when 'poll' then (select question from public.polls where id=r.target_id)
 when 'suggestion' then (select left(title||' — '||body,1500) from public.suggestions where id=r.target_id) end as preview
 from public.reports r where (state='' or r.status=state) and (reason_filter='' or r.reason=reason_filter) and (type_filter='' or r.target_type=type_filter) order by r.created_at,r.id limit 20 offset skip) x;
 elsif section='users' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into result from (
 select p.id,p.alias,p.role,p.created_at,s.expires_at,s.reason from public.profiles p left join public.user_suspensions s on s.user_id=p.id order by p.created_at desc,p.id limit 20 offset skip) x;
 elsif section='audit' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into result from (
 select m.id,m.action,m.target_type,m.target_id,m.reason,m.created_at,p.alias as moderator from public.moderation_actions m left join public.profiles p on p.id=m.actor_id order by m.created_at desc,m.id limit 20 offset skip) x;
 elsif section='posts' then
 select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into result from (
 select * from (
 select id,'post' as target_type,title,body,status,created_at,locked,author_id as account_id from public.posts
 union all select id,'comment',null,body,status,created_at,false,author_id from public.comments
 union all select id,'poll',question,description,status,created_at,false,author_id from public.polls
 union all select id,'suggestion',title,body,status,created_at,false,author_id from public.suggestions) content
 where (state='' or status=state) and (type_filter='' or target_type=type_filter) order by created_at desc,id limit 20 offset skip) x;
 else raise exception 'Unknown moderation section.'; end if;
 return result;
 end;
$$;
-- Explicit allowlist. PostgreSQL otherwise grants function execution to PUBLIC.
revoke all on all functions in schema private from public,anon,authenticated;
revoke all on all functions in schema public from public,anon,authenticated;
grant execute on function public.feed(text,text,text,text,integer,text),public.post_detail(uuid),public.comments_for(uuid,integer) to anon,authenticated;
grant execute on function public.me(),public.my_comments(integer),public.mutate(text,jsonb),public.moderate(jsonb),public.admin_data(text,integer,text,text,text) to authenticated;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;
-- Keep the private login identifier immutable through the public Auth API.
create function private.keep_login_identifier() returns trigger language plpgsql security definer set search_path='' as $$
 begin
 if new.email is distinct from old.email then raise exception 'Login identifiers cannot be changed.'; end if;
 return new;
 end;
$$;
create trigger amitea_login_identifier_immutable before update of email on auth.users
for each row execute function private.keep_login_identifier();
revoke all on function private.keep_login_identifier() from public,anon,authenticated;

commit;
