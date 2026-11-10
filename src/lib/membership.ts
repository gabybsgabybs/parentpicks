import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MyGroup = { neighborhoodId: string; name: string; role: "admin" | "member"; inviteCode: string };

export const myGroupQuery = queryOptions({
  queryKey: ["my-group"],
  queryFn: async (): Promise<MyGroup | null> => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const { data } = await supabase.from("memberships").select("role, neighborhood_id, neighborhoods(name, invite_code)")
      .eq("user_id", u.user.id).order("created_at").limit(1).maybeSingle();
    if (!data) return null;
    const n = data.neighborhoods as unknown as { name: string; invite_code: string };
    return { neighborhoodId: data.neighborhood_id, name: n.name, inviteCode: n.invite_code, role: data.role as MyGroup["role"] };
  },
});
