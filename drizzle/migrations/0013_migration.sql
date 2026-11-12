CREATE TABLE public.village_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  neighborhood_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  place_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.village_chat (user_id, neighborhood_id, created_at);
GRANT SELECT, INSERT, DELETE ON public.village_chat TO authenticated;
GRANT ALL ON public.village_chat TO service_role;
ALTER TABLE public.village_chat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own chat read" ON public.village_chat FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own chat insert" ON public.village_chat FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_member(neighborhood_id));
CREATE POLICY "own chat delete" ON public.village_chat FOR DELETE TO authenticated USING (auth.uid() = user_id);