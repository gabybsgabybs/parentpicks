import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import village from "@/assets/village-meadow.jpg";
import catPediatricians from "@/assets/cat-pediatricians.jpg";
import catActivities from "@/assets/cat-activities.jpg";
import catRestaurants from "@/assets/cat-restaurants.jpg";
import catPreschools from "@/assets/cat-preschools.jpg";
import { Heart, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const sampleCategories = [
  { name: "Pediatricians", image: catPediatricians },
  { name: "Activities", image: catActivities },
  { name: "Kid-friendly restaurants", image: catRestaurants },
  { name: "Preschools", image: catPreschools },
];

const sampleReviews = [
  { category: "Pediatricians", note: "Parents appreciate a calm, attentive approach and having their questions taken seriously." },
  { category: "Activities", note: "A welcoming class with patient instructors. Several parents would happily return." },
  { category: "Kid-friendly restaurants", note: "An easygoing spot for a family meal, though parents mention that weekends can get busy." },
];

const faqs = [
  { question: "Who can see our group's recommendations?", answer: "Your group's board is for signed-in members who have joined with its invite code. The public examples on this page are illustrative, not excerpts from a private chat." },
  { question: "Are the reviews anonymized?", answer: "Yes. Every review is anonymized: no parent names, initials or phone numbers are shown, and each note is simply attributed to ‘A parent’. Notes are paraphrased, not quoted, and children's names, ages and health details are left out." },
  { question: "Are these independent parent reviews?", answer: "Recommendations come from conversations shared by parents, not reviews written by Parent Picks or endorsements by the businesses. Suspected self-promotion can be flagged for admin review. Positive, mixed and negative experiences can all appear; being listed is not a guarantee of quality." },
  { question: "Are the reviews and contact details verified?", answer: "Recommendations as shared by parents in the group. Summaries are written by AI and may contain mistakes. Not verified. Contact details found online can also be out of date or match the wrong business, so please double-check before booking." },
];

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
      <section className="mx-auto grid max-w-6xl items-center gap-2 px-4 pb-12 pt-6 md:grid-cols-[1fr_1.25fr] md:gap-8">
        <div>
          <h1 className="font-display text-6xl leading-[0.95] md:text-7xl">
            Your village already <em className="text-primary">knows</em> the answer.
          </h1>
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">
            Years of parent recommendations from your WhatsApp local group, gathered into one board.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-full px-7 text-base"><Link to="/auth">Enter the village</Link></Button>
        </div>
        <img src={village} alt="A tiny clay village park with parents and children walking, a playground, pond and corner café" width={1600} height={1008} className="village-fade w-full object-contain mix-blend-multiply" />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-4xl md:text-5xl">Reviews where they matter most</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {sampleCategories.map(({ name, image }) => (
            <Link key={name} to="/auth" className="group rounded-lg bg-card p-3 text-center transition-transform hover:-translate-y-1">
              <img src={image} alt="" loading="lazy" width={816} height={816} className="mx-auto aspect-square w-full max-w-40 object-cover mix-blend-multiply" />
              <h3 className="mt-1 font-display text-xl leading-tight">{name}</h3>
            </Link>
          ))}
        </div>
      </section>
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-display text-4xl md:text-5xl">From one parent to another</h2></div>
            <span className="text-sm text-muted-foreground">Illustrative examples · not actual reviews</span>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {sampleReviews.map((review) => (
              <article key={review.category} className="rounded-lg border border-border bg-background p-6">
                <div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wide text-primary">{review.category}</span><MessageCircle className="size-5 shrink-0 text-primary/60" strokeWidth={1.5} /></div>
                <p className="mt-5 text-base leading-relaxed">{review.note}</p>
                <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Heart className="size-4" />A parent · sample summary</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-[0.8fr_1.2fr]">
        <div><h2 className="font-display text-4xl md:text-5xl">Frequently asked questions</h2><p className="mt-4 max-w-xs text-muted-foreground">Your conversations stay personal. The helpful bits bring us together.</p></div>
        <Accordion type="single" collapsible>
          {faqs.map((faq, i) => <AccordionItem key={faq.question} value={`faq-${i}`}><AccordionTrigger className="gap-4 py-5 text-base">{faq.question}</AccordionTrigger><AccordionContent className="text-base leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem>)}
        </Accordion>
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-6 text-sm text-muted-foreground"><span className="font-display text-xl text-foreground">Parent Picks</span><span>It takes a village.</span></footer>
    </div>
  );
}
