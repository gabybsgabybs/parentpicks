export const CATEGORIES = [
  "pediatrician", "dentist", "specialist", "therapist", "childcare",
  "classes and activities", "clothing brands", "toys", "stores", "services", "other",
  "pediatricians", "pediatric dentists", "adult dentists", "tongue tie and ENT",
  "feeding, sleep and doulas", "massage, PT and therapy", "preschools and daycares",
  "nannies and sitters", "childcare agencies and tips", "camps", "swim",
  "free and drop-in", "shoes and clothes", "strollers and car seats",
  "feeding and home gear", "travel with kids", "toddler tower and furniture",
  "cleaners, handy people and gardeners", "utilities, cars and money",
  "real estate and tenants", "birthday party venues", "dinner delivery and takeout",
  "kid-friendly restaurants", "travel and outings", "haircuts and styling",
  "photographers", "pets", "local businesses",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_LABEL: Record<Category, string> = {
  pediatrician: "Pediatricians", dentist: "Dentists", specialist: "Specialists", therapist: "Therapists",
  childcare: "Childcare", "classes and activities": "Classes & activities", "clothing brands": "Clothing brands",
  toys: "Toys", stores: "Stores", services: "Services", other: "Other",
  pediatricians: "Pediatricians", "pediatric dentists": "Pediatric dentists", "adult dentists": "Adult dentists",
  "tongue tie and ENT": "Tongue tie & ENT", "feeding, sleep and doulas": "Feeding, sleep & doulas",
  "massage, PT and therapy": "Massage, PT & therapy", "preschools and daycares": "Preschools & daycares",
  "nannies and sitters": "Nannies & sitters", "childcare agencies and tips": "Childcare agencies & tips",
  camps: "Camps", swim: "Swim", "free and drop-in": "Free & drop-in", "shoes and clothes": "Shoes & clothes",
  "strollers and car seats": "Strollers & car seats", "feeding and home gear": "Feeding & home gear",
  "travel with kids": "Travel with kids", "toddler tower and furniture": "Toddler towers & furniture",
  "cleaners, handy people and gardeners": "Cleaners, handy people & gardeners",
  "utilities, cars and money": "Utilities, cars & money", "real estate and tenants": "Real estate & tenants",
  "birthday party venues": "Birthday party venues", "dinner delivery and takeout": "Dinner delivery & takeout",
  "kid-friendly restaurants": "Kid-friendly restaurants", "travel and outings": "Travel & outings",
  "haircuts and styling": "Haircuts & styling", photographers: "Photographers", pets: "Pets",
  "local businesses": "Local businesses",
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

/** Brands and shops only need a website; local providers also get phone, address and booking link. */
export const WEBSITE_ONLY_CATEGORIES = ["clothing brands", "toys", "stores"] as const;
export function websiteOnly(category: string) {
  return (WEBSITE_ONLY_CATEGORIES as readonly string[]).includes(category);
}
export function cleanUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  const t = u.trim();
  if (!t) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch { return null; }
}
export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
