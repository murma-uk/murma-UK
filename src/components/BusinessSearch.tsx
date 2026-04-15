import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Store, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessResult {
  id?: string;
  osm_id: number;
  name: string;
  business_type: string;
  lat: number;
  lng: number;
  town: string;
  address?: string;
}

interface Props {
  town: string;
  selected: BusinessResult | null;
  onSelect: (business: BusinessResult | null) => void;
}

export default function BusinessSearch({ town, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchBusinesses = useCallback(async () => {
    if (!town.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      // First geocode the town to get a bounding box
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(town)}&format=json&limit=1&countrycodes=gb,ie`
      );
      const geoData = await geoRes.json();
      if (!geoData.length) {
        setResults([]);
        return;
      }

      const { lat, lon, boundingbox } = geoData[0];
      const [south, north, west, east] = boundingbox;

      // Query Overpass API for amenities/shops in the area
      const nameFilter = query.trim()
        ? `["name"~"${query.replace(/"/g, "")}", i]`
        : `["name"]`;

      const overpassQuery = `
        [out:json][timeout:10];
        (
          node["amenity"${nameFilter}](${south},${west},${north},${east});
          node["shop"${nameFilter}](${south},${west},${north},${east});
          node["leisure"${nameFilter}](${south},${west},${north},${east});
          node["tourism"${nameFilter}](${south},${west},${north},${east});
        );
        out body 50;
      `;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(overpassQuery)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();

      const businesses: BusinessResult[] = (data.elements || []).map((el: any) => ({
        osm_id: el.id,
        name: el.tags?.name || "Unknown",
        business_type: el.tags?.amenity || el.tags?.shop || el.tags?.leisure || el.tags?.tourism || "business",
        lat: el.lat,
        lng: el.lon,
        town,
        address: [el.tags?.["addr:street"], el.tags?.["addr:housenumber"]].filter(Boolean).join(" ") || undefined,
      }));

      setResults(businesses);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [town, query]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
        <Store className="h-4 w-4 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selected.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{selected.business_type.replace(/_/g, " ")}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onSelect(null)}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Search for a business (optional)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchBusinesses())}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={searchBusinesses}
          disabled={loading || !town.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {searched && results.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">No businesses found. Try a different search.</p>
      )}

      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border border-border divide-y divide-border">
          {results.map((b) => (
            <button
              key={b.osm_id}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent/50 transition-colors"
              onClick={() => onSelect(b)}
            >
              <Store className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {b.business_type.replace(/_/g, " ")}
                  {b.address ? ` · ${b.address}` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
