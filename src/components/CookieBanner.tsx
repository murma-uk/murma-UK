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
      className="accent-strip accent-strip-civic fixed bottom-0 left-0 right-0 z-[1000] border-t-[1.5px] border-border bg-popover/95 shadow-card-hover backdrop-blur-md"
    >
      <div className="container flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-md bg-civic/10 text-civic sm:flex">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="font-body text-sm text-muted-foreground">
            We use only essential cookies to keep you signed in. We do not use tracking or
            advertising cookies. Read our{" "}
            <Link to="/privacy" className="font-medium text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
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
