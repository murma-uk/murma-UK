import type { RequestCategory } from "@/lib/categories";
import { BUSINESS_TYPES, findBusinessType } from "@/lib/businessTypes";

export interface WishHints {
  category: RequestCategory | null;
  businessKind?: "type" | "brand" | null;
  typeSlug?: string | null;
  brandName?: string | null;
}

// Ordered by specificity — first match wins.
const KEYWORD_MAP: { category: RequestCategory; patterns: RegExp[] }[] = [
  {
    category: "nature_outdoors" as RequestCategory,
    patterns: [
      /\b(meadow|wildflower|tree(s)?|bat\s*box|bird\s*box|pond|river|park|garden|allotment|hedgerow|rewild|wildlife|nature|forest|woodland|bench|bin|recycl|composter?|planter|green\s*space|cycle\s*(path|lane)|path)\b/i,
    ],
  },
  {
    category: "culture_art" as RequestCategory,
    patterns: [
      /\b(mural|street\s*art|graffiti|gig|concert|band|exhibition|gallery|poetry|open\s*mic|theatre|theater|cinema|film|festival|artist|sculpture|installation|busker?|live\s*music|dj|comedy\s*night)\b/i,
    ],
  },
  {
    category: "community_service" as RequestCategory,
    patterns: [
      /\b(repair\s*caf[eé]|swap\s*shop|community\s*fridge|language\s*exchange|food\s*bank|tool\s*library|meet\s*?up|volunteer|workshop|club|men[''']?s\s*shed|skill[s]?\s*share|library|community\s*centre|playgroup|after\s*school)\b/i,
    ],
  },
  {
    category: "classes_sessions" as RequestCategory,
    patterns: [
      /\b(class(es)?|lesson(s)?|course(s)?|workshop|session(s)?|tutorial)\b/i,
    ],
  },
  {
    category: "artist_visit" as RequestCategory,
    patterns: [
      /\b(visit|tour|book\s*signing|author\s*event|talk\s*by|in\s*conversation\s*with)\b/i,
    ],
  },
  {
    category: "opening_hours" as RequestCategory,
    patterns: [
      /\b(open\s*(later|earlier|sundays?|weekends?|24\/?7|all\s*night)|opening\s*hours|stay\s*open\s*longer|late\s*opening)\b/i,
    ],
  },
];

const BRAND_HINTS = [
  /\b(greggs|pret|costa|starbucks|nando[''']?s|wagamama|tesco|sainsbury[''']?s|m&s|marks\s*and\s*spencer|aldi|lidl|waitrose|john\s*lewis|ikea|primark|boots|wh\s*smith|argos)\b/i,
];

function detectBusinessType(text: string): string | null {
  const lower = text.toLowerCase();
  for (const bt of BUSINESS_TYPES) {
    const needles = [bt.label.toLowerCase(), bt.slug.replace(/_/g, " "), ...(bt.aliases ?? []).map((a) => a.toLowerCase())];
    for (const n of needles) {
      // word-ish boundary so 'bar' doesn't match 'barber'
      const re = new RegExp(`(^|\\s)${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$|[,.!?])`, "i");
      if (re.test(lower)) return bt.slug;
    }
  }
  return null;
}

function detectBrand(text: string): string | null {
  for (const re of BRAND_HINTS) {
    const m = text.match(re);
    if (m) {
      // Capitalise nicely
      return m[0]
        .trim()
        .split(/\s+/)
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    }
  }
  return null;
}

export function classifyWish(text: string): WishHints {
  const clean = (text || "").trim();
  if (clean.length < 3) return { category: null };

  // Business type/brand → new_branch
  const typeSlug = detectBusinessType(clean);
  const brand = detectBrand(clean);
  const newBranchSignals = /\b(new|open|opening|need|want|wish|would\s*love)\b/i.test(clean);

  if (typeSlug && (newBranchSignals || /\b(near|in|here|nearby|locally)\b/i.test(clean))) {
    return {
      category: "new_branch" as RequestCategory,
      businessKind: "type",
      typeSlug,
    };
  }
  if (brand) {
    return {
      category: "new_branch" as RequestCategory,
      businessKind: "brand",
      brandName: brand,
    };
  }

  // Keyword categories
  for (const entry of KEYWORD_MAP) {
    if (entry.patterns.some((p) => p.test(clean))) {
      return { category: entry.category };
    }
  }

  // Fallback — wild idea
  return { category: "wild_idea" as RequestCategory };
}

export function suggestTitleAndDescription(wish: string, hints: WishHints, town: string) {
  const trimmed = wish.trim().replace(/\s+/g, " ");
  if (hints.category === ("new_branch" as RequestCategory)) {
    if (hints.businessKind === "type" && hints.typeSlug) {
      const t = findBusinessType(hints.typeSlug);
      return {
        title: t ? `New ${t.label.toLowerCase()}${town ? ` in ${town}` : ""}` : trimmed,
        description: trimmed,
      };
    }
    if (hints.businessKind === "brand" && hints.brandName) {
      return {
        title: `${hints.brandName}${town ? ` in ${town}` : ""}`,
        description: trimmed,
      };
    }
  }
  return { title: trimmed.slice(0, 120), description: "" };
}
