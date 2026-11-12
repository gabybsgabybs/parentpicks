import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STOP = new Set("the and for with that this what where who any near best good kid kids child baby our your have has are can you recommend recommendations looking need want some about from into does anyone know place places".split(" "));

export const askVillage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ neighborhoodId: z.string().uuid(), question: z.string().trim().min(2).max(1000) }).parse(d))
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: member } = await db.rpc("is_member", { _nb: data.neighborhoodId });
    if (!member) throw new Error("You're not a member of this group");

    const { data: hist } = await db.from("village_chat").select("role, content")
      .eq("user_id", context.userId).eq("neighborhood_id", data.neighborhoodId)
      .order("created_at", { ascending: false }).limit(12);
    const history = (hist ?? []).reverse();

    // Retrieve candidate places using words from the question (+ last user turn for follow-ups).
    const lastUser = [...history].reverse().find((h) => h.role === "user")?.content ?? "";
    const words = Array.from(new Set(`${data.question} ${lastUser}`.toLowerCase().match(/[a-z]{3,}/g) ?? []))
      .filter((w) => !STOP.has(w)).slice(0, 10).map((w) => w.replace(/s$/, ""));
    let places: any[] = [];
    if (words.length) {
      const or = words.flatMap((w) => [`name.ilike.%${w}%`, `summary.ilike.%${w}%`, `category.ilike.%${w}%`]).join(",");
      const { data: rows } = await db.from("providers").select("id, name, category, summary, location, parent_count, positive, negative, mixed, website, phone")
        .eq("neighborhood_id", data.neighborhoodId).eq("status", "published").gte("parent_count", 2).or(or).limit(80);
      places = (rows ?? []).map((p) => {
        const hay = `${p.name} ${p.category} ${p.summary}`.toLowerCase();
        return { ...p, _s: words.filter((w) => hay.includes(w)).length * 10 + p.parent_count };
      }).sort((a, b) => b._s - a._s).slice(0, 12);
    }
    const ids = places.map((p) => p.id);
    const { data: ms } = ids.length
      ? await db.from("mentions").select("provider_id, paraphrase").in("provider_id", ids).limit(200)
      : { data: [] as { provider_id: string | null; paraphrase: string }[] };
    const context_ = places.map((p) => {
      const q = (ms ?? []).filter((m) => m.provider_id === p.id).slice(0, 4).map((m) => `  - A parent: ${m.paraphrase}`).join("\n");
      return `[${p.id}] ${p.name} (${p.category}${p.location ? `, ${p.location}` : ""}) — ${p.parent_count} parents (${p.positive} positive, ${p.negative} negative, ${p.mixed} mixed). ${p.summary}\n${q}`;
    }).join("\n\n") || "(no matching places found)";

    const { aiJson } = await import("./ai.server");
    const convo = history.map((h) => `${h.role === "user" ? "Parent" : "Assistant"}: ${h.content}`).join("\n");
    const out = await aiJson<{ answer: string; place_ids: string[] }>(
      `You are "Ask the Village", a warm, concise helper for San Francisco parents. Answer ONLY using the PLACES list below, which comes from recommendations shared in local parent groups. Never invent places or facts. If nothing fits, say so kindly and suggest asking the group. Decline anything unrelated to parent recommendations in SF. Never mention names of parents; refer to them as "a parent" or "parents". Use short markdown (bold place names, brief bullets). Put the ids of places you mention in place_ids.`,
      `PLACES:\n${context_}\n\nCONVERSATION SO FAR:\n${convo || "(none)"}\n\nNEW QUESTION: ${data.question}`,
      "village_answer",
      { type: "object", additionalProperties: false, required: ["answer", "place_ids"], properties: { answer: { type: "string" }, place_ids: { type: "array", items: { type: "string" } } } },
    );
    const placeIds = out.place_ids.filter((id) => ids.includes(id));
    const { error } = await db.from("village_chat").insert([
      { user_id: context.userId, neighborhood_id: data.neighborhoodId, role: "user", content: data.question, place_ids: [] },
      { user_id: context.userId, neighborhood_id: data.neighborhoodId, role: "assistant", content: out.answer, place_ids: placeIds },
    ]);
    if (error) throw new Error(error.message);
    return { answer: out.answer, places: places.filter((p) => placeIds.includes(p.id)).map((p) => ({ id: p.id as string, name: p.name as string })) };
  });
