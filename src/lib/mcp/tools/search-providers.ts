import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";
import { PROVIDER_FIELDS, MIN_PARENTS, toProviderJson, fail, DISCLAIMER } from "../shared";

export default defineTool({
  name: "search_recommendations",
  title: "Search recommendations",
  description: "Search parent-recommended places in San Francisco by keyword and/or category, ranked by how many parents recommend them.",
  inputSchema: {
    query: z.string().max(100).optional().describe("Keywords, e.g. 'dentist' or 'swim'."),
    category: z.string().max(60).optional().describe("Category id from list_categories, e.g. 'pediatricians'."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 15)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }) => {
    const db = supabaseAnon();
    let q = db.from("providers").select(PROVIDER_FIELDS).eq("status", "published").gte("parent_count", MIN_PARENTS);
    if (category) q = q.eq("category", category);
    if (query) {
      const term = query.replace(/[%,()*]/g, " ").trim();
      if (term) q = q.or(`name.ilike.%${term}%,summary.ilike.%${term}%,category.ilike.%${term}%`);
    }
    const { data, error } = await q.order("parent_count", { ascending: false }).limit(limit ?? 15);
    if (error) fail(error.message);
    const results = (data ?? []).map(toProviderJson);
    const text = results.length
      ? results.map((r) => `• ${r.name} (${r.category_label}) — ${r.parents_recommending} parents. ${r.summary}`).join("\n") + `\n\n${DISCLAIMER}`
      : "No matching recommendations. You may not be a member of any neighborhood yet.";
    return { content: [{ type: "text", text }], structuredContent: { results } };
  },
});
