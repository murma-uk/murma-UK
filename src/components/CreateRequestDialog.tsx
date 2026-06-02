import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCategories, type RequestCategory } from "@/lib/categories";
import {
  useCategoryFields,
  formatFieldValue,
  validateFieldValues,
  type CategoryField,
} from "@/lib/categoryFields";
import DynamicFieldRenderer from "./DynamicFieldRenderer";
import NewBranchFields, {
  defaultNewBranchValue,
  isNewBranchValid,
  composeNewBranchTitle,
  composeNewBranchDescription,
  RADIUS_OPTIONS,
  type NewBranchValue,
} from "./request/NewBranchFields";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Lock, ArrowRight } from "lucide-react";
import BusinessSearch, { type BusinessResult } from "./BusinessSearch";

interface PinLocation {
  lat: number;
  lng: number;
  town: string;
}

export interface RequestDraft {
  title?: string;
  description?: string;
  category?: RequestCategory | "";
  town?: string;
  lat?: number;
  lng?: number;
  selectedBusiness?: BusinessResult | null;
  fieldValues?: Record<string, unknown>;
  newBranch?: NewBranchValue;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  pinLocation?: PinLocation | null;
  initialDraft?: RequestDraft | null;
  onRequestPin?: (draft: RequestDraft) => void;
}

function buildDescriptionFromFields(
  fields: CategoryField[],
  values: Record<string, unknown>,
  extra: string,
): string {
  const parts: string[] = [];
  for (const f of fields) {
    const formatted = formatFieldValue(f, values[f.key]);
    if (formatted) parts.push(`${f.label}: ${formatted}`);
  }
  if (extra.trim()) parts.push(extra.trim());
  return parts.join("\n");
}

