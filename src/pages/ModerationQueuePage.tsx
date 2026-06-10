import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useIsTrusted } from "@/hooks/useIsTrusted";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, RotateCcw, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { buildRequestPath } from "@/lib/slug";

interface HiddenRequest {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  town: string;
  category: string;
  status: string;
  user_id: string;
  created_at: string;
  flags: { reason: string; note: string | null; created_at: string }[];
}

export default function ModerationQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isTrusted, isLoading: trustedLoading } = useIsTrusted();
  const { toast } = useToast();
  const [items, setItems] = useState<HiddenRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canReview = !!(isAdmin || isTrusted);

  const fetchQueue = async () => {
    setLoading(true);
    const { data: reqs, error } = await supabase
      .from("requests")
      .select("id, slug, title, description, town, category, status, user_id, created_at")
      .in("status", ["hidden", "removed"])
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Could not load queue", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    const ids = (reqs ?? []).map((r) => r.id);
    let flagsByReq: Record<string, HiddenRequest["flags"]> = {};
    if (ids.length) {
      const { data: flags } = await supabase
        .from("request_flags")
        .select("request_id, reason, note, created_at")
        .in("request_id", ids);
      for (const f of flags ?? []) {
        (flagsByReq[f.request_id] ??= []).push({
          reason: f.reason, note: f.note, created_at: f.created_at,
        });
      }
    }
    setItems((reqs ?? []).map((r) => ({ ...r, flags: flagsByReq[r.id] ?? [] })) as any);
    setLoading(false);
  };

  useEffect(() => {
    if (canReview) fetchQueue();
  }, [canReview]);

  if (authLoading || adminLoading || trustedLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!canReview) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-xl py-16 text-center">
          <h1 className="font-display text-3xl uppercase">Not authorized</h1>
          <p className="mt-2 text-muted-foreground">
            Moderation is available to admins and trusted reviewers.
          </p>
        </div>
      </div>
    );
  }

  const moderate = async (id: string, action: "restore" | "remove") => {
    setBusyId(id);
    const { error } = await supabase.rpc("moderate_request", {
      _request_id: id,
      _action: action,
      _note: null,
    });
    setBusyId(null);
    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: action === "restore" ? "Post restored" : "Post removed" });
    fetchQueue();
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Moderation queue — Hey, Open Up" description="Review flagged posts" path="/admin/moderation" />
      <Navbar />
      <div className="container max-w-3xl py-8">
        <div className="mb-6 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <h1 className="font-display text-3xl uppercase tracking-[0.02em]">Moderation queue</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-md border border-dashed border-border bg-surface-2 p-8 text-center text-muted-foreground">
            Nothing to review. Nice.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((it) => (
              <li key={it.id} className="rounded-md border-[1.5px] border-border bg-popover p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-accent">
                        {it.status}
                      </span>
                      <span>{it.town}</span>
                      <span>· {it.category}</span>
                    </div>
                    <h2 className="font-heading text-lg font-bold uppercase tracking-[0.03em] leading-tight">
                      {it.title}
                    </h2>
                    {it.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{it.description}</p>
                    )}
                  </div>
                  <Link to={buildRequestPath(it.id, it.slug)} className="shrink-0">
                    <Button variant="ghost" size="icon" title="Open">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="mt-3 space-y-1.5 rounded-sm border border-dashed border-border bg-surface-2 p-2.5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {it.flags.length} flag{it.flags.length === 1 ? "" : "s"}
                  </p>
                  {it.flags.map((f, idx) => (
                    <div key={idx} className="text-xs">
                      <span className="font-medium text-foreground">{f.reason.replace(/_/g, " ")}</span>
                      {f.note && <span className="text-muted-foreground"> — {f.note}</span>}
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === it.id}
                    onClick={() => moderate(it.id, "restore")}
                    className="gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busyId === it.id}
                    onClick={() => moderate(it.id, "remove")}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
