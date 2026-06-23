import { useState, useEffect, useMemo, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Lock, ArrowRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { type RequestCategory } from "@/lib/categories";
import { classifyWish, suggestTitleAndDescription, type WishHints } from "@/lib/wishClassifier";
import { flagNegativePhrasing } from "@/lib/positivityCheck";
import CategoryChips from "./CategoryChips";
import LocationPicker, { type ResolvedLocation } from "./LocationPicker";
import SimilarRequestsPanel from "./SimilarRequestsPanel";
import JoinRequestDialog from "./JoinRequestDialog";
import { useSimilarRequests, type SimilarRequest } from "@/lib/similarRequests";


const PLACEHOLDERS = [
  "I'd like a ramen shop near the station…",
  "A bat box in the park would be great…",
  "This town needs a late-night bookshop…",
  "A wildflower meadow by the canal…",
  "A poetry night at the old chapel…",
];

export interface WishComposerSubmit {
  wish: string;
  category: RequestCategory;
  location: ResolvedLocation;
  hints: WishHints;
  extraDetail: string;
}

interface Props {
  isGuest: boolean;
  loading: boolean;
  pinLocation?: { lat: number; lng: number; town: string } | null;
  mapCenter?: { lat: number; lng: number; town?: string } | null;
  initialWish?: string;
  initialCategory?: RequestCategory | null;
  initialLocation?: ResolvedLocation | null;
  initialExtra?: string;
  onRequestPin?: (snapshot: { wish: string; category: RequestCategory | null; extra: string }) => void;
  onSubmit: (payload: WishComposerSubmit) => void;
}

export default function WishComposer({
  isGuest,
  loading,
  pinLocation,
  mapCenter,
  initialWish = "",
  initialCategory = null,
  initialLocation = null,
  initialExtra = "",
  onRequestPin,
  onSubmit,
}: Props) {
  const [wish, setWish] = useState(initialWish);
  const [manualCategory, setManualCategory] = useState<RequestCategory | null>(initialCategory);
  const [location, setLocation] = useState<ResolvedLocation | null>(initialLocation);
  const [extraOpen, setExtraOpen] = useState(false);
  const [extra, setExtra] = useState(initialExtra);
  const [similarDismissed, setSimilarDismissed] = useState(false);
  const [joinTarget, setJoinTarget] = useState<SimilarRequest | null>(null);
  const wishRef = useRef<HTMLTextAreaElement>(null);


  // Cycle placeholders for a bit of life
  const [placeholderIdx, setPlaceholderIdx] = useState(() => Math.floor(Math.random() * PLACEHOLDERS.length));
  useEffect(() => {
    if (wish) return;
    const t = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length), 4500);
    return () => clearInterval(t);
  }, [wish]);

  // Autofocus the wish input
  useEffect(() => {
    const t = setTimeout(() => wishRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Sync pin → location
  useEffect(() => {
    if (pinLocation) {
      setLocation({
        source: "pin",
        town: pinLocation.town,
        lat: pinLocation.lat,
        lng: pinLocation.lng,
      });
    }
  }, [pinLocation?.lat, pinLocation?.lng]);

  // Default to map view if available and nothing set
  useEffect(() => {
    if (!location && mapCenter) {
      setLocation({
        source: "map_view",
        town: mapCenter.town ?? "",
        lat: mapCenter.lat,
        lng: mapCenter.lng,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapCenter?.lat, mapCenter?.lng]);

  const hints = useMemo(() => classifyWish(wish), [wish]);
  const guessedCategory = hints.category;
  const effectiveCategory = manualCategory ?? guessedCategory;

  const positivityWarning = useMemo(() => flagNegativePhrasing(wish), [wish]);

  const wishReady = wish.trim().length >= 6;
  const locationReady = !!location && (!!location.town || location.lat != null);
  const canSubmit = wishReady && locationReady && !!effectiveCategory && !loading;

  // Live similarity search
  const { results: similar, loading: similarLoading } = useSimilarRequests({
    text: wish,
    category: effectiveCategory ?? null,
    lat: location?.lat ?? null,
    lng: location?.lng ?? null,
    enabled: wishReady && locationReady && !similarDismissed,
  });


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !effectiveCategory || !location) return;
    onSubmit({
      wish: wish.trim(),
      category: effectiveCategory,
      location,
      hints,
      extraDetail: extra.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Step 1 — the murma */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5 text-xs uppercase tracking-[0.12em] font-mono text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" /> Your murma
        </Label>
        <Textarea
          ref={wishRef}
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={3}
          maxLength={240}
          className="resize-none text-base leading-snug"
        />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
          <span>One sentence is plenty.</span>
          <span>{wish.length}/240</span>
        </div>
        {positivityWarning && (
          <Alert className="border-accent/40 bg-accent/5 py-2">
            <AlertDescription className="text-xs">{positivityWarning}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Step 2 — where (revealed once wish has substance) */}
      {wishReady && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label className="text-xs uppercase tracking-[0.12em] font-mono text-muted-foreground">
            Where?
          </Label>
          <LocationPicker
            value={location}
            onChange={setLocation}
            mapCenter={mapCenter}
            pinLocation={pinLocation}
            onRequestPin={
              onRequestPin
                ? () =>
                    onRequestPin({
                      wish,
                      category: effectiveCategory ?? null,
                      extra,
                    })
                : undefined
            }
          />
        </div>
      )}

      {/* Step 3 — category (revealed once location is set) */}
      {wishReady && locationReady && (
        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label className="text-xs uppercase tracking-[0.12em] font-mono text-muted-foreground">
            File under
          </Label>
          <CategoryChips
            selected={manualCategory}
            autoGuessed={guessedCategory}
            onSelect={(c) => setManualCategory(c === manualCategory ? null : c)}
          />
        </div>
      )}

      {/* Similar murmas nearby — surfaced once we have murma + location */}
      {wishReady && locationReady && !similarDismissed && (similarLoading || similar.length > 0) && (
        <SimilarRequestsPanel
          results={similar}
          loading={similarLoading}
          onJoin={(t) => setJoinTarget(t)}
          onDismiss={() => setSimilarDismissed(true)}
        />
      )}


      {/* Optional details */}
      {wishReady && locationReady && (
        <div className="rounded-md border border-dashed border-border">
          <button
            type="button"
            onClick={() => setExtraOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-left font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            <span>Add detail (optional)</span>
            {extraOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {extraOpen && (
            <div className="space-y-2 border-t border-dashed border-border p-3">
              <Textarea
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
                placeholder="Anything else? Context, links, why this would be good…"
                rows={2}
                maxLength={500}
                className="resize-none text-sm"
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Button
          type="submit"
          className="w-full font-heading font-medium gap-2 h-11"
          disabled={!canSubmit}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isGuest ? (
            <>
              <Lock className="h-4 w-4" />
              Continue to sign in
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Add your murma"
          )}
        </Button>
        {isGuest && wishReady && (
          <p className="text-center text-[11px] text-muted-foreground">
            We'll save your draft and bring you back here after sign-in.
          </p>
        )}
      </div>

      <JoinRequestDialog
        open={!!joinTarget}
        onOpenChange={(v) => !v && setJoinTarget(null)}
        target={joinTarget}
        defaultMode="upvote"
        draft={{
          title: wish.trim(),
          body: extra.trim() || wish.trim(),
          category: effectiveCategory ?? null,
        }}
        onJoined={() => setJoinTarget(null)}
      />
    </form>
  );
}

