import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, FileUp } from "lucide-react";
import { AdminOnly } from "@/components/AdminOnly";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { parseWhatsApp, readChatFile } from "@/lib/whatsapp";
import { finalizeUpload, lookupContacts, processChunk, startUpload } from "@/lib/pipeline.functions";

export const Route = createFileRoute("/_authenticated/_member/admin/upload")({
  head: () => ({ meta: [{ title: "Upload chat — Parent Picks" }, { name: "description", content: "Upload a WhatsApp chat export." }, { property: "og:title", content: "Upload chat — Parent Picks" }, { property: "og:description", content: "Organize your group's WhatsApp recommendations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  validateSearch: (s: Record<string, unknown>): { item?: string } => (typeof s["item"] === "string" && s["item"] ? { item: s["item"].slice(0, 120) } : {}),
  component: () => <AdminOnly><Upload /></AdminOnly>,
});

const CHUNK = 80;

function Upload() {
  const { group } = Route.useRouteContext();
  const { item } = Route.useSearch();
  const announce = `Hi everyone! 👋 We're setting up Parent Picks — a private board that collects the recommendations shared in this group (pediatricians, dentists, classes, shops and more) so they're easy to search.

• Only members of this group can see it (sign in with your email + the invite code in the group description).
• No names are shown — every comment is shown as "A parent", and summaries describe the business, not your family.
• Want something removed or corrected? Use "Flag something wrong" on the board, or message an admin.

Reply here if you have questions or concerns before we upload the chat.`;
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<"idle" | "reading" | "processing" | "grouping" | "contacts" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ messages: number; recs: number; mentions: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const start = useServerFn(startUpload), chunk = useServerFn(processChunk), finish = useServerFn(finalizeUpload), contacts = useServerFn(lookupContacts);
  const qc = useQueryClient();

  async function run() {
    if (!file) return;
    setErr(null); setResult(null); setStage("reading"); setProgress(3);
    try {
      const text = await readChatFile(file);
      const msgs = parseWhatsApp(text);
      if (!msgs.length) throw new Error("We couldn't find any messages in that file. Make sure it's a WhatsApp export (.txt or .zip).");
      const { uploadId } = await start({ data: { neighborhoodId: group.neighborhoodId, consent: true, messagesRead: msgs.length } });
      setStage("processing");
      const total = Math.ceil(msgs.length / CHUNK);
      for (let i = 0; i < total; i++) {
        await chunk({ data: { neighborhoodId: group.neighborhoodId, uploadId, messages: msgs.slice(i * CHUNK, (i + 1) * CHUNK) } });
        setProgress(5 + Math.round(((i + 1) / total) * 75));
      }
      setStage("grouping"); setProgress(85);
      const r = await finish({ data: { neighborhoodId: group.neighborhoodId, uploadId } });
      setStage("contacts"); setProgress(90);
      for (let i = 0; i < r.providerIds.length; i += 4) {
        try { await contacts({ data: { neighborhoodId: group.neighborhoodId, providerIds: r.providerIds.slice(i, i + 4) } }); } catch { /* contact info can be refreshed from Review */ }
        setProgress(90 + Math.round(((i + 4) / r.providerIds.length) * 9));
      }
      setProgress(100); setStage("done");
      setResult({ messages: msgs.length, recs: r.recommendations, mentions: r.mentions });
      setFile(null);
      qc.invalidateQueries();
    } catch (e) {
      setStage("error"); setErr(e instanceof Error ? e.message : "Something went wrong");
    }
  }
  const busy = stage === "reading" || stage === "processing" || stage === "grouping" || stage === "contacts";
  const label = { idle: "", reading: "Reading the chat…", processing: "Finding recommendations…", grouping: "Matching names and writing summaries…", contacts: "Looking up websites and phone numbers…", done: "Done!", error: "" }[stage];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-extrabold">Upload a chat</h1>
      {item && <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm">Adding your take on <b>{item}</b>: share it in the WhatsApp group, then upload the latest chat here.</p>}

      <section className="rounded-2xl border border-border bg-popover p-5">
        <h2 className="font-display text-xl font-extrabold">1. Tell the group first</h2>
        <p className="mt-1 text-sm text-muted-foreground">Post this in the WhatsApp group so everyone knows what the board is.</p>
        <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-secondary p-4 font-sans text-sm">{announce}</pre>
        <Button variant="outline" className="mt-3" onClick={() => { navigator.clipboard.writeText(announce); toast.success("Message copied"); }}><Copy className="size-4" /> Copy message</Button>
      </section>

      <section className="rounded-2xl border border-border bg-popover p-5 space-y-4">
        <h2 className="font-display text-xl font-extrabold">2. Upload the chat export</h2>
        <p className="text-sm text-muted-foreground">In WhatsApp, open the group → group info → Export chat → Without media. Upload the .txt or .zip it creates. iPhone and Android both work. The file is read once and not kept.</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-marigold/20 p-4">
          <Checkbox checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5 size-5" />
          <span className="font-medium">Our group has been told about this board and agreed to it.</span>
        </label>
        <label className={`flex h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input ${consent ? "cursor-pointer hover:bg-secondary" : "opacity-50"}`}>
          <FileUp className="size-7" />
          <span className="font-medium">{file ? file.name : "Choose a .txt or .zip file"}</span>
          <input type="file" accept=".txt,.zip" disabled={!consent || busy} className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <Button size="lg" className="h-12 w-full text-base" disabled={!consent || !file || busy} onClick={run}>{busy ? "Working…" : "Process chat"}</Button>
        <a href="/sample-duboce-chat.txt" download className="block text-center text-sm underline">Download a fictional sample chat to try it</a>
        {stage !== "idle" && stage !== "error" && (
          <div><Progress value={progress} /><p className="mt-2 text-sm">{label}</p></div>
        )}
        {err && <p className="text-sm text-destructive">{err}</p>}
      </section>

      {result && (
        <section className="kraft-card p-5">
          <div className="flex items-center gap-2"><CheckCircle2 className="size-6 text-positive" /><h2 className="font-display text-2xl font-extrabold">Upload complete</h2></div>
          <p className="mt-2 text-lg">Read <b>{result.messages}</b> messages and found <b>{result.recs}</b> recommendations ({result.mentions} parent comments).</p>
          <p className="mt-1 text-sm">The chat file was not saved. New recommendations are waiting in Review before parents can see them.</p>
          <Button asChild className="mt-4"><Link to="/admin/review">Go to review</Link></Button>
        </section>
      )}
    </div>
  );
}
