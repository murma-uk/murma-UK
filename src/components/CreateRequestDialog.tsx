import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CATEGORIES, type RequestCategory } from "@/lib/categories";
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
  openTime?: string;
  closeTime?: string;
  days?: string[];
  classType?: string;
  skillLevel?: string;
  artistName?: string;
  eventDate?: string;
  audienceSize?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  pinLocation?: PinLocation | null;
  initialDraft?: RequestDraft | null;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function CreateRequestDialog({ open, onOpenChange, onCreated, pinLocation, initialDraft }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory | "">("");
  const [town, setTown] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessResult | null>(null);

  // Category-specific fields
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [days, setDays] = useState<string[]>([]);
  const [classType, setClassType] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [artistName, setArtistName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [audienceSize, setAudienceSize] = useState("");

  // Prefill town from dropped pin
  useEffect(() => {
    if (pinLocation?.town && !town) setTown(pinLocation.town);
  }, [pinLocation]);

  // Hydrate from saved draft (resume after sign-in)
  useEffect(() => {
    if (!initialDraft || !open) return;
    if (initialDraft.title) setTitle(initialDraft.title);
    if (initialDraft.description) setDescription(initialDraft.description);
    if (initialDraft.category) setCategory(initialDraft.category);
    if (initialDraft.town) setTown(initialDraft.town);
    if (initialDraft.selectedBusiness) setSelectedBusiness(initialDraft.selectedBusiness);
    if (initialDraft.openTime) setOpenTime(initialDraft.openTime);
    if (initialDraft.closeTime) setCloseTime(initialDraft.closeTime);
    if (initialDraft.days) setDays(initialDraft.days);
    if (initialDraft.classType) setClassType(initialDraft.classType);
    if (initialDraft.skillLevel) setSkillLevel(initialDraft.skillLevel);
    if (initialDraft.artistName) setArtistName(initialDraft.artistName);
    if (initialDraft.eventDate) setEventDate(initialDraft.eventDate);
    if (initialDraft.audienceSize) setAudienceSize(initialDraft.audienceSize);
  }, [initialDraft, open]);

  const reset = () => {
    setTitle(""); setDescription(""); setCategory(""); setTown("");
    setSelectedBusiness(null);
    setOpenTime(""); setCloseTime(""); setDays([]);
    setClassType(""); setSkillLevel("");
    setArtistName(""); setEventDate(""); setAudienceSize("");
  };

  const toggleDay = (d: string) => {
    setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const buildDescription = (): string => {
    const parts: string[] = [];
    if (category === "opening_hours") {
      if (openTime || closeTime) parts.push(`Preferred hours: ${openTime || "?"} – ${closeTime || "?"}`);
      if (days.length) parts.push(`Days: ${days.join(", ")}`);
    } else if (category === "classes_sessions") {
      if (classType) parts.push(`Type: ${classType}`);
      if (skillLevel) parts.push(`Level: ${skillLevel}`);
    } else if (category === "artist_visit") {
      if (artistName) parts.push(`Artist: ${artistName}`);
      if (eventDate) parts.push(`Preferred date: ${eventDate}`);
      if (audienceSize) parts.push(`Estimated audience: ${audienceSize}`);
    }
    if (description.trim()) parts.push(description.trim());
    return parts.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    // Guest: save draft to sessionStorage and redirect to auth
    if (!user) {
      const draft: RequestDraft = {
        title, description, category, town,
        lat: pinLocation?.lat, lng: pinLocation?.lng,
        selectedBusiness,
        openTime, closeTime, days,
        classType, skillLevel,
        artistName, eventDate, audienceSize,
      };
      try {
        sessionStorage.setItem("pendingRequest", JSON.stringify(draft));
      } catch {
        // ignore storage errors
      }
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

        const { data: existing } = await supabase
          .from("businesses")
          .select("id")
          .eq("osm_id", selectedBusiness.osm_id)
          .maybeSingle();

        if (existing) {
          businessId = existing.id;
        } else {
          const { data: newBiz, error: bizErr } = await supabase
            .from("businesses")
            .insert({
              osm_id: selectedBusiness.osm_id,
              name: selectedBusiness.name,
              business_type: selectedBusiness.business_type,
              lat: selectedBusiness.lat,
              lng: selectedBusiness.lng,
              town: selectedBusiness.town,
              address: selectedBusiness.address || null,
            })
            .select("id")
            .single();
          if (bizErr) throw bizErr;
          businessId = newBiz.id;
        }
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

      const { error } = await supabase.from("requests").insert({
        title,
        description: buildDescription() || null,
        category,
        town,
        lat,
        lng,
        user_id: user.id,
        business_id: businessId || null,
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

  const renderCategoryFields = () => {
    switch (category) {
      case "opening_hours":
        return (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Open from</Label>
                <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Open until</Label>
                <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Days</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {DAYS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      days.includes(d) ? "bg-primary text-primary-foreground" : "bg-background border border-border hover:border-primary/40"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case "classes_sessions":
        return (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label className="text-xs">Class or session type</Label>
              <Input placeholder="e.g. Yoga, Pottery, Coding" value={classType} onChange={(e) => setClassType(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Skill level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger><SelectValue placeholder="Any level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="all">All levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case "artist_visit":
        return (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label className="text-xs">Artist or performer</Label>
              <Input placeholder="Who would you like to see?" value={artistName} onChange={(e) => setArtistName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Preferred date</Label>
                <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Audience size</Label>
                <Input type="number" min="1" placeholder="e.g. 50" value={audienceSize} onChange={(e) => setAudienceSize(e.target.value)} />
              </div>
            </div>
          </div>
        );
      case "new_branch":
        return (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Drop a pin on the map or search for an existing nearby business to indicate where you'd like a new branch.
          </div>
        );
      case "announcement":
        return (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            Use the description below to share what you'd like the community or a business to announce.
          </div>
        );
      default:
        return null;
    }
  };

  const isGuest = !user;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">New Request</DialogTitle>
          {pinLocation && (
            <DialogDescription className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              Pinned at {pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}
              {pinLocation.town ? ` · ${pinLocation.town}` : ""}
            </DialogDescription>
          )}
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
            <Select value={category} onValueChange={(v) => setCategory(v as RequestCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="What are you requesting?" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CATEGORIES) as [RequestCategory, typeof CATEGORIES[RequestCategory]][]).map(([key, cat]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                      {cat.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {renderCategoryFields()}

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

          <div className="space-y-1.5">
            <Button
              type="submit"
              className="w-full font-heading font-medium gap-2"
              disabled={loading || !category || !title || !town}
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
