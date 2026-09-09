-- App-owned demo state. Existing tables and services are left intact.
create table if not exists public.contextflow_sessions (
 id uuid primary key,
 token_hash text not null unique,
 revision bigint not null default 0,
 body jsonb not null,
 updated_at timestamptz not null default now(),
 check ((body->>'id')::uuid=id),
 check ((body->>'revision')::bigint=revision),
 check ((body->>'walletMinor')::bigint>=0)
);
create table if not exists public.contextflow_actions (
 owner uuid not null references public.contextflow_sessions(id) on delete cascade,
 id text not null,
 fingerprint text not null,
 result jsonb not null,
 created_at timestamptz not null default now(),
 primary key(owner,id)
);
create table if not exists public.contextflow_tickets (
 id text primary key,
 owner uuid not null references public.contextflow_sessions(id) on delete cascade,
 body jsonb not null,
 created_at timestamptz not null default now(),
 check ((body->>'demoOnly')::boolean=true)
);
create table if not exists public.contextflow_cache (id text primary key,body jsonb not null,updated_at timestamptz not null default now());
create table if not exists public.contextflow_rate_limits (id text primary key,window_start timestamptz not null,hits integer not null);
alter table public.contextflow_sessions enable row level security;
alter table public.contextflow_actions enable row level security;
alter table public.contextflow_tickets enable row level security;
alter table public.contextflow_cache enable row level security;
alter table public.contextflow_rate_limits enable row level security;
revoke all on public.contextflow_sessions,public.contextflow_actions,public.contextflow_tickets,public.contextflow_cache,public.contextflow_rate_limits from anon,authenticated;
grant all on public.contextflow_sessions,public.contextflow_actions,public.contextflow_tickets,public.contextflow_cache,public.contextflow_rate_limits to service_role;

create table if not exists public.contextflow_commands (owner uuid primary key references public.contextflow_sessions(id) on delete cascade,request_id text not null,active boolean not null default true);
alter table public.contextflow_commands enable row level security;
revoke all on public.contextflow_commands from anon,authenticated;
grant all on public.contextflow_commands to service_role;

create or replace function public.contextflow_commit(p_owner uuid,p_expected bigint,p_id text,p_fingerprint text,p_result jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.contextflow_sessions; previous public.contextflow_actions; ticket jsonb;
begin
 select * into s from public.contextflow_sessions where id=p_owner for update;
 if not found then raise exception 'Session not found'; end if;
 select * into previous from public.contextflow_actions where owner=p_owner and id=p_id;
 if found then
  if previous.fingerprint<>p_fingerprint then raise exception 'Action ID already used for another request'; end if;
  return jsonb_build_object('duplicate',true,'result',previous.result,'session',s.body);
 end if;
 if p_result ? 'commandGuard' and not exists(select 1 from public.contextflow_commands where owner=p_owner and request_id=p_result->>'commandGuard' and active=true) then raise exception 'Instruction cancelled'; end if;
 p_result:=p_result-'commandGuard';
 if s.revision<>p_expected then return jsonb_build_object('conflict',true); end if;
 if (p_result->'session'->>'revision')::bigint<>p_expected+1 then raise exception 'Invalid state revision'; end if;
 update public.contextflow_sessions set body=p_result->'session',revision=p_expected+1,updated_at=now() where id=p_owner;
 insert into public.contextflow_actions(owner,id,fingerprint,result) values(p_owner,p_id,p_fingerprint,p_result);
 for ticket in select value from jsonb_array_elements(p_result->'session'->'tickets') loop
  insert into public.contextflow_tickets(id,owner,body) values(ticket->>'id',p_owner,ticket) on conflict(id) do nothing;
 end loop;
 return jsonb_build_object('result',p_result);
end $$;
revoke all on function public.contextflow_commit(uuid,bigint,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.contextflow_commit(uuid,bigint,text,text,jsonb) to service_role;

create or replace function public.contextflow_limit(p_id text,p_max integer)
returns boolean language plpgsql security definer set search_path=public as $$
declare count_now integer;
begin
 insert into public.contextflow_rate_limits(id,window_start,hits) values(p_id,date_trunc('minute',now()),1)
 on conflict(id) do update set window_start=excluded.window_start,hits=case when contextflow_rate_limits.window_start=excluded.window_start then contextflow_rate_limits.hits+1 else 1 end returning hits into count_now;
 return count_now<=p_max;
end $$;
revoke all on function public.contextflow_limit(text,integer) from public,anon,authenticated;
grant execute on function public.contextflow_limit(text,integer) to service_role;

-- One round trip authenticates and loads the action's idempotency record.
create or replace function public.contextflow_context(p_token_hash text,p_action_id text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare s public.contextflow_sessions; previous public.contextflow_actions;
begin
 select * into s from public.contextflow_sessions where token_hash=p_token_hash;
 if not found then return null; end if;
 if not public.contextflow_limit(s.id::text,240) then raise exception 'Too many requests. Please wait a moment.'; end if;
 if p_action_id is not null then select * into previous from public.contextflow_actions where owner=s.id and id=p_action_id; end if;
 return jsonb_build_object('session',s.body,'previous',case when previous.id is null then null else jsonb_build_object('fingerprint',previous.fingerprint,'result',previous.result) end);
end $$;
revoke all on function public.contextflow_context(text,text) from public,anon,authenticated;
grant execute on function public.contextflow_context(text,text) to service_role;
