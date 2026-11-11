type HighlightProvider = { id: string; category: string; positive: number; parent_count: number };

/** Keep the overview compact; the complete board remains searchable below. */
export function categoryHighlights<T extends HighlightProvider>(providers: T[]): T[] {
  const ranked = [...providers].sort((a, b) => b.positive - a.positive || b.parent_count - a.parent_count || a.id.localeCompare(b.id));
  const seen = new Set<string>();
  return ranked.filter((p) => {
    if (seen.has(p.category)) return false;
    seen.add(p.category);
    return true;
  }).slice(0, 8);
}