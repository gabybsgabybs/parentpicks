import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";
import { MIN_PARENTS, fail } from "../shared";
import { CATEGORY_LABEL } from "@/lib/categories";

export default defineTool({
  name: "list_categories",
  title: "List categories",
  description: "List recommendation categories with how many places each has.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_a, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db.from("providers").select("category").eq("status", "published").gte("parent_count", MIN_PARENTS).limit(2000);
    if (error) fail(error.message);
    const counts = new Map<string, number>();
    for (const r of data ?? []) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
    const categories = [...counts].sort((a, b) => b[1] - a[1]).map(([id, places]) => ({ id, label: (CATEGORY_LABEL as Record<string, string>)[id] ?? id, places }));
    return { content: [{ type: "text", text: categories.map((c) => `${c.label} (${c.id}): ${c.places}`).join("\n") || "No categories yet." }], structuredContent: { categories } };
  },
});
