// Curated list of business "types" used for the New Branch flow.
// Keep entries lowercase singular nouns that read naturally in
// "I want a ___ near here".

export interface BusinessType {
  slug: string;
  label: string;
  aliases?: string[];
}

export const BUSINESS_TYPES: BusinessType[] = [
  { slug: "bakery", label: "Bakery" },
  { slug: "barber", label: "Barber" },
  { slug: "bookshop", label: "Bookshop", aliases: ["book store", "books"] },
  { slug: "butcher", label: "Butcher" },
  { slug: "cafe", label: "Café", aliases: ["coffee shop"] },
  { slug: "childrens_shoes", label: "Children's shoe shop", aliases: ["kids shoes", "kids' shoe shop"] },
  { slug: "clothes_shop", label: "Clothes shop", aliases: ["clothing", "fashion"] },
  { slug: "coffee_shop", label: "Coffee shop" },
  { slug: "convenience_store", label: "Convenience store" },
  { slug: "crossfit_gym", label: "CrossFit gym" },
  { slug: "deli", label: "Deli" },
  { slug: "dentist", label: "Dentist" },
  { slug: "dry_cleaner", label: "Dry cleaner" },
  { slug: "florist", label: "Florist" },
  { slug: "garden_centre", label: "Garden centre" },
  { slug: "greengrocer", label: "Greengrocer" },
  { slug: "gym", label: "Gym" },
  { slug: "hairdresser", label: "Hairdresser", aliases: ["salon"] },
  { slug: "hardware_store", label: "Hardware store" },
  { slug: "ice_cream_shop", label: "Ice cream shop" },
  { slug: "indian_restaurant", label: "Indian restaurant" },
  { slug: "italian_restaurant", label: "Italian restaurant" },
  { slug: "juice_bar", label: "Juice bar" },
  { slug: "laundrette", label: "Laundrette", aliases: ["laundromat"] },
  { slug: "library", label: "Library" },
  { slug: "music_venue", label: "Music venue" },
  { slug: "nail_salon", label: "Nail salon" },
  { slug: "newsagent", label: "Newsagent" },
  { slug: "optician", label: "Optician" },
  { slug: "pharmacy", label: "Pharmacy", aliases: ["chemist"] },
  { slug: "physio", label: "Physiotherapist", aliases: ["physio"] },
  { slug: "pizza_place", label: "Pizza place" },
  { slug: "post_office", label: "Post office" },
  { slug: "pub", label: "Pub" },
  { slug: "ramen_shop", label: "Ramen shop" },
  { slug: "record_shop", label: "Record shop" },
  { slug: "restaurant", label: "Restaurant" },
  { slug: "supermarket", label: "Supermarket" },
  { slug: "sushi_restaurant", label: "Sushi restaurant" },
  { slug: "swimming_pool", label: "Swimming pool" },
  { slug: "tailor", label: "Tailor" },
  { slug: "thai_restaurant", label: "Thai restaurant" },
  { slug: "toy_shop", label: "Toy shop" },
  { slug: "vegan_restaurant", label: "Vegan restaurant" },
  { slug: "vet", label: "Vet" },
  { slug: "wine_bar", label: "Wine bar" },
  { slug: "yoga_studio", label: "Yoga studio" },
];

export function findBusinessType(slug: string | null | undefined): BusinessType | undefined {
  if (!slug) return undefined;
  return BUSINESS_TYPES.find((b) => b.slug === slug);
}

export function searchBusinessTypes(query: string): BusinessType[] {
  const q = query.trim().toLowerCase();
  if (!q) return BUSINESS_TYPES;
  return BUSINESS_TYPES.filter((b) => {
    if (b.label.toLowerCase().includes(q)) return true;
    if (b.slug.replace(/_/g, " ").includes(q)) return true;
    return b.aliases?.some((a) => a.toLowerCase().includes(q));
  });
}
