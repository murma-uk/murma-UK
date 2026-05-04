import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-sm border-[1.5px] border-border-mid bg-surface-2 px-3.5 py-2.5 font-mono text-sm text-foreground shadow-[0_1px_2px_hsl(45_21%_8%/0.04)] ring-offset-background transition-[border-color,box-shadow] placeholder:text-text-lo focus-visible:outline-none focus-visible:border-primary focus-visible:shadow-glow-signal disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
