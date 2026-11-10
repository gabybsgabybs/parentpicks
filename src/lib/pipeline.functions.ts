import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES } from "./categories";

const PRIVACY = `Privacy rules: never include any person's name, initials, phone number, children's names, ages tied to a child, health conditions or diagnoses. Describe the provider's service only, not the family's situation. Paraphrase; never quote. Keep negative points factual and calm.`;

async function assertAdmin(supabase: any, nb: string) {
  const { data } = await supabase.rpc("is_admin", { _nb: nb });
  if (!data) throw new Error("Only group admins can do this");
}

export const startUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { neighborhoodId: string; consent: boolean; messagesRead: number }) =>
    z.object({ neighborhoodId: z.string().uuid(), consent: z.literal(true), messagesRead: z.number().int().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, data.neighborhoodId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: up, error } = await supabaseAdmin.from("uploads")
      .insert({ neighborhood_id: data.neighborhoodId, uploaded_by: context.userId, messages_read: data.messagesRead })
      .select("id").single();
    if (error) throw new Error(error.message);
    return { uploadId: up.id };
  });

const msgSchema = z.object({ sender: z.string().max(200), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), text: z.string().max(4000) });

export const processChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    neighborhoodId: z.string().uuid(), uploadId: z.string().uuid(),
    messages: z.array(msgSchema).max(150),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, data.neighborhoodId);
    const { aiJson, hashSender } = await import("./ai.server");
    // Sender names are replaced by stable aliases (P1, P2...) before AI sees them.
    const alias = new Map<string, string>();
    data.messages.forEach((m) => { if (!alias.has(m.sender)) alias.set(m.sender, `P${alias.size + 1}`); });
    const lines = data.messages.map((m, i) => `#${i} ${m.date} ${alias.get(m.sender)}: ${m.text.replace(/\n/g, " ")}`).join("\n");
    const out = await aiJson<{ mentions: { i: number; provider_name: string; category: string; sentiment: string; paraphrase: string; location: string | null; self_promo: boolean }[] }>(
      `You read a parents' group chat and extract every mention where a provider, business, or brand is recommended or warned against.
Rules:
- A question with no opinion ("Has anyone tried X?") is NOT a mention. Pure thanks/"+1" without naming a provider counts only if it clearly refers to a provider named in the immediately preceding message; then use that provider's name.
- One message may mention several providers; output one item per provider.
- provider_name: the name exactly as written (e.g. "Dr. Kim", "the dentist on Church St").
- category: one of ${CATEGORIES.join(", ")}.
- sentiment: positive, negative, or mixed.
- paraphrase: one short neutral sentence (max 20 words) describing what was said about the provider. ${PRIVACY}
- location: neighborhood/street if mentioned, else null.
- self_promo: true if the sender appears to be promoting their own business ("my studio", "shameless plug").
- i: the message number.`,
      lines, "mentions",
      { type: "object", additionalProperties: false, required: ["mentions"], properties: { mentions: { type: "array", items: {
        type: "object", additionalProperties: false, required: ["i", "provider_name", "category", "sentiment", "paraphrase", "location", "self_promo"],
        properties: { i: { type: "integer" }, provider_name: { type: "string" }, category: { type: "string", enum: [...CATEGORIES] },
          sentiment: { type: "string", enum: ["positive", "negative", "mixed"] }, paraphrase: { type: "string" },
          location: { type: ["string", "null"] }, self_promo: { type: "boolean" } } } } } },
    );
    const rows = [];
    for (const m of out.mentions) {
      const src = data.messages[m.i];
      if (!src) continue;
      rows.push({
        neighborhood_id: data.neighborhoodId, upload_id: data.uploadId,
        sender_hash: await hashSender(data.neighborhoodId, src.sender),
        raw_name: m.provider_name.slice(0, 200), category: m.category, location: m.location,
        mentioned_at: src.date, sentiment: m.sentiment, paraphrase: m.paraphrase.slice(0, 300), self_promo: m.self_promo,
      });
    }
    if (rows.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { error } = await supabaseAdmin.from("mentions").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { found: rows.length };
  });

