import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MapView from "@/components/MapView";
import RequestCard from "@/components/RequestCard";
import { getNearbyPoints, convertKmToMiles } from "@/utils/geoUtils";
import { buildRequestPath } from "@/lib/slug";
import { Loader2, MapPin, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import { type RequestCategory } from "@/lib/categories";

interface NearbyRequest {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  category: RequestCategory;
  town: string;
  lat: number;
  lng: number;
  upvote_count: number;
  cosigner_count: number;
  status: string;
  created_at: string;
  distance_km: number;
}

export default function TownPage() {
  const { location } = useParams<{ location: string }>();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();

  const [centerLat, setCenterLat] = useState<number | null>(null);
  const [centerLng, setCenterLng] = useState<number | null>(null);
  const [townName, setTownName] = useState<string>("");
  const [nearbyRequests, setNearbyRequests] = useState<NearbyRequest[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  // Parse coordinates from URL param
  useEffect(() => {
    if (!location) {
      setError("Invalid location");
      setLoading(false);
      return;
    }

    const parts = location.split(",");
    if (parts.length !== 2) {
      setError("Invalid location format");
      setLoading(false);
      return;
    }

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);

    if (isNaN(lat) || isNaN(lng)) {
      setError("Invalid coordinates");
      setLoading(false);
      return;
    }

    setCenterLat(lat);
    setCenterLng(lng);

    // Get town name from query param or reverse geocode
    const townParam = searchParams.get("town");
    if (townParam) {
      setTownName(decodeURIComponent(townParam));
    } else {
      // Attempt reverse geocoding
      const reverseGeocode = async () => {
        try {
          const { data } = await supabase.functions.invoke("geocode", {
            body: { mode: "reverse", lat, lng },
          });
          if (data?.town) {
            setTownName(data.town);
          } else {
            setTownName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
          }
        } catch {
          setTownName(`${lat.toFixed(2)}, ${lng.toFixed(2)}`);
        }
      };
      reverseGeocode();
    }
  }, [location, searchParams]);

  // Fetch nearby requests
  const fetchNearbyRequests = useCallback(async () => {
    if (centerLat === null || centerLng === null) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all active requests
      const { data, error: fetchError } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "active")
        .order("upvote_count", { ascending: false });

      if (fetchError) throw fetchError;

      const requests = (data ?? []) as NearbyRequest[];

      // Calculate distances and filter (getNearbyPoints returns within 1 mile, max 10)
      const nearby = getNearbyPoints(requests, centerLat, centerLng, {
        radiusKm: 1.6, // 1 mile
        limit: 10, // max 10 results
      });

      setNearbyRequests(nearby);
    } catch (err: any) {
      console.error("Error fetching nearby requests:", err);
      setError(err.message ?? "Failed to load nearby murmas");
    } finally {
      setLoading(false);
    }
  }, [centerLat, centerLng]);

  // Fetch upvotes for current user
  const fetchUpvotes = useCallback(async () => {
    if (!user) {
      setUpvotedIds(new Set());
      return;
    }
    const { data } = await supabase.from("upvotes").select("request_id").eq("user_id", user.id);
    setUpvotedIds(new Set(data?.map((u) => u.request_id) ?? []));
  }, [user]);

  useEffect(() => {
    if (centerLat !== null && centerLng !== null) {
      fetchNearbyRequests();
    }
  }, [centerLat, centerLng, fetchNearbyRequests]);

  useEffect(() => {
    fetchUpvotes();
  }, [fetchUpvotes]);

  const handleShare = async () => {
    const currentUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(currentUrl);
      setShared(true);
      toast({
        title: "Copied to clipboard",
        description: "Share this link with others to show them this town's murmas.",
      });
      setTimeout(() => setShared(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const mapRequests = nearbyRequests.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    lat: r.lat,
    lng: r.lng,
    town: r.town,
    upvote_count: r.upvote_count,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${townName} • Murma`}
        description={`Discover ${nearbyRequests.length} murmas near ${townName}`}
        path={`/town/${location}`}
      />
      <Navbar />

      {error ? (
        <section className="border-b border-border bg-popover">
          <div className="container py-16">
            <h1 className="font-display text-4xl tracking-[-0.02em] mb-4">Location not found</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </section>
      ) : loading ? (
        <section className="border-b border-border bg-popover">
          <div className="container py-16 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </section>
      ) : (
        <>
          {/* Header */}
          <section className="border-b border-border bg-popover">
            <div className="container py-12">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h1 className="font-display text-4xl tracking-[-0.02em]">{townName}</h1>
                  </div>
                  <p className="text-muted-foreground">
                    {nearbyRequests.length} {nearbyRequests.length === 1 ? "murma" : "murmas"} within 1 mile
                  </p>
                </div>
                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="gap-2"
                  size="lg"
                >
                  {shared ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Share Town
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Main Content */}
          <div className="container py-12">
            {nearbyRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-6">
                  No murmas found in {townName} yet. Be the first to add one!
                </p>
                <Link to="/explore?create=true">
                  <Button>Add the First Murma</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Primary: List View */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="font-heading text-xl font-semibold mb-4">Nearby Murmas</h2>
                  {nearbyRequests.map((request) => (
                    <div key={request.id} className="space-y-2">
                      <div className="text-xs text-muted-foreground font-mono">
                        {convertKmToMiles(request.distance_km).toFixed(1)} mi away
                      </div>
                      <RequestCard
                        id={request.id}
                        slug={request.slug}
                        title={request.title}
                        description={request.description}
                        category={request.category}
                        town={request.town}
                        upvoteCount={request.upvote_count}
                        hasUpvoted={upvotedIds.has(request.id)}
                        createdAt={request.created_at}
                        onUpvoteChange={fetchUpvotes}
                      />
                    </div>
                  ))}
                </div>

                {/* Secondary: Map View */}
                <div className="lg:col-span-1 sticky top-20 h-[500px] rounded-lg border border-border overflow-hidden">
                  {centerLat !== null && centerLng !== null && (
                    <MapView
                      requests={mapRequests}
                      center={[centerLat, centerLng]}
                      onRequestClick={() => {}} // Read-only map
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
