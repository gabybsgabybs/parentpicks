import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Parent Picks" },
      { name: "description", content: "Sign in with a one-time email link to see your parents' group board." },
      { property: "og:title", content: "Sign in — Parent Picks" },
      { property: "og:description", content: "Sign in with a one-time email link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) navigate({ to: "/board", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/board", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/board` } });
    setBusy(false);
    if (error) setError(error.message); else setSent(true);
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="font-display text-xl font-extrabold">Parent Picks</Link>
        <div className="kraft-card mt-4 p-6">
          {sent ? (
            <div>
              <h1 className="font-display text-3xl font-extrabold">Check your email</h1>
              <p className="mt-2">We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.</p>
              <Button variant="ghost" className="mt-4 px-0" onClick={() => setSent(false)}>Use a different email</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="font-display text-3xl font-extrabold">Sign in</h1>
              <p className="text-sm">No password needed — we'll email you a one-time link.</p>
              <div className="space-y-2">
                <Label htmlFor="email">Your email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-background text-base" placeholder="you@example.com" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" disabled={busy} className="h-12 w-full text-base">{busy ? "Sending…" : "Email me a sign-in link"}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
