import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RequestCategory } from "@/lib/categories";

export interface SimilarRequest {
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
  distance_km: number;
  trgm_score: number;
  score: number;
}

interface UseSimilarArgs {
  text: string;
  category: RequestCategory | null;
  lat: number | null | undefined;
  lng: number | null | undefined;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Debounced lookup of nearby requests likely to be duplicates.
 * Returns up to 5 ranked candidates from the find_similar_requests RPC.
 */
export function useSimilarRequests({
  text,
  category,
  lat,
  lng,
  enabled = true,
  debounceMs = 350,
}: UseSimilarArgs) {
  const [results, setResults] = useState<SimilarRequest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || text.trim().length < 10 || lat == null || lng == null) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase.rpc("find_similar_requests", {
        _text: text.trim(),
        _category: category as any,
        _lat: lat,
        _lng: lng,
        _limit: 5,
      });
      if (cancelled) return;
      if (error) {
        setResults([]);
      } else {
        setResults((data ?? []) as SimilarRequest[]);
      }
      setLoading(false);
    }, debounceMs);
    return () => {
      cancelled = true;
      clearTimeout(handle);
      setLoading(false);
    };
  }, [text, category, lat, lng, enabled, debounceMs]);

  return { results, loading };
}
