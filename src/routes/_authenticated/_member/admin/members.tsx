import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly } from "@/components/AdminOnly";
import { Button } from "@/components/ui/button";
import { myGroupQuery } from "@/lib/membership";

const membersQuery = (nb: string) => queryOptions({
  queryKey: ["members", nb],
  queryFn: async () => (await supabase.from("memberships").select("id, user_id, email, role, created_at").eq("neighborhood_id", nb).order("created_at")).data ?? [],
});

export const Route = createFileRoute("/_authenticated/_member/admin/members")({
  head: () => ({ meta: [{ title: "Members — Parent Picks" }, { name: "description", content: "Manage the invite code and members." }, { property: "og:title", content: "Members — Parent Picks" }, { property: "og:description", content: "Manage membership in your Parent Picks neighborhood." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AdminOnly><Members /></AdminOnly>,
});

function Members() {
  const { group, user } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data: g } = useSuspenseQuery(myGroupQuery);
  const { data } = useSuspenseQuery(membersQuery(group.neighborhoodId));
  async function rotate() {
    if (!confirm("Make a new invite code? The old one stops working right away.")) return;
    const { error } = await supabase.rpc("rotate_invite_code", { _nb: group.neighborhoodId });
    if (error) { toast.error(error.message); return; }
    toast.success("New code ready — update the WhatsApp group description.");
    qc.invalidateQueries({ queryKey: myGroupQuery.queryKey });
  }
  async function remove(id: string) {
    if (!confirm("Remove this member? They'll lose access to the board.")) return;
    const { error } = await supabase.from("memberships").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member removed");
    qc.invalidateQueries({ queryKey: ["members"] });
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-4xl font-extrabold">Members</h1>
      <section className="kraft-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wide opacity-70">Invite code</h2>
        <div className="mt-1 font-display text-4xl font-extrabold tracking-widest">{g?.inviteCode}</div>
        <p className="mt-1 text-sm">Post this in the WhatsApp group description. Anyone with it can join.</p>
        <Button variant="outline" className="mt-3 bg-background" onClick={rotate}>Change invite code</Button>
      </section>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-popover">
        {data.map((m) => (
          <li key={m.id} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1"><div className="truncate font-medium">{m.email}</div><div className="text-xs text-muted-foreground">{m.role === "admin" ? "Admin" : "Parent"} · joined {new Date(m.created_at).toLocaleDateString()}</div></div>
            {m.user_id !== user.id && <Button variant="ghost" className="text-destructive" onClick={() => remove(m.id)}>Remove</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
