import { useState, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown, MapPin, Pencil, Globe, Store, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  BUSINESS_TYPES,
  findBusinessType,
  type BusinessType,
} from "@/lib/businessTypes";
import {
  guessBrandWebsite,
  isValidWebsiteUrl,
  normaliseWebsiteUrl,
  displayHostname,
} from "@/lib/brandWebsite";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

export type LocationMode = "town" | "pin" | "radius";
export type BusinessKind = "type" | "brand";

export interface NewBranchValue {
  kind: BusinessKind;
  typeSlug: string | null;
  brandName: string;
  brandWebsite: string;
  town: string;
  locationMode: LocationMode;
  radiusMiles: number; // only used when locationMode === 'radius'
}

export const RADIUS_OPTIONS: { miles: number; label: string }[] = [
  { miles: 0.25, label: "¼ mile" },
  { miles: 0.5, label: "½ mile" },
  { miles: 1, label: "1 mile" },
  { miles: 2, label: "2 miles" },
  { miles: 5, label: "5 miles" },
];

interface PinLocation {
  lat: number;
  lng: number;
  town: string;
}

interface Props {
  value: NewBranchValue;
  onChange: (next: NewBranchValue) => void;
  pinLocation?: PinLocation | null;
  onRequestPin?: () => void;
}

