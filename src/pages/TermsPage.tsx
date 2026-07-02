import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Terms of Service — Murma"
        description="The terms that govern your use of Murma, the community voice platform."
        path="/terms"
      />
      <Navbar />
      <main className="container max-w-3xl py-12">
        <h1 className="font-heading text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">1. Acceptance</h2>
            <p className="text-muted-foreground">
              By creating an account or using Murma, you agree to these Terms. If you do not
              agree, do not use the service. These Terms are governed by the laws of England and
              Wales.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">2. Eligibility</h2>
            <p className="text-muted-foreground">
              You must be at least 13 years old to use this service. By signing up you confirm the
              information you provide is accurate.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">3. User content</h2>
            <p className="text-muted-foreground">
              You retain ownership of content you submit. You grant us a non-exclusive, royalty-free
              licence to host, display, and distribute your content as part of the service. You are
              responsible for the legality of your content and must not post material that is
              defamatory, infringes intellectual property, harasses others, or breaches UK law.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">4. Acceptable use</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>No spam, scraping, or automated abuse.</li>
              <li>No content that is unlawful under UK law (Online Safety Act 2023, Equality Act 2010, Defamation Act 2013, Malicious Communications Act 1988).</li>
              <li>No impersonation of businesses, authorities, or other users.</li>
              <li>Respect the rights and dignity of others.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">5. Moderation</h2>
            <p className="text-muted-foreground">
              We may remove content or suspend accounts that breach these Terms. We comply with the
              UK Online Safety Act and will act on illegal content notifications.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">6. Disclaimer</h2>
            <p className="text-muted-foreground">
              The service is provided "as is" without warranties. Business and location data may be
              sourced from open data (e.g. OpenStreetMap) and is not guaranteed to be accurate or
              up-to-date.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">7. Liability</h2>
            <p className="text-muted-foreground">
              To the extent permitted by law, our liability is limited to direct damages and capped
              at £100. Nothing in these Terms excludes liability for death, personal injury caused
              by negligence, or fraud.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">8. Termination</h2>
            <p className="text-muted-foreground">
              You may delete your account at any time. We may suspend or terminate accounts that
              breach these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">9. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:murma@atomicmail.io" className="text-primary underline">
                murma@atomicmail.io
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
