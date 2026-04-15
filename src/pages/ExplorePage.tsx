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
import { Loader2 } from "lucide-react";

export default function ExplorePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<any[]>([]);
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<RequestCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(searchParams.get("create") === "true");

  const fetchRequests = useCallback(async () => {
    let query = supabase.from("requests").select("*").eq("status", "active").order("upvote_count", { ascending: false });
    if (selectedCategory) query = query.eq("category", selectedCategory);
    const { data } = await query;
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

  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open);
    if (!open) setSearchParams({});
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

  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="flex w-full flex-col border-r border-border md:w-96">
          <div className="border-b border-border p-4">
            <h2 className="mb-3 font-heading text-lg font-bold">Requests</h2>
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
        </div>

        {/* Map */}
        <div className="hidden flex-1 md:block">
          <MapView requests={mapRequests} />
        </div>
      </div>

      <CreateRequestDialog
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        onCreated={fetchRequests}
      />
    </div>
  );
}