function BusinessTypeCombobox({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (slug: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => findBusinessType(value), [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-mono text-sm"
        >
          <span className="flex items-center gap-2 min-w-0 truncate">
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
            {selected ? selected.label : <span className="text-muted-foreground">Choose a type — bakery, gym, café…</span>}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(value, search) => {
            const v = value.toLowerCase();
            const s = search.toLowerCase().trim();
            if (!s) return 1;
            if (v.includes(s)) return 1;
            // also match aliases via the value string we encode below
            return 0;
          }}
        >
          <CommandInput placeholder="Start typing… bakery, gym, ramen" />
          <CommandList className="max-h-64 overflow-y-auto">
            <CommandEmpty>No matching type.</CommandEmpty>
            <CommandGroup>
              {BUSINESS_TYPES.map((t: BusinessType) => {
                // encode aliases into value so Command's filter sees them
                const cmdValue = [t.label, t.slug.replace(/_/g, " "), ...(t.aliases ?? [])].join(" ");
                return (
                  <CommandItem
                    key={t.slug}
                    value={cmdValue}
                    onSelect={() => {
                      onChange(t.slug);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === t.slug ? "opacity-100" : "opacity-0")} />
                    {t.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function BrandConfirm({
  name,
  website,
  onWebsiteChange,
}: {
  name: string;
  website: string;
  onWebsiteChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(website);

  useEffect(() => setDraft(website), [website]);

  if (!name.trim()) return null;

  const host = website ? displayHostname(website) : "";
  const draftHost = draft ? displayHostname(draft) : "";

  return (
    <div className="rounded-lg border-[1.5px] border-civic/40 bg-civic/5 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Globe className="h-4 w-4 text-civic mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-civic">
            Do you mean
          </p>
          <p className="font-heading text-base font-semibold tracking-[-0.01em] truncate">
            {name.trim()}
          </p>
          {!editing ? (
            <p className="font-mono text-xs text-muted-foreground truncate">
              {host || "no website set"}
            </p>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://example.co.uk"
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setDraft(website);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="flex-1"
              disabled={!!draft && !isValidWebsiteUrl(normaliseWebsiteUrl(draft))}
              onClick={() => {
                onWebsiteChange(draft ? normaliseWebsiteUrl(draft) : "");
                setEditing(false);
              }}
            >
              Save URL
            </Button>
          </div>
          {draft && !isValidWebsiteUrl(normaliseWebsiteUrl(draft)) && (
            <p className="text-[11px] text-destructive">Doesn't look like a valid URL.</p>
          )}
          {draft && draftHost && (
            <p className="text-[11px] text-muted-foreground">Will save: {draftHost}</p>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => {
              /* yes — keep current website; nothing to do */
            }}
            disabled
            aria-label="Confirmed"
          >
            <Check className="h-3.5 w-3.5 mr-1" />
            Looks right
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            No, edit URL
          </Button>
        </div>
      )}
    </div>
  );
}

function ModeToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex w-full rounded-md border-[1.5px] border-border-mid bg-surface-2 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-sm px-2 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
            value === opt.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function NewBranchFields({ value, onChange, pinLocation, onRequestPin }: Props) {
  // Auto-fill town from a dropped pin if user hasn't typed anything.
  // If pin doesn't have town yet, reverse geocode it.
  useEffect(() => {
    if (!pinLocation || value.town) return;

    const fillTownFromPin = async () => {
      let town = pinLocation.town;

      // If pin doesn't have town, reverse geocode it
      if (!town && pinLocation.lat != null && pinLocation.lng != null) {
        try {
          const { data: geo } = await supabase.functions.invoke("geocode", {
            body: { mode: "reverse", lat: pinLocation.lat, lng: pinLocation.lng },
          });
          if (geo && typeof (geo as any).town === "string") {
            town = (geo as any).town;
          }
        } catch (err) {
          // Silently fail; user can still type town manually
        }
      }

      if (town) {
        onChange({ ...value, town });
      }
    };

    fillTownFromPin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinLocation?.lat, pinLocation?.lng]);

  const set = (patch: Partial<NewBranchValue>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-5">
      {/* Step 1 — what */}
      <section className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Store className="h-3 w-3" /> What kind of business?
        </Label>

        <ModeToggle
          value={value.kind}
          onChange={(k) => set({ kind: k })}
          options={[
            { value: "type", label: "A type" },
            { value: "brand", label: "A named brand" },
          ]}
        />

        {value.kind === "type" ? (
          <BusinessTypeCombobox
            value={value.typeSlug}
            onChange={(slug) => set({ typeSlug: slug })}
          />
        ) : (
          <div className="space-y-2">
            <Input
              placeholder="e.g. Greggs, PC World, Pret"
              value={value.brandName}
              maxLength={80}
              onChange={(e) => {
                const name = e.target.value;
                set({
                  brandName: name,
                  // re-suggest a website whenever they retype,
                  // unless they already manually set a custom one
                  brandWebsite:
                    !value.brandWebsite ||
                    value.brandWebsite === guessBrandWebsite(value.brandName)
                      ? guessBrandWebsite(name)
                      : value.brandWebsite,
                });
              }}
            />
            <BrandConfirm
              name={value.brandName}
              website={value.brandWebsite}
              onWebsiteChange={(w) => set({ brandWebsite: w })}
            />
          </div>
        )}
      </section>

      {/* Step 2 — where */}
      <section className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" /> Where?
        </Label>

        <ModeToggle
          value={value.locationMode}
          onChange={(m) => set({ locationMode: m })}
          options={[
            { value: "town", label: "Town/city" },
            { value: "pin", label: "On the map" },
            { value: "radius", label: "Near + radius" },
          ]}
        />

        {value.locationMode === "town" && (
          <PlaceAutocomplete
            value={value.town}
            placeholder="Town or city"
            types={["locality", "postal_town", "sublocality"]}
            onChange={(t) => set({ town: t })}
            onSelect={(p) => set({ town: p.primaryText })}
          />
        )}

        {(value.locationMode === "pin" || value.locationMode === "radius") && (
          <div className="space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-3">
            {pinLocation?.town ? (
              <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Location set · {pinLocation.town}
              </p>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                Drop a pin on the map to set the {value.locationMode === "radius" ? "centre point" : "location"}.
              </p>
            )}
            {onRequestPin && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={onRequestPin}
              >
                <MapPin className="h-3.5 w-3.5" />
                {pinLocation ? "Move pin" : "Drop pin on map"}
              </Button>
            )}
            {/* Town still needed for display / search */}
            <Input
              placeholder="Nearest town or city"
              value={value.town}
              onChange={(e) => set({ town: e.target.value })}
            />
          </div>
        )}

        {value.locationMode === "radius" && (
          <div>
            <Label className="text-xs">Within</Label>
            <Select
              value={String(value.radiusMiles)}
              onValueChange={(v) => set({ radiusMiles: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((r) => (
                  <SelectItem key={r.miles} value={String(r.miles)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>
    </div>
  );
}

export function defaultNewBranchValue(): NewBranchValue {
  return {
    kind: "type",
    typeSlug: null,
    brandName: "",
    brandWebsite: "",
    town: "",
    locationMode: "town",
    radiusMiles: 1,
  };
}

export function isNewBranchValid(v: NewBranchValue): boolean {
  if (v.kind === "type" && !v.typeSlug) return false;
  if (v.kind === "brand" && !v.brandName.trim()) return false;
  if (!v.town.trim()) return false;
  return true;
}

export function composeNewBranchTitle(v: NewBranchValue): string {
  if (v.kind === "type") {
    const t = findBusinessType(v.typeSlug);
    if (!t) return "";
    return `New ${t.label.toLowerCase()} in ${v.town.trim()}`;
  }
  return `${v.brandName.trim()} in ${v.town.trim()}`;
}

export function composeNewBranchDescription(v: NewBranchValue): string {
  const what =
    v.kind === "type"
      ? findBusinessType(v.typeSlug)?.label.toLowerCase() ?? "business"
      : v.brandName.trim();

  const where =
    v.locationMode === "radius"
      ? `within ${RADIUS_OPTIONS.find((r) => r.miles === v.radiusMiles)?.label ?? `${v.radiusMiles} miles`} of ${v.town.trim()}`
      : v.locationMode === "pin"
        ? `at the pinned location in ${v.town.trim()}`
        : `in ${v.town.trim()}`;

  const site =
    v.kind === "brand" && v.brandWebsite ? ` (${displayHostname(v.brandWebsite)})` : "";

  return `Requested: a new ${what}${site} ${where}.`;
}
