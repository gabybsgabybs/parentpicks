CREATE OR REPLACE FUNCTION public.admin_manage_review(_neighborhood uuid, _provider uuid, _mention uuid, _action text, _paraphrase text DEFAULT NULL, _sentiment text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(_neighborhood) THEN RAISE EXCEPTION 'Only group admins can manage reviews'; END IF;
  PERFORM 1 FROM public.providers WHERE id = _provider AND neighborhood_id = _neighborhood FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recommendation not found'; END IF;
  IF _action = 'delete' THEN
    DELETE FROM public.mentions WHERE id = _mention AND provider_id = _provider AND neighborhood_id = _neighborhood;
  ELSIF _action = 'update' THEN
    IF _paraphrase IS NULL OR length(trim(_paraphrase)) = 0 OR length(_paraphrase) > 4000 OR _sentiment IS NULL OR _sentiment NOT IN ('positive', 'negative', 'mixed') THEN RAISE EXCEPTION 'Invalid review'; END IF;
    UPDATE public.mentions SET paraphrase = trim(_paraphrase), sentiment = _sentiment WHERE id = _mention AND provider_id = _provider AND neighborhood_id = _neighborhood;
  ELSE RAISE EXCEPTION 'Invalid action';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Review not found'; END IF;
  PERFORM public.recompute_provider(_provider);
END;
$$;
REVOKE ALL ON FUNCTION public.admin_manage_review(uuid, uuid, uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_manage_review(uuid, uuid, uuid, text, text, text) TO authenticated;