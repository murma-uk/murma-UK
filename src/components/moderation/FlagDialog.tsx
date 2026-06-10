import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "off_topic", label: "Off-topic / not a wish" },
  { value: "hateful", label: "Hateful or harassing" },
  { value: "duplicate", label: "Duplicate of another post" },
  { value: "illegal", label: "Illegal or unsafe" },
  { value: "other", label: "Other" },
] as const;

type Reason = typeof REASONS[number]["value"];

const schema = z.object({
  reason: z.enum(["spam", "off_topic", "hateful", "duplicate", "illegal", "other"]),
  note: z.string().trim().max(280).optional(),
});

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  requestId: string;
  requestTitle: string;
}

export default function FlagDialog({ open, onOpenChange, requestId, requestTitle }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reason, setReason] = useState<Reason>("spam");
  const [note, setNote] = useState("");
  const [existing, setExisting] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    supabase
      .from("request_flags")
      .select("id, reason, note")
      .eq("request_id", requestId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExisting(data.id);
          setReason(data.reason as Reason);
          setNote(data.note ?? "");
        } else {
          setExisting(null);
          setReason("spam");
          setNote("");
        }
      });
  }, [open, user, requestId]);

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in to flag</DialogTitle>
            <DialogDescription>You need an account to flag posts.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => navigate("/auth")}>Sign in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const submit = async () => {
    const parsed = schema.safeParse({ reason, note: note || undefined });
    if (!parsed.success) {
      toast({ title: "Check your input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("request_flags").upsert(
      { request_id: requestId, user_id: user.id, reason, note: note.trim() || null },
      { onConflict: "request_id,user_id" },
    );
    setLoading(false);
    if (error) {
      toast({ title: "Could not submit flag", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Thanks — moderators will take a look." });
    onOpenChange(false);
  };

  const withdraw = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("request_flags")
      .delete()
      .eq("request_id", requestId)
      .eq("user_id", user.id);
    setLoading(false);
    if (error) {
      toast({ title: "Could not withdraw flag", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Flag withdrawn" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-accent" />
            {existing ? "You've flagged this" : "Flag this post"}
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{requestTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Reason</Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as Reason)} className="space-y-1">
              {REASONS.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-2 rounded-sm border border-border-mid bg-surface-2 px-2.5 py-1.5 text-sm">
                  <RadioGroupItem value={r.value} />
                  <span>{r.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              Note (optional)
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              maxLength={280}
              placeholder="Add context for reviewers…"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Three flags will auto-hide the post until a moderator reviews it.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {existing && (
            <Button variant="outline" onClick={withdraw} disabled={loading}>
              Withdraw
            </Button>
          )}
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : existing ? "Update" : "Submit flag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
