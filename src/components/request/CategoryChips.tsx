import { useCategories, type RequestCategory } from "@/lib/categories";

interface Props {
  selected: RequestCategory | null;
  onSelect: (cat: RequestCategory) => void;
  autoGuessed?: RequestCategory | null;
}

export default function CategoryChips({ selected, onSelect, autoGuessed }: Props) {
  const { data: categories = [] } = useCategories();

  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.map((cat) => {
        const Icon = cat.Icon;
        const isSelected = selected === cat.slug;
        const isGuess = !selected && autoGuessed === cat.slug;
        return (
          <button
            key={cat.slug}
            type="button"
            onClick={() => onSelect(cat.slug)}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors"
            style={
              isSelected
                ? { borderColor: cat.color, backgroundColor: cat.color, color: "white" }
                : isGuess
                  ? { borderColor: cat.color, color: cat.color, backgroundColor: `${cat.color}18` }
                  : { borderColor: `${cat.color}40`, color: cat.color, backgroundColor: `${cat.color}08` }
            }
          >
            <Icon className="h-3 w-3" />
            {cat.label}
            {isGuess && <span className="ml-1 opacity-60">· guessed</span>}
          </button>
        );
      })}
    </div>
  );
}
