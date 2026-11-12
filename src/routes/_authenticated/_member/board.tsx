import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import village from "@/assets/village-meadow.jpg";
import { boardQuery, reviewTextQuery, searchProviders } from "@/lib/board";
import { groupedCategories, isThin } from "@/lib/category-overview";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { ProviderCard } from "@/components/ProviderCard";
import { SplitBar } from "@/components/SplitBar";
import { TipJar } from "@/components/TipJar";
import { VillageChat } from "@/components/VillageChat";
import { Input } from "@/components/ui/input";
import iHealth from "@/assets/icon-health.png";
import iChildcare from "@/assets/icon-childcare.png";
import iActivities from "@/assets/icon-activities.png";
import iGear from "@/assets/icon-gear.png";
import iHome from "@/assets/icon-home.png";
import iFood from "@/assets/icon-food.png";
import iOutings from "@/assets/icon-outings.png";

const GROUP_ICON: Record<string, string> = { Health: iHealth, Childcare: iChildcare, Activities: iActivities, Gear: iGear, "Home & services": iHome, Food: iFood, "Out & about": iOutings };

export const Route = createFileRoute("/_authenticated/_member/board")({
  head: () => ({ meta: [{ title: "Board — Parent Picks" }, { name: "description", content: "Search every recommendation your group has shared." }, { property: "og:title", content: "Board — Parent Picks" }, { property: "og:description", content: "Explore your village's parent recommendations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(boardQuery(context.group.neighborhoodId)),
    context.queryClient.ensureQueryData(reviewTextQuery(context.group.neighborhoodId)),
  ]),
  validateSearch: (search: Record<string, unknown>): { tip?: string | undefined } => ({
    tip: typeof search["tip"] === "string" ? search["tip"] : undefined,
  }),
  component: Board,
});

const label = (c: string) => CATEGORY_LABEL[c as Category] ?? c;

function Board() {
  const { group } = Route.useRouteContext();
  const { tip } = Route.useSearch();
  const { data } = useSuspenseQuery(boardQuery(group.neighborhoodId));
  const { data: reviews } = useSuspenseQuery(reviewTextQuery(group.neighborhoodId));
  const [q, setQ] = useState("");
  const results = useMemo(() => searchProviders(data, q, reviews).filter((p) => !isThin(p)), [data, q, reviews]);
  const groups = useMemo(() => groupedCategories(data), [data]);

  return (
    <div>
      <section className="grid items-center gap-4 sm:grid-cols-2 sm:max-h-[40vh]">
        <div className="py-2">
          <h1 className="font-display text-[32px] leading-tight md:text-[56px]">What the village recommends</h1>
          <p className="mt-2 text-sm text-muted-foreground">Curated from WhatsApp local parents groups · summaries by AI</p>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pediatricians, swim lessons, nannies…" className="h-14 rounded-xl bg-popover pl-12 text-base md:text-lg" aria-label="Search recommendations" />
          </div>
        </div>
        <img src={village} alt="" width={1600} height={1008} className="village-fade-left hidden max-h-[40vh] w-full object-cover object-center mix-blend-multiply sm:block" />
      </section>

      {q.trim() ? (
        <section className="mt-6">
          <p className="text-sm text-muted-foreground">{results.length} {results.length === 1 ? "match" : "matches"}</p>
          {results.length === 0
            ? <p className="mt-8 text-center text-lg">Nothing yet for ‘{q.trim()}’ — ask the group or <Link to="/admin/upload" search={{ item: q.trim() }} className="font-semibold underline">add it</Link></p>
            : <div className="mt-3 grid gap-4 sm:grid-cols-2">{results.map((p) => <ProviderCard key={p.id} p={p} />)}</div>}
        </section>
      ) : (
        <>
          {groups.length > 1 && (
            <nav aria-label="Jump to section" className="sticky top-[61px] z-10 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-background/90 px-4 py-2 backdrop-blur [scrollbar-width:none]">
              {groups.map((g) => (
                <a key={g.name} href={`#sec-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-secondary">{g.name}</a>
              ))}
            </nav>
          )}
          {groups.map((g) => (
            <section key={g.name} id={`sec-${g.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="mt-8 scroll-mt-32">
              <h2 className="font-display text-3xl">{g.name}</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.cards.map((c) => (
                  <Link key={c.category} to="/c/$category" params={{ category: c.category }} className="kraft-card block min-w-0 p-4 transition hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <img src={GROUP_ICON[g.name] ?? iOutings} alt="" loading="lazy" width={816} height={816} className="size-14 shrink-0 scale-150 object-contain" />
                      <div className="min-w-0">
                        <h3 className="truncate text-xl">{label(c.category)}</h3>
                        <span className="text-xs font-semibold text-muted-foreground">{c.count} {c.count === 1 ? "place" : "places"}</span>
                      </div>
                    </div>
                    {c.top && <>
                      <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Top pick</p>
                      <p className="truncate font-semibold">{c.top.name}</p>
                      <SplitBar p={c.top} className="mt-1.5" />
                    </>}
                    {c.split && <p className="mt-3 truncate text-sm"><span className="font-semibold text-mixed-ink">Most talked about — parents are split:</span> {c.split.name}</p>}
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {groups.length === 0 && <p className="mt-10 text-center text-muted-foreground">Nothing on the board yet. Once an admin uploads the chat and publishes recommendations, they'll show up here.</p>}
        </>
      )}

      <p className="mt-10 text-xs text-muted-foreground">Recommendations as shared by parents in the group. Summaries are written by AI and may contain mistakes. Not verified.</p>

      <TipJar thanks={tip === "thanks"} />
      <VillageChat />
    </div>
  );
}
