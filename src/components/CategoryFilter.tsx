import { CATEGORIES, type RequestCategory } from "@/lib/categories";

interface Props {
  selected: RequestCategory | null;
  onSelect: (cat: RequestCategory | null) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={`rounded-full px-3 py-1.5 text-xs font-medium font-heading transition-colors ${
          selected === null
            ? "bg-foreground text-background"
            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
        }`}
      >
        All
      </button>
      {(Object.entries(CATEGORIES) as [RequestCategory, typeof CATEGORIES[RequestCategory]][]).map(([key, cat]) => {
        const Icon = cat.icon;
        return (
          <button
            key={key}
            onClick={() => onSelect(selected === key ? null : key)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium font-heading transition-colors ${
              selected === key
                ? "text-white"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
            style={selected === key ? { backgroundColor: cat.color } : {}}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
