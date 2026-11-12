import { useState } from "react";
import { useRouteContext } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/categories";

const SENTIMENTS = [["positive", "Loved it"], ["mixed", "Mixed"], ["negative", "Heads up"]] as const;

export function RecommendPlace() {
  const { group } = useRouteContext({ from: "/_authenticated/_member" });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("");
  const [review, setReview] = useState("");
  const [sentiment, setSentiment] = useState<string>("positive");
  const [busy, setBusy] = useState(false);
  const ok = name.trim().length >= 2 && category && review.trim().length >= 10;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("parent_suggestions").insert({ neighborhood_id: group.neighborhoodId, name: name.trim(), category, review: review.trim(), sentiment });
    setBusy(false);
    if (error) { toast.error("Couldn't send that. Please try again."); return; }
    toast.success("Thanks! It'll appear once an admin approves it.");
    setName(""); setCategory(""); setReview(""); setSentiment("positive"); setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="h-11 rounded-xl bg-card px-4"><Plus className="size-4" /> Recommend a place</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Recommend a place</DialogTitle>
          <DialogDescription>Shared anonymously as "A parent" after an admin reviews it.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="rp-name">Place or provider</Label><Input id="rp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="e.g. Little Fish Swim School" /></div>
          <div className="space-y-1.5"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger aria-label="Category"><SelectValue placeholder="Choose a category" /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="rp-review">Your take</Label><Textarea id="rp-review" value={review} onChange={(e) => setReview(e.target.value)} maxLength={1500} rows={4} placeholder="What did you love? Any tips for other parents? Please don't include names of kids." /></div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How was it?">
            {SENTIMENTS.map(([v, l]) => <button type="button" key={v} role="radio" aria-checked={sentiment === v} onClick={() => setSentiment(v)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${sentiment === v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}>{l}</button>)}
          </div>
          <Button type="submit" className="w-full" disabled={!ok || busy}>{busy ? "Sending…" : "Send recommendation"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
