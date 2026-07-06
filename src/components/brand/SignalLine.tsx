import { cn } from "@/lib/utils";

/**
 * Murma UK — SignalLine (v2, replaces BrickStripe)
 * A single thin signal-green line that fades at both edges — the calm,
 * evolved successor to the old four-colour brick stripe. Sits flush at the
 * top of the navbar and page tops.
 */
export default function SignalLine({ className }: { className?: string }) {
  return <div className={cn("signal-line", className)} aria-hidden />;
}
