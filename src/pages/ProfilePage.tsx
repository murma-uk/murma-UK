import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogOut, Pencil, Plus, Check, X, ArrowBigUp, MapPin, ExternalLink, Trash2, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCategories, getCategory, type RequestCategory } from "@/lib/categories";
import { buildRequestPath } from "@/lib/slug";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatTile, { formatLiveSince } from "@/components/brand/StatTile";
import SectionHeading from "@/components/brand/SectionHeading";
import SignalLine from "@/components/brand/SignalLine";
import ShareButton from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type SortKey = "new" | "top";
type StatusFilter = "active" | "closed" | "all";

interface MyRequest {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: RequestCategory;
  town: string;
  status: string;
  created_at: string;
  upvote_count: number;
  view_count: number;
  share_count: number;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: categories } = useCategories();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sort, setSort] = useState<SortKey>("new");

  // ----- Profile (display name) -----
  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  useEffect(() => {
    if (profileQuery.data?.display_name) setNameDraft(profileQuery.data.display_name);
  }, [profileQuery.data?.display_name]);

  const saveName = async () => {
    if (!user) return;
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      toast({ title: "Display name can't be empty", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("user_id", user.id);
    if (error) {
      toast({ title: "Couldn't save name", description: error.message, variant: "destructive" });
      return;
    }
    setEditingName(false);
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast({ title: "Saved" });
  };

  // ----- My requests -----
  const myReqQuery = useQuery({
    queryKey: ["my-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("id,slug,title,description,category,town,status,created_at,upvote_count,view_count,share_count")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyRequest[];
    },
  });

  const myRequests = myReqQuery.data ?? [];

  const totals = useMemo(() => {
    return myRequests.reduce(
      (acc, r) => ({
        upvotes: acc.upvotes + (r.upvote_count ?? 0),
        views: acc.views + (r.view_count ?? 0),
        shares: acc.shares + (r.share_count ?? 0),
        live: acc.live + (r.status === "active" ? 1 : 0),
      }),
      { upvotes: 0, views: 0, shares: 0, live: 0 },
    );
  }, [myRequests]);

  const filteredSorted = useMemo(() => {
    let list = myRequests;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    list = [...list].sort((a, b) =>
      sort === "top"
        ? (b.upvote_count ?? 0) - (a.upvote_count ?? 0)
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return list;
  }, [myRequests, statusFilter, sort]);

  // ----- Recently upvoted -----
  const upvotedQuery = useQuery({
    queryKey: ["my-upvotes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("upvotes")
        .select("created_at, requests(id,slug,title,town,category,upvote_count)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []).filter((r: any) => r.requests) as Array<{
        created_at: string;
        requests: { id: string; slug: string | null; title: string; town: string; category: RequestCategory; upvote_count: number };
      }>;
    },
  });

  // ----- Mutations -----
  const toggleStatus = async (r: MyRequest) => {
    const next = r.status === "active" ? "closed" : "active";
    const { error } = await supabase.from("requests").update({ status: next }).eq("id", r.id);
    if (error) {
      toast({ title: "Couldn't update", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-requests", user?.id] });
    toast({ title: next === "closed" ? "Request closed" : "Request reopened" });
  };

  const deleteRequest = async (r: MyRequest) => {
    const { error } = await supabase.from("requests").delete().eq("id", r.id);
    if (error) {
      toast({ title: "Couldn't delete", description: error.message, variant: "destructive" });
      return;
    }
    qc.invalidateQueries({ queryKey: ["my-requests", user?.id] });
    toast({ title: "Request deleted" });
  };

  // ----- Gating -----
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?next=/me" replace />;

  const displayName = profileQuery.data?.display_name || user.email?.split("@")[0] || "You";
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-4xl py-8">
        {/* Header */}
        <section className="relative overflow-hidden rounded-lg border-[1.5px] border-border bg-popover">
          <SignalLine />
          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-lo">Your dashboard</p>
              {editingName ? (
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    autoFocus
                    value={nameDraft}
                    maxLength={60}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveName();
                      if (e.key === "Escape") setEditingName(false);
                    }}
                    className="h-10 max-w-xs font-heading text-xl tracking-[-0.01em]"
                  />
                  <Button size="icon" variant="default" onClick={saveName} aria-label="Save">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => setEditingName(false)} aria-label="Cancel">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h1 className="mt-1 flex items-center gap-2 font-display text-4xl leading-none tracking-[-0.02em] md:text-5xl">
                  {displayName}
                  <button
                    onClick={() => {
                      setNameDraft(profileQuery.data?.display_name ?? displayName);
                      setEditingName(true);
                    }}
                    className="rounded-sm p-1 text-text-lo transition-colors hover:text-primary"
                    aria-label="Edit display name"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </h1>
              )}
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.12em] text-text-lo">
                {memberSince ? <>Member since {memberSince} · </> : null}
                {totals.live} live · {myRequests.length} total
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link to="/explore?create=true">
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add murma
                </Button>
              </Link>
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={async () => { await signOut(); navigate("/"); }}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          </div>
        </section>

        {/* Totals */}
        <section className="mt-6">
          <SectionHeading>Totals</SectionHeading>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
            <StatTile label="Voices" value={totals.upvotes} />
            <StatTile label="Views" value={totals.views} />
            <StatTile label="Shares" value={totals.shares} />
            <StatTile label="Live murmas" value={totals.live} sub={`of ${myRequests.length}`} />
          </div>
        </section>

        {/* My murmas */}
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeading>Your murmas</SectionHeading>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-sm border-[1.5px] border-border bg-popover p-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
                {(["active", "closed", "all"] as StatusFilter[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-[3px] px-2.5 py-1 transition-colors ${
                      statusFilter === s ? "bg-primary text-primary-foreground" : "text-text-lo hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex rounded-sm border-[1.5px] border-border bg-popover p-0.5 font-mono text-[10px] uppercase tracking-[0.12em]">
                {(["new", "top"] as SortKey[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`rounded-[3px] px-2.5 py-1 transition-colors ${
                      sort === s ? "bg-foreground text-background" : "text-text-lo hover:text-foreground"
                    }`}
                  >
                    {s === "new" ? "Newest" : "Top"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {myReqQuery.isLoading ? (
            <div className="mt-4 flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="mt-4 rounded-lg border-[1.5px] border-dashed border-border bg-popover p-8 text-center">
              <p className="font-heading text-lg font-semibold tracking-[-0.01em]">No murmas yet</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.12em] text-text-lo">
                Be impossible to ignore.
              </p>
              <Link to="/explore?create=true" className="mt-4 inline-block">
                <Button className="gap-1.5">
                  <Plus className="h-4 w-4" /> Add your first murma
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {filteredSorted.map((r) => {
                const cat = getCategory(categories, r.category);
                const Icon = cat.Icon;
                const closed = r.status !== "active";
                return (
                  <li
                    key={r.id}
                    className="rounded-lg border-[1.5px] border-border bg-popover p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
                        style={{ borderColor: `${cat.color}40`, backgroundColor: `${cat.color}14`, color: cat.color }}
                      >
                        <Icon className="h-3 w-3" />
                        {cat.label}
                      </span>
                      {closed && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-border-mid bg-surface-2 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-lo">
                          <Lock className="h-3 w-3" /> Closed
                        </span>
                      )}
                      <span className="ml-auto flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-lo">
                        <MapPin className="h-3 w-3" />
                        {r.town}
                      </span>
                    </div>

                    <Link
                      to={buildRequestPath(r.id, r.slug)}
                      className="mt-1.5 block font-heading text-lg font-semibold tracking-[-0.01em] leading-tight text-card-foreground hover:text-primary"
                    >
                      {r.title}
                    </Link>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-lo">
                      <span>Live {formatLiveSince(r.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <ArrowBigUp className="h-3 w-3" /> {r.upvote_count} voices
                      </span>
                      <span>{r.view_count} views</span>
                      <span>{r.share_count} shares</span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link to={buildRequestPath(r.id, r.slug)}>
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <ExternalLink className="h-3.5 w-3.5" /> Open
                        </Button>
                      </Link>
                      <ShareButton id={r.id} slug={r.slug} title={r.title} description={r.description} variant="full" />
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toggleStatus(r)}>
                        {closed ? <><Unlock className="h-3.5 w-3.5" /> Reopen</> : <><Lock className="h-3.5 w-3.5" /> Close</>}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-1.5">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this murma?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{r.title}" will be removed permanently along with all its voices. This can't be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteRequest(r)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recently upvoted */}
        {(upvotedQuery.data?.length ?? 0) > 0 && (
          <section className="mt-8">
            <SectionHeading>Recently upvoted</SectionHeading>
            <ul className="mt-2 divide-y divide-border rounded-lg border-[1.5px] border-border bg-popover">
              {upvotedQuery.data!.map((u) => {
                const cat = getCategory(categories, u.requests.category);
                const Icon = cat.Icon;
                return (
                  <li key={u.requests.id}>
                    <Link
                      to={buildRequestPath(u.requests.id, u.requests.slug)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40"
                    >
                      <Icon className="h-4 w-4 shrink-0" style={{ color: cat.color }} />
                      <span className="min-w-0 flex-1 truncate font-heading text-sm font-medium tracking-[-0.01em]">
                        {u.requests.title}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-lo">
                        {u.requests.town}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-text-lo">
                        <ArrowBigUp className="h-3 w-3" /> {u.requests.upvote_count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
