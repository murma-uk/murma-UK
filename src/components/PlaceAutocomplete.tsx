import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google: any;
    __murmaMapsReady?: Promise<void>;
    __murmaInitMaps?: () => void;
  }
}

const BROWSER_KEY = import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY as
  | string
  | undefined;
const TRACKING_ID = import.meta.env.VITE_GOOGLE_MAPS_TRACKING_ID as
  | string
  | undefined;

function loadMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.__murmaMapsReady) return window.__murmaMapsReady;
  if (!BROWSER_KEY) return Promise.reject(new Error("Google Maps key missing"));

  window.__murmaMapsReady = new Promise((resolve, reject) => {
    window.__murmaInitMaps = () => resolve();
    const s = document.createElement("script");
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      libraries: "places",
      loading: "async",
      callback: "__murmaInitMaps",
      v: "weekly",
    });
    if (TRACKING_ID) params.set("channel", TRACKING_ID);
    s.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window.__murmaMapsReady;
}

export type PlaceSelection = {
  placeId: string;
  primaryText: string;
  description: string;
  lat?: number;
  lng?: number;
};

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (place: PlaceSelection) => void;
  placeholder?: string;
  /** "(cities)" for towns, "establishment" for businesses */
  types?: string[];
  regionCodes?: string[];
  className?: string;
}

export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  types,
  regionCodes = ["gb", "ie"],
  className,
}: Props) {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const sessionTokenRef = useRef<any>(null);
  const debounceRef = useRef<number | null>(null);
  const skipFetchRef = useRef(false);

  useEffect(() => {
    loadMaps().then(() => setReady(true)).catch(() => setReady(false));
  }, []);

  const placesLib = useMemo(() => (ready ? window.google?.maps?.places : null), [ready]);

  useEffect(() => {
    if (!placesLib || !value.trim()) {
      setSuggestions([]);
      return;
    }
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const req: any = {
          input: value,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: regionCodes,
        };
        if (types?.length) req.includedPrimaryTypes = types;
        const { suggestions } =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(req);
        setSuggestions(suggestions ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, placesLib, types?.join(","), regionCodes.join(",")]);

  const handleSelect = async (s: any) => {
    const pred = s.placePrediction;
    if (!pred) return;
    const primary = pred.mainText?.text ?? pred.text?.text ?? "";
    const description = pred.text?.text ?? primary;
    skipFetchRef.current = true;
    onChange(primary);
    setOpen(false);
    setSuggestions([]);

    try {
      const place = pred.toPlace();
      await place.fetchFields({ fields: ["location"] });
      onSelect({
        placeId: pred.placeId,
        primaryText: primary,
        description,
        lat: place.location?.lat?.(),
        lng: place.location?.lng?.(),
      });
    } catch {
      onSelect({ placeId: pred.placeId, primaryText: primary, description });
    }
    sessionTokenRef.current = null;
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {suggestions.slice(0, 6).map((s, i) => {
            const pred = s.placePrediction;
            if (!pred) return null;
            const main = pred.mainText?.text ?? pred.text?.text ?? "";
            const secondary = pred.secondaryText?.text ?? "";
            return (
              <li key={pred.placeId ?? i}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                >
                  <div className="font-medium truncate">{main}</div>
                  {secondary && (
                    <div className="text-xs text-muted-foreground truncate">{secondary}</div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
