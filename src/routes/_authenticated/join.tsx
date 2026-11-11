import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { myGroupQuery } from "@/lib/membership";

export const Route = createFileRoute("/_authenticated/join")({
  head: () => ({ meta: [{ title: "Join your group — Parent Picks" }, { name: "description", content: "Enter your neighborhood's invite code." }, { property: "og:title", content: "Join your group — Parent Picks" }, { property: "og:description", content: "Join your neighborhood's private recommendations board." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: JoinPage,
});

function JoinPage() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await supabase.rpc("join_with_code", { _code: code });
    setBusy(false);
    if (error) { setError(error.message.includes("not valid") ? "That code didn't work. Check the WhatsApp group description for the current code." : error.message); return; }
    await qc.invalidateQueries({ queryKey: myGroupQuery.queryKey });
    navigate({ to: "/board" });
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="kraft-card w-full max-w-md space-y-4 p-6">
        <h1 className="font-display text-3xl font-extrabold">Enter your invite code</h1>
        <p className="text-sm">Your group admin posts it in the WhatsApp group description.</p>
        <div className="space-y-2">
          <Label htmlFor="code">Invite code</Label>
          <Input id="code" required value={code} onChange={(e) => setCode(e.target.value)} className="h-12 bg-background text-base uppercase tracking-widest" placeholder="ABCD-1234" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" disabled={busy} className="h-12 w-full text-base">{busy ? "Checking…" : "Join the board"}</Button>
      </form>
    </div>
  );
}
