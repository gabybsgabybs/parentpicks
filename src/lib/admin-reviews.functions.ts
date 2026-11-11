import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireReviewAdmin, reviewMutationSchema } from "./admin-review-schema";

export const getAdminReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { neighborhoodId: string; providerId: string }) => z.object({ neighborhoodId: z.string().uuid(), providerId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("is_admin", { _nb: data.neighborhoodId });
    if (roleError) throw new Error(roleError.message);
    requireReviewAdmin(admin === true);
    const { data: reviews, error } = await context.supabase.from("mentions")
      .select("id, paraphrase, sentiment, mentioned_at, self_promo")
      .eq("neighborhood_id", data.neighborhoodId).eq("provider_id", data.providerId)
      .order("mentioned_at", { ascending: false });
    if (error) throw new Error(error.message);
    return reviews ?? [];
  });

export const manageAdminReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.input<typeof reviewMutationSchema>) => reviewMutationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error: roleError } = await context.supabase.rpc("is_admin", { _nb: data.neighborhoodId });
    if (roleError) throw new Error(roleError.message);
    requireReviewAdmin(admin === true);
    const { error } = await context.supabase.rpc("admin_manage_review", {
      _neighborhood: data.neighborhoodId, _provider: data.providerId, _mention: data.mentionId, _action: data.action,
      ...(data.action === "update" ? { _paraphrase: data.paraphrase, _sentiment: data.sentiment } : {}),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });