GRANT SELECT (id, name, category, summary, location, parent_count, positive, mixed, negative, last_mention, website, phone, address, booking_url, status) ON public.providers TO anon;
GRANT SELECT (provider_id, paraphrase, sentiment, mentioned_at) ON public.mentions TO anon;
CREATE POLICY "public read published 2+ providers" ON public.providers FOR SELECT TO anon USING (status = 'published' AND parent_count >= 2);
CREATE POLICY "public read mentions of published 2+ providers" ON public.mentions FOR SELECT TO anon USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = mentions.provider_id AND p.status = 'published' AND p.parent_count >= 2));

CREATE OR REPLACE FUNCTION public.join_default()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare nb uuid; uemail text; r text := 'member';
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into nb from neighborhoods order by created_at limit 1;
  if nb is null then raise exception 'No group available'; end if;
  select email into uemail from auth.users where id = auth.uid();
  if exists (select 1 from admin_invites where neighborhood_id = nb and lower(email) = lower(uemail)) then r := 'admin'; end if;
  insert into memberships (neighborhood_id, user_id, email, role) values (nb, auth.uid(), uemail, r)
  on conflict (neighborhood_id, user_id) do nothing;
  return nb;
end $$;
REVOKE EXECUTE ON FUNCTION public.join_default() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.join_default() TO authenticated;