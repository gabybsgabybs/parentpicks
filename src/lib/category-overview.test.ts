import { describe, expect, it } from "vitest";
import { categorySummary, cleanQuote, groupedCategories, isRecommendation, pickTop, score, sortCategoryItems } from "./category-overview";

const p = (id: string, positive: number, negative: number, parent_count = positive + negative, category = "swim") => ({ id, name: id, category, positive, negative, parent_count });

describe("category overview rules", () => {
  it("score is positive minus negative", () => { expect(score(p("a", 7, 2))).toBe(5); });
  it("top pick is the highest score among items with 2+ positives", () => {
    expect(pickTop([p("a", 9, 6), p("b", 4, 0), p("c", 1, 0)])?.id).toBe("b");
  });
  it("falls back to the highest positive count when nobody has 2+ positives", () => {
    expect(pickTop([p("a", 1, 0), p("b", 0, 1)])?.id).toBe("a");
  });
  it("never calls a split most-mentioned item the top pick and labels it split", () => {
    const s = categorySummary("swim", [p("loud", 3, 3, 10), p("quiet", 2, 0)]);
    expect(s.top?.id).toBe("quiet");
    expect(s.split?.id).toBe("loud");
  });
  it("leaves items with no positive or negative answers out of the grid", () => {
    expect(categorySummary("swim", [p("thin", 0, 0, 5), p("ok", 2, 0)]).count).toBe(1);
    expect(groupedCategories([p("thin", 0, 0, 5, "camps")])).toHaveLength(0);
  });
  it("counts recommendations as items with at least one positive", () => {
    expect([p("a", 1, 0), p("b", 0, 2), p("c", 0, 0)].filter(isRecommendation)).toHaveLength(1);
  });
  it("sorts category items by score by default", () => {
    expect(sortCategoryItems([p("a", 3, 3, 9), p("b", 4, 0)], "score").map((x) => x.id)).toEqual(["b", "a"]);
    expect(sortCategoryItems([p("a", 3, 3, 9), p("b", 4, 0)], "mentions").map((x) => x.id)).toEqual(["a", "b"]);
  });
  it("strips wrapping quotes from reviews", () => { expect(cleanQuote("'We love Dr Kelly'")).toBe("We love Dr Kelly"); });
});
