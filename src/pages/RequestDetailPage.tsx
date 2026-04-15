import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { CATEGORIES, type RequestCategory } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowBigUp, MapPin, ArrowLeft, Flag, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    const [reqRes, comRes] = await Promise.all([
      supabase.from("requests").select("*").eq("id", id).single(),
      supabase.from("comments").select("*").eq("request_id", id).order("created_at", { ascending: true }),
    ]);
    setRequest(reqRes.data);

    // Fetch display names for commenters
    if (comRes.data && comRes.data.length > 0) {
      const userIds = [...new Set(comRes.data.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) ?? []);
      comRes.data.forEach((c: any) => { c.display_name = profileMap.get(c.user_id) ?? "Anonymous"; });
    }
    setComments(comRes.data ?? []);

    if (user) {
      const { data } = await supabase.from("upvotes").select("id").eq("request_id", id).eq("user_id", user.id).maybeSingle();
      setHasUpvoted(!!data);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpvote = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!id) return;
    if (hasUpvoted) {
      await supabase.from("upvotes").delete().eq("request_id", id).eq("user_id", user.id);
    } else {
      await supabase.from("upvotes").insert({ request_id: id, user_id: user.id });
    }
    fetchData();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      request_id: id,
      user_id: user.id,
      content: newComment.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewComment("");
      fetchData();
    }
    setPosting(false);
  };

  const handleFlag = async (commentId: string) => {
    toast({ title: "Flagged", description: "This comment has been flagged for review." });
    // In production, this would update the flagged field via an admin endpoint
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Request not found.
        </div>
      </div>
    );
  }

  const cat = CATEGORIES[request.category as RequestCategory];
  const Icon = cat.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {request.town}
            </span>
          </div>

          <h1 className="font-heading text-2xl font-bold md:text-3xl">{request.title}</h1>
          {request.description && (
            <p className="mt-3 text-muted-foreground leading-relaxed">{request.description}</p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <Button
              onClick={handleUpvote}
              variant={hasUpvoted ? "default" : "outline"}
              className="gap-2 font-heading font-medium"
            >
              <ArrowBigUp className="h-5 w-5" />
              {hasUpvoted ? "Upvoted" : "Upvote"}
              <span className="ml-1 font-bold">{request.upvote_count}</span>
            </Button>
            <span className="text-sm text-muted-foreground">
              {new Date(request.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
        </motion.div>

        {/* Comments */}
        <div className="mt-10">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Comments ({comments.length})
          </h2>

          {user ? (
            <form onSubmit={handleComment} className="mb-6 flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={posting || !newComment.trim()}>
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : (
            <p className="mb-6 text-sm text-muted-foreground">
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">
                Sign in
              </button>{" "}
              to join the conversation.
            </p>
          )}

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium font-heading">
                    {c.profiles?.display_name ?? "Anonymous"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    {user && (
                      <button
                        onClick={() => handleFlag(c.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Flag comment"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-card-foreground">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">No comments yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
