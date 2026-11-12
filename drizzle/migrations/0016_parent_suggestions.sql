create table public.parent_suggestions (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid not null references public.neighborhoods(id),
  user_id uuid not null default auth.uid(),
  name text not null check (char_length(name) between 2 and 120),
  category text not null default 'other',
  review text not null check (char_length(review) between 10 and 1500),
  sentiment text not null default 'positive' check (sentiment in ('positive','negative','mixed')),
  status text not null default 'pending' check (status in ('pending','approved','dismissed')),
  provider_id uuid references public.providers(id),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.parent_suggestions to authenticated;
grant all on public.parent_suggestions to service_role;
alter table public.parent_suggestions enable row level security;
create policy "members suggest" on public.parent_suggestions for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and provider_id is null and public.is_member(neighborhood_id));
create policy "own or admin read suggestions" on public.parent_suggestions for select to authenticated
  using (user_id = auth.uid() or public.is_admin(neighborhood_id));
create policy "admins update suggestions" on public.parent_suggestions for update to authenticated
  using (public.is_admin(neighborhood_id)) with check (public.is_admin(neighborhood_id));

create or replace function public.admin_resolve_suggestion(_id uuid, _action text)
returns uuid language plpgsql security definer set search_path = public as $$
declare s parent_suggestions; p uuid;
begin
  select * into s from parent_suggestions where id = _id for update;
  if s.id is null or not is_admin(s.neighborhood_id) then raise exception 'not allowed'; end if;
  if s.status <> 'pending' then raise exception 'already handled'; end if;
  if _action = 'dismiss' then
    update parent_suggestions set status = 'dismissed' where id = _id; return null;
  elsif _action <> 'approve' then raise exception 'bad action'; end if;
  select id into p from providers where neighborhood_id = s.neighborhood_id and lower(trim(name)) = lower(trim(s.name)) limit 1;
  if p is null then
    insert into providers (neighborhood_id, name, category, summary, status)
    values (s.neighborhood_id, trim(s.name), s.category, '', 'published') returning id into p;
  end if;
  insert into mentions (neighborhood_id, provider_id, sender_hash, raw_name, category, mentioned_at, sentiment, paraphrase)
  values (s.neighborhood_id, p, 'app:' || md5(s.user_id::text), s.name, s.category, current_date, s.sentiment, s.review);
  perform recompute_provider(p);
  update parent_suggestions set status = 'approved', provider_id = p where id = _id;
  return p;
end $$;
revoke execute on function public.admin_resolve_suggestion(uuid, text) from public, anon;
grant execute on function public.admin_resolve_suggestion(uuid, text) to authenticated;