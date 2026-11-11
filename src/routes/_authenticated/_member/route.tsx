import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { myGroupQuery } from "@/lib/membership";
import { AppHeader } from "@/components/AppHeader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export const Route = createFileRoute("/_authenticated/_member")({
  beforeLoad: async ({ context }) => {
    const group = await context.queryClient.fetchQuery(myGroupQuery);
    if (!group) throw redirect({ to: "/join" });
    return { group };
  },
  component: () => (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-6"><Outlet /></main>
    </div>
  ),
});
