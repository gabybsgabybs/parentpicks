import { cn } from "@/lib/utils";

/** 10px bar: green share = positive, amber share = negative. */
export function SplitBar({ p, labels = false, className }: { p: { positive: number; negative: number; mixed?: number }; labels?: boolean; className?: string }) {
  const mixed = p.mixed ?? 0;
  const total = p.positive + p.negative + mixed;
  const w = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  const label = `${p.positive} positive, ${mixed} mixed, ${p.negative} negative`;
  return (
    <div className={className}>
      <div role="img" aria-label={label} className="flex h-2.5 overflow-hidden rounded-full bg-border">
        {p.positive > 0 && <div className="bg-positive" style={{ width: w(p.positive) }} />}
        {mixed > 0 && <div className="bg-muted-foreground/40" style={{ width: w(mixed) }} />}
        {p.negative > 0 && <div className="bg-mixed" style={{ width: w(p.negative) }} />}
      </div>
      {labels && (
        <div className="mt-1 flex justify-between text-xs font-semibold">
          <span className="text-positive">{p.positive} positive</span>
          <span className="flex gap-3">
          {mixed > 0 && <span className="text-muted-foreground">{mixed} mixed</span>}
          <span className={cn(p.negative ? "text-mixed-ink" : "text-muted-foreground")}>{p.negative} negative</span>
          </span>
        </div>
      )}
    </div>
  );
}

export function sentimentText(p: { positive: number; negative: number; mixed: number }) {
  return [p.positive && `${p.positive} positive`, p.mixed && `${p.mixed} mixed`, p.negative && `${p.negative} negative`].filter(Boolean).join(" · ") || "No opinions yet";
}
