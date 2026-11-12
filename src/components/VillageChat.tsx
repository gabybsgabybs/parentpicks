import { Link, useRouteContext } from "@tanstack/react-router";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUp, MessageCircle, Trash2, X } from "lucide-react";
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

const SUGGEST = ["Pediatrician with a gentle bedside manner?", "Rainy day activity for a toddler", "Kid-friendly brunch spot", "Swim lessons for a 4-year-old"];

export function VillageChat() {
  const { group } = useRouteContext({ from: "/_authenticated/_member" });
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: saved = [] } = useQuery({ ...chatQuery(group.neighborhoodId), enabled: open });
  const [pending, setPending] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) ta.current?.focus(); }, [pending, open]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [saved.length, pending, open]);

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
    <>
      {open && (
        <div role="dialog" aria-label="Ask the Village" className="fixed inset-x-0 bottom-0 z-40 flex h-[85vh] flex-col rounded-t-2xl border border-border bg-background p-4 shadow-2xl sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:max-h-[75vh] sm:w-[400px] sm:rounded-2xl">
          <div className="flex items-center gap-2">
            <img src={iOutings} alt="" width={816} height={816} className="size-10 object-contain" />
            <div className="mr-auto min-w-0">
              <h2 className="font-display text-2xl leading-none">Ask the Village</h2>
              <p className="text-xs text-muted-foreground">Answers from your group's recommendations</p>
            </div>
            {saved.length > 0 && <Button variant="ghost" size="icon" onClick={clear} aria-label="Clear conversation"><Trash2 className="size-4" /></Button>}
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chat"><X className="size-4" /></Button>
          </div>

          <div className="-mx-1 mt-4 flex-1 space-y-4 overflow-y-auto px-1">
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

          <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-popover p-2">
            <Textarea ref={ta} value={text} onChange={(e) => setText(e.target.value)} rows={1}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
              placeholder="Ask about doctors, classes, cafés…" aria-label="Your question" className="min-h-10 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0" />
            <Button type="submit" size="icon" className="shrink-0 rounded-full" disabled={!text.trim() || !!pending} aria-label="Send"><ArrowUp className="size-4" /></Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">AI answers may contain mistakes. Not verified.</p>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Close Ask the Village" : "Open Ask the Village"}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-0.5 ${open ? "max-sm:hidden" : ""}`}>
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="hidden sm:inline">{open ? "Close" : "Ask the Village"}</span>
      </button>
    </>
  );
}

function Bubble({ m }: { m: Msg }) {
  if (m.role === "user") return <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">{m.content}</div>;
  return (
    <div>
      <div className="prose prose-sm max-w-none text-sm text-foreground [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5"><ReactMarkdown>{m.content}</ReactMarkdown></div>
      {m.places.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{m.places.map((p) => <Link key={p.id} to="/p/$id" params={{ id: p.id }} className="kraft-card px-3 py-1 text-xs font-semibold hover:-translate-y-0.5">{p.name} →</Link>)}</div>}
    </div>
  );
}
