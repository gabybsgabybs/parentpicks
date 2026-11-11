import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Declared locally so this client module has no cross-tree imports.
// Structurally identical to the server StripeEnv in stripe.server.ts.
export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

// Derive the environment from the token PREFIX, not its mere presence.
// A missing or unrecognized token is a configuration error: the build shipped
// before go-live finished. Never fall through to "live" — fail loudly instead.
function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Card payments are not configured for this build. " +
      "Complete payments go-live to enable checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}

/** Null when this build has no usable payments token. */
export function safeStripeEnvironment(): StripeEnv | null {
  try {
    return paymentsEnvironment();
  } catch {
    return null;
  }
}
