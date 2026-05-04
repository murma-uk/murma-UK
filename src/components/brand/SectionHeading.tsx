import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "p" | "h2" | "h3";
}

export default function SectionHeading({ children, className, as: As = "p" }: SectionHeadingProps) {
  return <As className={cn("section-heading", className)}>{children}</As>;
}
