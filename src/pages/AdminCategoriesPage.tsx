import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAllCategories, type CategoryRow } from "@/lib/categories";
import { ICON_NAMES, getIcon } from "@/lib/iconRegistry";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Info } from "lucide-react";

interface Draft {
  id: string;
  slug: string;
  label: string;
  icon_name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export default function AdminCategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: categories, isLoading } = useAllCategories();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/admin/categories");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!categories) return;
    const next: Record<string, Draft> = {};
    categories.forEach((c) => {
      next[c.slug] = {
        id: (c as any).id ?? c.slug,
        slug: c.slug,
        label: c.label,
        icon_name: c.iconName,
        color: c.color,
        sort_order: c.sortOrder,
        is_active: c.isActive,
      };
    });
    setDrafts(next);
  }, [categories]);

  if (authLoading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container max-w-md py-20 text-center">
          <h1 className="font-heading text-2xl font-bold">Admin only</h1>
          <p className="mt-2 text-muted-foreground">
            You need an admin role to manage request categories.
          </p>
        </div>
      </div>
    );
  }

  const update = (slug: string, patch: Partial<Draft>) => {
    setDrafts((d) => ({ ...d, [slug]: { ...d[slug], ...patch } }));
  };

  const save = async (slug: string) => {
    const draft = drafts[slug];
    setSavingId(slug);
    const { error } = await (supabase as any)
      .from("request_categories")
      .update({
        label: draft.label,
        icon_name: draft.icon_name,
        color: draft.color,
        sort_order: draft.sort_order,
        is_active: draft.is_active,
      })
      .eq("slug", slug);
    setSavingId(null);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Category updated" });
    qc.invalidateQueries({ queryKey: ["request_categories"] });
  };

  const rows = Object.values(drafts).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container max-w-4xl py-8">
        <h1 className="font-heading text-2xl font-bold">Request Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit how categories appear across the app. Changes go live immediately.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Adding brand-new category slugs requires a database migration to extend
            the underlying enum. For now, you can edit, reorder, and disable existing
            categories. Disabled categories stay attached to past requests but are
            hidden from new pickers and filters.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {rows.map((d) => {
            const Preview = getIcon(d.icon_name);
            return (
              <div
                key={d.slug}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                      style={{ backgroundColor: `${d.color}20`, color: d.color }}
                    >
                      <Preview className="h-4 w-4" />
                    </span>
                    <code className="text-xs text-muted-foreground">{d.slug}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${d.slug}`} className="text-xs">
                      Active
                    </Label>
                    <Switch
                      id={`active-${d.slug}`}
                      checked={d.is_active}
                      onCheckedChange={(v) => update(d.slug, { is_active: v })}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={d.label}
                      onChange={(e) => update(d.slug, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Icon</Label>
                    <Select
                      value={d.icon_name}
                      onValueChange={(v) => update(d.slug, { icon_name: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Input
                      value={d.color}
                      onChange={(e) => update(d.slug, { color: e.target.value })}
                      placeholder="hsl(210, 100%, 50%)"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sort order</Label>
                    <Input
                      type="number"
                      value={d.sort_order}
                      onChange={(e) =>
                        update(d.slug, { sort_order: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => save(d.slug)}
                    disabled={savingId === d.slug}
                    className="gap-1.5"
                  >
                    {savingId === d.slug ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
