import { Link } from "react-router-dom";
import Wordmark from "@/components/brand/Wordmark";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-popover/60">
      <div className="container py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <Wordmark size="md" tone="muted" withMark />

          <nav className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
            <Link to="/explore" className="hover:text-primary transition-colors">Explore</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link to="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-text-lo md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Murma · All rights reserved</p>
          <p>Made in the UK · UK GDPR &amp; PECR compliant</p>
        </div>
      </div>
    </footer>
  );
}
