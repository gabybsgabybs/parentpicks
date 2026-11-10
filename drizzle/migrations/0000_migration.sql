
create table public.neighborhoods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  created_at timestamptz not null default now()
);
grant select on public.neighborhoods to authenticated;
grant all on public.neighborhoods to service_role;
alter table public.neighborhoods enable row level security;

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  user_id uuid not null,
  email text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now(),
  unique (neighborhood_id, user_id)
);
grant select, delete on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;

create table public.admin_invites (
  email text not null,
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  primary key (email, neighborhood_id)
);
grant all on public.admin_invites to service_role;
alter table public.admin_invites enable row level security;

create or replace function public.is_member(_nb uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where neighborhood_id = _nb and user_id = auth.uid())
$$;
create or replace function public.is_admin(_nb uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from memberships where neighborhood_id = _nb and user_id = auth.uid() and role = 'admin')
$$;

create policy "members read their neighborhood" on public.neighborhoods for select to authenticated using (public.is_member(id));
create policy "read own membership or admin reads all" on public.memberships for select to authenticated
  using (user_id = auth.uid() or public.is_admin(neighborhood_id));
create policy "admins remove members" on public.memberships for delete to authenticated
  using (public.is_admin(neighborhood_id) and user_id <> auth.uid());

create or replace function public.join_with_code(_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare nb uuid; uemail text; r text := 'member';
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into nb from neighborhoods where upper(invite_code) = upper(trim(_code));
  if nb is null then raise exception 'That invite code is not valid'; end if;
  select email into uemail from auth.users where id = auth.uid();
  if exists (select 1 from admin_invites where neighborhood_id = nb and lower(email) = lower(uemail)) then r := 'admin'; end if;
  insert into memberships (neighborhood_id, user_id, email, role) values (nb, auth.uid(), uemail, r)
  on conflict (neighborhood_id, user_id) do update set role = case when memberships.role = 'admin' then 'admin' else excluded.role end;
  return nb;
end $$;
revoke execute on function public.join_with_code(text) from public, anon;
grant execute on function public.join_with_code(text) to authenticated;

create or replace function public.rotate_invite_code(_nb uuid) returns text
language plpgsql security definer set search_path = public as $$
declare c text;
begin
  if not public.is_admin(_nb) then raise exception 'Only admins can change the code'; end if;
  c := upper(substr(md5(gen_random_uuid()::text), 1, 4) || '-' || substr(md5(gen_random_uuid()::text), 1, 4));
  update neighborhoods set invite_code = c where id = _nb;
  return c;
end $$;
revoke execute on function public.rotate_invite_code(uuid) from public, anon;
grant execute on function public.rotate_invite_code(uuid) to authenticated;

create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  uploaded_by uuid not null,
  messages_read int not null default 0,
  recommendations_found int not null default 0,
  status text not null default 'processing',
  created_at timestamptz not null default now()
);
grant select on public.uploads to authenticated;
grant all on public.uploads to service_role;
alter table public.uploads enable row level security;
create policy "admins read uploads" on public.uploads for select to authenticated using (public.is_admin(neighborhood_id));

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  name text not null,
  aliases text[] not null default '{}',
  category text not null default 'other' check (category in ('pediatrician','dentist','specialist','therapist','childcare','classes and activities','clothing brands','toys','stores','services','other')),
  summary text not null default '',
  location text,
  status text not null default 'needs_review' check (status in ('needs_review','published','hidden')),
  self_promo_flag boolean not null default false,
  parent_count int not null default 0,
  positive int not null default 0,
  negative int not null default 0,
  mixed int not null default 0,
  first_mention date,
  last_mention date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.providers (neighborhood_id, status);
grant select, update on public.providers to authenticated;
grant all on public.providers to service_role;
alter table public.providers enable row level security;
create policy "members read published, admins read all" on public.providers for select to authenticated
  using ((status = 'published' and public.is_member(neighborhood_id)) or public.is_admin(neighborhood_id));
create policy "admins edit providers" on public.providers for update to authenticated
  using (public.is_admin(neighborhood_id)) with check (public.is_admin(neighborhood_id));

create table public.mentions (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete cascade,
  upload_id uuid references public.uploads(id) on delete set null,
  sender_hash text not null,
  raw_name text not null,
  category text not null default 'other',
  location text,
  mentioned_at date not null,
  sentiment text not null check (sentiment in ('positive','negative','mixed')),
  paraphrase text not null,
  self_promo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.mentions (provider_id);
-- sender_hash is never exposed to app users
grant select (id, neighborhood_id, provider_id, mentioned_at, sentiment, paraphrase, self_promo, raw_name) on public.mentions to authenticated;
grant all on public.mentions to service_role;
alter table public.mentions enable row level security;
create policy "read mentions of visible providers" on public.mentions for select to authenticated
  using (public.is_admin(neighborhood_id) or (public.is_member(neighborhood_id) and exists (select 1 from providers p where p.id = provider_id and p.status = 'published')));

create table public.match_suggestions (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  provider_a uuid not null references public.providers(id) on delete cascade,
  provider_b uuid not null references public.providers(id) on delete cascade,
  reason text not null default '',
  status text not null default 'open' check (status in ('open','merged','dismissed')),
  created_at timestamptz not null default now()
);
grant select, update on public.match_suggestions to authenticated;
grant all on public.match_suggestions to service_role;
alter table public.match_suggestions enable row level security;
create policy "admins read suggestions" on public.match_suggestions for select to authenticated using (public.is_admin(neighborhood_id));
create policy "admins update suggestions" on public.match_suggestions for update to authenticated using (public.is_admin(neighborhood_id));

create table public.flags (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  note text not null check (char_length(note) between 3 and 1000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.flags to authenticated;
grant all on public.flags to service_role;
alter table public.flags enable row level security;
create policy "members flag" on public.flags for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(neighborhood_id));
create policy "admins read flags" on public.flags for select to authenticated using (public.is_admin(neighborhood_id));
create policy "admins resolve flags" on public.flags for update to authenticated using (public.is_admin(neighborhood_id));

-- Recompute counts: one opinion per parent (their most recent), self-promotion excluded
create or replace function public.recompute_provider(_p uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  with latest as (
    select distinct on (sender_hash) sentiment from mentions
    where provider_id = _p and not self_promo
    order by sender_hash, mentioned_at desc, created_at desc
  ), agg as (
    select count(*)::int c,
      count(*) filter (where sentiment='positive')::int pos,
      count(*) filter (where sentiment='negative')::int neg,
      count(*) filter (where sentiment='mixed')::int mix from latest
  ), dates as (select min(mentioned_at) f, max(mentioned_at) l from mentions where provider_id = _p)
  update providers set parent_count = agg.c, positive = agg.pos, negative = agg.neg, mixed = agg.mix,
    first_mention = dates.f, last_mention = dates.l,
    self_promo_flag = exists (select 1 from mentions where provider_id = _p and self_promo),
    updated_at = now()
  from agg, dates where providers.id = _p;
end $$;
revoke execute on function public.recompute_provider(uuid) from public, anon, authenticated;
grant execute on function public.recompute_provider(uuid) to service_role;

insert into public.neighborhoods (id, name, invite_code) values ('11111111-1111-1111-1111-111111111111', 'Duboce Parents', 'DUBOCE-2026');
insert into public.admin_invites (email, neighborhood_id) values ('admin@duboceparents.example', '11111111-1111-1111-1111-111111111111');
