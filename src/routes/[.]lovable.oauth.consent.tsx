import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type OAuthResult = { data: { redirect_url?: string; redirect_to?: string; client?: { name?: string; client_name?: string }; redirect_uri?: string; scope?: string } | null; error: { message: string } | null };
type OAuthApi = {
  getAuthorizationDetails(id: string): Promise<OAuthResult>;
  approveAuthorization(id: string): Promise<OAuthResult>;
  denyAuthorization(id: string): Promise<OAuthResult>;
};
const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  head: () => ({ meta: [{ title: "Connect an assistant — Parent Picks" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ authorization_id: typeof s["authorization_id"] === "string" ? s["authorization_id"] : "" }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("This connection link is missing information. Please start again from your assistant.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { next: location.pathname + location.searchStr } });
  },
  loader: async ({ location }) => {
    const id = new URLSearchParams(location.searchStr).get("authorization_id")!;
    const { data, error } = await oauth().getAuthorizationDetails(id);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    const { data: u } = await supabase.auth.getUser();
    return { details: data, email: u.user?.email ?? "" };
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <div className="grid min-h-screen place-items-center px-4"><div className="kraft-card max-w-md p-6">
      <h1 className="font-display text-2xl">Couldn't open this connection request</h1>
      <p className="mt-2 text-sm">{error instanceof Error ? error.message : String(error)}</p>
    </div></div>
  ),
});

function Consent() {
  const { details, email } = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = details?.client?.name ?? details?.client?.client_name ?? "An assistant";

  async function decide(approve: boolean) {
    setBusy(true); setError(null);
    const { data, error } = approve ? await oauth().approveAuthorization(authorization_id) : await oauth().denyAuthorization(authorization_id);
    const target = data?.redirect_url ?? data?.redirect_to;
    if (error || !target) { setBusy(false); setError(error?.message ?? "Something went wrong. Please try again."); return; }
    window.location.href = target;
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="kraft-card w-full max-w-md p-6">
        <h1 className="font-display text-3xl">Connect {name} to Parent Picks</h1>
        <p className="mt-2 text-sm">Signed in as <b>{email}</b></p>
        <p className="mt-4">{name} will be able to search and read your neighborhood's recommendations as you. It can't change anything.</p>
        <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
          <li>Share your basic profile and email address</li>
          <li>Only neighborhoods you're a member of; comments stay anonymous</li>
        </ul>
        {details?.redirect_uri && <p className="mt-3 text-xs text-muted-foreground">Returns to {new URL(details.redirect_uri).host}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Button disabled={busy} onClick={() => decide(true)} className="flex-1">Approve</Button>
          <Button disabled={busy} variant="outline" onClick={() => decide(false)} className="flex-1">Cancel connection</Button>
        </div>
      </div>
    </div>
  );
}
