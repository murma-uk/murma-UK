import { cn } from "@/lib/utils";
import LogoMark from "./LogoMark";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "dark" | "light" | "muted";
  withMark?: boolean;
}

const sizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl md:text-6xl",
};

const markPxMap = {
  sm: 22,
  md: 30,
  lg: 44,
  xl: 72,
};

/**
 * Murma UK — Wordmark (v2)
 * "Murma UK" set in Bricolage Grotesque SemiBold, mixed-case, tightly
 * tracked, with the "UK" in signal green. Optional cresting-arc mark
 * alongside.
 */
export default function Wordmark({
  className,
  size = "md",
  tone = "dark",
  withMark = false,
}: WordmarkProps) {
  const toneClass =
    tone === "light" ? "text-page" : tone === "muted" ? "text-text-lo" : "text-foreground";
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {withMark && <LogoMark variant="light" size={markPxMap[size]} />}
      <span
        className={cn(
          "font-heading font-semibold tracking-[-0.02em] leading-none whitespace-nowrap",
          sizeMap[size],
          toneClass,
        )}
      >
        <span className="text-primary">MURMA</span>
      </span>
    </span>
  );
}