export const finalizeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { neighborhoodId: string; uploadId: string }) =>
    z.object({ neighborhoodId: z.string().uuid(), uploadId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, data.neighborhoodId);
    const { aiJson } = await import("./ai.server");
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const nb = data.neighborhoodId;
    const { data: pending } = await db.from("mentions").select("id, raw_name, category, location, paraphrase").eq("upload_id", data.uploadId).is("provider_id", null);
    const { data: existing } = await db.from("providers").select("id, name, aliases, category").eq("neighborhood_id", nb);
    const names = [...new Set((pending ?? []).map((m) => m.raw_name))];
    if (!names.length) {
      await db.from("uploads").update({ status: "done", recommendations_found: 0 }).eq("id", data.uploadId);
      return { recommendations: 0, mentions: 0 };
    }
    const nameInfo = names.map((n) => {
      const ms = (pending ?? []).filter((m) => m.raw_name === n);
      return `- "${n}" [${ms[0]?.category}] ${ms[0]?.location ?? ""} :: ${ms.slice(0, 3).map((m) => m.paraphrase).join(" | ")}`;
    }).join("\n");
    const existingInfo = (existing ?? []).map((p) => `- id=${p.id} "${p.name}" aka ${JSON.stringify(p.aliases)} [${p.category}]`).join("\n") || "(none)";
    const groups = await aiJson<{ groups: { canonical_name: string; raw_names: string[]; category: string; location: string | null; existing_id: string | null; uncertain_with: string | null; reason: string }[] }>(
      `Group provider names that refer to the same provider (e.g. "Dr. Kim", "Golden Gate Pediatrics", "GG Peds" when context shows Dr. Kim works there; "the dentist on Church St" and "Smile Bright Kids").
Only group when confident. Every raw name must appear in exactly one group.
canonical_name: the clearest full business/brand name (a person's professional name like "Dr. Sarah Kim" is fine for a practitioner).
existing_id: id of an existing provider this group confidently matches, else null.
uncertain_with: if a group MIGHT be the same as another group's canonical_name or an existing id but you're not confident, put that canonical_name or id here; else null. reason: short why.`,
      `New names:\n${nameInfo}\n\nExisting providers:\n${existingInfo}`, "groups",
      { type: "object", additionalProperties: false, required: ["groups"], properties: { groups: { type: "array", items: {
        type: "object", additionalProperties: false, required: ["canonical_name", "raw_names", "category", "location", "existing_id", "uncertain_with", "reason"],
        properties: { canonical_name: { type: "string" }, raw_names: { type: "array", items: { type: "string" } }, category: { type: "string", enum: [...CATEGORIES] },
          location: { type: ["string", "null"] }, existing_id: { type: ["string", "null"] }, uncertain_with: { type: ["string", "null"] }, reason: { type: "string" } } } } } },
    );
    const byCanon = new Map<string, string>();
    const touched = new Set<string>();
    const existingIds = new Set((existing ?? []).map((p) => p.id));
    for (const g of groups.groups) {
      let pid = g.existing_id && existingIds.has(g.existing_id) ? g.existing_id : null;
      const others = g.raw_names.filter((n) => n !== g.canonical_name);
      if (pid) {
        const ex = existing!.find((p) => p.id === pid)!;
        const aliases = [...new Set([...ex.aliases, ...g.raw_names].filter((n) => n.toLowerCase() !== ex.name.toLowerCase()))];
        await db.from("providers").update({ aliases }).eq("id", pid);
      } else {
        const { data: created, error } = await db.from("providers").insert({
          neighborhood_id: nb, name: g.canonical_name, aliases: others, category: g.category as never, location: g.location, status: "needs_review",
        }).select("id").single();
        if (error) throw new Error(error.message);
        pid = created.id;
      }
      byCanon.set(g.canonical_name, pid);
      touched.add(pid);
      const ids = (pending ?? []).filter((m) => g.raw_names.includes(m.raw_name)).map((m) => m.id);
      if (ids.length) await db.from("mentions").update({ provider_id: pid }).in("id", ids);
    }
    for (const g of groups.groups) {
      if (!g.uncertain_with) continue;
      const a = byCanon.get(g.canonical_name);
      const b = existingIds.has(g.uncertain_with) ? g.uncertain_with : byCanon.get(g.uncertain_with);
      if (a && b && a !== b) await db.from("match_suggestions").insert({ neighborhood_id: nb, provider_a: a, provider_b: b, reason: g.reason });
    }
    for (const id of touched) await db.rpc("recompute_provider", { _p: id });
    await writeSummaries(db, [...touched]);
    const { count } = await db.from("mentions").select("id", { count: "exact", head: true }).eq("upload_id", data.uploadId);
    await db.from("uploads").update({ status: "done", recommendations_found: touched.size }).eq("id", data.uploadId);
    return { recommendations: touched.size, mentions: count ?? 0 };
  });

