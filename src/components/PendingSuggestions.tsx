import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";

const pendingQuery = (nb: string) => queryOptions({
  queryKey: ["pending-suggestions", nb],
  queryFn: async () => {
    const { data, error } = await supabase.from("parent_suggestions").select("id, name, category, review, sentiment, created_at").eq("neighborhood_id", nb).eq("status", "pending").order("created_at");
    if (error) throw error;
    return data ?? [];
  },
});

const SENT: Record<string, string> = { positive: "Loved it", mixed: "Mixed", negative: "Heads up" };

export function PendingSuggestions({ neighborhoodId }: { neighborhoodId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(pendingQuery(neighborhoodId));
  async function act(id: string, action: "approve" | "dismiss") {
    const { error } = await supabase.rpc("admin_resolve_suggestion", { _id: id, _action: action });
    if (error) { toast.error(error.message); return; }
    toast.success(action === "approve" ? "Approved — added to the place" : "Dismissed");
    qc.invalidateQueries({ queryKey: ["pending-suggestions", neighborhoodId] });
    qc.invalidateQueries({ queryKey: ["review", neighborhoodId] });
    qc.invalidateQueries({ queryKey: ["board"] });
  }
  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold"><Inbox className="size-5" /> Pending parent reviews ({data.length})</h2>
      {data.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">Nothing waiting. New "Recommend a place" submissions show up here.</p> : (
        <ul className="mt-3 space-y-2">
          {data.map((s) => (
            <li key={s.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold">{s.name}</span>
                <span className="text-xs text-muted-foreground">{CATEGORY_LABEL[s.category as Category] ?? s.category} · {SENT[s.sentiment]} · {new Date(s.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-1 text-sm">{s.review}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => act(s.id, "approve")}>Approve & publish</Button>
                <Button size="sm" variant="outline" onClick={() => act(s.id, "dismiss")}>Dismiss</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
