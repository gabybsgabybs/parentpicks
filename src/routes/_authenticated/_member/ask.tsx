import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { askVillage } from "@/lib/village-chat.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import iOutings from "@/assets/icon-outings.png";

type Msg = { id: string; role: "user" | "assistant"; content: string; places: { id: string; name: string }[] };

const chatQuery = (nb: string) => queryOptions({
  queryKey: ["village-chat", nb],
  queryFn: async (): Promise<Msg[]> => {
    const { data, error } = await supabase.from("village_chat").select("id, role, content, place_ids").eq("neighborhood_id", nb).order("created_at").limit(200);
    if (error) throw error;
    const ids = [...new Set((data ?? []).flatMap((m) => m.place_ids))];
    const { data: ps } = ids.length ? await supabase.from("providers").select("id, name").in("id", ids) : { data: [] as { id: string; name: string }[] };
    return (data ?? []).map((m) => ({ id: m.id, role: m.role as Msg["role"], content: m.content, places: (ps ?? []).filter((p) => m.place_ids.includes(p.id)) }));
  },
});

export const Route = createFileRoute("/_authenticated/_member/ask")({
  head: () => ({ meta: [{ title: "Ask the Village — Parent Picks" }, { name: "description", content: "Ask questions and get answers from your group's parent recommendations." }, { property: "og:title", content: "Ask the Village — Parent Picks" }, { property: "og:description", content: "Answers grounded in what local parents recommend." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(chatQuery(context.group.neighborhoodId)),
  component: Ask,
});

const SUGGEST = ["Pediatrician with a gentle bedside manner?", "Rainy day activity for a toddler", "Kid-friendly brunch spot", "Swim lessons for a 4-year-old"];

function Ask() {
  const { group } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: saved } = useSuspenseQuery(chatQuery(group.neighborhoodId));
  const [pending, setPending] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { ta.current?.focus(); }, [pending]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [saved.length, pending]);

  async function send(q: string) {
    q = q.trim(); if (!q || pending) return;
    setErr(""); setPending(q); setText("");
    try {
      await askVillage({ data: { neighborhoodId: group.neighborhoodId, question: q } });
      await qc.invalidateQueries({ queryKey: ["village-chat", group.neighborhoodId] });
    } catch (e) {
      setErr("Sorry, I couldn't answer that just now. Please try again."); setText(q); console.error(e);
    } finally { setPending(null); }
  }
  async function clear() {
    if (!confirm("Clear this conversation?")) return;
    await supabase.from("village_chat").delete().eq("neighborhood_id", group.neighborhoodId);
    qc.invalidateQueries({ queryKey: ["village-chat", group.neighborhoodId] });
  }

  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col">
      <div className="flex items-center gap-3">
        <img src={iOutings} alt="" width={816} height={816} className="size-14 object-contain" />
        <div className="mr-auto">
          <h1 className="font-display text-3xl md:text-4xl">Ask the Village</h1>
          <p className="text-sm text-muted-foreground">Answers come only from what parents in your group recommended.</p>
        </div>
        {saved.length > 0 && <Button variant="ghost" size="sm" onClick={clear}><Trash2 className="size-4" />Clear</Button>}
      </div>

      <div className="mt-6 flex-1 space-y-5">
        {saved.length === 0 && !pending && (
          <div className="flex flex-wrap gap-2">
            {SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm hover:bg-secondary">{s}</button>)}
          </div>
        )}
        {saved.map((m) => <Bubble key={m.id} m={m} />)}
        {pending && <>
          <Bubble m={{ id: "p", role: "user", content: pending, places: [] }} />
          <p className="animate-pulse text-sm text-muted-foreground">Asking the village…</p>
        </>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div ref={end} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="sticky bottom-4 mt-6 flex items-end gap-2 rounded-2xl border border-border bg-popover p-2 shadow-sm">
        <Textarea ref={ta} value={text} onChange={(e) => setText(e.target.value)} rows={1}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
          placeholder="Ask about doctors, classes, cafés…" aria-label="Your question" className="min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
        <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={!text.trim() || !!pending} aria-label="Send"><ArrowUp className="size-4" /></Button>
      </form>
      <p className="mt-2 text-center text-xs text-muted-foreground">AI answers may contain mistakes. Not verified.</p>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === "user") return <div className="ml-auto max-w-[85%] w-fit rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground">{m.content}</div>;
  return (
    <div className="max-w-[95%]">
      <div className="prose prose-sm max-w-none text-foreground [&_a]:underline [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown>{m.content}</ReactMarkdown></div>
      {m.places.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{m.places.map((p) => <Link key={p.id} to="/p/$id" params={{ id: p.id }} className="kraft-card px-3 py-1 text-sm font-semibold hover:-translate-y-0.5">{p.name} →</Link>)}</div>}
    </div>
  );
}
