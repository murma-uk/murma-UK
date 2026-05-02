import { useMemo, useState } from "react";
import { Constants } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ICON_NAMES, getIcon } from "@/lib/iconRegistry";
import { Loader2, Info } from "lucide-react";
import type { CategoryInfo } from "@/lib/categories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: CategoryInfo[];
}

export default function AddCategoryDialog({ open, onOpenChange, existing }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const enumValues = Constants.public.Enums.request_category as readonly string[];
  const usedSlugs = useMemo(() => new Set(existing.map((c) => c.slug)), [existing]);
  const availableSlugs = enumValues.filter((s) => !usedSlugs.has(s as any));

  const [slug, setSlug] = useState<string>(availableSlugs[0] ?? "");
  const [label, setLabel] = useState("");
  const [iconName, setIconName] = useState<string>(ICON_NAMES[0]);
  const [color, setColor] = useState("hsl(210, 100%, 50%)");
  const [sortOrder, setSortOrder] = useState<number>(
    (existing.reduce((max, c) => Math.max(max, c.sortOrder), 0) || 0) + 10,
  );
  const [saving, setSaving] = useState(false);

  if (availableSlugs.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Add category</DialogTitle>
            <DialogDescription>
              All available category slugs are in use.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              To add a brand-new slug, a developer needs to extend the underlying
              <code className="mx-1">request_category</code> database enum first. Once
              that's done, the new slug will appear here automatically.
            </p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const submit = async () => {
    if (!slug || !label.trim()) {
      toast({ title: "Label and slug are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("request_categories").insert({
      slug,
      label: label.trim(),
      icon_name: iconName,
      color,
      sort_order: sortOrder,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Could not add category", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Category added" });
    qc.invalidateQueries({ queryKey: ["request_categories"] });
    onOpenChange(false);
    setLabel("");
  };

  const Preview = getIcon(iconName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add category</DialogTitle>
          <DialogDescription>
            Pick from slugs available in the database enum. Field questions can be
            configured after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Slug</Label>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableSlugs.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. New Branch" />
          </div>

          <div>
            <Label className="text-xs">Icon</Label>
            <Select value={iconName} onValueChange={setIconName}>
              <SelectTrigger>
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <Preview className="h-4 w-4" />
                    {iconName}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {ICON_NAMES.map((name) => {
                  const I = getIcon(name);
                  return (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        <I className="h-4 w-4" />
                        {name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Color (HSL)</Label>
            <Input value={color} onChange={(e) => setColor(e.target.value)} />
          </div>

          <div>
            <Label className="text-xs">Sort order</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add category"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
