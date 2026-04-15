import { Clock, MapPin, GraduationCap, Palette, Megaphone } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type RequestCategory = Database["public"]["Enums"]["request_category"];

export const CATEGORIES: Record<RequestCategory, { label: string; icon: typeof Clock; color: string }> = {
  opening_hours: { label: "Opening Hours", icon: Clock, color: "hsl(210, 100%, 50%)" },
  new_branch: { label: "New Branch", icon: MapPin, color: "hsl(145, 65%, 42%)" },
  classes_sessions: { label: "Classes & Sessions", icon: GraduationCap, color: "hsl(280, 70%, 55%)" },
  artist_visit: { label: "Artist Visit", icon: Palette, color: "hsl(12, 90%, 60%)" },
  announcement: { label: "Announcement", icon: Megaphone, color: "hsl(38, 92%, 50%)" },
};

export type { RequestCategory };
