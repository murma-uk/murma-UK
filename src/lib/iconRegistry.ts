import {
  Clock,
  MapPin,
  GraduationCap,
  Palette,
  Megaphone,
  Coffee,
  ShoppingBag,
  Music,
  Calendar,
  Star,
  Heart,
  Bell,
  Utensils,
  Bike,
  Dumbbell,
  BookOpen,
  Camera,
  Sparkles,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

// Whitelist of icons admins may pick from.
// Keys are stored in `request_categories.icon_name`.
export const ICON_REGISTRY: Record<string, LucideIcon> = {
  Clock,
  MapPin,
  GraduationCap,
  Palette,
  Megaphone,
  Coffee,
  ShoppingBag,
  Music,
  Calendar,
  Star,
  Heart,
  Bell,
  Utensils,
  Bike,
  Dumbbell,
  BookOpen,
  Camera,
  Sparkles,
};

export const ICON_NAMES = Object.keys(ICON_REGISTRY);

export function getIcon(name: string | null | undefined): LucideIcon {
  if (name && ICON_REGISTRY[name]) return ICON_REGISTRY[name];
  return HelpCircle;
}
