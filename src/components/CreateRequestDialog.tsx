import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Lock } from "lucide-react";
import { type RequestCategory } from "@/lib/categories";
import { suggestTitleAndDescription } from "@/lib/wishClassifier";
import WishComposer, { type WishComposerSubmit } from "./request/WishComposer";
import { type ResolvedLocation } from "./request/LocationPicker";

interface PinLocation {
  lat: number;
  lng: number;
  town: string;
}

export interface RequestDraft {
  wish?: string;
  category?: RequestCategory | null;
  location?: ResolvedLocation | null;
  extra?: string;
  // legacy fields kept for back-compat with previously saved drafts
  lat?: number;
  lng?: number;
  town?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  pinLocation?: PinLocation | null;
  mapCenter?: { lat: number; lng: number; town?: string } | null;
  initialDraft?: RequestDraft | null;
  onRequestPin?: (draft: RequestDraft) => void;
}

export default function CreateRequestDialog({
  open,
  onOpenChange,
  onCreated,
  pinLocation,
  mapCenter,
  initialDraft,
  onRequestPin,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState<RequestDraft | null>(null);

  useEffect(() => {
    if (open && initialDraft) setHydrated(initialDraft);
    if (!open) setHydrated(null);
  }, [open, initialDraft]);

  const handleSubmit = async (payload: WishComposerSubmit) => {
    // Guest → save draft + redirect to auth
    if (!user) {
      const draft: RequestDraft = {
        wish: payload.wish,
        category: payload.category,
        location: payload.location,
        extra: payload.extraDetail,
        lat: payload.location.lat,
        lng: payload.location.lng,
        town: payload.location.town,
      };
      try {
        sessionStorage.setItem("pendingRequest", JSON.stringify(draft));
      } catch {}
      toast({
        title: "Draft saved",
        description: "Sign in to post your wish — we'll bring you back here.",
      });
      onOpenChange(false);
      navigate("/auth?redirect=/explore&resume=request");
      return;
    }

    setLoading(true);
    try {
      let { lat, lng, town } = payload.location;

      // If we don't have coords, geocode the town
      if ((lat == null || lng == null) && town) {
        const { data: geo } = await supabase.functions.invoke("geocode", {
          body: { mode: "forward", query: town },
        });
        if (geo && typeof (geo as any).lat === "number") {
          lat = (geo as any).lat;
          lng = (geo as any).lng;
          if (!town && (geo as any).town) town = (geo as any).town;
        }
      }

      // Validate location is complete before submission
      if (lat == null || lng == null || !town) {
        throw new Error("Please select a location to submit your murma");
      }

      const { title, description } = suggestTitleAndDescription(payload.wish, payload.hints, town);
      const finalDescription = [description, payload.extraDetail].filter(Boolean).join("\n\n");

      const insertRow: any = {
        title: title || payload.wish.slice(0, 120),
        description: finalDescription || null,
        category: payload.category,
        town,
        lat,
        lng,
        user_id: user.id,
        field_values: {} as any,
      };

      // For new_branch, fill business hint fields when we have them
      if (payload.category === ("new_branch" as RequestCategory)) {
        if (payload.hints.businessKind === "type" && payload.hints.typeSlug) {
          insertRow.business_kind = "type";
          insertRow.business_type_slug = payload.hints.typeSlug;
        } else if (payload.hints.businessKind === "brand" && payload.hints.brandName) {
          insertRow.business_kind = "brand";
          insertRow.brand_name = payload.hints.brandName;
        }
      }

      const { error } = await supabase.from("requests").insert(insertRow);
      if (error) throw error;

      toast({
        title: "Your wish is live ✨",
        description: "It's now on the map for others to back.",
      });
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast({
        title: "Couldn't post your wish",
        description: err.message ?? "Something went wrong — please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isGuest = !user;

  // Resolve initial location from hydrated draft, pin, or legacy fields
  const initialLocation: ResolvedLocation | null =
    hydrated?.location
      ? hydrated.location
      : pinLocation
        ? { source: "pin", town: pinLocation.town, lat: pinLocation.lat, lng: pinLocation.lng }
        : hydrated?.lat != null && hydrated?.lng != null
          ? { source: "town", town: hydrated.town ?? "", lat: hydrated.lat, lng: hydrated.lng }
          : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
            What would you love to see?
          </DialogTitle>
          {pinLocation?.town ? (
            <DialogDescription className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Pinned at {pinLocation.town}
            </DialogDescription>
          ) : (
            <DialogDescription className="text-xs">
              Big or small, natural or commercial — only positive wishes here.
            </DialogDescription>
          )}
        </DialogHeader>

        {isGuest && (
          <Alert className="border-primary/30 bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              You can plan your wish now. Sign-in only kicks in when you post — your draft will be saved.
            </AlertDescription>
          </Alert>
        )}

        <WishComposer
          isGuest={isGuest}
          loading={loading}
          pinLocation={pinLocation}
          mapCenter={mapCenter}
          initialWish={hydrated?.wish ?? ""}
          initialCategory={hydrated?.category ?? null}
          initialLocation={initialLocation}
          initialExtra={hydrated?.extra ?? ""}
          onRequestPin={
            onRequestPin
              ? (snap) =>
                  onRequestPin({
                    wish: snap.wish,
                    category: snap.category,
                    extra: snap.extra,
                    location: initialLocation,
                  })
              : undefined
          }
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
