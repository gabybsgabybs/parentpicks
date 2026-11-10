import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const { group } = useRouteContext({ from: "/_authenticated/_member" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const link = "rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-secondary";
  const active = { className: "bg-foreground text-background hover:bg-foreground" };
  return (
    <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/board" className="mr-auto flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-marigold font-display text-lg font-extrabold">P</span>
          <span className="font-display text-lg font-extrabold leading-none">{group.name}<span className="block text-xs font-medium text-muted-foreground font-sans">Parent Picks</span></span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link to="/board" className={link} activeProps={active}>Board</Link>
          {group.role === "admin" && <>
            <Link to="/admin/upload" className={link} activeProps={active}>Upload</Link>
            <Link to="/admin/review" className={link} activeProps={active}>Review</Link>
            <Link to="/admin/members" className={link} activeProps={active}>Members</Link>
          </>}
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </nav>
      </div>
    </header>
  );
}