export default function CreateRequestDialog({ open, onOpenChange, onCreated, pinLocation, initialDraft, onRequestPin }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory | "">("");
  const [town, setTown] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResult | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [newBranch, setNewBranch] = useState<NewBranchValue>(defaultNewBranchValue());

  const isNewBranch = category === "new_branch";

  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === category),
    [categories, category],
  );
  const { data: fields = [] } = useCategoryFields(
    isNewBranch ? undefined : selectedCategory?.id,
  );

  // Prefill town from dropped pin (non-new-branch flow)
  useEffect(() => {
    if (!isNewBranch && pinLocation?.town && !town) setTown(pinLocation.town);
  }, [pinLocation, isNewBranch]);

  // Prefill town from selected business
  useEffect(() => {
    if (selectedBusiness?.town && !town) setTown(selectedBusiness.town);
  }, [selectedBusiness]);

  // Hydrate from saved draft (resume after sign-in)
  useEffect(() => {
    if (!initialDraft || !open) return;
    if (initialDraft.title) setTitle(initialDraft.title);
    if (initialDraft.description) setDescription(initialDraft.description);
    if (initialDraft.category) setCategory(initialDraft.category);
    if (initialDraft.town) setTown(initialDraft.town);
    if (initialDraft.selectedBusiness) setSelectedBusiness(initialDraft.selectedBusiness);
    if (initialDraft.fieldValues) setFieldValues(initialDraft.fieldValues);
    if (initialDraft.newBranch) setNewBranch(initialDraft.newBranch);
  }, [initialDraft, open]);

  const reset = () => {
    setTitle(""); setDescription(""); setCategory(""); setTown("");
    setSelectedBusiness(null);
    setFieldValues({});
    setNewBranch(defaultNewBranchValue());
  };

  const updateField = (key: string, value: unknown) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    // ---- New Branch flow ----
    if (isNewBranch) {
      if (!isNewBranchValid(newBranch)) {
        toast({
          title: "Missing info",
          description: "Pick a business type or brand and tell us where.",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        const draft: RequestDraft = {
          title, description, category, town: newBranch.town,
          lat: pinLocation?.lat, lng: pinLocation?.lng,
          newBranch,
        };
        try { sessionStorage.setItem("pendingRequest", JSON.stringify(draft)); } catch {}
        toast({ title: "Draft saved", description: "Sign in to post your request — we'll bring you back here." });
        onOpenChange(false);
        navigate("/auth?redirect=/explore&resume=request");
        return;
      }

      setLoading(true);
      try {
        let lat = pinLocation?.lat ?? 51.5074;
        let lng = pinLocation?.lng ?? -0.1278;

        // If no pin, geocode the town via Google
        if (!pinLocation && newBranch.town) {
          const { data: geo } = await supabase.functions.invoke("geocode", {
            body: { mode: "forward", query: newBranch.town },
          });
          if (geo && typeof (geo as any).lat === "number") {
            lat = (geo as any).lat;
            lng = (geo as any).lng;
          }
        }

        const finalTitle = title.trim() || composeNewBranchTitle(newBranch);
        const finalDescription = composeNewBranchDescription(newBranch);
        const radius_m =
          newBranch.locationMode === "radius"
            ? Math.round(newBranch.radiusMiles * 1609.344)
            : null;

        const { error } = await supabase.from("requests").insert({
          title: finalTitle,
          description: finalDescription,
          category,
          town: newBranch.town,
          lat,
          lng,
          user_id: user.id,
          field_values: {} as any,
          business_kind: newBranch.kind,
          business_type_slug: newBranch.kind === "type" ? newBranch.typeSlug : null,
          brand_name: newBranch.kind === "brand" ? newBranch.brandName.trim() : null,
          brand_website: newBranch.kind === "brand" ? newBranch.brandWebsite || null : null,
          radius_m,
        } as any);

        if (error) throw error;

        toast({ title: "Request created!", description: "Your request is now live on the map." });
        reset();
        onOpenChange(false);
        onCreated?.();
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // ---- Other categories (existing flow) ----
    const validationError = validateFieldValues(fields, fieldValues);
    if (validationError) {
      toast({ title: "Missing info", description: validationError, variant: "destructive" });
      return;
    }

    if (!user) {
      const draft: RequestDraft = {
        title, description, category, town,
        lat: pinLocation?.lat, lng: pinLocation?.lng,
        selectedBusiness,
        fieldValues,
      };
      try { sessionStorage.setItem("pendingRequest", JSON.stringify(draft)); } catch {}
      toast({ title: "Draft saved", description: "Sign in to post your request — we'll bring you back here." });
      onOpenChange(false);
      navigate("/auth?redirect=/explore&resume=request");
      return;
    }

    setLoading(true);
    try {
      let lat = pinLocation?.lat ?? 51.5074;
      let lng = pinLocation?.lng ?? -0.1278;
      let businessId: string | undefined;

      if (selectedBusiness) {
        lat = selectedBusiness.lat;
        lng = selectedBusiness.lng;

        const { data: linkData, error: linkErr } = await supabase.functions.invoke(
          "link-business",
          {
            body: {
              osm_id: selectedBusiness.osm_id,
              osm_type: selectedBusiness.osm_type,
            },
          },
        );
        if (linkErr) throw linkErr;
        if (!linkData?.business_id) throw new Error("Could not link business");
        businessId = linkData.business_id as string;
      } else if (!pinLocation) {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(town)}&format=json&limit=1&countrycodes=gb,ie`
        );
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          lat = parseFloat(geoData[0].lat);
          lng = parseFloat(geoData[0].lon);
        }
      }

      const composed = buildDescriptionFromFields(fields, fieldValues, description);

      const { error } = await supabase.from("requests").insert({
        title,
        description: composed || null,
        category,
        town,
        lat,
        lng,
        user_id: user.id,
        business_id: businessId || null,
        field_values: fieldValues as any,
      } as any);

      if (error) throw error;

      toast({ title: "Request created!", description: "Your request is now live on the map." });
      reset();
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isGuest = !user;

  const submitDisabled =
    loading ||
    !category ||
    (isNewBranch ? !isNewBranchValid(newBranch) : !title || !town);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">New Request</DialogTitle>
          {!isNewBranch && selectedBusiness ? (
            <DialogDescription className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Location set from {selectedBusiness.name}
              {selectedBusiness.town ? ` · ${selectedBusiness.town}` : ""}
            </DialogDescription>
          ) : pinLocation ? (
            <DialogDescription className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Pinned at {pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}
              {pinLocation.town ? ` · ${pinLocation.town}` : ""}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        {isGuest && (
          <Alert className="border-primary/30 bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              You can plan your request now. You'll need to sign in to post it — your draft will be saved.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Request type</Label>
            <Select value={category} onValueChange={(v) => { setCategory(v as RequestCategory); setFieldValues({}); }}>
              <SelectTrigger>
                <SelectValue placeholder="What are you requesting?" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const Icon = cat.Icon;
                  return (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" style={{ color: cat.color }} />
                        {cat.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {isNewBranch ? (
            <>
              <NewBranchFields
                value={newBranch}
                onChange={setNewBranch}
                pinLocation={pinLocation}
                onRequestPin={
                  onRequestPin
                    ? () =>
                        onRequestPin({
                          title, description, category,
                          town: newBranch.town,
                          newBranch,
                        })
                    : undefined
                }
              />
            </>
          ) : (
            <>
              <div>
                <Label className="text-xs">Title</Label>
                <Input
                  placeholder="e.g. 'Later opening hours for the library'"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={120}
                />
              </div>

              <DynamicFieldRenderer fields={fields} values={fieldValues} onChange={updateField} />

              <div>
                <Label className="text-xs">Town or city</Label>
                <Input
                  placeholder="Town or city"
                  value={town}
                  onChange={(e) => setTown(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label className="text-xs">Existing business (optional)</Label>
                <BusinessSearch
                  town={town}
                  selected={selectedBusiness}
                  onSelect={setSelectedBusiness}
                />
              </div>

              <div>
                <Label className="text-xs">More details (optional)</Label>
                <Textarea
                  placeholder="Anything else you'd like to add..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {!selectedBusiness && !pinLocation && onRequestPin && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Pick a business above or drop a pin on the map to set a precise location.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() =>
                      onRequestPin({
                        title, description, category, town,
                        selectedBusiness, fieldValues,
                      })
                    }
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Drop pin on map
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Button
              type="submit"
              className="w-full font-heading font-medium gap-2"
              disabled={submitDisabled}
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
                "Submit Request"
              )}
            </Button>
            {isGuest && (
              <p className="text-center text-[11px] text-muted-foreground">
                We'll save your draft and bring you back here after sign-in.
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
