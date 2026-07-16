import { useCategories, type RequestCategory } from "@/lib/categories";

interface Props {
  selected: RequestCategory | null;
  onSelect: (cat: RequestCategory | null) => void;
}

export default function CategoryFilter({ selected, onSelect }: Props) {
  const { data: categories = [] } = useCategories();

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onSelect(null)}
        className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
          selected === null
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-transparent text-text-lo hover:border-border-mid hover:text-foreground"
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
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
            style={{
              borderColor: isSelected ? cat.color : `${cat.color}40`,
              backgroundColor: isSelected ? cat.color : `${cat.color}10`,
              color: isSelected ? "white" : cat.color,
            }}
          >
            <Icon className="h-3 w-3" />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
