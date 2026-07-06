import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Users, MessageSquare, Sparkles, GitMerge, Check, X, Loader2 } from "lucide-react";

interface Comment {
  id: string;
  user_id: string;
  body: string;
  kind: "angle" | "comment";
  created_at: string;
}
interface Cosigner {
  id: string;
  user_id: string;
  note: string | null;
  created_at: string;
}
interface MergeSuggestion {
  id: string;
  suggester_id: string;
  proposed_title: string;
  proposed_body: string | null;
  status: string;
  created_at: string;
}
interface ProfileMap {
  [userId: string]: { display_name: string | null };
}

interface Props {
  requestId: string;
  ownerId: string;
}

export default function RequestEngagement({ requestId, ownerId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [cosigners, setCosigners] = useState<Cosigner[]>([]);
  const [suggestions, setSuggestions] = useState<MergeSuggestion[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const isOwner = !!user && user.id === ownerId;

  const load = useCallback(async () => {
    const [{ data: cs }, { data: co }, sugs] = await Promise.all([
      supabase
        .from("request_comments")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
      supabase
        .from("request_cosigners")
        .select("*")
        .eq("request_id", requestId)
        .order("created_at", { ascending: true }),
      isOwner
        ? supabase
            .from("merge_suggestions")
            .select("*")
            .eq("target_request_id", requestId)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as MergeSuggestion[] }),
    ]);

    const comm = (cs ?? []) as Comment[];
    const cos = (co ?? []) as Cosigner[];
    const sg = ((sugs as any).data ?? []) as MergeSuggestion[];
    setComments(comm);
    setCosigners(cos);
    setSuggestions(sg);

    // Fetch display names
    const ids = Array.from(
      new Set<string>([
        ...comm.map((c) => c.user_id),
        ...cos.map((c) => c.user_id),
        ...sg.map((s) => s.suggester_id),
      ]),
    );
    if (ids.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      const map: ProfileMap = {};
      (profs ?? []).forEach((p: any) => {
        map[p.user_id] = { display_name: p.display_name };
      });
      setProfiles(map);
    }
  }, [requestId, isOwner]);

  useEffect(() => {
    load();
  }, [load]);

  const nameFor = (uid: string) => profiles[uid]?.display_name || "Someone";

  const postComment = async () => {
    if (!user) {
      toast({ title: "Sign in to comment" });
      return;
    }
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    try {
      const { error } = await supabase
        .from("request_comments")
        .insert({ request_id: requestId, user_id: user.id, body, kind: "comment" });
      if (error) throw error;
      setDraft("");
      load();
    } catch (e: any) {
      toast({ title: "Could not post", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const decide = async (id: string, accept: boolean) => {
    setActing(id);
    try {
      if (accept) {
        const { error } = await supabase.rpc("accept_merge_suggestion", { _id: id });
        if (error) throw error;
        toast({ title: "Merge accepted", description: "Co-signer added." });
      } else {
        const { error } = await supabase
          .from("merge_suggestions")
          .update({ status: "rejected", decided_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        toast({ title: "Suggestion declined" });
      }
      load();
    } catch (e: any) {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(null);
    }
  };

  const angles = comments.filter((c) => c.kind === "angle");
  const general = comments.filter((c) => c.kind === "comment");

  return (
    <div className="mt-8 space-y-6">
      {/* Owner inbox */}
      {isOwner && suggestions.length > 0 && (
        <section className="rounded-lg border-[1.5px] border-civic/40 bg-civic/5 p-4">
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[-0.01em] text-civic">
            <GitMerge className="h-4 w-4" />
            {suggestions.length} merge {suggestions.length === 1 ? "suggestion" : "suggestions"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Someone wrote a similar murma nearby. Accept to add them as a co-signer.
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li key={s.id} className="rounded-sm border border-border bg-popover p-3">
                <p className="font-heading text-sm font-semibold leading-tight">{s.proposed_title}</p>
                {s.proposed_body && (
                  <p className="mt-1 text-xs text-muted-foreground whitespace-pre-line">{s.proposed_body}</p>
                )}
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
                  From {nameFor(s.suggester_id)}
                </p>
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide(s.id, true)}
                    disabled={acting === s.id}
                    className="gap-1.5 h-7"
                  >
                    {acting === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide(s.id, false)}
                    disabled={acting === s.id}
                    className="gap-1.5 h-7"
                  >
                    <X className="h-3 w-3" />
                    Decline
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Co-signers */}
      {cosigners.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[-0.01em]">
            <Users className="h-4 w-4 text-primary" />
            {cosigners.length} co-{cosigners.length === 1 ? "signer" : "signers"}
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {cosigners.map((c) => (
              <li
                key={c.id}
                className="rounded-full border border-border bg-popover px-3 py-1 text-xs"
                title={c.note ?? undefined}
              >
                {nameFor(c.user_id)}
                {c.note && <span className="ml-1 text-muted-foreground">· {c.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Angles */}
      {angles.length > 0 && (
        <section>
          <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[-0.01em]">
            <Sparkles className="h-4 w-4 text-primary" />
            Angles
          </h3>
          <ul className="mt-2 space-y-2">
            {angles.map((a) => (
              <li key={a.id} className="rounded-lg border-l-2 border-primary bg-primary/5 p-3">
                <p className="text-sm whitespace-pre-line">{a.body}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
                  {nameFor(a.user_id)} · {new Date(a.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Comments */}
      <section>
        <h3 className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[-0.01em]">
          <MessageSquare className="h-4 w-4" />
          Discussion {general.length > 0 && <span className="text-text-lo">({general.length})</span>}
        </h3>
        {user ? (
          <div className="mt-2 space-y-2">
            <Label className="sr-only">Add a comment</Label>
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add to the conversation…"
              rows={2}
              maxLength={1000}
            />
            <div className="flex justify-end">
              <Button size="sm" onClick={postComment} disabled={posting || !draft.trim()}>
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">Sign in to join the discussion.</p>
        )}
        {general.length > 0 && (
          <ul className="mt-3 space-y-2">
            {general.map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-popover p-3">
                <p className="text-sm whitespace-pre-line">{c.body}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-text-lo">
                  {nameFor(c.user_id)} · {new Date(c.created_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
