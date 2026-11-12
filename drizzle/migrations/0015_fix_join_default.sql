CREATE OR REPLACE FUNCTION public.join_default()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare nb uuid; uemail text; r text := 'member';
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select neighborhood_id into nb from memberships where role = 'admin' limit 1;
  if nb is null then select id into nb from neighborhoods limit 1; end if;
  if nb is null then raise exception 'No group available'; end if;
  select email into uemail from auth.users where id = auth.uid();
  if exists (select 1 from admin_invites where neighborhood_id = nb and lower(email) = lower(uemail)) then r := 'admin'; end if;
  insert into memberships (neighborhood_id, user_id, email, role) values (nb, auth.uid(), uemail, r)
  on conflict (neighborhood_id, user_id) do nothing;
  return nb;
end $$;