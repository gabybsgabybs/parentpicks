import { CalendarCheck, Globe, MapPin, Phone } from "lucide-react";
import type { Provider } from "@/lib/board";
import { mapsUrl, websiteOnly } from "@/lib/categories";

type C = Pick<Provider, "category" | "website" | "phone" | "address" | "booking_url">;

export function hasContact(p: C) {
  return !!(p.website || (!websiteOnly(p.category) && (p.phone || p.address || p.booking_url)));
}

export function ContactLinks({ p, compact = false }: { p: C; compact?: boolean }) {
  if (!hasContact(p)) return null;
  const local = !websiteOnly(p.category);
  const items = [
    local && p.booking_url && { href: p.booking_url, icon: CalendarCheck, label: "Book online", ext: true },
    local && p.phone && { href: `tel:${p.phone.replace(/[^\d+]/g, "")}`, icon: Phone, label: compact ? "Call" : `Call ${p.phone}`, ext: false },
    p.website && { href: p.website, icon: Globe, label: local ? "Website" : "Visit website", ext: true },
    local && p.address && { href: mapsUrl(p.address), icon: MapPin, label: "Directions", ext: true },
  ].filter(Boolean) as { href: string; icon: typeof Globe; label: string; ext: boolean }[];
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ href, icon: Icon, label, ext }) => (
        <a key={label} href={href} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 font-semibold transition hover:bg-background ${compact ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm"}`}>
          <Icon className={compact ? "size-3.5" : "size-4"} />{label}
        </a>
      ))}
    </div>
  );
}
