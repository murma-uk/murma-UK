import { cn } from "@/lib/utils";

interface LiveChipProps {
  children: React.ReactNode;
  className?: string;
  tone?: "signal" | "demand" | "civic" | "gate";
}

const toneClass = {
  signal: "border-primary/25 bg-primary/10 text-primary [&_.live-pip]:bg-primary",
  demand: "border-accent/25 bg-accent/10 text-accent [&_.live-pip]:bg-accent",
  civic: "border-civic/25 bg-civic/10 text-civic [&_.live-pip]:bg-civic",
  gate: "border-gate/25 bg-gate/10 text-gate [&_.live-pip]:bg-gate",
};

export default function LiveChip({ children, className, tone = "signal" }: LiveChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-medium uppercase tracking-[0.2em]",
        toneClass[tone],
        className,
      )}
    >
      <span className="live-pip" />
      {children}
    </span>
  );
}
