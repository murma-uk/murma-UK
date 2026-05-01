import { useCategories, type RequestCategory } from "@/lib/categories";

interface Props {
  selected: RequestCategory | null;
  onSelect: (cat: RequestCategory | null) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  const { data: categories = [] } = useCategories();

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
      {categories.map((cat) => {
        const Icon = cat.Icon;
        const isSelected = selected === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => onSelect(isSelected ? null : cat.slug)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium font-heading transition-colors ${
              isSelected
                ? "text-white"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
            style={isSelected ? { backgroundColor: cat.color } : {}}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
