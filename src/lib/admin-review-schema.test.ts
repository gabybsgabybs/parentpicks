import { describe, expect, it } from "vitest";
import { requireReviewAdmin, reviewMutationSchema } from "./admin-review-schema";

const ids = { neighborhoodId: "11111111-1111-4111-8111-111111111111", providerId: "22222222-2222-4222-8222-222222222222", mentionId: "33333333-3333-4333-8333-333333333333" };
describe("admin review management", () => {
  it("only permits group admins to manage reviews", () => {
    expect(() => requireReviewAdmin(false)).toThrow("Only group admins");
    expect(() => requireReviewAdmin(true)).not.toThrow();
  });
  it("allows removing a specific review", () => {
    expect(reviewMutationSchema.parse({ ...ids, action: "delete" }).mentionId).toBe(ids.mentionId);
    expect(reviewMutationSchema.safeParse({ ...ids, mentionId: undefined, action: "delete" }).success).toBe(false);
  });
  it("allows editing review text and sentiment but rejects blank reviews", () => {
    expect(reviewMutationSchema.parse({ ...ids, action: "update", paraphrase: "  No longer open  ", sentiment: "negative" })).toMatchObject({ paraphrase: "No longer open", sentiment: "negative" });
    expect(reviewMutationSchema.safeParse({ ...ids, action: "update", paraphrase: " ", sentiment: "negative" }).success).toBe(false);
  });
});