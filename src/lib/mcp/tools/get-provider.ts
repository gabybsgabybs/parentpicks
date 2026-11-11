import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";
import { PROVIDER_FIELDS, MIN_PARENTS, toProviderJson, fail, DISCLAIMER } from "../shared";

export default defineTool({
  name: "get_recommendation",
  title: "Get recommendation details",
  description: "Get one place's details, contact info and anonymous parent comments by its id.",
  inputSchema: { id: z.string().uuid().describe("Place id from search_recommendations.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    const db = supabaseForUser(ctx);
    const { data: p, error } = await db.from("providers").select(PROVIDER_FIELDS)
      .eq("id", id).eq("status", "published").gte("parent_count", MIN_PARENTS).maybeSingle();
    if (error) fail(error.message);
    if (!p) fail("Place not found.");
    const { data: m } = await db.from("mentions").select("paraphrase, sentiment, mentioned_at")
      .eq("provider_id", id).order("mentioned_at", { ascending: false }).limit(30);
    const comments = (m ?? []).map((x) => ({ by: "A parent", comment: x.paraphrase, sentiment: x.sentiment, month: x.mentioned_at.slice(0, 7) }));
    const provider = toProviderJson(p);
    const text = `${provider.name} — ${provider.parents_recommending} parents\n${provider.summary}\n\n` +
      comments.map((c) => `A parent (${c.month}): ${c.comment}`).join("\n") + `\n\n${DISCLAIMER}`;
    return { content: [{ type: "text", text }], structuredContent: { provider, comments } };
  },
});
