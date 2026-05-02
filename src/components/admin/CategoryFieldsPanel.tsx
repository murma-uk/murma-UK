import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAllCategoryFields,
  type CategoryField,
  type FieldType,
} from "@/lib/categoryFields";
import DynamicFieldRenderer from "@/components/DynamicFieldRenderer";
import { Loader2, Plus, Trash2, ChevronUp, ChevronDown, Save, Eye } from "lucide-react";

const FIELD_TYPES: FieldType[] = [
  "text", "textarea", "number", "date", "time", "select", "multiselect", "days",
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^([0-9])/, "_$1")
    .slice(0, 40) || "field";
}

interface Draft extends Omit<CategoryField, "id" | "category_id"> {
  id?: string;
  _new?: boolean;
  _dirty?: boolean;
  _deleted?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  categoryLabel: string;
}

export default function CategoryFieldsPanel({ open, onOpenChange, categoryId, categoryLabel }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: fields, isLoading } = useAllCategoryFields(categoryId ?? undefined);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!fields) return;
    setDrafts(fields.map((f) => ({ ...f })));
    setPreviewValues({});
  }, [fields]);

  const update = (idx: number, patch: Partial<Draft>) => {
    setDrafts((d) =>
      d.map((row, i) => (i === idx ? { ...row, ...patch, _dirty: true } : row)),
    );
  };

  const addRow = () => {
    setDrafts((d) => [
      ...d,
      {
        _new: true,
        _dirty: true,
        key: `field_${d.length + 1}`,
        label: "New field",
        field_type: "text",
        options: null,
        placeholder: null,
        help_text: null,
        required: false,
        sort_order: (d.reduce((m, x) => Math.max(m, x.sort_order), 0) || 0) + 10,
        is_active: true,
      },
    ]);
  };

  const removeRow = (idx: number) => {
    setDrafts((d) => {
      const row = d[idx];
      if (row._new) return d.filter((_, i) => i !== idx);
      return d.map((r, i) => (i === idx ? { ...r, _deleted: true } : r));
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    setDrafts((d) => {
      const visible = d.filter((r) => !r._deleted);
      const target = visible[idx];
      const swap = visible[idx + dir];
      if (!target || !swap) return d;
      const a = target.sort_order;
      const b = swap.sort_order;
      return d.map((r) => {
        if (r === target) return { ...r, sort_order: b, _dirty: true };
        if (r === swap) return { ...r, sort_order: a, _dirty: true };
        return r;
      });
    });
  };

  const save = async () => {
    if (!categoryId) return;
    setSaving(true);
    try {
      const toDelete = drafts.filter((d) => d._deleted && d.id);
      const toUpsert = drafts.filter((d) => !d._deleted && d._dirty);

      for (const d of toDelete) {
        const { error } = await (supabase as any)
          .from("request_category_fields")
          .delete()
          .eq("id", d.id);
        if (error) throw error;
      }

      for (const d of toUpsert) {
        const payload: any = {
          category_id: categoryId,
          key: d.key,
          label: d.label,
          field_type: d.field_type,
          options: d.options,
          placeholder: d.placeholder || null,
          help_text: d.help_text || null,
          required: d.required,
          sort_order: d.sort_order,
          is_active: d.is_active,
        };
        if (d.id) {
          const { error } = await (supabase as any)
            .from("request_category_fields")
            .update(payload)
            .eq("id", d.id);
          if (error) throw error;
        } else {
          const { error } = await (supabase as any)
            .from("request_category_fields")
            .insert(payload);
          if (error) throw error;
        }
      }

      toast({ title: "Fields saved" });
      qc.invalidateQueries({ queryKey: ["request_category_fields", categoryId] });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const visible = drafts.filter((d) => !d._deleted).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Fields — {categoryLabel}</SheetTitle>
          <SheetDescription>
            Define the questions users answer when submitting a request in this
            category. Answers are stored as structured data on each request.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add field
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview((s) => !s)}
            className="gap-1.5"
          >
            <Eye className="h-4 w-4" /> {showPreview ? "Hide" : "Show"} preview
          </Button>
          <div className="ml-auto" />
          <Button size="sm" onClick={save} disabled={saving} className="gap-1.5">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {visible.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No fields yet. Add one to start collecting structured info.
              </p>
            )}
            {visible.map((d, visibleIdx) => {
              const idx = drafts.indexOf(d);
              const needsOptions =
                d.field_type === "select" || d.field_type === "multiselect";
              const optionsText = Array.isArray(d.options)
                ? d.options.map((o) => `${o.value}|${o.label}`).join("\n")
                : "";
              return (
                <div key={d.id ?? `new-${idx}`} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => move(visibleIdx, -1)}
                        disabled={visibleIdx === 0}
                        className="text-muted-foreground disabled:opacity-30 hover:text-foreground"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(visibleIdx, 1)}
                        disabled={visibleIdx === visible.length - 1}
                        className="text-muted-foreground disabled:opacity-30 hover:text-foreground"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <Input
                      value={d.label}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        const patch: Partial<Draft> = { label: newLabel };
                        if (d._new) patch.key = slugify(newLabel);
                        update(idx, patch);
                      }}
                      placeholder="Label"
                      className="flex-1 font-medium"
                    />
                    <Switch
                      checked={d.is_active}
                      onCheckedChange={(v) => update(idx, { is_active: v })}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => removeRow(idx)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Key</Label>
                      <Input
                        value={d.key}
                        onChange={(e) => update(idx, { key: slugify(e.target.value) })}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Type</Label>
                      <Select
                        value={d.field_type}
                        onValueChange={(v) => {
                          const next: Partial<Draft> = { field_type: v as FieldType };
                          if (v !== "select" && v !== "multiselect") next.options = null;
                          else if (!d.options) next.options = [];
                          update(idx, next);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Placeholder</Label>
                      <Input
                        value={d.placeholder ?? ""}
                        onChange={(e) => update(idx, { placeholder: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">Help text</Label>
                      <Input
                        value={d.help_text ?? ""}
                        onChange={(e) => update(idx, { help_text: e.target.value })}
                      />
                    </div>
                  </div>

                  {needsOptions && (
                    <div>
                      <Label className="text-[11px]">
                        Options — one per line, format <code>value|label</code>
                      </Label>
                      <textarea
                        value={optionsText}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          const opts = lines
                            .map((l) => l.trim())
                            .filter(Boolean)
                            .map((l) => {
                              const [value, ...rest] = l.split("|");
                              return {
                                value: value.trim(),
                                label: (rest.join("|").trim() || value.trim()),
                              };
                            });
                          update(idx, { options: opts });
                        }}
                        rows={Math.max(3, optionsText.split("\n").length)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                        placeholder="beginner|Beginner&#10;advanced|Advanced"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch
                      id={`req-${idx}`}
                      checked={d.required}
                      onCheckedChange={(v) => update(idx, { required: v })}
                    />
                    <Label htmlFor={`req-${idx}`} className="text-xs">Required</Label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showPreview && visible.length > 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-border p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Live preview</p>
            <DynamicFieldRenderer
              fields={visible.map((d, i) => ({
                id: d.id ?? `preview-${i}`,
                category_id: categoryId ?? "",
                key: d.key,
                label: d.label,
                field_type: d.field_type,
                options: d.options,
                placeholder: d.placeholder,
                help_text: d.help_text,
                required: d.required,
                sort_order: d.sort_order,
                is_active: d.is_active,
              }))}
              values={previewValues}
              onChange={(k, v) => setPreviewValues((p) => ({ ...p, [k]: v }))}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
