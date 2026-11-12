import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Flag, Search, EyeOff, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminOnly } from "@/components/AdminOnly";
import { SentimentBar } from "@/components/SentimentBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_LABEL, MIN_PARENTS, cleanUrl, yearRange } from "@/lib/categories";
import type { Provider } from "@/lib/board";
import { lookupContacts, mergeProviders, splitProvider } from "@/lib/pipeline.functions";
import { websiteOnly } from "@/lib/categories";
import { AdminReviews } from "@/components/AdminReviews";
import { PendingSuggestions } from "@/components/PendingSuggestions";

const reviewQuery = (nb: string) => queryOptions({
  queryKey: ["review", nb],
  queryFn: async () => {
    const [p, s, f] = await Promise.all([
      supabase.from("providers").select("*").eq("neighborhood_id", nb).order("parent_count", { ascending: false }),
      supabase.from("match_suggestions").select("*").eq("neighborhood_id", nb).eq("status", "open"),
      supabase.from("flags").select("*").eq("neighborhood_id", nb).eq("resolved", false).order("created_at", { ascending: false }),
    ]);
    if (p.error) throw p.error;
    if (s.error) throw s.error;
    if (f.error) throw f.error;
    return { providers: (p.data ?? []) as Provider[], suggestions: s.data ?? [], flags: f.data ?? [] };
  },
});

