import { createServerFn } from "@tanstack/react-start";
import type Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  type StripeEnv,
  createStripeClient,
  getStripeErrorMessage,
} from "@/lib/stripe.server";

type TipCheckoutResult = { clientSecret: string } | { error: string };

export const MIN_TIP_CENTS = 100;
export const MAX_TIP_CENTS = 50000;

// Look up an existing Customer by userId metadata (then by email), or create
// one. Putting userId on the Customer object is what makes later reads
// (payment history, refunds) resolvable — Session metadata is not searchable.
async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string | undefined; userId?: string | undefined },
): Promise<string> {
  // userId is interpolated into a Stripe Search query string below;
  // reject anything that could break out of the quoted value.
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    const match = found.data[0];
    if (match) return match.id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    const customer = existing.data[0];
    if (customer) {
      if (options.userId && customer.metadata?.["userId"] !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

/**
 * Opens an embedded card checkout for a one-time, voluntary tip.
 * The amount is chosen by the tipper at checkout, so there is no product or
 * price catalog behind it — the amount goes straight into the session as
 * price_data.
 */
export const createTipCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    amountInCents: number;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (
      !Number.isInteger(data.amountInCents) ||
      data.amountInCents < MIN_TIP_CENTS ||
      data.amountInCents > MAX_TIP_CENTS
    ) {
      throw new Error("Choose a tip between $1 and $500");
    }
    if (typeof data.returnUrl !== "string" || !data.returnUrl.startsWith("http")) {
      throw new Error("Invalid return address");
    }
    if (data.environment !== "sandbox" && data.environment !== "live") {
      throw new Error("Unknown payments environment");
    }
    return data;
  })
  .handler(async ({ data, context }): Promise<TipCheckoutResult> => {
    try {
      const stripe = createStripeClient(data.environment);

      // Derive the email server-side from the session — never trust a
      // caller-supplied email.
      const { data: { user } } = await context.supabase.auth.getUser();
      const customerId = await resolveOrCreateCustomer(stripe, {
        email: user?.email,
        userId: context.userId,
      });

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Tip for Parent Picks",
                // Stripe requires a tax code on the inline product. A tip is a
                // voluntary contribution, not a sale of goods or services, so
                // it is classified as a cash donation.
                tax_code: "txcd_90000001",
              },
              unit_amount: data.amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        // Surfaces as the product name in the payments dashboard.
        payment_intent_data: { description: "Tip for Parent Picks" },
        metadata: { userId: context.userId, kind: "tip" },
        // A tip is a voluntary contribution, not a sale, so it is coded as a
        // cash donation. That code is ineligible for the account's default
        // end-to-end compliance handling, so this session opts out of it.
        managed_payments: { enabled: false },
      } as Stripe.Checkout.SessionCreateParams);

      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
