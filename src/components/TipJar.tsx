import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Heart } from "lucide-react";
import { createTipCheckout, MAX_TIP_CENTS, MIN_TIP_CENTS } from "@/lib/tip.functions";
import { getStripe, safeStripeEnvironment } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CHIPS = [500, 1000, 2500];

function toCents(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100);
}

function dollars(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
}

export function TipJar({ thanks = false }: { thanks?: boolean }) {
  const environment = safeStripeEnvironment();
  const [picked, setPicked] = useState<number | "custom">(1000);
  const [customInput, setCustomInput] = useState("");
  const [sessionCents, setSessionCents] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const openTipCheckout = useServerFn(createTipCheckout);

  const cents = picked === "custom" ? toCents(customInput) : picked;

  const checkoutOptions = useMemo(() => {
    if (sessionCents === null || environment === null) return null;
    return {
      fetchClientSecret: async (): Promise<string> => {
        const result = await openTipCheckout({
          data: {
            amountInCents: sessionCents,
            returnUrl: `${window.location.origin}/board?tip=thanks`,
            environment,
          },
        });
        if ("error" in result) {
          setError(result.error);
          throw new Error(result.error);
        }
        if (!result.clientSecret) {
          setError("Card payments did not return a checkout session.");
          throw new Error("No checkout session");
        }
        return result.clientSecret;
      },
    };
  }, [sessionCents, environment, openTipCheckout]);

  if (thanks) {
    return (
      <section className="kraft-card mt-10 flex items-start gap-4 p-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marigold/70">
          <Heart className="size-5 fill-current text-foreground" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl">Thank you — that keeps the lights on</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Your tip went through. Nothing on the board changed and nothing was
            added to your name: tips are never shown next to a recommendation.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="kraft-card mt-10 p-6">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marigold/70">
          <Heart className="size-5 fill-current text-foreground" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl">Keep the village running</h2>
          <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
            Parent Picks is one person's side project, not a company. Hosting,
            the domain and the AI that writes the summaries cost money every
            month. If this board saved you an afternoon of asking the group, a
            tip helps keep it online for everyone.
          </p>
        </div>
      </div>

      {environment === null ? (
        <p className="mt-5 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Card payments aren't available in this build yet.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setPicked(chip);
                  setError(null);
                }}
                aria-pressed={picked === chip}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  picked === chip
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-popover hover:bg-secondary"
                }`}
              >
                {dollars(chip)}
              </button>
            ))}
            <div className="relative w-28">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                $
              </span>
              <Input
                value={customInput}
                onChange={(e) => {
                  setPicked("custom");
                  setCustomInput(e.target.value);
                  setError(null);
                }}
                inputMode="decimal"
                placeholder="other"
                aria-label="Other tip amount in dollars"
                className={`h-9 rounded-full pl-7 text-sm ${
                  picked === "custom" ? "border-primary" : ""
                }`}
              />
            </div>
          </div>

          {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}

          {checkoutOptions ? (
            <div className="mt-5 rounded-xl border border-border bg-popover p-4">
              <EmbeddedCheckoutProvider stripe={getStripe()} options={checkoutOptions}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
              <button
                type="button"
                onClick={() => {
                  setSessionCents(null);
                  setError(null);
                }}
                className="mt-3 text-sm font-medium underline underline-offset-4 hover:text-foreground"
              >
                Cancel this tip
              </button>
            </div>
          ) : (
            <Button
              size="lg"
              className="mt-5 rounded-full px-7"
              disabled={cents === null || cents < MIN_TIP_CENTS || cents > MAX_TIP_CENTS}
              onClick={() => {
                if (cents === null) return;
                setError(null);
                setSessionCents(cents);
              }}
            >
              {cents === null
                ? "Enter an amount"
                : `Tip ${dollars(cents)}`}
            </Button>
          )}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Tips are one-time and optional. Paying doesn't unlock anything or
            change the board — no name, initials or payment detail is ever
            shown next to a recommendation.
          </p>
        </>
      )}
    </section>
  );
}
