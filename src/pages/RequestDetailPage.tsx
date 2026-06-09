import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { useCategories, getCategory, type RequestCategory } from "@/lib/categories";
import { useCategoryFields, formatFieldValue } from "@/lib/categoryFields";
import { buildRequestPath, parseRequestParam } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { ArrowBigUp, MapPin, ArrowLeft, Loader2, Store } from "lucide-react";
import ShareButton from "@/components/ShareButton";
import StatTile, { formatLiveSince } from "@/components/brand/StatTile";
import { motion } from "framer-motion";
import SEO from "@/components/SEO";
import RequestEngagement from "@/components/request/RequestEngagement";


export default function RequestDetailPage() {
  const { id: routeParam } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: categories } = useCategories();
  const cat = request ? getCategory(categories, request.category as RequestCategory) : null;
  const { data: fields = [] } = useCategoryFields(cat?.id || undefined);
  const viewedRef = useRef<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!routeParam) return;
    const { uuid, shortId } = parseRequestParam(routeParam);

    let reqQuery = supabase.from("requests").select("*");
    if (uuid) {
      reqQuery = reqQuery.eq("id", uuid);
    } else if (shortId) {
      reqQuery = (reqQuery as any).eq("id_short", shortId);
    } else {
      setRequest(null);
      setLoading(false);
      return;
    }

    const { data: reqRows } = await reqQuery
      .order("created_at", { ascending: false })
      .limit(1);
    const reqData = reqRows?.[0] ?? null;
    setRequest(reqData);

    if (!reqData) {
      setLoading(false);
      return;
    }

    const canonical = buildRequestPath(reqData.id, (reqData as any).slug);
    if (canonical !== `/request/${routeParam}`) {
      navigate(canonical, { replace: true });
    }

    if (reqData.business_id) {
      const { data: bizData } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", reqData.business_id)
        .single();
      setBusiness(bizData);
    } else {
      setBusiness(null);
    }

    if (user) {
      const { data } = await supabase
        .from("upvotes")
        .select("id")
        .eq("request_id", reqData.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setHasUpvoted(!!data);
    }

    // Track a view exactly once per page-load.
    if (viewedRef.current !== reqData.id) {
      viewedRef.current = reqData.id;
      supabase.rpc("increment_request_view", { _request_id: reqData.id }).then(() => {
        setRequest((prev: any) =>
          prev && prev.id === reqData.id ? { ...prev, view_count: (prev.view_count ?? 0) + 1 } : prev,
        );
      });
    }

    setLoading(false);
  }, [routeParam, user, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpvote = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!request?.id) return;
    if (hasUpvoted) {
      await supabase.from("upvotes").delete().eq("request_id", request.id).eq("user_id", user.id);
    } else {
      await supabase.from("upvotes").insert({ request_id: request.id, user_id: user.id });
    }
    fetchData();
  };

  const handleShared = () => {
    setRequest((prev: any) => (prev ? { ...prev, share_count: (prev.share_count ?? 0) + 1 } : prev));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          Request not found.
        </div>
      </div>
    );
  }

  const catResolved = cat ?? getCategory(categories, request.category as RequestCategory);
  const Icon = catResolved.Icon;
  const fieldValues = (request.field_values ?? {}) as Record<string, unknown>;
  const structured = fields
    .map((f) => ({ label: f.label, value: formatFieldValue(f, fieldValues[f.key]) }))
    .filter((x) => x.value);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${request.title} — Hey, Open Up`}
        description={(request.description || `Community request in ${request.town}. Upvote to add your voice.`).slice(0, 158)}
        path={buildRequestPath(request.id, (request as any).slug)}
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: request.title,
          description: (request.description || "").slice(0, 200),
          datePublished: request.created_at,
          articleSection: catResolved?.label,
          locationCreated: request.town ? { "@type": "Place", name: request.town } : undefined,
        }}
      />
      <Navbar />
      <div className="container max-w-2xl py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 font-mono text-xs uppercase tracking-[0.15em] text-text-lo transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.12em]"
              style={{
                borderColor: `${catResolved.color}40`,
                backgroundColor: `${catResolved.color}14`,
                color: catResolved.color,
              }}
            >
              <Icon className="h-3 w-3" />
              {catResolved.label}
            </span>
            <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-[0.12em] text-text-lo">
              <MapPin className="h-3 w-3" />
              {request.town}
            </span>
          </div>

          <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-[0.02em] md:text-5xl">{request.title}</h1>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Live" value={formatLiveSince(request.created_at)} />
            <StatTile label="Upvotes" value={request.upvote_count ?? 0} />
            <StatTile label="Co-signers" value={(request as any).cosigner_count ?? 0} />
            <StatTile label="Views" value={request.view_count ?? 0} />
          </div>


          {structured.length > 0 && (
            <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              {structured.map((s) => (
                <div key={s.label} className="contents">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {request.description && (
            <p className="mt-3 text-muted-foreground leading-relaxed whitespace-pre-line">{request.description}</p>
          )}

          {business && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <Store className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{business.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {business.business_type?.replace(/_/g, " ")} · {business.town}
                </p>
              </div>
            </div>
          )}

          {request.brand_name && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-civic/30 bg-civic/5 p-3">
              <Store className="h-4 w-4 text-civic shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium">{request.brand_name}</p>
                {request.brand_website && (
                  <a
                    href={request.brand_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-civic hover:underline truncate block"
                  >
                    {request.brand_website.replace(/^https?:\/\/(www\.)?/, "")}
                  </a>
                )}
              </div>
            </div>
          )}

          {request.radius_m && (
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-text-lo">
              Within {(request.radius_m / 1609.344).toFixed(2).replace(/\.?0+$/, "")} mi of {request.town}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              onClick={handleUpvote}
              variant={hasUpvoted ? "default" : "outline"}
              className="gap-2 font-heading font-medium"
            >
              <ArrowBigUp className="h-5 w-5" />
              {hasUpvoted ? "Upvoted" : "Upvote"}
              <span className="ml-1 font-bold">{request.upvote_count}</span>
            </Button>
            <ShareButton
              id={request.id}
              slug={(request as any).slug}
              title={request.title}
              description={request.description}
              variant="full"
              onShared={handleShared}
            />
            <span className="font-mono text-xs uppercase tracking-[0.15em] text-text-lo">
              Posted {new Date(request.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
