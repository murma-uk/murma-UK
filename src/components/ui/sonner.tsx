import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast font-body group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:border-[1.5px] group-[.toaster]:border-border group-[.toaster]:shadow-card-hover group-[.toaster]:rounded-md",
          title: "font-heading font-bold uppercase tracking-[0.04em] text-sm",
          description: "group-[.toast]:text-muted-foreground font-mono text-xs",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
