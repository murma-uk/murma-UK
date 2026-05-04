import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { useCategories, getCategory, type RequestCategory } from "@/lib/categories";
import { useCategoryFields, formatFieldValue } from "@/lib/categoryFields";
import { buildRequestPath, parseRequestParam } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowBigUp, MapPin, ArrowLeft, Flag, Loader2, Send, Store } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import { motion } from "framer-motion";

export default function RequestDetailPage() {
  const { id: routeParam } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { data: categories } = useCategories();
  const cat = request ? getCategory(categories, request.category as RequestCategory) : null;
  const { data: fields = [] } = useCategoryFields(cat?.id || undefined);

  const fetchData = useCallback(async () => {
    if (!routeParam) return;
    const { uuid, shortId } = parseRequestParam(routeParam);

    // Resolve the request: by full UUID (legacy) or by id_short (pretty URL).
    let reqQuery = supabase.from("requests").select("*");
    if (uuid) {
      reqQuery = reqQuery.eq("id", uuid);
    } else if (shortId) {
      reqQuery = (reqQuery as any).eq("id_short", shortId);
    } else {
      setRequest(null);
      setLoading(false);
      return;
    }

    const { data: reqRows } = await reqQuery
      .order("created_at", { ascending: false })
      .limit(1);
    const reqData = reqRows?.[0] ?? null;
    setRequest(reqData);

    if (!reqData) {
      setLoading(false);
      return;
    }

    // Canonicalise the URL: if user landed via legacy UUID or mismatched slug,
    // replace the URL with the pretty one (no history entry).
    const canonical = buildRequestPath(reqData.id, (reqData as any).slug);
    if (canonical !== `/request/${routeParam}`) {
      navigate(canonical, { replace: true });
    }

    const { data: comData } = await supabase
      .from("comments")
      .select("*")
      .eq("request_id", reqData.id)
      .order("created_at", { ascending: true });

    if (reqData.business_id) {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", reqData.business_id)
        .single();
      setBusiness(bizData);
    } else {
      setBusiness(null);
    }

    if (comData && comData.length > 0) {
      const userIds = [...new Set(comData.map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) ?? []);
      comData.forEach((c: any) => {
        c.display_name = profileMap.get(c.user_id) ?? "Anonymous";
      });
    }
    setComments(comData ?? []);

    if (user) {
      const { data } = await supabase
        .from("upvotes")
        .select("id")
        .eq("request_id", reqData.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setHasUpvoted(!!data);
    }
    setLoading(false);
  }, [routeParam, user, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpvote = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!request?.id) return;
    if (hasUpvoted) {
      await supabase.from("upvotes").delete().eq("request_id", request.id).eq("user_id", user.id);
    } else {
      await supabase.from("upvotes").insert({ request_id: request.id, user_id: user.id });
    }
    fetchData();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !request?.id || !newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("comments").insert({
      request_id: request.id,
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

  const catResolved = cat ?? getCategory(categories, request.category as RequestCategory);
  const Icon = catResolved.Icon;
  const fieldValues = (request.field_values ?? {}) as Record<string, unknown>;
  const structured = fields
    .map((f) => ({ label: f.label, value: formatFieldValue(f, fieldValues[f.key]) }))
    .filter((x) => x.value);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-2xl py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 font-mono text-xs uppercase tracking-[0.15em] text-text-lo transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]"
              style={{
                borderColor: `${catResolved.color}40`,
                backgroundColor: `${catResolved.color}14`,
                color: catResolved.color,
              }}
            >
              <Icon className="h-3 w-3" />
              {catResolved.label}
            </span>
            <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.12em] text-text-lo">
              <MapPin className="h-3 w-3" />
              {request.town}
            </span>
          </div>

          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-[0.02em] md:text-5xl">{request.title}</h1>

          {structured.length > 0 && (
            <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              {structured.map((s) => (
                <div key={s.label} className="contents">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {request.description && (
            <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{request.description}</p>
          )}

          {business && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Store className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{business.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {business.business_type?.replace(/_/g, " ")} · {business.town}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleUpvote}
              variant={hasUpvoted ? "default" : "outline"}
              className="gap-2 font-heading font-medium"
            >
              <ArrowBigUp className="h-5 w-5" />
              {hasUpvoted ? "Upvoted" : "Upvote"}
              <span className="ml-1 font-bold">{request.upvote_count}</span>
            </Button>
            <ShareButton
              id={request.id}
              slug={(request as any).slug}
              title={request.title}
              description={request.description}
              variant="full"
            />
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
                    {c.display_name ?? "Anonymous"}
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
