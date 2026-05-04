import { cn } from "@/lib/utils";

export default function Pip({ className }: { className?: string }) {
  return <span className={cn("live-pip", className)} aria-hidden />;
}
