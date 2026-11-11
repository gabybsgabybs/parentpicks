import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { boardQuery } from "@/lib/board";
import { isSplit, isThin, sortCategoryItems, type CategorySort } from "@/lib/category-overview";
import { CATEGORY_LABEL, type Category } from "@/lib/categories";
import { hasContact } from "@/components/ContactLinks";
import { SplitBar, sentimentText } from "@/components/SplitBar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_member/c/$category")({
  head: ({ params }) => {
    const name = CATEGORY_LABEL[params.category as Category] ?? params.category;
    return { meta: [{ title: `${name} — Parent Picks` }, { name: "description", content: `${name} recommended by parents in your group.` }, { property: "og:title", content: `${name} — Parent Picks` }, { property: "og:description", content: `${name} recommended by parents.` }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(boardQuery(context.group.neighborhoodId)),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const { group } = Route.useRouteContext();
  const { data } = useSuspenseQuery(boardQuery(group.neighborhoodId));
  const [sort, setSort] = useState<CategorySort>("score");
  const [contactOnly, setContactOnly] = useState(false);
  const [hideSplit, setHideSplit] = useState(false);
  const inCat = data.filter((p) => p.category === category);
  const thin = inCat.filter(isThin);
  const items = useMemo(() => sortCategoryItems(inCat.filter((p) => !isThin(p) && (!contactOnly || hasContact(p)) && (!hideSplit || !isSplit(p))), sort), [inCat, sort, contactOnly, hideSplit]);
  const name = CATEGORY_LABEL[category as Category] ?? category;

  return (
    <div>
      <Link to="/board" className="text-sm font-medium underline-offset-4 hover:underline">← Back to the board</Link>
      <h1 className="mt-2 font-display text-[32px] leading-tight md:text-[56px]">{name}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip on={contactOnly} onClick={() => setContactOnly((v) => !v)}>Only with contact info</Chip>
        <Chip on={hideSplit} onClick={() => setHideSplit((v) => !v)}>Hide split reviews</Chip>
        <div className="ml-auto w-full sm:w-48">
          <Select value={sort} onValueChange={(v) => setSort(v as CategorySort)}>
            <SelectTrigger aria-label="Sort" className="h-11 w-full bg-popover"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="score">Sort: best score</SelectItem><SelectItem value="mentions">Sort: most mentions</SelectItem><SelectItem value="name">Sort: name</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((p) => (
          <li key={p.id}>
            <Link to="/p/$id" params={{ id: p.id }} className="kraft-card block p-4 transition hover:-translate-y-0.5">
              <div className="flex flex-wrap items-baseline gap-x-3">
                <h2 className="min-w-0 truncate text-2xl">{p.name}</h2>
                {isSplit(p) && <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-mixed-ink">Parents are split</span>}
              </div>
              <p className="mt-1 text-[15px] leading-relaxed">{p.summary}</p>
              <SplitBar p={p} className="mt-3 max-w-sm" />
              <p className="mt-1.5 text-xs font-semibold">{sentimentText(p)}{p.location ? <span className="font-normal text-muted-foreground"> · {p.location}</span> : null}</p>
            </Link>
          </li>
        ))}
      </ul>
      {items.length === 0 && <p className="mt-8 text-center text-muted-foreground">No places match these filters.</p>}

      {thin.length > 0 && (
        <details className="mt-8 rounded-xl border border-border bg-popover p-4">
          <summary className="cursor-pointer font-semibold">Asked about, no answers yet — know something? ({thin.length})</summary>
          <ul className="mt-3 space-y-2 text-sm">
            {thin.map((p) => <li key={p.id} className="flex flex-wrap gap-x-3"><span>{p.name}</span><Link to="/admin/upload" search={{ item: p.name }} className="font-semibold underline">Add your take</Link></li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold transition", on ? "border-foreground bg-foreground text-background" : "border-border bg-popover text-foreground hover:bg-card")}>{children}</button>;
}