export const Route = createFileRoute("/_authenticated/_member/admin/review")({
  loader: ({ context }) => context.group.role === "admin" ? context.queryClient.ensureQueryData(reviewQuery(context.group.neighborhoodId)) : undefined,
  head: () => ({ meta: [{ title: "Admin central — Parent Picks" }, { name: "description", content: "Manage businesses, categories, summaries and anonymous parent reviews." }, { property: "og:title", content: "Admin central — Parent Picks" }, { property: "og:description", content: "Manage your group's recommendations and parent reviews." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <AdminOnly><Review /></AdminOnly>,
});

type Status = "needs_review" | "published" | "hidden";
const STATUS_LABEL: Record<Status, string> = { needs_review: "Needs review", published: "Published", hidden: "Hidden" };

function Review() {
  const { group } = Route.useRouteContext();
  const qc = useQueryClient();
  const { data } = useSuspenseQuery(reviewQuery(group.neighborhoodId));
  const [tab, setTab] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [page, setPage] = useState(0);
  const merge = useServerFn(mergeProviders);
  const refresh = () => qc.invalidateQueries();
  const byId = new Map(data.providers.map((p) => [p.id, p]));
  const list = data.providers.filter((p) => (tab === "all" || p.status === tab) && (filterCategory === "all" || p.category === filterCategory) && [p.name, ...p.aliases, p.summary, p.location ?? ""].join(" ").toLowerCase().includes(search.trim().toLowerCase()));

  async function doMerge(keepId: string, mergeId: string) {
    try { await merge({ data: { keepId, mergeId } }); toast.success("Merged"); refresh(); } catch (e) { toast.error((e as Error).message); }
  }
  async function publishAll() {
    const ids = list.filter((p) => !p.self_promo_flag && p.parent_count >= MIN_PARENTS).map((p) => p.id);
    if (!ids.length) return;
    const { error } = await supabase.from("providers").update({ status: "published" }).in("id", ids);
    if (error) { toast.error(error.message); return; }
    toast.success(`Published ${ids.length}`); refresh();
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-4xl font-extrabold">Admin central</h1>

      <PendingSuggestions neighborhoodId={group.neighborhoodId} />

      {data.flags.length > 0 && (
        <section>
          <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold"><Flag className="size-5" /> Flags from parents</h2>
          <ul className="mt-3 space-y-2">
            {data.flags.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-marigold bg-marigold/15 p-4">
                <div className="flex-1"><Link to="/p/$id" params={{ id: f.provider_id }} className="font-semibold underline">{byId.get(f.provider_id)?.name ?? "Recommendation"}</Link><p className="mt-1">{f.note}</p></div>
                <Button variant="outline" className="bg-background" onClick={async () => { await supabase.from("flags").update({ resolved: true }).eq("id", f.id); refresh(); }}>Mark handled</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.suggestions.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-extrabold">Could these be the same?</h2>
          <div className="mt-3 space-y-4">
            {data.suggestions.map((s) => {
              const a = byId.get(s.provider_a), b = byId.get(s.provider_b);
              if (!a || !b) return null;
              return (
                <div key={s.id} className="rounded-2xl border border-border bg-popover p-4">
                  <p className="text-sm text-muted-foreground">{s.reason}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">{[a, b].map((p) => <MiniCard key={p.id} p={p} />)}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => doMerge(a.id, b.id)}>Same — keep “{a.name}”</Button>
                    <Button variant="outline" onClick={() => doMerge(b.id, a.id)}>Same — keep “{b.name}”</Button>
                    <Button variant="ghost" onClick={async () => { await supabase.from("match_suggestions").update({ status: "dismissed" }).eq("id", s.id); refresh(); }}>Not the same</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-5 text-muted-foreground" /><Input className="h-11 pl-10" aria-label="Search businesses" placeholder="Search businesses…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} /></div>
          <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(0); }}><SelectTrigger aria-label="Filter category" className="h-11 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs className="min-w-0 max-w-full overflow-x-auto" value={tab} onValueChange={(v) => { setTab(v as Status | "all"); setPage(0); }}>
            <TabsList className="h-11">
              <TabsTrigger value="all" className="px-3">All ({data.providers.length})</TabsTrigger>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <TabsTrigger key={s} value={s} className="px-3">{STATUS_LABEL[s]} ({data.providers.filter((p) => p.status === s).length})</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          {tab === "needs_review" && list.length > 0 && <Button variant="outline" className="ml-auto" onClick={publishAll}>Publish all with 2+ parents (skips flagged)</Button>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Parents only see published recommendations mentioned by at least {MIN_PARENTS} parents.</p>
        <div className="mt-4 space-y-4">
          {list.length === 0 && <p className="py-8 text-center text-muted-foreground">Nothing here.</p>}
          {list.slice(page * 10, (page + 1) * 10).map((p) => <EditCard key={p.id} p={p} all={data.providers} onChange={refresh} onMerge={doMerge} />)}
        </div>
        {list.length > 10 && <div className="mt-5 flex items-center justify-between gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><span className="text-sm text-muted-foreground">{page * 10 + 1}–{Math.min((page + 1) * 10, list.length)} of {list.length}</span><Button variant="outline" disabled={(page + 1) * 10 >= list.length} onClick={() => setPage(page + 1)}>Next</Button></div>}
      </section>
    </div>
  );
}

function MiniCard({ p }: { p: Provider }) {
  return (
    <div className="kraft-card p-4">
      <div className="text-xs font-bold uppercase opacity-60">{CATEGORY_LABEL[p.category as keyof typeof CATEGORY_LABEL]}</div>
      <div className="font-display text-xl font-extrabold">{p.name}</div>
      {p.aliases.length > 0 && <div className="text-xs">Also: {p.aliases.join(", ")}</div>}
      <div className="mt-1 text-sm">{p.parent_count} parents · {yearRange(p.first_mention, p.last_mention)}</div>
      <p className="mt-2 text-sm">{p.summary}</p>
    </div>
  );
}

function EditCard({ p, all, onChange, onMerge }: { p: Provider; all: Provider[]; onChange: () => void; onMerge: (keep: string, drop: string) => void }) {
  const [name, setName] = useState(p.name);
  const [category, setCategory] = useState(p.category);
  const [summary, setSummary] = useState(p.summary);
  const [mergeInto, setMergeInto] = useState("");
  const [website, setWebsite] = useState(p.website ?? "");
  const [phone, setPhone] = useState(p.phone ?? "");
  const [address, setAddress] = useState(p.address ?? "");
  const [booking, setBooking] = useState(p.booking_url ?? "");
  const [looking, setLooking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const split = useServerFn(splitProvider);
  const lookup = useServerFn(lookupContacts);
  const webOnly = websiteOnly(category);
  const contactDirty = website !== (p.website ?? "") || phone !== (p.phone ?? "") || address !== (p.address ?? "") || booking !== (p.booking_url ?? "");
  const dirty = name !== p.name || category !== p.category || summary !== p.summary || contactDirty;
  async function save(extra: Partial<Provider> = {}) {
    if (!name.trim()) { toast.error("Please enter a business name"); return; }
    setSaving(true);
    try {
    const { error } = await supabase.from("providers").update({ name, category: category as never, summary,
      website: cleanUrl(website), phone: webOnly ? null : phone.trim() || null, address: webOnly ? null : address.trim() || null,
      booking_url: webOnly ? null : cleanUrl(booking), ...extra } as never).eq("id", p.id);
    if (error) { toast.error(error.message); return; }
    toast.success(extra.status ? `Moved to ${STATUS_LABEL[extra.status as Status]}` : "Saved"); onChange();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Could not save changes"); }
    finally { setSaving(false); }
  }
  return (
    <div className="rounded-lg border border-border bg-popover p-4" data-provider-id={p.id}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{STATUS_LABEL[p.status as Status] ?? p.status}</span><Link to="/p/$id" params={{ id: p.id }} className="underline">View recommendation</Link></div>
      {p.self_promo_flag && <p className="mb-3 flex items-center gap-2 rounded-lg bg-marigold/25 px-3 py-2 text-sm font-medium"><AlertTriangle className="size-4" /> Possible self-promotion: a parent may have recommended their own business.</p>}
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 font-display text-lg font-bold" aria-label="Name" />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 w-full" aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <b>{p.parent_count} parents</b><span>{yearRange(p.first_mention, p.last_mention)}</span>{p.location && <span>{p.location}</span>}
        {p.parent_count < MIN_PARENTS && <span className="text-muted-foreground">(needs {MIN_PARENTS}+ parents to show on the board)</span>}
      </div>
      <SentimentBar p={p} className="mt-2 max-w-sm" />
      <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="mt-3 text-base" aria-label="Summary" />
      <div className="mt-3 rounded-xl bg-secondary/50 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="font-semibold">Contact info</span>
          <span className="text-muted-foreground">{p.contact_checked_at ? "found online by AI — please check" : "not looked up yet"}</span>
          <Button size="sm" variant="outline" className="ml-auto" disabled={looking} onClick={async () => {
            setLooking(true);
            try { await lookup({ data: { neighborhoodId: p.neighborhood_id, providerIds: [p.id] } }); toast.success("Contact info updated"); onChange(); }
            catch (e) { toast.error((e as Error).message); } finally { setLooking(false); }
          }}>{looking ? "Searching…" : p.contact_checked_at ? "Search again" : "Find contact info"}</Button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" aria-label="Website" />
          {!webOnly && <>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" aria-label="Phone" />
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" aria-label="Address" />
            <Input value={booking} onChange={(e) => setBooking(e.target.value)} placeholder="Booking link" aria-label="Booking link" />
          </>}
        </div>
      </div>
      {p.aliases.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold">Other names:</span>
          {p.aliases.map((a) => (
            <span key={a} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1">{a}
              <Button size="sm" variant="link" className="h-auto p-0 text-xs" title="Split this name into its own recommendation" onClick={async () => {
                if (!confirm(`Split "${a}" into its own recommendation?`)) return;
                try { await split({ data: { providerId: p.id, alias: a } }); toast.success("Split"); onChange(); } catch (e) { toast.error((e as Error).message); }
              }}>split</Button>
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {dirty && <Button variant="outline" disabled={saving} onClick={() => save()}>Save changes</Button>}
        {p.status !== "published" && <Button disabled={saving} onClick={() => save({ status: "published" })}>Publish</Button>}
        {p.status !== "hidden" && <Button variant="ghost" disabled={saving} onClick={() => save({ status: "hidden" })}><EyeOff className="size-4" />Hide business</Button>}
        {p.status === "hidden" && <Button variant="ghost" disabled={saving} onClick={() => save({ status: "needs_review" })}>Back to review</Button>}
        <Button variant="outline" aria-expanded={showReviews} onClick={() => setShowReviews(!showReviews)}><MessageSquare className="size-4" />{showReviews ? "Close reviews" : "Manage reviews"}</Button>
        <div className="ml-auto flex w-full gap-2 sm:w-auto">
          <Select value={mergeInto} onValueChange={setMergeInto}>
            <SelectTrigger className="h-10 min-w-0 flex-1 sm:w-52" aria-label="Merge into"><SelectValue placeholder="Merge into…" /></SelectTrigger>
            <SelectContent>{all.filter((o) => o.id !== p.id).map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" disabled={!mergeInto} onClick={() => onMerge(mergeInto, p.id)}>Merge</Button>
        </div>
      </div>
      {showReviews && <AdminReviews neighborhoodId={p.neighborhood_id} providerId={p.id} />}
    </div>
  );
}
