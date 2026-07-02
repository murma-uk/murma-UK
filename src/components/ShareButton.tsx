import { useState } from "react";
import { Share2, Copy, Mail, MessageCircle, Facebook, Twitter, MoreHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { buildRequestPath } from "@/lib/slug";
import { supabase } from "@/integrations/supabase/client";

interface ShareButtonProps {
  id: string;
  slug?: string | null;
  title: string;
  description?: string | null;
  variant?: "full" | "icon";
  onShared?: () => void;
}

export default function ShareButton({ id, slug, title, description, variant = "full", onShared }: ShareButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = `${typeof window !== "undefined" ? window.location.origin : ""}${buildRequestPath(id, slug)}`;
  const shareText = `${title} — Murma`;
  const canNativeShare = typeof navigator !== "undefined" && typeof (navigator as any).share === "function";

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const trackShare = () => {
    supabase.rpc("increment_request_share", { _request_id: id }).then(() => onShared?.());
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Link copied", description: "Share it anywhere you like." });
      setTimeout(() => setCopied(false), 1500);
      trackShare();
    } catch {
      toast({ title: "Couldn't copy", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const openWindow = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
    trackShare();
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWindow(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`);
  };

  const handleFacebook = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  };

  const handleTwitter = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`);
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    const body = `${description ? description.slice(0, 280) + "\n\n" : ""}${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    setOpen(false);
    trackShare();
  };

  const handleNative = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await (navigator as any).share({ title, text: shareText, url });
      setOpen(false);
      trackShare();
    } catch {
      // user cancelled
    }
  };

  const trigger =
    variant === "icon" ? (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={stop}
        aria-label="Share request"
      >
        <Share2 className="h-3.5 w-3.5" />
      </Button>
    ) : (
      <Button
        type="button"
        variant="outline"
        className="gap-2 font-heading font-medium"
        onClick={stop}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    );

  const Item = ({
    onClick,
    icon,
    label,
    color,
  }: {
    onClick: (e: React.MouseEvent) => void;
    icon: React.ReactNode;
    label: string;
    color?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent/10"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-muted" style={color ? { color } : undefined}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-60 p-1.5"
        onClick={stop}
      >
        <Item
          onClick={handleCopy}
          icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          label={copied ? "Copied!" : "Copy link"}
        />
        <Item
          onClick={handleWhatsApp}
          icon={<MessageCircle className="h-4 w-4" />}
          label="WhatsApp"
          color="hsl(142 70% 40%)"
        />
        <Item
          onClick={handleFacebook}
          icon={<Facebook className="h-4 w-4" />}
          label="Facebook"
          color="hsl(221 44% 41%)"
        />
        <Item
          onClick={handleTwitter}
          icon={<Twitter className="h-4 w-4" />}
          label="X (Twitter)"
          color="hsl(203 89% 53%)"
        />
        <Item
          onClick={handleEmail}
          icon={<Mail className="h-4 w-4" />}
          label="Email"
        />
        {canNativeShare && (
          <Item
            onClick={handleNative}
            icon={<MoreHorizontal className="h-4 w-4" />}
            label="More…"
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
