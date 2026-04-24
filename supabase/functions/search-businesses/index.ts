const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SearchBody {
  town: string;
  query?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { town, query } = (await req.json()) as SearchBody;

    if (!town || typeof town !== "string" || town.trim().length === 0) {
      return new Response(JSON.stringify({ error: "town is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Geocode the town via Nominatim
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        town
      )}&format=json&limit=1&countrycodes=gb,ie`,
      { headers: { "User-Agent": "lovable-community-requests/1.0" } }
    );
    const geoData = await geoRes.json();
    if (!Array.isArray(geoData) || geoData.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { boundingbox } = geoData[0];
    const [south, north, west, east] = boundingbox;

    // 2. Build Overpass query
    const cleanedQuery = (query ?? "").trim().replace(/["\\]/g, "");
    const nameFilter = cleanedQuery
      ? `["name"~"${cleanedQuery}",i]`
      : `["name"]`;

    const overpassQuery = `
      [out:json][timeout:15];
      (
        node["amenity"]${nameFilter}(${south},${west},${north},${east});
        node["shop"]${nameFilter}(${south},${west},${north},${east});
        node["leisure"]${nameFilter}(${south},${west},${north},${east});
        node["tourism"]${nameFilter}(${south},${west},${north},${east});
        way["amenity"]${nameFilter}(${south},${west},${north},${east});
        way["shop"]${nameFilter}(${south},${west},${north},${east});
      );
      out center 50;
    `;

    // 3. Try multiple Overpass mirrors (the main one fails often)
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.osm.ch/api/interpreter",
    ];

    let data: any = null;
    let lastErr: string | null = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: "POST",
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "lovable-community-requests/1.0",
          },
        });
        if (!res.ok) {
          lastErr = `${url} → ${res.status}`;
          continue;
        }
        data = await res.json();
        break;
      } catch (e) {
        lastErr = `${url} → ${(e as Error).message}`;
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({ error: "All Overpass endpoints failed", detail: lastErr }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = (data.elements || [])
      .map((el: any) => {
        const lat = el.lat ?? el.center?.lat;
        const lng = el.lon ?? el.center?.lon;
        if (lat == null || lng == null) return null;
        return {
          osm_id: el.id,
          osm_type: (el.type as "node" | "way" | "relation") ?? "node",
          name: el.tags?.name || "Unknown",
          business_type:
            el.tags?.amenity ||
            el.tags?.shop ||
            el.tags?.leisure ||
            el.tags?.tourism ||
            "business",
          lat,
          lng,
          town,
          address:
            [el.tags?.["addr:housenumber"], el.tags?.["addr:street"]]
              .filter(Boolean)
              .join(" ") || undefined,
        };
      })
      .filter(Boolean);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
