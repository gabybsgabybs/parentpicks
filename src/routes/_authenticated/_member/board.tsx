import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import village from "@/assets/village-meadow.jpg";
import { boardQuery, reviewTextQuery, searchProviders } from "@/lib/board";
import { groupedCategories, isRecommendation, isThin } from "@/lib/category-overview";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { ProviderCard } from "@/components/ProviderCard";
import { SplitBar } from "@/components/SplitBar";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/_member/board")({
  head: () => ({ meta: [{ title: "Board — Parent Picks" }, { name: "description", content: "Search every recommendation your group has shared." }, { property: "og:title", content: "Board — Parent Picks" }, { property: "og:description", content: "Explore your village's parent recommendations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(boardQuery(context.group.neighborhoodId)),
    context.queryClient.ensureQueryData(reviewTextQuery(context.group.neighborhoodId)),
  ]),
  component: Board,
});

const label = (c: string) => CATEGORY_LABEL[c as Category] ?? c;

function Board() {
  const { group } = Route.useRouteContext();
  const { data } = useSuspenseQuery(boardQuery(group.neighborhoodId));
  const { data: reviews } = useSuspenseQuery(reviewTextQuery(group.neighborhoodId));
  const [q, setQ] = useState("");
  const results = useMemo(() => searchProviders(data, q, reviews).filter((p) => !isThin(p)), [data, q, reviews]);
  const groups = useMemo(() => groupedCategories(data), [data]);
  const recs = data.filter(isRecommendation).length;
  const catCount = groups.reduce((n, g) => n + g.cards.length, 0);

  return (
    <div>
      <section className="grid items-center gap-4 sm:grid-cols-2 sm:max-h-[40vh]">
        <div className="py-2">
          <h1 className="font-display text-[32px] leading-tight md:text-[56px]">What the village recommends</h1>
          <p className="mt-2 text-sm text-muted-foreground">From 1,908 messages in the Duboce Families WhatsApp, Feb–Nov 2026 · summaries by AI, may contain mistakes · updated 10 Nov 2026</p>
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
          <section className="mt-6 rounded-2xl border-t-4 border-foreground bg-card p-5">
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <div><div className="font-display text-5xl text-mixed-ink">{recs}</div><div className="text-sm">recommendations</div></div>
              <div><div className="font-display text-5xl">{catCount}</div><div className="text-sm">categories covered</div></div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Counts places at least one parent spoke well of, mentioned by 2 or more parents.</p>
          </section>

          {groups.map((g) => (
            <section key={g.name} className="mt-8">
              <h2 className="font-display text-3xl">{g.name}</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.cards.map((c) => (
                  <Link key={c.category} to="/c/$category" params={{ category: c.category }} className="kraft-card block min-w-0 p-4 transition hover:-translate-y-0.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="truncate text-xl">{label(c.category)}</h3>
                      <span className="shrink-0 text-xs font-semibold text-muted-foreground">{c.count} {c.count === 1 ? "place" : "places"}</span>
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
    </div>
  );
}
