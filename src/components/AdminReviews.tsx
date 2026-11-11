import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { getAdminReviews, manageAdminReview } from "@/lib/admin-reviews.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

export function AdminReviews({ neighborhoodId, providerId }: { neighborhoodId: string; providerId: string }) {
  const load = useServerFn(getAdminReviews);
  const mutate = useServerFn(manageAdminReview);
  const qc = useQueryClient();
  const { data, isPending, error } = useQuery({ queryKey: ["admin-reviews", providerId], queryFn: () => load({ data: { neighborhoodId, providerId } }) });
  const [editing, setEditing] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sentiment, setSentiment] = useState<"positive" | "negative" | "mixed">("positive");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function submit(mentionId: string, action: "delete" | "update") {
    setBusy(true);
    try {
      const ids = { neighborhoodId, providerId, mentionId };
      await mutate({ data: action === "delete" ? { ...ids, action } : { ...ids, action, paraphrase: text, sentiment } });
      setEditing(null); setDeleting(null);
      await qc.invalidateQueries();
      toast.success(action === "delete" ? "Review deleted; parent counts updated" : "Review saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save the review"); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 border-t border-border pt-4">
    <h3 className="font-semibold">Parent reviews</h3>
    {isPending && <p className="py-3 text-sm text-muted-foreground">Loading reviews…</p>}
    {error && <p role="alert" className="py-3 text-sm text-destructive">Could not load reviews. <Button variant="link" onClick={() => qc.invalidateQueries({ queryKey: ["admin-reviews", providerId] })}>Try again</Button></p>}
    {data?.length === 0 && <p className="py-3 text-sm text-muted-foreground">No parent reviews.</p>}
    <ul className="divide-y divide-border">{data?.map((review) => <li key={review.id} className="py-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span>A parent · {review.mentioned_at.slice(0, 7)}</span><span className="capitalize">{review.sentiment}</span>{review.self_promo && <span>Possible self-promotion</span>}</div>
      {editing === review.id ? <div className="mt-3 space-y-3">
        <Textarea aria-label="Review text" value={text} onChange={(e) => setText(e.target.value)} maxLength={4000} rows={4} />
        <div className="flex flex-wrap gap-2">
          <Select value={sentiment} onValueChange={(v) => { if (v === "positive" || v === "negative" || v === "mixed") setSentiment(v); }}><SelectTrigger aria-label="Review sentiment" className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="positive">Positive</SelectItem><SelectItem value="negative">Negative</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent></Select>
          <Button disabled={busy || !text.trim()} onClick={() => submit(review.id, "update")}><Save className="size-4" />Save review</Button>
          <Button variant="ghost" disabled={busy} onClick={() => setEditing(null)}><X className="size-4" />Cancel</Button>
        </div>
      </div> : <>
        <p className="mt-2 whitespace-pre-wrap break-words text-sm">{review.paraphrase}</p>
        <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditing(review.id); setText(review.paraphrase); setSentiment(review.sentiment === "negative" ? "negative" : review.sentiment === "mixed" ? "mixed" : "positive"); }}><Pencil className="size-4" />Edit review</Button><Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => setDeleting(review.id)}><Trash2 className="size-4" />Delete review</Button></div>
      </>}
    </li>)}</ul>
    <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this review?</AlertDialogTitle><AlertDialogDescription>This permanently removes the review and updates this business’s parent counts. The business and its other reviews stay intact.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); if (deleting) void submit(deleting, "delete"); }}>{busy ? "Deleting…" : "Delete permanently"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}