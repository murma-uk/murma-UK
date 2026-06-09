import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, ArrowBigUp, Users, GitMerge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { buildRequestPath } from "@/lib/slug";
import type { SimilarRequest } from "@/lib/similarRequests";
import type { RequestCategory } from "@/lib/categories";

export type JoinMode = "upvote" | "cosign" | "suggest_merge";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: SimilarRequest | null;
  /** Pre-filled draft from the composer, used for merge suggestions and as the default angle. */
  draft?: {
    title?: string;
    body?: string;
    category?: RequestCategory | null;
  };
  defaultMode?: JoinMode;
  onJoined?: () => void;
}

export default function JoinRequestDialog({
  open,
  onOpenChange,
  target,
  draft,
  defaultMode = "upvote",
  onJoined,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<JoinMode>(defaultMode);
  const [note, setNote] = useState(draft?.body ?? "");
  const [busy, setBusy] = useState(false);

  if (!target) return null;

  const requireAuth = () => {
    if (!user) {
      toast({ title: "Sign in to join", description: "You need an account to back wishes." });
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return false;
    }
    return true;
  };

  const handleUpvote = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      const { error: upErr } = await supabase
        .from("upvotes")
        .insert({ request_id: target.id, user_id: user!.id });
      // ignore unique-violation (already upvoted)
      if (upErr && !/duplicate|unique/i.test(upErr.message)) throw upErr;

      const angle = note.trim();
      if (angle) {
        const { error: cErr } = await supabase
          .from("request_comments")
          .insert({ request_id: target.id, user_id: user!.id, body: angle, kind: "angle" });
        if (cErr) throw cErr;
      }
      toast({ title: "Voice added", description: `You're backing "${target.title}".` });
      onJoined?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not back wish", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleCosign = async () => {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      const trimmed = note.trim().slice(0, 200);
      const { error } = await supabase
        .from("request_cosigners")
        .insert({ request_id: target.id, user_id: user!.id, note: trimmed || null });
      if (error && !/duplicate|unique/i.test(error.message)) throw error;
      toast({ title: "Co-signed ✨", description: "You're on the record as backing this wish." });
      onJoined?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not co-sign", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleMerge = async () => {
    if (!requireAuth()) return;
    if (!draft?.title || !draft?.category) {
      toast({ title: "Nothing to merge", description: "Write your wish first.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("merge_suggestions").insert({
        target_request_id: target.id,
        suggester_id: user!.id,
        proposed_title: draft.title,
        proposed_body: note.trim() || draft.body || null,
        proposed_category: draft.category as any,
      });
      if (error) throw error;
      toast({
        title: "Merge suggested",
        description: "The original poster will be notified. They can accept or decline.",
      });
      onJoined?.();
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Could not suggest merge", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl uppercase tracking-[0.02em]">
            Join forces
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{target.title}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              {target.town} · {target.distance_km < 0.1 ? "<0.1" : target.distance_km.toFixed(1)} km · {target.upvote_count} upvotes
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as JoinMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upvote" className="gap-1.5 text-xs">
              <ArrowBigUp className="h-3.5 w-3.5" /> Back
            </TabsTrigger>
            <TabsTrigger value="cosign" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Co-sign
            </TabsTrigger>
            <TabsTrigger value="suggest_merge" className="gap-1.5 text-xs" disabled={!draft?.title}>
              <GitMerge className="h-3.5 w-3.5" /> Merge
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upvote" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Add your upvote. Optionally leave an "angle" — a short note on why this matters to you.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Your angle (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. especially needed for night-shift workers…"
                rows={3}
                maxLength={500}
              />
            </div>
            <Button onClick={handleUpvote} disabled={busy} className="w-full gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowBigUp className="h-4 w-4" />}
              Back this wish
            </Button>
          </TabsContent>

          <TabsContent value="cosign" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Become a named co-signer. Your endorsement appears publicly on the request.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Note (optional, max 200 chars)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 200))}
                placeholder="Why you're behind this"
                rows={2}
                maxLength={200}
              />
            </div>
            <Button onClick={handleCosign} disabled={busy} className="w-full gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              Co-sign this wish
            </Button>
          </TabsContent>

          <TabsContent value="suggest_merge" className="space-y-3 pt-3">
            <p className="text-xs text-muted-foreground">
              Suggest merging your wish into this one. The original poster decides — if accepted,
              you become a co-signer and your angle is added.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs">Your angle</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={draft?.body ?? "Anything to add?"}
                rows={3}
                maxLength={500}
              />
            </div>
            <Button onClick={handleMerge} disabled={busy} className="w-full gap-2">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
              Suggest merge
            </Button>
          </TabsContent>
        </Tabs>

        <div className="border-t border-border pt-2 text-center">
          <a
            href={buildRequestPath(target.id, target.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            View full wish →
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
