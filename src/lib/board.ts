import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MIN_PARENTS } from "./categories";

export type Provider = {
  id: string; neighborhood_id: string; name: string; aliases: string[]; category: string; summary: string; location: string | null;
  status: string; self_promo_flag: boolean; parent_count: number; positive: number; negative: number; mixed: number;
  first_mention: string | null; last_mention: string | null;
  website: string | null; phone: string | null; address: string | null; booking_url: string | null; contact_checked_at: string | null;
};

export const boardQuery = (nb: string) => queryOptions({
  queryKey: ["board", nb],
  queryFn: async () => {
    const { data, error } = await supabase.from("providers").select("*").eq("neighborhood_id", nb)
      .eq("status", "published").gte("parent_count", MIN_PARENTS).order("parent_count", { ascending: false });
    if (error) throw error;
    return data as Provider[];
  },
});

export type Sort = "parents" | "positive" | "recent";
export type TimeFilter = "all" | "1y" | "2y";

export function filterProviders(list: Provider[], o: { q: string; category: string; location: string; time: TimeFilter; sort: Sort }, now = new Date()) {
  const q = o.q.trim().toLowerCase();
  let out = list.filter((p) => {
    if (o.category !== "all" && p.category !== o.category) return false;
    if (o.location !== "all" && (p.location ?? "") !== o.location) return false;
    if (o.time !== "all") {
      const c = new Date(now); c.setFullYear(c.getFullYear() - (o.time === "1y" ? 1 : 2));
      if (!p.last_mention || new Date(p.last_mention) < c) return false;
    }
    if (q) {
      const hay = [p.name, ...p.aliases, p.category, p.location ?? ""].join(" ").toLowerCase();
      if (!q.split(/\s+/).every((w) => hay.includes(w))) return false;
    }
    return true;
  });
  out = [...out].sort((a, b) =>
    o.sort === "positive" ? b.positive - a.positive || b.parent_count - a.parent_count
    : o.sort === "recent" ? (b.last_mention ?? "").localeCompare(a.last_mention ?? "")
    : b.parent_count - a.parent_count || b.positive - a.positive);
  return out;
}
