// Edge function: link-business
// Receives an OSM identifier from the client, fetches the canonical record
// from OpenStreetMap server-side, and upserts into public.businesses using
// the service role. The client cannot forge name/coords/etc.
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

type OsmType = "node" | "way" | "relation";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    // ---- Auth ----
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);

    // ---- Validate input ----
    const body = await req.json().catch(() => null) as
      | { osm_id?: unknown; osm_type?: unknown }
      | null;
    if (!body) return json({ error: "Invalid JSON body" }, 400);

    const osmIdNum = Number(body.osm_id);
    const osmType = String(body.osm_type ?? "").toLowerCase() as OsmType;
    if (!Number.isFinite(osmIdNum) || osmIdNum <= 0) {
      return json({ error: "osm_id must be a positive number" }, 400);
    }
    if (osmType !== "node" && osmType !== "way" && osmType !== "relation") {
      return json({ error: "osm_type must be node|way|relation" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // ---- Existing row? Just return it. ----
    const { data: existing } = await admin
      .from("businesses")
      .select("id")
      .eq("osm_id", osmIdNum)
      .maybeSingle();
    if (existing) return json({ business_id: existing.id });

    // ---- Fetch canonical OSM record ----
    const ua = "HeyOpenUp/1.0 (link-business edge fn)";
    const osmRes = await fetch(
      `https://www.openstreetmap.org/api/0.6/${osmType}/${osmIdNum}.json`,
      { headers: { "User-Agent": ua, "Accept": "application/json" } },
    );
    if (!osmRes.ok) {
      return json({ error: `OSM lookup failed (${osmRes.status})` }, 502);
    }
    const osmJson = await osmRes.json() as {
      elements?: Array<{
        type: string;
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };
    const el = osmJson.elements?.[0];
    if (!el || !el.tags) return json({ error: "OSM record not found" }, 404);

    const name = el.tags.name;
    if (!name) return json({ error: "OSM record has no name" }, 422);

    const business_type = el.tags.shop ?? el.tags.amenity ?? el.tags.leisure ??
      el.tags.tourism ?? "business";

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return json({ error: "OSM record has no coordinates" }, 422);
    }

    const address = [el.tags["addr:housenumber"], el.tags["addr:street"]]
      .filter(Boolean).join(" ") || null;

    // ---- Reverse-geocode town (best effort) ----
    let town = "";
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=12&addressdetails=1`,
        { headers: { "User-Agent": ua } },
      );
      if (geoRes.ok) {
        const g = await geoRes.json();
        town = g?.address?.city || g?.address?.town || g?.address?.village ||
          g?.address?.suburb || g?.address?.county || "";
      }
    } catch { /* ignore */ }

    // ---- Insert via service role ----
    const { data: inserted, error: insErr } = await admin
      .from("businesses")
      .insert({
        osm_id: osmIdNum,
        name,
        business_type,
        lat,
        lng,
        town,
        address,
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("link-business DB insert error:", insErr);
      return json({ error: "Failed to save business record." }, 500);
    }

    return json({ business_id: inserted.id });
  } catch (err) {
    console.error("link-business error:", err);
    return json({ error: "Internal server error." }, 500);
  }
});
