export const CATEGORIES = [
  "pediatrician", "dentist", "specialist", "therapist", "childcare",
  "classes and activities", "clothing brands", "toys", "stores", "services", "other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  pediatrician: "Pediatricians", dentist: "Dentists", specialist: "Specialists", therapist: "Therapists",
  childcare: "Childcare", "classes and activities": "Classes & activities", "clothing brands": "Clothing brands",
  toys: "Toys", stores: "Stores", services: "Services", other: "Other",
};
export const MIN_PARENTS = 2;
export const OLD_AFTER_YEARS = 2;

export function isOlder(lastMention: string | null, now = new Date()): boolean {
  if (!lastMention) return false;
  const cutoff = new Date(now); cutoff.setFullYear(cutoff.getFullYear() - OLD_AFTER_YEARS);
  return new Date(lastMention) < cutoff;
}
export function yearRange(first: string | null, last: string | null): string {
  if (!first || !last) return "";
  const a = first.slice(0, 4), b = last.slice(0, 4);
  return a === b ? `Mentioned in ${a}` : `Mentioned ${a} to ${b}`;
}
export function breakdown(p: { positive: number; negative: number; mixed: number }): string {
  const parts = [];
  if (p.positive) parts.push(`${p.positive} positive`);
  if (p.negative) parts.push(`${p.negative} negative`);
  if (p.mixed) parts.push(`${p.mixed} mixed`);
  return parts.join(", ");
}
