import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import village from "@/assets/village-meadow.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Parent Picks — your parents' group recommendations, organized" },
      { name: "description", content: "Turn years of WhatsApp recommendations into a searchable board of pediatricians, dentists, classes and more." },
      { property: "og:title", content: "Parent Picks" },
      { property: "og:description", content: "Turn years of WhatsApp recommendations into a searchable board." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-6 flex items-center">
        <span className="grid size-9 place-items-center rounded-lg bg-marigold font-display text-xl font-extrabold">P</span>
        <span className="ml-2 font-display text-xl font-extrabold">Parent Picks</span>
        <Button asChild variant="ghost" className="ml-auto"><Link to="/auth">Sign in</Link></Button>
      </div>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-24 pt-6 md:grid-cols-[1fr_1.25fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">It takes a village</p>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] md:text-7xl">
            Your village already <em className="text-primary">knows</em> the answer.
          </h1>
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">
            Years of parent recommendations from your WhatsApp group, gathered into one calm board.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-full px-7 text-base"><Link to="/auth">Enter the village</Link></Button>
        </div>
        <img src={village} alt="A tiny clay village park with parents and children walking, a playground, pond and corner café" width={1600} height={1008} className="village-fade w-full mix-blend-multiply" />
      </section>
    </div>
  );
}
