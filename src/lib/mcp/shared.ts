import { ToolError } from "@lovable.dev/mcp-js";
import { MIN_PARENTS, CATEGORY_LABEL } from "@/lib/categories";

export { MIN_PARENTS };
export const PROVIDER_FIELDS = "id, name, category, summary, location, parent_count, positive, mixed, negative, last_mention, website, phone, address, booking_url";

type P = { id: string; name: string; category: string; summary: string; location: string | null; parent_count: number; positive: number; mixed: number; negative: number; last_mention: string | null; website: string | null; phone: string | null; address: string | null; booking_url: string | null };

export const toProviderJson = (p: P) => ({
  id: p.id, name: p.name, category: p.category,
  category_label: (CATEGORY_LABEL as Record<string, string>)[p.category] ?? p.category,
  summary: p.summary, location: p.location, parents_recommending: p.parent_count,
  positive: p.positive, mixed: p.mixed, negative: p.negative, last_mentioned: p.last_mention,
  website: p.website, phone: p.phone, address: p.address, booking_url: p.booking_url,
});

export function fail(msg: string): never { throw new ToolError(msg); }
export const DISCLAIMER = "Summaries are AI-generated from anonymous parent comments; contact details were found online. Double-check before booking.";
