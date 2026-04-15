import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, ArrowBigUp, Users, Building2, Landmark } from "lucide-react";
import { CATEGORIES, type RequestCategory } from "@/lib/categories";
import Navbar from "@/components/Navbar";

const stats = [
  { label: "Active Requests", value: "—", icon: MapPin },
  { label: "Upvotes Cast", value: "—", icon: ArrowBigUp },
  { label: "Towns Covered", value: "—", icon: Building2 },
];

const audiences = [
  {
    title: "For People",
    icon: Users,
    points: [
      "Request new opening hours",
      "Ask for new branches or venues",
      "Request classes & sessions",
      "Invite artists to your town",
    ],
  },
  {
    title: "For Businesses",
    icon: Building2,
    points: [
      "Prove market demand with real signals",
      "Find where to open your next branch",
      "Understand customer needs by area",
      "Make announcements to your community",
    ],
  },
  {
    title: "For Authorities",
    icon: Landmark,
    points: [
      "See demand across towns in real-time",
      "Support investment decisions with data",
      "Understand community priorities",
      "Drive evidence-based planning",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient absolute inset-0 opacity-5" />
        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <MapPin className="h-4 w-4" />
              Community-powered demand signals
            </div>
            <h1 className="font-heading text-4xl font-bold tracking-tight md:text-6xl">
              Tell your town
              <br />
              <span className="text-primary">what you need.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Request new services, opening hours, or venues in your area.
              Upvote what matters most. Help businesses and councils make better decisions.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore">
                <Button size="lg" className="gap-2 font-heading font-semibold text-base">
                  Explore the Map
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="font-heading font-semibold text-base">
                  Get Started
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-y border-border bg-card/50">
        <div className="container py-8">
          <div className="flex flex-wrap justify-center gap-3">
            {(Object.entries(CATEGORIES) as [RequestCategory, typeof CATEGORIES[RequestCategory]][]).map(([key, cat]) => {
              const Icon = cat.icon;
              return (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium"
                  style={{ color: cat.color }}
                >
                  <Icon className="h-4 w-4" />
                  {cat.label}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="container py-20">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-heading text-3xl font-bold"
        >
          Built for everyone in the community
        </motion.h2>
        <div className="grid gap-6 md:grid-cols-3">
          {audiences.map((aud, i) => (
            <motion.div
              key={aud.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-hover rounded-xl border border-border bg-card p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <aud.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-3 font-heading text-xl font-semibold">{aud.title}</h3>
              <ul className="space-y-2">
                {aud.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="container py-16 text-center">
          <h2 className="font-heading text-2xl font-bold">Ready to shape your town?</h2>
          <p className="mt-2 text-muted-foreground">Sign up and start making requests today.</p>
          <Link to="/auth">
            <Button size="lg" className="mt-6 gap-2 font-heading font-semibold">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Hey, Open Up. UK/EU GDPR compliant.</p>
          <p className="mt-1">Your data is stored securely. We never share personal information.</p>
        </div>
      </footer>
    </div>
  );
}
