import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SectionHeading from "@/components/brand/SectionHeading";
import SEO from "@/components/SEO";

export default function AboutPage() {
  const contactEmail = "murma@atomicmail.io";
  const emailSubject = "Feedback / Question about murma";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About Murma — Building Better Neighbourhoods Together"
        description="We're changing neighbourhoods, towns and cities for the better. Learn how we're building in the open with community input."
        path="/about"
      />
      <Navbar />

      {/* Hero Section */}
      <section className="border-b border-border bg-popover">
        <div className="container py-16 md:py-24">
          <h1 className="font-display text-4xl tracking-[-0.02em] md:text-5xl mb-4">
            We're changing neighbourhoods, towns and cities for the better.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
            What's different about murma? Every change starts with you—the voice of the user.
          </p>
        </div>
      </section>

      {/* Early-Stage Transparency Section */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <SectionHeading className="mb-3">Join us as we build</SectionHeading>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold mb-8 tracking-[-0.01em]">
              This is in active development. That's intentional.
            </h2>

            <div className="prose prose-sm max-w-none space-y-6 text-foreground">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                This website—and murma itself—is in active development. Things will change. Rapidly. That's intentional.
              </p>

              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                We're building in the open because we believe the best neighbourhoods, towns, and cities are shaped by the people who live in them. Your feedback, ideas, and participation aren't nice-to-haves. They're essential.
              </p>

              <div className="space-y-4 bg-card rounded-lg border border-border p-6">
                <p className="text-base md:text-lg text-foreground font-medium">
                  Have something to say?
                </p>
                <ul className="space-y-2 text-base md:text-lg text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">→</span>
                    <span>If something isn't working, tell us.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">→</span>
                    <span>If you have an idea, share it.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold">→</span>
                    <span>If you want to get involved, let's talk.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-border bg-popover/50">
        <div className="container py-16 md:py-24">
          <div className="max-w-3xl">
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4 uppercase tracking-widest">
                  Get Involved
                </p>
                <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-6">
                  Share your feedback or ask a question.
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  asChild
                >
                  <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(emailSubject)}`}>
                    Email the team
                  </a>
                </Button>
              </div>

              <p className="text-base text-muted-foreground leading-relaxed">
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-primary underline hover:text-primary/80 transition-colors"
                >
                  Have a quick question? Send us an email
                </a>
                {" "}anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
