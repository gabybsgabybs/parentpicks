import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { myGroupQuery } from "@/lib/membership";
import { AppHeader } from "@/components/AppHeader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/_authenticated/_member")({
  beforeLoad: async ({ context }) => {
    let group = await context.queryClient.fetchQuery(myGroupQuery);
    if (!group) {
      await supabase.rpc("join_default");
      group = await context.queryClient.fetchQuery({ ...myGroupQuery, staleTime: 0 });
    }
    if (!group) throw redirect({ to: "/join" });
    return { group };
  },
  component: () => (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6"><Outlet /></main>
    </div>
  ),
});
