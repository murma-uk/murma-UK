import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import MapView, { type MapBusiness } from "@/components/MapView";
import RequestCard from "@/components/RequestCard";
import CategoryFilter from "@/components/CategoryFilter";
import CreateRequestDialog from "@/components/CreateRequestDialog";
import { type RequestCategory } from "@/lib/categories";
import { buildRequestPath } from "@/lib/slug";
import { Loader2, Store, List, Map as MapIcon, MapPin, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import SEO from "@/components/SEO";

export default function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<MapBusiness[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "true");
  const [viewMode, setViewMode] = useState<"businesses" | "requests">("businesses");
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [pinMode, setPinMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; town: string } | null>(null);
  const [initialDraft, setInitialDraft] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; town?: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    let query = supabase.from("requests").select("*").eq("status", "active").order("upvote_count", { ascending: false }) as any;
    if (selectedCategory) query = query.eq("category", selectedCategory);
    if (selectedBusinessId) query = query.eq("business_id", selectedBusinessId);
    const { data } = await query;
    setRequests(data ?? []);
    setLoading(false);
  }, [selectedCategory, selectedBusinessId]);

  const fetchBusinesses = useCallback(async () => {
    // Fetch businesses that have at least one request linked
    const { data } = await supabase.from("businesses").select("*");
    if (!data) return;

    // Count requests per business
    const { data: reqCounts } = await (supabase
      .from("requests")
      .select("business_id")
      .eq("status", "active")
      .not("business_id", "is", null) as any);

    const countMap = new Map<string, number>();
    reqCounts?.forEach((r: any) => {
      countMap.set(r.business_id, (countMap.get(r.business_id) || 0) + 1);
    });

    const mapped: MapBusiness[] = data
      .filter((b: any) => countMap.has(b.id))
      .map((b: any) => ({
        id: b.id,
        name: b.name,
        business_type: b.business_type || "business",
        lat: b.lat,
        lng: b.lng,
        town: b.town,
        request_count: countMap.get(b.id) || 0,
      }));

    setBusinesses(mapped);
  }, []);

  const fetchUpvotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("upvotes").select("request_id").eq("user_id", user.id);
    setUpvotedIds(new Set(data?.map((u) => u.request_id) ?? []));
  }, [user]);

  useEffect(() => {
    fetchRequests();
    fetchBusinesses();
    fetchUpvotes();
  }, [fetchRequests, fetchBusinesses, fetchUpvotes]);

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
  }, [user, navigate, toast]);

  const handleBusinessClick = (id: string) => {
    setSelectedBusinessId(id === selectedBusinessId ? null : id);
    setViewMode("requests");
  };

  const mapRequests = requests.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category as RequestCategory,
    lat: r.lat,
    lng: r.lng,
    town: r.town,
    upvote_count: r.upvote_count,
  }));

  const selectedBiz = businesses.find((b) => b.id === selectedBusinessId);

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
        <div className={`${mobileView === "list" ? "flex" : "hidden"} md:flex relative w-full flex-col border-r border-border md:w-96 md:flex-shrink-0`}>
          <div className="border-b border-border p-4">
            <p className="section-heading mb-2">The Signal</p>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-2xl tracking-[-0.02em]">
                {viewMode === "businesses" ? "Businesses" : "Murmas"}
              </h2>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "businesses" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => { setViewMode("businesses"); setSelectedBusinessId(null); }}
                >
                  <Store className="h-3.5 w-3.5" />
                  Businesses
                </Button>
                <Button
                  variant={viewMode === "requests" ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => { setViewMode("requests"); setSelectedBusinessId(null); }}
                >
                  <List className="h-3.5 w-3.5" />
                  Murmas
                </Button>
              </div>
            </div>

            {viewMode === "requests" && (
              <>
                {selectedBiz && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
                    <Store className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{selectedBiz.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedBiz.request_count} request{selectedBiz.request_count !== 1 ? "s" : ""}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedBusinessId(null)}>
                      Clear
                    </Button>
                  </div>
                )}
                <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : viewMode === "businesses" ? (
              businesses.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No businesses with murmas yet. Add a murma and link a business!
                </div>
              ) : (
                businesses.map((b) => (
                  <button
                    key={b.id}
                    className="w-full rounded-lg border border-border bg-card p-4 text-left hover:border-primary/30 transition-colors"
                    onClick={() => { handleBusinessClick(b.id); setMobileView("map"); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold truncate">{b.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {b.business_type.replace(/_/g, " ")} · {b.town}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">{b.request_count}</span>
                    </div>
                  </button>
                ))
              )
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
          <div className="md:hidden pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1">
            <Button
              size="sm"
              className="pointer-events-auto rounded-full shadow-lg gap-2 h-11 px-4"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New request
            </Button>
            {!user && (
              <span className="pointer-events-auto rounded-full bg-card/95 border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
                Plan now — sign in required to post
              </span>
            )}
          </div>
        </div>

        {/* Map */}
        <div className={`${mobileView === "map" ? "flex" : "hidden"} md:flex flex-1 relative`}>
          <MapView
            requests={viewMode === "requests" ? mapRequests : []}
            businesses={viewMode === "businesses" ? businesses : (selectedBiz ? [selectedBiz] : [])}
            onMarkerClick={(id) => {
              if (pinMode) return;
              const r = requests.find((x) => x.id === id);
              navigate(buildRequestPath(id, r?.slug));
            }}
            onBusinessClick={(id) => pinMode ? undefined : handleBusinessClick(id)}
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
          fetchBusinesses();
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
