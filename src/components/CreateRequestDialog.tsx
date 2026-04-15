import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, type RequestCategory } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export default function CreateRequestDialog({ open, onOpenChange, onCreated }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RequestCategory | "">("");
  const [town, setTown] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category) return;

    setLoading(true);
    try {
      // Geocode town to get coordinates (simple approach using Nominatim)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(town)}&format=json&limit=1&countrycodes=gb,ie`
      );
      const geoData = await geoRes.json();

      let lat = 51.5074;
      let lng = -0.1278;
      if (geoData.length > 0) {
        lat = parseFloat(geoData[0].lat);
        lng = parseFloat(geoData[0].lon);
      }

      const { error } = await supabase.from("requests").insert({
        title,
        description: description || null,
        category,
        town,
        lat,
        lng,
        user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Request created!", description: "Your request is now live on the map." });
      setTitle("");
      setDescription("");
      setCategory("");
      setTown("");
      onOpenChange(false);
      onCreated?.();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">New Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
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

          <Input
            placeholder="e.g. 'Later opening hours for the library'"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={120}
          />

          <Textarea
            placeholder="Tell us more about what you'd like..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <Input
            placeholder="Town or city"
            value={town}
            onChange={(e) => setTown(e.target.value)}
            required
          />

          <Button type="submit" className="w-full font-heading font-medium" disabled={loading || !category || !title || !town}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
