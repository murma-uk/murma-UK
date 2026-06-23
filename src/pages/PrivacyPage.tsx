import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Privacy Policy — Murma"
        description="How Murma collects, uses, and protects your personal data under UK GDPR."
        path="/privacy"
      />
      <Navbar />
      <main className="container max-w-3xl py-12">
        <h1 className="font-heading text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">1. Who we are</h2>
            <p className="text-muted-foreground">
              Hey, Open Up ("we", "us") operates this community platform. We are the data
              controller of personal data processed via this service, in accordance with the UK GDPR
              and the Data Protection Act 2018.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">2. What data we collect</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Account data: email address, display name, hashed password.</li>
              <li>Content you submit: requests, upvotes, business links, location data (town/coordinates) you choose to attach.</li>
              <li>Technical data: minimal session data needed to keep you signed in.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We do not use advertising cookies, third-party analytics that profile users, or
              tracking pixels.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">3. Lawful basis</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Contract</strong> (Art. 6(1)(b) UK GDPR): to provide the service you sign up for.</li>
              <li><strong>Legitimate interests</strong> (Art. 6(1)(f)): platform safety, moderation, fraud prevention.</li>
              <li><strong>Consent</strong> (Art. 6(1)(a)): for any non-essential cookies (currently none).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">4. How we share data</h2>
            <p className="text-muted-foreground">
              Public content (requests, upvotes, display name) is visible to other users.
              Account data is stored on our backend infrastructure (Lovable Cloud / Supabase, EU
              region). We do not sell your personal data.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">5. Retention</h2>
            <p className="text-muted-foreground">
              We retain account data while your account is active. You may request deletion at any
              time and we will erase your account and associated personal data within 30 days,
              subject to legal obligations.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">6. Your rights</h2>
            <p className="text-muted-foreground">Under UK GDPR you have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Access your personal data</li>
              <li>Rectify inaccurate data</li>
              <li>Erase your data ("right to be forgotten")</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Lodge a complaint with the Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="text-primary underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
            </ul>
            <p className="text-muted-foreground mt-2">
              To exercise these rights, contact us via the email associated with your account.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">7. Children</h2>
            <p className="text-muted-foreground">
              This service is not intended for children under 13. We do not knowingly collect data
              from children.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">8. Changes</h2>
            <p className="text-muted-foreground">
              We will post any changes to this policy on this page and update the "Last updated"
              date.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
