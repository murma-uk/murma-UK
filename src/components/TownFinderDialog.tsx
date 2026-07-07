import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, MapPin } from "lucide-react";
import PlaceAutocomplete, { type PlaceSelection } from "./PlaceAutocomplete";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TownFinderDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelect = (place: PlaceSelection) => {
    if (place.lat != null && place.lng != null) {
      setLoading(true);
      // Navigate to town page with coordinates
      navigate(`/town/${place.lat},${place.lng}?town=${encodeURIComponent(place.primaryText)}`);
      setSearchText("");
      onOpenChange(false);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-[-0.02em]">
            Find Your Town
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Search for a location to see nearby murmas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <PlaceAutocomplete
            value={searchText}
            onChange={setSearchText}
            onSelect={handleSelect}
            placeholder="Enter a town or city..."
            types={["(cities)"]}
            className="w-full"
          />

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
