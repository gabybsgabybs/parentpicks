ALTER TABLE public.mentions ADD COLUMN IF NOT EXISTS sentiment_checked boolean NOT NULL DEFAULT false;
GRANT SELECT (sentiment_checked) ON public.mentions TO authenticated;
CREATE OR REPLACE FUNCTION public.admin_check_review(_neighborhood uuid, _mention uuid, _sentiment text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
declare p uuid;
begin
  if auth.uid() is null or not public.is_admin(_neighborhood) then raise exception 'Only group admins can validate reviews'; end if;
  if _sentiment not in ('positive','negative','mixed') then raise exception 'Invalid sentiment'; end if;
  update mentions set sentiment = _sentiment, sentiment_checked = true
    where id = _mention and neighborhood_id = _neighborhood returning provider_id into p;
  if not found then raise exception 'Review not found'; end if;
  if p is not null then perform public.recompute_provider(p); end if;
end $$;
REVOKE EXECUTE ON FUNCTION public.admin_check_review(uuid, uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.admin_check_review(uuid, uuid, text) TO authenticated;