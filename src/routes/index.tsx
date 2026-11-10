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

const SAMPLE = [
  { name: "Smile Bright Kids Dental", cat: "Dentist", n: 7, b: "6 positive, 1 mixed" },
  { name: "La Petite Baleen", cat: "Classes & activities", n: 7, b: "6 positive, 1 mixed" },
  { name: "Primary", cat: "Clothing brands", n: 4, b: "3 positive, 1 mixed" },
];

function Index() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-6 flex items-center">
        <span className="grid size-9 place-items-center rounded-lg bg-marigold font-display text-xl font-extrabold">P</span>
        <span className="ml-2 font-display text-xl font-extrabold">Parent Picks</span>
        <Button asChild variant="ghost" className="ml-auto"><Link to="/auth">Sign in</Link></Button>
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <img src={village} alt="A little village meadow with parents, strollers and children playing by a stream" width={1920} height={912} className="village-fade w-full" />
      </div>
      <section className="mx-auto grid max-w-5xl gap-10 px-4 pb-20 pt-4 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary">It takes a village</p>
          <h1 className="mt-3 font-display text-6xl leading-[0.95] md:text-7xl">
            Your village already <em className="text-primary">knows</em> the answer.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            Every pediatrician, dentist and swim class your group has ever loved — Parent Picks turns years of WhatsApp chat into one board you can search — ranked by how many parents recommended each place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-base"><Link to="/auth">Sign in with your email</Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">You'll need your group's invite code — it's in the WhatsApp group description.</p>
        </div>
        <div className="space-y-3">
          {SAMPLE.map((s, i) => (
            <div key={s.name} className="kraft-card p-4" style={{ transform: `rotate(${[-1.2, 0.8, -0.4][i]}deg)` }}>
              <div className="text-xs font-bold uppercase tracking-wide text-foreground/60">{s.cat}</div>
              <div className="font-display text-xl font-extrabold">{s.name}</div>
              <div className="mt-1 text-sm"><b>{s.n} parents</b> · {s.b}</div>
            </div>
          ))}
          <p className="text-center text-xs text-muted-foreground">Example cards. No parent names are ever shown.</p>
        </div>
      </section>
    </div>
  );
}
