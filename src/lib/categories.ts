import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getIcon } from "./iconRegistry";

type RequestCategory = Database["public"]["Enums"]["request_category"];

export interface CategoryInfo {
  slug: RequestCategory;
  label: string;
  color: string;
  iconName: string;
  Icon: LucideIcon;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryRow {
  id: string;
  slug: string;
  label: string;
  icon_name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const FALLBACK: CategoryInfo = {
  slug: "announcement" as RequestCategory,
  label: "Unknown",
  color: "hsl(var(--muted-foreground))",
  iconName: "HelpCircle",
  Icon: getIcon(null),
  sortOrder: 999,
  isActive: true,
};

function toInfo(row: CategoryRow): CategoryInfo {
  return {
    slug: row.slug as RequestCategory,
    label: row.label,
    color: row.color,
    iconName: row.icon_name,
    Icon: getIcon(row.icon_name),
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

async function fetchCategories(includeInactive = false): Promise<CategoryInfo[]> {
  let query = supabase
    .from("request_categories" as any)
    .select("*")
    .order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as CategoryRow[]).map(toInfo);
}

/**
 * Active categories for use in pickers, filters, and rendering badges.
 */
export function useCategories() {
  return useQuery({
    queryKey: ["request_categories", "active"],
    queryFn: () => fetchCategories(false),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * All categories (including disabled). For admin management.
 */
export function useAllCategories() {
  return useQuery({
    queryKey: ["request_categories", "all"],
    queryFn: () => fetchCategories(true),
    staleTime: 60 * 1000,
  });
}

/**
 * Lookup helper given a list (e.g. from the hook) and a slug.
 * Returns a safe fallback when the slug is unknown so the UI never crashes.
 */
export function getCategory(
  categories: CategoryInfo[] | undefined,
  slug: RequestCategory | string | null | undefined,
): CategoryInfo {
  if (!slug || !categories) return FALLBACK;
  return categories.find((c) => c.slug === slug) ?? FALLBACK;
}

export type { RequestCategory };
