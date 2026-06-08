import { useState } from "react";
import { MapPin, Map as MapIcon, Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

export interface ResolvedLocation {
  source: "map_view" | "town" | "pin";
  town: string;
  lat?: number;
  lng?: number;
}

interface Props {
  value: ResolvedLocation | null;
  onChange: (next: ResolvedLocation) => void;
  /** Center of the current map view, used by the "this map view" option */
  mapCenter?: { lat: number; lng: number; town?: string } | null;
  pinLocation?: { lat: number; lng: number; town: string } | null;
  onRequestPin?: () => void;
}

export default function LocationPicker({ value, onChange, mapCenter, pinLocation, onRequestPin }: Props) {
  const [open, setOpen] = useState(false);

  // Sync pin → value
  if (pinLocation && (!value || value.source !== "pin" || value.lat !== pinLocation.lat)) {
    // setState-via-render-guard pattern would be wrong; instead expose via effect in parent.
    // We just display it correctly below.
  }

  const display = value
    ? value.town || (value.lat != null ? `${value.lat.toFixed(3)}, ${value.lng?.toFixed(3)}` : "Set")
    : "Choose location";

  const sourceLabel =
    value?.source === "map_view"
      ? "This map view"
      : value?.source === "pin"
        ? "Pinned"
        : value?.source === "town"
          ? "Town/city"
          : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between font-mono text-sm h-11"
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{display}</span>
            {sourceLabel && (
              <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground shrink-0">
                · {sourceLabel}
              </span>
            )}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-2 space-y-1" align="start">
        {mapCenter && (
          <button
            type="button"
            onClick={() => {
              onChange({
                source: "map_view",
                town: mapCenter.town ?? "",
                lat: mapCenter.lat,
                lng: mapCenter.lng,
              });
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
          >
            <MapIcon className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <div className="font-medium">This map view</div>
              {mapCenter.town && (
                <div className="text-xs text-muted-foreground truncate">{mapCenter.town}</div>
              )}
            </div>
            {value?.source === "map_view" && <Check className="h-4 w-4 text-primary" />}
          </button>
        )}

        <div className="px-1 py-1">
          <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            <Search className="h-3 w-3" /> A town or city
          </div>
          <PlaceAutocomplete
            value={value?.source === "town" ? value.town : ""}
            placeholder="Start typing — Bristol, Hove…"
            types={["locality", "postal_town"]}
            onChange={(t) =>
              onChange({ source: "town", town: t })
            }
            onSelect={(p) => {
              onChange({
                source: "town",
                town: p.primaryText,
                lat: p.lat,
                lng: p.lng,
              });
              setOpen(false);
            }}
          />
        </div>

        {onRequestPin && (
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onRequestPin();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="font-medium">Drop a pin on the map</div>
              <div className="text-xs text-muted-foreground">Precise spot — best for outdoor wishes</div>
            </div>
            {value?.source === "pin" && <Check className="h-4 w-4 text-primary" />}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
