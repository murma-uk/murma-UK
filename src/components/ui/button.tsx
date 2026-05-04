import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-heading font-bold uppercase tracking-[0.08em] ring-offset-background transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.25)] hover:-translate-y-px hover:shadow-[0_4px_16px_hsl(var(--primary)/0.35)] hover:bg-primary/95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_2px_8px_hsl(var(--destructive)/0.2)] hover:-translate-y-px hover:shadow-[0_4px_16px_hsl(var(--destructive)/0.3)]",
        demand:
          "bg-accent text-accent-foreground shadow-[0_2px_8px_hsl(var(--accent)/0.2)] hover:-translate-y-px hover:shadow-[0_4px_16px_hsl(var(--accent)/0.3)]",
        civic:
          "bg-civic text-civic-foreground hover:-translate-y-px hover:shadow-[0_4px_16px_hsl(var(--civic)/0.3)]",
        outline:
          "border-[1.5px] border-border-mid bg-transparent text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "bg-transparent text-foreground hover:bg-primary/5 hover:text-primary",
        link:
          "text-primary underline-offset-4 hover:underline normal-case tracking-normal font-body font-medium",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm: "h-8 px-3.5 text-[11px]",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
