import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowBigUp, MapPin, Flag } from "lucide-react";
import { useCategories, getCategory, type RequestCategory } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { buildRequestPath } from "@/lib/slug";
import ShareButton from "./ShareButton";
import FlagDialog from "./moderation/FlagDialog";

interface RequestCardProps {
  id: string;
  slug?: string | null;
  title: string;
  description: string | null;
  category: RequestCategory;
  town: string;
  upvoteCount: number;
  hasUpvoted: boolean;
  createdAt: string;
  onUpvoteChange?: () => void;
}

export default function RequestCard({
  id, slug, title, description, category, town, upvoteCount,
  hasUpvoted, createdAt, onUpvoteChange,
}: RequestCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const { data: categories } = useCategories();
  const cat = getCategory(categories, category);
  const Icon = cat.Icon;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      if (hasUpvoted) {
        await supabase.from("upvotes").delete().eq("request_id", id).eq("user_id", user.id);
      } else {
        await supabase.from("upvotes").insert({ request_id: id, user_id: user.id });
        setAnimating(true);
        setTimeout(() => setAnimating(false), 300);
      }
      onUpvoteChange?.();
    } catch {
      toast({ title: "Error", description: "Could not update vote", variant: "destructive" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="accent-strip card-hover relative cursor-pointer overflow-hidden rounded-lg border-[1.5px] border-border bg-popover p-4 pl-5"
      onClick={() => {
        console.log("Clicked murma:", { id, slug, title });
        navigate(buildRequestPath(id, slug));
      }}
    >
      <div className="flex gap-3">
        <button
          onClick={handleUpvote}
          className={`flex flex-col items-center justify-center rounded-sm border-[1.5px] px-2.5 py-1.5 transition-all ${
            hasUpvoted
              ? "border-primary bg-primary/10 text-primary"
              : "border-border-mid bg-surface-2 text-text-lo hover:border-primary hover:text-primary"
          } ${animating ? "animate-pulse-up" : ""}`}
          aria-label="Upvote"
        >
          <ArrowBigUp className="h-4 w-4" />
          <span className="font-heading font-bold text-base leading-none mt-0.5">{upvoteCount}</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
              style={{
                borderColor: `${cat.color}40`,
                backgroundColor: `${cat.color}14`,
                color: cat.color,
              }}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
            </span>
          </div>
          <h3 className="font-heading text-lg font-semibold tracking-[-0.01em] leading-tight text-card-foreground">
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 font-body text-sm text-muted-foreground">{description}</p>
          )}
          <div className="mt-2.5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {town}
            </span>
            <span>{new Date(createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
            <span className="ml-auto flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {user && (
                <button
                  type="button"
                  onClick={() => setFlagOpen(true)}
                  className="rounded-sm p-1 text-text-lo hover:text-accent"
                  title="Flag this post"
                  aria-label="Flag this post"
                >
                  <Flag className="h-3 w-3" />
                </button>
              )}
              <ShareButton id={id} slug={slug} title={title} description={description} variant="icon" />
            </span>
          </div>
        </div>
      </div>
      <FlagDialog open={flagOpen} onOpenChange={setFlagOpen} requestId={id} requestTitle={title} />
    </motion.div>
  );
}
