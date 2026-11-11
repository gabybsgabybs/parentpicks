import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABEL, isOlder, type Category } from "@/lib/categories";
import type { Provider } from "@/lib/board";
import { SplitBar } from "@/components/SplitBar";
import { cleanQuote } from "@/lib/category-overview";
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
  head: () => ({ meta: [{ title: "Recommendation — Parent Picks" }, { name: "description", content: "What parents in the group said." }, { property: "og:title", content: "Recommendation — Parent Picks" }, { property: "og:description", content: "Parent experiences and contact details from your group's board." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(detailQuery(params.id)),
  component: Detail,
});

const fmtMonth = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });
const tone: Record<string, string> = { positive: "bg-positive text-primary-foreground", negative: "bg-negative text-primary-foreground", mixed: "bg-mixed text-foreground" };

function Detail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(detailQuery(id));
  const p = data.p;
  const reviews = data.mentions.filter((m) => !m.self_promo).flatMap((m) => m.paraphrase.split(/'\s*;\s*'/).map((t, i) => ({ ...m, id: `${m.id}-${i}`, text: cleanQuote(t) }))).filter((m) => m.text);
  if (!p) return <div className="py-20 text-center">This recommendation isn't available. <Link to="/board" className="underline">Back to the board</Link></div>;
  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/board" className="text-sm font-medium underline-offset-4 hover:underline">← Back to the board</Link>
      <article className="kraft-card mt-3 p-6">
        <Link to="/c/$category" params={{ category: p.category }} className="text-xs font-bold uppercase tracking-wide text-foreground/70 hover:underline">{CATEGORY_LABEL[p.category as Category] ?? p.category}</Link>
        <h1 className="mt-1 font-display text-4xl font-extrabold leading-tight">{p.name}</h1>
        {isOlder(p.last_mention) && <span className="mt-2 inline-block rounded-full bg-background/70 px-2 py-0.5 text-xs font-semibold">Older recommendations</span>}
        <p className="mt-2"><b>{p.parent_count} parents</b> mentioned this</p>
        <SplitBar p={p} labels className="mt-3" />
        <p className="mt-4 text-lg leading-relaxed">{p.summary}</p>
        {(hasContact(p) || p.location) && (
          <div className="mt-5">
            <ContactLinks p={p} />
            <div className="mt-3 flex flex-wrap items-start gap-3">
              <div className="space-y-0.5 text-sm">
                {p.phone && <p>{p.phone}</p>}
                {p.address && <p>{p.address}</p>}
                {p.location && <p className="text-foreground/70">{p.location}</p>}
              </div>
              {p.contact_unverified && <span className="rounded-full border border-mixed bg-mixed/20 px-2.5 py-1 text-xs font-semibold text-foreground">Contact details unverified — call before relying on them</span>}
            </div>
            <p className="mt-2 text-xs text-foreground/70">Contact details found online by AI. Please double-check before booking.</p>
          </div>
        )}
        {p.aliases.length > 0 && <p className="mt-4 text-sm"><span className="font-semibold">Also called:</span> {p.aliases.join(", ")}</p>}
      </article>
      <p className="mt-3 text-xs text-muted-foreground">Recommendations as shared by parents in the group. Summaries are written by AI and may contain mistakes. Not verified.</p>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto font-display text-2xl">What parents said</h2>
        <Button asChild><Link to="/admin/upload" search={{ item: p.name }}>Add your take</Link></Button>
        <FlagButton provider={p} />
      </div>
      {reviews.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center">
          <p>No reviews yet — be the first</p>
          <Button asChild variant="outline" className="mt-3"><Link to="/admin/upload" search={{ item: p.name }}>Add your take</Link></Button>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {reviews.map((m) => (
            <li key={m.id} className="relative rounded-xl border border-border bg-popover p-4 pl-12">
              <span aria-hidden className="absolute left-3 top-1 font-display text-5xl leading-none text-primary">“</span>
              <p className="text-[17px] leading-relaxed">{m.text}</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">A parent · {fmtMonth(m.mentioned_at)}<span className={`rounded-full px-2 py-0.5 font-semibold ${tone[m.sentiment]}`}>{m.sentiment}</span></p>
            </li>
          ))}
        </ul>
      )}
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
