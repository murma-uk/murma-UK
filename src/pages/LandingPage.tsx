import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Building2, Landmark } from "lucide-react";
import { useCategories } from "@/lib/categories";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LiveChip from "@/components/brand/LiveChip";
import SectionHeading from "@/components/brand/SectionHeading";
import SEO from "@/components/SEO";

const audiences = [
  {
    title: "MURMA",
    subtitle: "For Voices",
    icon: Users,
    tone: "primary",
    points: [
      "Add your murma to things you need",
      "See what your community cares about",
      "Support ideas you love",
      "Make your town impossible to ignore",
    ],
  },
  {
    title: "Murma Signals",
    subtitle: "For Businesses",
    icon: Building2,
    tone: "accent",
    points: [
      "Buy the signal from the noise",
      "See where real demand exists",
      "Make smarter expansion decisions",
      "Hear your customers clearly",
    ],
  },
  {
    title: "Murmur Civic",
    subtitle: "For Councils",
    icon: Landmark,
    tone: "civic",
    points: [
      "See murmuration patterns in real-time",
      "Make policy grounded in evidence",
      "Understand what your community needs",
      "Plan with confidence",
    ],
  },
] as const;

export default function LandingPage() {
  const { data: categories = [] } = useCategories();
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Murma — Be Impossible to Ignore"
        description="Add your murma. See what your community needs. Help businesses and councils understand what matters. Make your voice heard."
        path="/"
      />
      <Navbar />

      {/* Hero — paste-up paper with spray stencil */}
      <section className="spray-hey border-b border-border bg-popover">
        <div className="container py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <LiveChip>Light Mode · v0.1</LiveChip>
              <span className="eyebrow">Whisper → Murma → Signal → Crescendo → Change</span>
            </div>

            <h1 className="font-display text-[clamp(52px,9vw,112px)] leading-[0.88] tracking-[0.02em] uppercase">
              Be <span className="text-primary">Impossible</span>
              <br />
              <span className="text-transparent" style={{ WebkitTextStroke: "1.5px hsl(var(--border-mid))" }}>
                TO IGNORE
              </span>
            </h1>

            <p className="mt-7 max-w-xl font-body text-lg leading-relaxed text-muted-foreground">
              Add your murma. Others add theirs. A pattern emerges. A business listens. Something opens.
              The community was heard.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore">
                <Button size="lg" className="gap-2">
                  View the Pattern
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg">
                  Add Your Murma
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 font-mono text-xs uppercase tracking-[0.15em] text-text-lo">
              <span>THE SIGNAL · Real-time</span>
              <span>·</span>
              <span>BOROUGHS · 333 UK areas</span>
              <span>·</span>
              <span>VOICES · People + Business + Council</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category strip */}
      {categories.length > 0 && (
        <section className="border-b border-border bg-card">
          <div className="container py-7">
            <SectionHeading className="mb-4">Live Categories</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = cat.Icon;
                return (
                  <span
                    key={cat.slug}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em]"
                    style={{
                      borderColor: `${cat.color}40`,
                      backgroundColor: `${cat.color}14`,
                      color: cat.color,
                    }}
                  >
                    <Icon className="h-3 w-3" />
                    {cat.label}
                  </span>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Audiences */}
      <section className="container py-20">
        <SectionHeading className="mb-3">One platform, three voices</SectionHeading>
        <h2 className="mb-12 font-display text-4xl uppercase tracking-[0.02em] md:text-5xl">
          Whisper into <span className="text-primary">Murmuration.</span>
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {audiences.map((aud, i) => {
            const accent =
              aud.tone === "accent" ? "accent" : aud.tone === "civic" ? "civic" : "primary";
            const tint =
              aud.tone === "accent"
                ? "bg-accent/10 text-accent"
                : aud.tone === "civic"
                  ? "bg-civic/10 text-civic"
                  : "bg-primary/10 text-primary";
            return (
              <motion.div
                key={aud.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`accent-strip ${accent === "accent" ? "accent-strip-demand" : accent === "civic" ? "accent-strip-civic" : ""} card-hover relative overflow-hidden rounded-md border-[1.5px] border-border bg-popover p-5 pl-6`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-md ${tint}`}>
                  <aud.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-heading text-2xl font-bold uppercase tracking-[0.04em]">{aud.title}</h3>
                <p className="mb-3 text-xs text-muted-foreground font-mono tracking-[0.08em]">{(aud as any).subtitle}</p>
                <ul className="space-y-2">
                  {aud.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <Badge variant={accent === "accent" ? "demand" : accent === "civic" ? "civic" : "open"}>
                    {accent === "civic" ? "Murmur Civic" : accent === "accent" ? "Murma Signals" : "MURMA"}
                  </Badge>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-popover">
        <div className="container py-16">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <SectionHeading className="mb-3">Be impossible to ignore</SectionHeading>
              <h2 className="font-display text-4xl uppercase tracking-[0.02em] md:text-5xl">
                Add your <span className="text-primary">murma</span> today.
              </h2>
              <p className="mt-3 max-w-md font-body text-base text-muted-foreground">
                One sentence. One minute. Free forever. Make your voice heard.
              </p>
            </div>
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Start Now
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
