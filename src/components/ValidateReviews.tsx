import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Scale } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Sent = "positive" | "mixed" | "negative";
const PAGE = 15;

const validateQuery = (nb: string) => queryOptions({
  queryKey: ["validate-reviews", nb],
  queryFn: async () => {
    const { data, error } = await supabase.from("mentions")
      .select("id, paraphrase, sentiment, mentioned_at, provider_id, providers!inner(name, status)")
      .eq("neighborhood_id", nb).in("sentiment", ["mixed", "negative"]).eq("sentiment_checked", false)
      .neq("providers.status", "hidden").order("mentioned_at", { ascending: false }).limit(1000);
    if (error) throw error;
    return data ?? [];
  },
});

export function ValidateReviews({ neighborhoodId }: { neighborhoodId: string }) {
  const qc = useQueryClient();
  const { data = [] } = useQuery(validateQuery(neighborhoodId));
  const [tab, setTab] = useState<"mixed" | "negative">("mixed");
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const list = data.filter((m) => m.sentiment === tab);
  const shown = list.slice(page * PAGE, page * PAGE + PAGE);
  const counts = { mixed: data.filter((m) => m.sentiment === "mixed").length, negative: data.filter((m) => m.sentiment === "negative").length };

  async function set(id: string, s: Sent) {
    setBusy(id);
    const { error } = await supabase.rpc("admin_check_review", { _neighborhood: neighborhoodId, _mention: id, _sentiment: s });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    qc.setQueryData(validateQuery(neighborhoodId).queryKey, (old) => old?.filter((m) => m.id !== id));
    qc.invalidateQueries({ queryKey: ["review", neighborhoodId] });
    qc.invalidateQueries({ queryKey: ["board"] });
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold"><Scale className="size-5" /> Validate reviews</h2>
      <p className="mt-1 text-sm text-muted-foreground">Confirm or correct mixed and negative reviews. Each one leaves the list once you pick.</p>
      <Tabs value={tab} onValueChange={(v) => { setTab(v as "mixed" | "negative"); setPage(0); }} className="mt-3">
        <TabsList>
          <TabsTrigger value="mixed">Mixed ({counts.mixed})</TabsTrigger>
          <TabsTrigger value="negative">Negative ({counts.negative})</TabsTrigger>
        </TabsList>
      </Tabs>
      {shown.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">All caught up.</p> : (
        <ul className="mt-3 space-y-2">
          {shown.map((m) => (
            <li key={m.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <Link to="/p/$id" params={{ id: m.provider_id! }} className="font-semibold hover:underline">{m.providers?.name}</Link>
                <span className="text-xs text-muted-foreground">{new Date(m.mentioned_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </div>
              <p className="mt-1 text-sm leading-relaxed">{m.paraphrase}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["positive", "mixed", "negative"] as Sent[]).map((s) => (
                  <Button key={s} size="sm" disabled={busy === m.id} variant={s === m.sentiment ? "default" : "outline"} onClick={() => set(m.id, s)}>
                    {s === m.sentiment ? `Keep ${s}` : `Make ${s}`}
                  </Button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.length > PAGE && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
          <span>Page {page + 1} of {Math.ceil(list.length / PAGE)}</span>
          <Button size="sm" variant="outline" disabled={(page + 1) * PAGE >= list.length} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </section>
  );
}
