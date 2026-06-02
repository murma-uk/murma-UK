import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3.23.8";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

const BodySchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("forward"), query: z.string().min(1).max(200) }),
  z.object({
    mode: z.literal("reverse"),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
]);

function pickTown(components: any[] = []): string {
  const byType = (t: string) =>
    components.find((c) => Array.isArray(c.types) && c.types.includes(t))?.long_name;
  return (
    byType("postal_town") ||
    byType("locality") ||
    byType("sublocality") ||
    byType("administrative_area_level_2") ||
    byType("administrative_area_level_1") ||
    ""
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
    return new Response(JSON.stringify({ error: "Google Maps connector not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const params = new URLSearchParams();
  if (parsed.data.mode === "forward") {
    params.set("address", parsed.data.query);
    params.set("region", "gb");
    params.set("components", "country:GB|country:IE");
  } else {
    params.set("latlng", `${parsed.data.lat},${parsed.data.lng}`);
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/maps/api/geocode/json?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
      },
    });
    const data = await res.json();
    if (!res.ok || data.status !== "OK" || !data.results?.length) {
      return new Response(
        JSON.stringify({ error: data.error_message || data.status || "No result" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const top = data.results[0];
    const body =
      parsed.data.mode === "forward"
        ? {
            lat: top.geometry.location.lat,
            lng: top.geometry.location.lng,
            town: pickTown(top.address_components),
            formatted: top.formatted_address,
          }
        : {
            town: pickTown(top.address_components),
            formatted: top.formatted_address,
          };
    return new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
