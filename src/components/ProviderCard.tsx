import { Link } from "@tanstack/react-router";
import type { Provider } from "@/lib/board";
import { CATEGORY_LABEL, isOlder, yearRange, type Category } from "@/lib/categories";
import { SentimentBar } from "./SentimentBar";
import { ContactLinks, hasContact } from "./ContactLinks";

export function ProviderCard({ p }: { p: Provider }) {
  const old = isOlder(p.last_mention);
  return (
    <div className="kraft-card group p-5 transition hover:-translate-y-0.5">
    <Link to="/p/$id" params={{ id: p.id }} className="block">
      <div className="flex items-start gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-foreground/60">{CATEGORY_LABEL[p.category as Category] ?? p.category}</span>
        {old && <span className="ml-auto rounded-full bg-background/70 px-2 py-0.5 text-[11px] font-semibold">Older recommendations</span>}
      </div>
      <h3 className="mt-1 font-display text-2xl font-extrabold leading-tight group-hover:underline">{p.name}</h3>
      <p className="mt-1 text-sm"><b>{p.parent_count} parents</b> mentioned this</p>
      <SentimentBar p={p} className="mt-3" />
      <p className="mt-3 text-[15px] leading-relaxed">{p.summary}</p>
      <p className="mt-3 text-xs text-foreground/60">{yearRange(p.first_mention, p.last_mention)}{p.location ? ` · ${p.location}` : ""}</p>
    </Link>
    {hasContact(p) && <div className="mt-3"><ContactLinks p={p} compact /></div>}
    </div>
  );
}
