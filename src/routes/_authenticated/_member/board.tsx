import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import village from "@/assets/village-meadow.jpg";
import { boardQuery, filterProviders, type Sort, type TimeFilter } from "@/lib/board";
import { categoryHighlights } from "@/lib/board-highlights";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/categories";
import { ProviderCard } from "@/components/ProviderCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/_member/board")({
  head: () => ({ meta: [{ title: "Board — Parent Picks" }, { name: "description", content: "Search every recommendation your group has shared." }, { property: "og:title", content: "Board — Parent Picks" }, { property: "og:description", content: "Explore your village's parent recommendations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(boardQuery(context.group.neighborhoodId)),
  component: Board,
});

function Board() {
  const { group } = Route.useRouteContext();
  const { data } = useSuspenseQuery(boardQuery(group.neighborhoodId));
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("all");
  const [time, setTime] = useState<TimeFilter>("all");
  const [sort, setSort] = useState<Sort>("parents");
  const list = useMemo(() => filterProviders(data, { q, category, location, time, sort }), [data, q, category, location, time, sort]);
  const locations = [...new Set(data.map((p) => p.location).filter(Boolean) as string[])].sort();
  const cats = CATEGORIES.filter((c) => data.some((p) => p.category === c));
  const tops = useMemo(() => categoryHighlights(data), [data]);

  return (
    <div>
      <div className="relative mb-4 overflow-hidden rounded-3xl">
        <img src={village} alt="" width={1920} height={912} className="h-44 w-full object-cover md:h-60" />
        <h1 className="absolute bottom-3 left-5 font-display text-4xl text-foreground md:text-5xl" style={{ textShadow: "0 1px 12px var(--background)" }}>What the village recommends</h1>
      </div>
      <section className="rounded-2xl bg-foreground p-6 text-background">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
          <div><div className="font-display text-5xl font-extrabold text-marigold">{data.length}</div><div className="text-sm opacity-80">recommendations</div></div>
          <div><div className="font-display text-5xl font-extrabold">{cats.length}</div><div className="text-sm opacity-80">categories covered</div></div>
        </div>
        {tops.length > 0 && <>
          <h2 className="mt-6 text-sm font-bold uppercase tracking-wide opacity-70">Most recommended in each category</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {tops.map((p) => (
              <Link key={p.id} to="/p/$id" params={{ id: p.id }} className="rounded-full bg-background/10 px-3 py-1.5 text-sm hover:bg-background/20">
                <span className="opacity-70">{CATEGORY_LABEL[p.category as Category]}:</span> <b>{p.name}</b>
              </Link>
            ))}
          </div>
        </>}
      </section>

      <div className="relative mt-6">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder='Search — try "dentist" or "swim"' className="h-14 rounded-xl bg-popover pl-12 text-lg" aria-label="Search recommendations" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Pick value={category} onChange={setCategory} label="Category" items={[["all", "All categories"], ...cats.map((c) => [c, CATEGORY_LABEL[c]] as [string, string])]} />
        <Pick value={location} onChange={setLocation} label="Neighborhood" items={[["all", "Any neighborhood"], ...locations.map((l) => [l, l] as [string, string])]} />
        <Pick value={time} onChange={(v) => setTime(v as TimeFilter)} label="Time" items={[["all", "All time"], ["2y", "Last 2 years"], ["1y", "Last year"]]} />
        <Pick value={sort} onChange={(v) => setSort(v as Sort)} label="Sort" items={[["parents", "Most parents"], ["positive", "Most positive"], ["recent", "Most recent"]]} />
      </div>

      <p className="mt-4 rounded-lg border border-marigold/60 bg-marigold/15 px-3 py-2 text-sm">
        Recommendations as shared by parents in the group. Summaries are written by AI and may contain mistakes. Not verified.
      </p>

      {list.length === 0 ? (
        <div className="mt-10 text-center text-muted-foreground">
          {data.length === 0 ? "Nothing on the board yet. Once an admin uploads the chat and publishes recommendations, they'll show up here." : "No matches. Try a different word or clear the filters."}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2">{list.map((p) => <ProviderCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}

function Pick({ value, onChange, label, items }: { value: string; onChange: (v: string) => void; label: string; items: [string, string][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-12 w-full bg-popover text-base"><SelectValue /></SelectTrigger>
      <SelectContent>{items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
