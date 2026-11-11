/** Pure rules for the board's category grid and category pages (tested in category-overview.test.ts). */
type Item = { id: string; name: string; category: string; positive: number; negative: number; parent_count: number };

export const CATEGORY_GROUPS: { name: string; categories: string[] }[] = [
  { name: "Health", categories: ["pediatrician", "pediatricians", "dentist", "pediatric dentists", "adult dentists", "specialist", "tongue tie and ENT", "therapist", "massage, PT and therapy", "feeding, sleep and doulas", "doctors and specialists", "mental health"] },
  { name: "Childcare", categories: ["childcare", "preschools and daycares", "nannies and sitters", "childcare agencies and tips", "elementary and K-12 schools"] },
  { name: "Activities", categories: ["classes and activities", "camps", "swim", "free and drop-in", "birthday party venues", "birthday party venues and entertainers"] },
  { name: "Gear", categories: ["clothing brands", "toys", "shoes and clothes", "strollers and car seats", "feeding and home gear", "toddler tower and furniture", "stores", "toys and books"] },
  { name: "Home & services", categories: ["services", "cleaners, handy people and gardeners", "utilities, cars and money", "real estate and tenants", "haircuts and styling", "photographers", "pets", "home services and contractors"] },
  { name: "Food", categories: ["kid-friendly restaurants", "dinner delivery and takeout", "kid-friendly restaurants and cafes"] },
  { name: "Out & about", categories: ["travel with kids", "travel and outings", "local businesses", "other"] },
];

export const score = (p: { positive: number; negative: number }) => p.positive - p.negative;
/** Nobody gave a positive or negative answer yet. */
export const isThin = (p: { positive: number; negative: number }) => p.positive === 0 && p.negative === 0;
export const isSplit = (p: { positive: number; negative: number }) => !isThin(p) && p.negative >= p.positive;
/** What the board counts as a recommendation. */
export const isRecommendation = (p: { positive: number }) => p.positive >= 1;

export function pickTop<T extends Item>(items: T[]): T | null {
  const pool = items.filter((p) => !isThin(p) && !isSplit(p));
  const strong = pool.filter((p) => p.positive >= 2).sort((a, b) => score(b) - score(a) || b.positive - a.positive || a.name.localeCompare(b.name));
  if (strong[0]) return strong[0];
  return [...pool].sort((a, b) => b.positive - a.positive || a.name.localeCompare(b.name))[0] ?? null;
}

export function categorySummary<T extends Item>(category: string, all: T[]) {
  const items = all.filter((p) => p.category === category && !isThin(p));
  const mostTalked = [...items].sort((a, b) => b.parent_count - a.parent_count || a.name.localeCompare(b.name))[0] ?? null;
  return { category, count: items.length, top: pickTop(items), split: mostTalked && isSplit(mostTalked) ? mostTalked : null };
}

export function groupedCategories<T extends Item>(all: T[]) {
  const present = new Set(all.filter((p) => !isThin(p)).map((p) => p.category));
  const known = new Set(CATEGORY_GROUPS.flatMap((g) => g.categories));
  const groups = CATEGORY_GROUPS.map((g) => ({ name: g.name, cards: g.categories.filter((c) => present.has(c)).map((c) => categorySummary(c, all)) }));
  const leftovers = [...present].filter((c) => !known.has(c));
  if (leftovers.length) groups[groups.length - 1]!.cards.push(...leftovers.map((c) => categorySummary(c, all)));
  return groups.filter((g) => g.cards.length > 0);
}

export type CategorySort = "score" | "mentions" | "name";
export function sortCategoryItems<T extends Item>(items: T[], sort: CategorySort): T[] {
  return [...items].sort((a, b) =>
    sort === "name" ? a.name.localeCompare(b.name)
    : sort === "mentions" ? b.parent_count - a.parent_count || score(b) - score(a)
    : score(b) - score(a) || b.positive - a.positive || a.name.localeCompare(b.name));
}

/** Reviews may arrive wrapped in quotes; show them bare. */
export function cleanQuote(s: string): string {
  return s.trim().replace(/^['"‘“]+/, "").replace(/['"’”]+$/, "").trim();
}
