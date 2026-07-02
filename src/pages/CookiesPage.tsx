import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

export default function CookiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEO
        title="Cookie Policy — Murma"
        description="Which cookies and storage technologies Murma uses, and how to manage your choices."
        path="/cookies"
      />
      <Navbar />
      <main className="container max-w-3xl py-12">
        <h1 className="font-heading text-4xl font-bold mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString("en-GB")}</p>

        <div className="space-y-6 text-foreground">
          <section>
            <p className="text-muted-foreground">
              This page explains the cookies and similar storage technologies used by Murma,
              in line with the UK GDPR and the Privacy and Electronic Communications Regulations
              (PECR).
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">Strictly necessary</h2>
            <p className="text-muted-foreground mb-2">
              These are required for the site to function and cannot be disabled. They do not require
              your consent under PECR.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li><strong>Authentication tokens</strong> — keep you signed in (stored in browser local storage by our backend).</li>
              <li><strong>Consent preference</strong> (<code>houp-cookie-consent</code>) — remembers your choice on the cookie banner.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">Analytics & advertising</h2>
            <p className="text-muted-foreground">
              We currently do <strong>not</strong> use any analytics, advertising, or third-party
              tracking cookies. If this changes, we will update this page and ask for your consent
              first.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">Third-party content</h2>
            <p className="text-muted-foreground">
              Map tiles are rendered by OpenStreetMap. Their tile servers may log standard request
              data (IP address, user agent) for the purpose of serving map tiles. See the{" "}
              <a
                href="https://wiki.osmfoundation.org/wiki/Privacy_Policy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenStreetMap privacy policy
              </a>
              .
            </p>
            <p className="text-muted-foreground mt-2">
              Address and place search is powered by Google Maps Platform (Places API). When you use
              location search, your query and approximate location are sent to Google. See the{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-primary underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold mb-2">Manage your choice</h2>
            <p className="text-muted-foreground">
              You can clear the consent banner choice by clearing your browser's site data for this
              domain. The banner will then re-appear on your next visit.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
