import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import RequestCard from "@/components/RequestCard";
import CategoryFilter from "@/components/CategoryFilter";
import CreateRequestDialog from "@/components/CreateRequestDialog";
import { type RequestCategory } from "@/lib/categories";
import { buildRequestPath } from "@/lib/slug";
import { Loader2, List, Map as MapIcon, MapPin, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "true");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [pinMode, setPinMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; town: string } | null>(null);
  const [initialDraft, setInitialDraft] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; town?: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    let query = supabase.from("requests").select("*").eq("status", "active").order("upvote_count", { ascending: false }) as any;
    if (selectedCategory) query = query.eq("category", selectedCategory);
    const { data, error } = await query;
    if (error) {
      console.error("Error fetching requests:", error);
    }
    setRequests(data ?? []);
    setLoading(false);
  }, [selectedCategory]);

  const fetchUpvotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("upvotes").select("request_id").eq("user_id", user.id);
    setUpvotedIds(new Set(data?.map((u) => u.request_id) ?? []));
  }, [user]);

  useEffect(() => {
    fetchRequests();
    fetchUpvotes();
  }, [fetchRequests, fetchUpvotes]);

  // Sync createOpen state with URL search params
  useEffect(() => {
    setCreateOpen(searchParams.get("create") === "true");
  }, [searchParams]);

  // Resume pending draft after sign-in
  useEffect(() => {
    if (!user) return;
    const raw = sessionStorage.getItem("pendingRequest");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft?.lat != null && draft?.lng != null) {
        setDroppedPin({ lat: draft.lat, lng: draft.lng, town: draft.town || "" });
      }
      setInitialDraft(draft);
      setCreateOpen(true);
    } catch {
      sessionStorage.removeItem("pendingRequest");
    }
  }, [user]);

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) {
      setSearchParams({});
      setDroppedPin(null);
      setInitialDraft(null);
    }
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setPinMode(false);
    // Reverse geocode via Google
    let town = "";
    try {
      const { data } = await supabase.functions.invoke("geocode", {
        body: { mode: "reverse", lat, lng },
      });
      town = (data as any)?.town ?? "";
    } catch {
      // ignore
    }
    setDroppedPin({ lat, lng, town });
    setCreateOpen(true);
    setSearchParams({ create: "true" });
  }, [user, navigate, toast, setSearchParams]);

  const mapRequests = requests.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category as RequestCategory,
    lat: r.lat,
    lng: r.lng,
    town: r.town,
    upvote_count: r.upvote_count,
  }));

  return (
    <div className="flex h-screen flex-col bg-background">
      <SEO
        title="The Signal — Explore Murmas in Your Area"
        description="Browse what your community needs. Add your voice to murmas that matter. Help businesses and councils understand local demand."
        path="/explore"
      />
      <h1 className="sr-only">Explore Local Demand</h1>
      <Navbar />

      {/* Mobile Map/List toggle */}
      <div className="flex border-b border-border bg-card md:hidden">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mobileView === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          onClick={() => setMobileView("list")}
        >
          <List className="h-4 w-4" /> List
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${mobileView === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
          onClick={() => setMobileView("map")}
        >
          <MapIcon className="h-4 w-4" /> Map
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${mobileView === "list" ? "flex" : "hidden"} md:flex flex-col relative w-full border-r border-border md:w-96 md:flex-shrink-0`}>
          <div className="border-b border-border p-4">
            <p className="section-heading mb-2">The Signal</p>
            <h2 className="font-display text-2xl tracking-[-0.02em] mb-3">Murmas</h2>
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No requests yet. Be the first to make one!
              </div>
            ) : (
              requests.map((r) => (
                <RequestCard
                  key={r.id}
                  id={r.id}
                  slug={r.slug}
                  title={r.title}
                  description={r.description}
                  category={r.category as RequestCategory}
                  town={r.town}
                  upvoteCount={r.upvote_count}
                  hasUpvoted={upvotedIds.has(r.id)}
                  createdAt={r.created_at}
                  onUpvoteChange={() => { fetchRequests(); fetchUpvotes(); }}
                />
              ))
            )}
          </div>

          {/* Floating create button (mobile list view) */}
          <div className="md:hidden pointer-events-auto absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1">
            <Button
              size="sm"
              className="pointer-events-auto rounded-full shadow-lg gap-2 h-11 px-4"
              onClick={() => {
                setCreateOpen(true);
                setSearchParams({ create: "true" });
              }}
            >
              <Plus className="h-4 w-4" />
              Add murma
            </Button>
            {!user && (
              <span className="pointer-events-auto rounded-full bg-card/95 border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                Plan now — sign in required to add murmas
              </span>
            )}
          </div>
        </div>

        {/* Map */}
        <div className={`${mobileView === "map" ? "flex" : "hidden"} md:flex flex-1 relative`}>
          <MapView
            requests={mapRequests}
            businesses={[]}
            onMarkerClick={(id) => {
              if (pinMode) return;
              const r = requests.find((x) => x.id === id);
              navigate(buildRequestPath(id, r?.slug));
            }}
            onBusinessClick={undefined}
            onMapClick={handleMapClick}
            onCenterChange={(lat, lng) => setMapCenter({ lat, lng })}
            pinMode={pinMode}
            droppedPin={droppedPin}
          />

          {/* Drop pin floating control */}
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[400] flex justify-center px-3">
            {pinMode ? (
              <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-card/95 border border-primary/40 px-3 py-2 shadow-lg backdrop-blur">
                <MapPin className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Tap the map to drop a pin</span>
                <Button size="sm" variant="ghost" className="h-7 px-2" aria-label="Cancel pin drop" onClick={() => setPinMode(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="pointer-events-auto flex flex-col items-center gap-1">
                <Button
                  size="sm"
                  className="rounded-full shadow-lg gap-2"
                  onClick={() => {
                    setPinMode(true);
                    setMobileView("map");
                  }}
                >
                  <MapPin className="h-4 w-4" />
                  Drop pin to request
                </Button>
                {!user && (
                  <span className="rounded-full bg-card/95 border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                    Plan now — sign in required to post
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateRequestDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        onCreated={() => {
          fetchRequests();
          setDroppedPin(null);
          setInitialDraft(null);
          sessionStorage.removeItem("pendingRequest");
        }}
        pinLocation={droppedPin}
        mapCenter={mapCenter}
        initialDraft={initialDraft}
        onRequestPin={(draft) => {
          setInitialDraft(draft);
          setCreateOpen(false);
          setMobileView("map");
          setPinMode(true);
        }}
      />
    </div>
  );
}
