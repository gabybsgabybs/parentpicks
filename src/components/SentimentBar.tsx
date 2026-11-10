import { cn } from "@/lib/utils";
export function SentimentBar({ p, className }: { p: { positive: number; negative: number; mixed: number }; className?: string }) {
  const total = p.positive + p.negative + p.mixed || 1;
  const items = [
    { n: p.positive, label: "positive", c: "bg-positive" },
    { n: p.mixed, label: "mixed", c: "bg-mixed" },
    { n: p.negative, label: "negative", c: "bg-negative" },
  ];
  return (
    <div className={className}>
      <div className="flex h-2 overflow-hidden rounded-full bg-background/60">
        {items.map((i) => i.n > 0 && <div key={i.label} className={i.c} style={{ width: `${(i.n / total) * 100}%` }} />)}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs font-medium">
        {items.filter((i) => i.n > 0).map((i) => (
          <span key={i.label} className="inline-flex items-center gap-1"><span className={cn("size-2 rounded-full", i.c)} />{i.n} {i.n === 1 ? "parent" : "parents"} {i.label}</span>
        ))}
      </div>
    </div>
  );
}
