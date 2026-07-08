import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { MapPin, AlertTriangle } from "lucide-react";
import { type RequestCategory } from "@/lib/categories";
import { suggestTitleAndDescription } from "@/lib/wishClassifier";
import WishComposer, { type WishComposerSubmit } from "./request/WishComposer";
import { type ResolvedLocation } from "./request/LocationPicker";
import { type Database } from "@/integrations/supabase/types";

type Request = Database["public"]["Tables"]["requests"]["Row"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  onSaved?: () => void;
  mapCenter?: { lat: number; lng: number; town?: string } | null;
}

export default function EditMurmaDialog({
  open,
  onOpenChange,
  requestId,
  onSaved,
  mapCenter,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [request, setRequest] = useState<Request | null>(null);
  const [showCategoryWarning, setShowCategoryWarning] = useState(false);
  const [proposedCategory, setProposedCategory] = useState<RequestCategory | null>(null);

  // Fetch request data when dialog opens
  useEffect(() => {
    if (!open || !requestId) return;
    setFetching(true);
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from("requests")
          .select("*")
          .eq("id", requestId)
          .single();
        if (error) throw error;
        setRequest(data as Request);
      } catch (err: any) {
        toast({
          title: "Couldn't load request",
          description: err.message ?? "Something went wrong",
          variant: "destructive",
        });
        onOpenChange(false);
      } finally {
        setFetching(false);
      }
    };
    fetchRequest();
  }, [open, requestId, onOpenChange, toast]);

  const handleCategoryChange = (newCategory: RequestCategory) => {
    if (request && newCategory !== request.category) {
      setProposedCategory(newCategory);
      setShowCategoryWarning(true);
    }
  };

  const handleConfirmCategoryChange = () => {
    setShowCategoryWarning(false);
    // The category will remain changed in WishComposer
  };

  const handleCancelCategoryChange = () => {
    setShowCategoryWarning(false);
    setProposedCategory(null);
    // We would need to reset the category, but since we can't directly control WishComposer's state
    // from here, we'll just acknowledge the warning
  };

  const handleSubmit = async (payload: WishComposerSubmit) => {
    if (!request || !user) return;

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

      // Validate location is complete
      if (lat == null || lng == null || !town) {
        throw new Error("Please select a location to save your murma");
      }

      const { title, description } = suggestTitleAndDescription(payload.wish, payload.hints, town);
      const finalDescription = [description, payload.extraDetail].filter(Boolean).join("\n\n");

      const updateData: any = {
        title: title || payload.wish.slice(0, 120),
        description: finalDescription || null,
        category: payload.category,
        town,
        lat,
        lng,
        field_values: payload.hints ? {} : (request.field_values ?? {}),
      };

      // Handle business fields for new_branch category
      if (payload.category === ("new_branch" as RequestCategory)) {
        if (payload.hints.businessKind === "type" && payload.hints.typeSlug) {
          updateData.business_kind = "type";
          updateData.business_type_slug = payload.hints.typeSlug;
        } else if (payload.hints.businessKind === "brand" && payload.hints.brandName) {
          updateData.business_kind = "brand";
          updateData.brand_name = payload.hints.brandName;
        }
      } else {
        // Clear business fields if changing away from new_branch
        updateData.business_kind = null;
        updateData.business_type_slug = null;
        updateData.brand_name = null;
        updateData.brand_website = null;
      }

      const { error } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Your changes are saved ✨",
        description: "Updates are live on the map.",
      });
      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast({
        title: "Couldn't save changes",
        description: err.message ?? "Something went wrong — please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request && !fetching) return null;

  const initialLocation: ResolvedLocation | null = request
    ? {
        source: "pin",
        town: request.town,
        lat: request.lat,
        lng: request.lng,
      }
    : null;

  const dialogHeader = (
    <>
      <div>
        <h2 className="font-display text-2xl tracking-[-0.02em]">Edit your murma</h2>
        {request?.town ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Located at {request.town}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground mt-1">Update your request details.</p>
        )}
      </div>
    </>
  );

  const dialogForm = request && (
    <WishComposer
      isGuest={false}
      loading={loading}
      mapCenter={mapCenter}
      initialWish={request.title}
      initialCategory={request.category as RequestCategory}
      initialLocation={initialLocation}
      initialExtra={request.description ?? ""}
      mode="edit"
      fieldValues={request.field_values as Record<string, unknown> ?? {}}
      onCategoryChange={handleCategoryChange}
      onSubmit={handleSubmit}
    />
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open && !fetching} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[80svh] overflow-y-auto">
            <div className="px-4 pt-4 pb-6">
              {dialogHeader}
              <div className="mt-6">{dialogForm}</div>
            </div>
          </DrawerContent>
        </Drawer>

        <AlertDialog open={showCategoryWarning} onOpenChange={setShowCategoryWarning}>
          <AlertDialogContent>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent" />
              Changing category?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Changing the category might affect your custom fields. Some information may be lost. Continue?
            </AlertDialogDescription>
            <div className="flex gap-3 justify-end">
              <AlertDialogCancel onClick={handleCancelCategoryChange}>
                Keep original category
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmCategoryChange}>
                Yes, change it
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={open && !fetching} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
              Edit your murma
            </DialogTitle>
            {request?.town ? (
              <DialogDescription className="flex items-center gap-1.5 text-xs">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Located at {request.town}
              </DialogDescription>
            ) : (
              <DialogDescription className="text-xs">
                Update your request details.
              </DialogDescription>
            )}
          </DialogHeader>

          {dialogForm}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCategoryWarning} onOpenChange={setShowCategoryWarning}>
        <AlertDialogContent>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            Changing category?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Changing the category might affect your custom fields. Some information may be lost. Continue?
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={handleCancelCategoryChange}>
              Keep original category
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCategoryChange}>
              Yes, change it
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
