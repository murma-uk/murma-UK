import { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Flag, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
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
    const signInContent = (
      <>
        <h2 className="text-lg font-semibold">Sign in to flag</h2>
        <p className="text-sm text-muted-foreground">You need an account to flag posts.</p>
        <Button onClick={() => navigate("/auth")} className="w-full mt-4">
          Sign in
        </Button>
      </>
    );

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[40svh]">
            <div className="px-4 pt-4 pb-6">{signInContent}</div>
          </DrawerContent>
        </Drawer>
      );
    }

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

  const dialogContent = (
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
  );

  const dialogButtons = (
    <div className="gap-2 flex flex-col-reverse sm:flex-row sm:justify-end">
      {existing && (
        <Button variant="outline" onClick={withdraw} disabled={loading}>
          Withdraw
        </Button>
      )}
      <Button onClick={submit} disabled={loading} className="w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : existing ? "Update" : "Submit flag"}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80svh] overflow-y-auto">
          <div className="px-4 pt-4 pb-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Flag className="h-4 w-4 text-accent" />
                {existing ? "You've flagged this" : "Flag this post"}
              </h2>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{requestTitle}</p>
            </div>
            {dialogContent}
            {dialogButtons}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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

        {dialogContent}

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
