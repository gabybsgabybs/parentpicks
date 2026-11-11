import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import village from "@/assets/village-meadow.jpg";
import { ArrowUpRight, Baby, Heart, MessageCircle, Stethoscope, Sun, Utensils, Sprout } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const sampleCategories = [
  { name: "Pediatricians", detail: "Care for your little people", icon: Stethoscope, tone: "bg-secondary" },
  { name: "Activities", detail: "Small adventures, big smiles", icon: Sun, tone: "bg-marigold/20" },
  { name: "Kid-friendly restaurants", detail: "A place for everyone at the table", icon: Utensils, tone: "bg-accent/25" },
  { name: "Preschools", detail: "First friendships start here", icon: Sprout, tone: "bg-meadow/15" },
  { name: "Childcare", detail: "An extra pair of caring hands", icon: Baby, tone: "bg-sky/25" },
];

const sampleReviews = [
  { category: "Pediatricians", note: "Parents appreciate a calm, attentive approach and having their questions taken seriously." },
  { category: "Activities", note: "A welcoming class with patient instructors. Several parents would happily return." },
  { category: "Kid-friendly restaurants", note: "An easygoing spot for a family meal, though parents mention that weekends can get busy." },
];

const faqs = [
  { question: "Who can see our group's recommendations?", answer: "Your group's board is for signed-in members who have joined with its invite code. The public examples on this page are illustrative, not excerpts from a private chat." },
  { question: "What happens to the WhatsApp chat?", answer: "The export is parsed in your browser. The raw chat file is not stored by Parent Picks; only extracted recommendation notes are saved. Sender names are replaced before AI processing, and saved sender identifiers are hashed." },
  { question: "Will my name or my child's details appear?", answer: "No parent names, initials or personal phone numbers are displayed. Notes are attributed to ‘A parent’ and paraphrased, not quoted. Children's names, ages and health information are excluded from summaries." },
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
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">It takes a village</p>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] md:text-7xl">
            Your village already <em className="text-primary">knows</em> the answer.
          </h1>
          <p className="mt-6 max-w-sm text-lg text-muted-foreground">
            Years of parent recommendations from your WhatsApp group, gathered into one calm board.
          </p>
          <Button asChild size="lg" className="mt-8 h-12 rounded-full px-7 text-base"><Link to="/auth">Enter the village</Link></Button>
        </div>
        <img src={village} alt="A tiny clay village park with parents and children walking, a playground, pond and corner café" width={1600} height={1008} className="village-fade w-full object-contain mix-blend-multiply" />
      </section>
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-xs font-bold uppercase tracking-wide text-primary">Around the village</p>
        <h2 className="mt-3 font-display text-4xl md:text-5xl">A little help with everyday life.</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {sampleCategories.map(({ name, detail, icon: Icon, tone }) => (
            <Button key={name} asChild variant="ghost" className={`h-auto min-h-48 items-stretch whitespace-normal rounded-lg p-5 text-left ${tone}`}>
              <Link to="/auth" className="flex flex-col">
                <div className="flex w-full items-start justify-between"><Icon className="size-7 text-primary" strokeWidth={1.5} /><ArrowUpRight className="size-4 text-muted-foreground" /></div>
                <h3 className="mt-6 w-full font-display text-2xl leading-tight">{name}</h3>
                <p className="mt-2 w-full text-sm font-normal text-muted-foreground">{detail}</p>
              </Link>
            </Button>
          ))}
        </div>
      </section>
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-wide text-primary">Word of mouth</p><h2 className="mt-3 font-display text-4xl md:text-5xl">From one parent to another.</h2></div>
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
        <div><p className="text-xs font-bold uppercase tracking-wide text-primary">A village built on trust</p><h2 className="mt-3 font-display text-4xl md:text-5xl">A few good questions.</h2><p className="mt-4 max-w-xs text-muted-foreground">Your conversations stay personal. The helpful bits bring us together.</p></div>
        <Accordion type="single" collapsible>
          {faqs.map((faq, i) => <AccordionItem key={faq.question} value={`faq-${i}`}><AccordionTrigger className="gap-4 py-5 text-base">{faq.question}</AccordionTrigger><AccordionContent className="text-base leading-relaxed text-muted-foreground">{faq.answer}</AccordionContent></AccordionItem>)}
        </Accordion>
      </section>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-6 text-sm text-muted-foreground"><span className="font-display text-xl text-foreground">Parent Picks</span><span>It takes a village.</span></footer>
    </div>
  );
}
