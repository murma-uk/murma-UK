import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowBigUp, MessageCircle, MapPin } from "lucide-react";
import { CATEGORIES, type RequestCategory } from "@/lib/categories";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface RequestCardProps {
  id: string;
  title: string;
  description: string | null;
  category: RequestCategory;
  town: string;
  upvoteCount: number;
  commentCount?: number;
  hasUpvoted: boolean;
  createdAt: string;
  onUpvoteChange?: () => void;
}

export default function RequestCard({
  id, title, description, category, town, upvoteCount,
  commentCount = 0, hasUpvoted, createdAt, onUpvoteChange,
}: RequestCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [animating, setAnimating] = useState(false);
  const cat = CATEGORIES[category];
  const Icon = cat.icon;

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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover cursor-pointer rounded-lg border border-border bg-card p-4"
      onClick={() => navigate(`/request/${id}`)}
    >
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleUpvote}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              hasUpvoted
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"
            } ${animating ? "animate-pulse-up" : ""}`}
          >
            <ArrowBigUp className="h-5 w-5" />
          </button>
          <span className={`text-sm font-bold font-heading ${hasUpvoted ? "text-primary" : "text-muted-foreground"}`}>
            {upvoteCount}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              <Icon className="h-3 w-3" />
              {cat.label}
            </span>
          </div>
          <h3 className="font-heading font-semibold text-card-foreground leading-tight">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {town}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {commentCount}
            </span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
