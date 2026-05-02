import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "time"
  | "select"
  | "multiselect"
  | "days";

export interface FieldOption {
  value: string;
  label: string;
}

export interface CategoryField {
  id: string;
  category_id: string;
  key: string;
  label: string;
  field_type: FieldType;
  options: FieldOption[] | null;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  sort_order: number;
  is_active: boolean;
}

async function fetchFields(categoryId: string | undefined, includeInactive = false): Promise<CategoryField[]> {
  if (!categoryId) return [];
  let q = (supabase as any)
    .from("request_category_fields")
    .select("*")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true });
  if (!includeInactive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as CategoryField[];
}

export function useCategoryFields(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["request_category_fields", categoryId ?? null, "active"],
    enabled: !!categoryId,
    queryFn: () => fetchFields(categoryId, false),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllCategoryFields(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["request_category_fields", categoryId ?? null, "all"],
    enabled: !!categoryId,
    queryFn: () => fetchFields(categoryId, true),
    staleTime: 30 * 1000,
  });
}

export function formatFieldValue(field: CategoryField, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (field.field_type === "multiselect" || field.field_type === "days") {
    if (!Array.isArray(value)) return String(value);
    if (field.options) {
      return value
        .map((v) => field.options!.find((o) => o.value === v)?.label ?? String(v))
        .join(", ");
    }
    return value.join(", ");
  }
  if (field.field_type === "select" && field.options) {
    return field.options.find((o) => o.value === value)?.label ?? String(value);
  }
  return String(value);
}

export function validateFieldValues(
  fields: CategoryField[],
  values: Record<string, unknown>,
): string | null {
  for (const f of fields) {
    if (!f.required) continue;
    const v = values[f.key];
    const empty =
      v === null ||
      v === undefined ||
      v === "" ||
      (Array.isArray(v) && v.length === 0);
    if (empty) return `${f.label} is required`;
  }
  return null;
}
