import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL, isOlder, yearRange, type Category } from "@/lib/categories";
import type { Provider } from "@/lib/board";
import { SentimentBar } from "@/components/SentimentBar";
import { ContactLinks, hasContact } from "@/components/ContactLinks";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const detailQuery = (id: string) => queryOptions({
  queryKey: ["provider", id],
  queryFn: async () => {
    const { data: p, error } = await supabase.from("providers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    const { data: ms } = await supabase.from("mentions").select("id, mentioned_at, sentiment, paraphrase, self_promo").eq("provider_id", id).order("mentioned_at", { ascending: false });
    return { p: p as Provider | null, mentions: ms ?? [] };
  },
});

export const Route = createFileRoute("/_authenticated/_member/p/$id")({
  head: () => ({ meta: [{ title: "Recommendation — Parent Picks" }, { name: "description", content: "What parents in the group said." }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(detailQuery(params.id)),
  component: Detail,
});

const fmtMonth = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
const tone: Record<string, string> = { positive: "bg-positive text-primary-foreground", negative: "bg-negative text-primary-foreground", mixed: "bg-mixed text-foreground" };

function Detail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(detailQuery(id));
  const p = data.p;
  if (!p) return <div className="py-20 text-center">This recommendation isn't available. <Link to="/board" className="underline">Back to the board</Link></div>;
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/board" className="text-sm font-medium underline-offset-4 hover:underline">← Back to the board</Link>
      <article className="kraft-card mt-3 p-6">
        <div className="text-xs font-bold uppercase tracking-wide text-foreground/60">{CATEGORY_LABEL[p.category as Category]}{p.location ? ` · ${p.location}` : ""}</div>
        <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight">{p.name}</h1>
        {isOlder(p.last_mention) && <span className="mt-2 inline-block rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold">Older recommendations</span>}
        <p className="mt-2"><b>{p.parent_count} parents</b> mentioned this · {yearRange(p.first_mention, p.last_mention)}</p>
        <SentimentBar p={p} className="mt-3" />
        <p className="mt-4 text-lg leading-relaxed">{p.summary}</p>
        {hasContact(p) && (
          <div className="mt-5">
            <ContactLinks p={p} />
            {p.address && <p className="mt-2 text-sm text-foreground/70">{p.address}</p>}
            <p className="mt-2 text-xs text-foreground/60">Contact details found online by AI. Please double-check before booking.</p>
          </div>
        )}
        {p.aliases.length > 0 && <p className="mt-4 text-sm"><span className="font-semibold">Also called:</span> {p.aliases.join(", ")}</p>}
      </article>
      <p className="mt-3 text-xs text-muted-foreground">Recommendations as shared by parents in the group. Summaries are written by AI and may contain mistakes. Not verified.</p>

      <div className="mt-8 flex items-center">
        <h2 className="font-display text-2xl font-extrabold">What parents said</h2>
        <FlagButton provider={p} />
      </div>
      <ul className="mt-3 space-y-2">
        {data.mentions.filter((m) => !m.self_promo).map((m) => (
          <li key={m.id} className="rounded-xl border border-border bg-popover p-4">
            <div className="flex items-center gap-2 text-sm">
              <b>A parent</b><span className="text-muted-foreground">· {fmtMonth(m.mentioned_at)}</span>
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-semibold ${tone[m.sentiment]}`}>{m.sentiment}</span>
            </div>
            <p className="mt-1.5">{m.paraphrase}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FlagButton({ provider }: { provider: Provider }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    const { error } = await supabase.from("flags").insert({ provider_id: provider.id, neighborhood_id: provider.neighborhood_id, note: note.trim() });
    setBusy(false);
    if (error) { toast.error("Couldn't send that. Please try again."); return; }
    toast.success("Thanks — the admins will take a look.");
    setNote(""); setOpen(false);
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="ml-auto">Flag something wrong</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Flag something wrong</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Tell the admins what's off — wrong name, wrong category, a summary that's unfair, or something that should be removed.</p>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="text-base" placeholder="What should the admins know?" />
        <Button size="lg" disabled={busy || note.trim().length < 3} onClick={send}>{busy ? "Sending…" : "Send to admins"}</Button>
      </DialogContent>
    </Dialog>
  );
}
