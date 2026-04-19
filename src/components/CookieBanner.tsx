import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "houp-cookie-consent";

export type ConsentValue = "accepted" | "rejected";

export function getStoredConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "accepted" || v === "rejected" ? v : null;
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentValue | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(getStoredConsent());
  }, []);

  const setChoice = (choice: ConsentValue) => {
    localStorage.setItem(STORAGE_KEY, choice);
    setConsent(choice);
  };

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[1000] border-t border-border bg-card/95 backdrop-blur-md shadow-lg"
    >
      <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Cookie className="h-5 w-5 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">
            We use only essential cookies to keep you signed in. We do not use tracking or
            advertising cookies. Read our{" "}
            <Link to="/privacy" className="font-medium text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setChoice("rejected")}>
            Reject non-essential
          </Button>
          <Button size="sm" onClick={() => setChoice("accepted")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
