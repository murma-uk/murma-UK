import { cn } from "@/lib/utils";

export default function BrickStripe({ className }: { className?: string }) {
  return <div className={cn("brick-stripe", className)} aria-hidden />;
}