async function writeSummaries(db: any, ids: string[]) {
  if (!ids.length) return;
  const { aiJson } = await import("./ai.server");
  const { data: provs } = await db.from("providers").select("id, name, category").in("id", ids);
  const { data: ms } = await db.from("mentions").select("provider_id, sentiment, paraphrase, mentioned_at, self_promo").in("provider_id", ids);
  const input = (provs ?? []).map((p: any) => `id=${p.id} ${p.name} [${p.category}]\n` +
    (ms ?? []).filter((m: any) => m.provider_id === p.id && !m.self_promo).map((m: any) => `  (${m.mentioned_at.slice(0, 7)}, ${m.sentiment}) ${m.paraphrase}`).join("\n")).join("\n\n");
  const out = await aiJson<{ summaries: { id: string; summary: string }[] }>(
    `For each provider write a fair two-sentence summary of what parents said, reflecting the balance of positive and negative opinions and noting if views changed over time. ${PRIVACY} Never say "parents named X". Don't mention counts.`,
    input, "summaries",
    { type: "object", additionalProperties: false, required: ["summaries"], properties: { summaries: { type: "array", items: {
      type: "object", additionalProperties: false, required: ["id", "summary"], properties: { id: { type: "string" }, summary: { type: "string" } } } } } },
  );
  for (const s of out.summaries) if (ids.includes(s.id)) await db.from("providers").update({ summary: s.summary }).eq("id", s.id);
}

export const mergeProviders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { keepId: string; mergeId: string }) => z.object({ keepId: z.string().uuid(), mergeId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows } = await context.supabase.from("providers").select("id, neighborhood_id, name, aliases").in("id", [data.keepId, data.mergeId]);
    const keep = rows?.find((r) => r.id === data.keepId), drop = rows?.find((r) => r.id === data.mergeId);
    if (!keep || !drop || keep.neighborhood_id !== drop.neighborhood_id) throw new Error("Providers not found");
    await assertAdmin(context.supabase, keep.neighborhood_id);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const aliases = [...new Set([...keep.aliases, drop.name, ...drop.aliases])].filter((a) => a !== keep.name);
    await db.from("mentions").update({ provider_id: keep.id }).eq("provider_id", drop.id);
    await db.from("flags").update({ provider_id: keep.id }).eq("provider_id", drop.id);
    await db.from("match_suggestions").update({ status: "merged" }).or(`provider_a.eq.${drop.id},provider_b.eq.${drop.id}`);
    await db.from("providers").update({ aliases }).eq("id", keep.id);
    await db.from("providers").delete().eq("id", drop.id);
    await db.rpc("recompute_provider", { _p: keep.id });
    await writeSummaries(db, [keep.id]);
    return { ok: true };
  });

export const splitProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { providerId: string; alias: string }) => z.object({ providerId: z.string().uuid(), alias: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: p } = await context.supabase.from("providers").select("*").eq("id", data.providerId).single();
    if (!p) throw new Error("Not found");
    await assertAdmin(context.supabase, p.neighborhood_id);
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await db.from("providers").insert({
      neighborhood_id: p.neighborhood_id, name: data.alias, category: p.category, location: p.location, status: "needs_review",
    }).select("id").single();
    if (error) throw new Error(error.message);
    await db.from("mentions").update({ provider_id: created.id }).eq("provider_id", p.id).eq("raw_name", data.alias);
    await db.from("providers").update({ aliases: p.aliases.filter((a: string) => a !== data.alias) }).eq("id", p.id);
    for (const id of [p.id, created.id]) await db.rpc("recompute_provider", { _p: id });
    await writeSummaries(db, [p.id, created.id]);
    return { newId: created.id };
  });
