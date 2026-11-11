import { z } from "zod";

const ids = {
  neighborhoodId: z.string().uuid(),
  providerId: z.string().uuid(),
  mentionId: z.string().uuid(),
};

export const reviewMutationSchema = z.discriminatedUnion("action", [
  z.object({ ...ids, action: z.literal("delete") }),
  z.object({ ...ids, action: z.literal("update"), paraphrase: z.string().trim().min(1).max(4000), sentiment: z.enum(["positive", "negative", "mixed"]) }),
]);

export function requireReviewAdmin(isAdmin: boolean) {
  if (!isAdmin) throw new Error("Only group admins can manage reviews");
}