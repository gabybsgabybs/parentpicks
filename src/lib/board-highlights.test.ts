import { describe, expect, it } from "vitest";
import { categoryHighlights } from "./board-highlights";

describe("board category highlights", () => {
  it("shows at most 8 categories, selecting each category's most recommended provider", () => {
    const providers = Array.from({ length: 12 }, (_, i) => ({ id: String(i), category: `category-${i}`, positive: i + 1, parent_count: i + 2 }));
    providers.push({ id: "winner", category: "category-11", positive: 20, parent_count: 21 });
    const highlights = categoryHighlights(providers);
    expect(highlights).toHaveLength(8);
    expect(new Set(highlights.map((p) => p.category)).size).toBe(8);
    expect(highlights[0].id).toBe("winner");
    expect(highlights.map((p) => p.category)).toEqual(["category-11", "category-10", "category-9", "category-8", "category-7", "category-6", "category-5", "category-4"]);
    expect(categoryHighlights(providers.slice(0, 3))).toHaveLength(3);
  });
});