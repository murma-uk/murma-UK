import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "dark" | "light" | "muted";
}

const sizeMap = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-3xl",
  xl: "text-5xl md:text-6xl",
};

export default function Wordmark({ className, size = "md", tone = "dark" }: WordmarkProps) {
  const toneClass =
    tone === "light" ? "text-page" : tone === "muted" ? "text-text-lo" : "text-foreground";
  return (
    <span
      className={cn(
        "font-display tracking-[0.1em] leading-none whitespace-nowrap",
        sizeMap[size],
        toneClass,
        className,
      )}
    >
      HEY! <span className="text-primary">OPEN</span> UP
    </span>
  );
}
