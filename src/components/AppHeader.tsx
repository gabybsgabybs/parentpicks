import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";

export function AppHeader() {
  const { group } = useRouteContext({ from: "/_authenticated/_member" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const link = "rounded-full px-3 py-1.5 text-sm font-medium text-foreground/80 hover:bg-secondary";

  return (
    <header className="border-b border-border bg-background/90 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
        <Link to="/board" className="mr-auto flex min-w-0 items-center gap-2">
          <span className="grid size-8 place-items-center shrink-0 rounded-lg bg-marigold font-display text-lg font-extrabold">P</span>
          <span className="min-w-0 truncate font-display text-lg font-extrabold leading-none">{group.name}<span className="block text-xs font-medium text-muted-foreground font-sans">Parent Picks</span></span>
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <Link to="/board" className={link} onClick={() => setOpen(false)}>Board</Link>
          {group.role === "admin" && <>
            <Link to="/admin/upload" className={link} onClick={() => setOpen(false)}>Upload</Link>
            <Link to="/admin/review" className={link} onClick={() => setOpen(false)}>Admin central</Link>
            <Link to="/admin/members" className={link} onClick={() => setOpen(false)}>Members</Link>
          </>}
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 sm:hidden" aria-label="Open menu"><Menu className="size-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <SheetTitle className="font-display text-2xl">Menu</SheetTitle>
            <nav className="mt-6 flex flex-col items-start gap-2">
              <Link to="/board" className={link} onClick={() => setOpen(false)}>Board</Link>
          {group.role === "admin" && <>
            <Link to="/admin/upload" className={link} onClick={() => setOpen(false)}>Upload</Link>
            <Link to="/admin/review" className={link} onClick={() => setOpen(false)}>Admin central</Link>
            <Link to="/admin/members" className={link} onClick={() => setOpen(false)}>Members</Link>
          </>}
          <Button variant="ghost" size="sm" onClick={signOut}>Sign out</Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
