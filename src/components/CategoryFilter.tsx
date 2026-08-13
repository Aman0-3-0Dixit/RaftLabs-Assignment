"use client";

export function CategoryFilter({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string | null;
  onChange: (category: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 pb-4" role="tablist" aria-label="Filter menu by category">
      <button
        type="button"
        role="tab"
        aria-selected={active === null}
        onClick={() => onChange(null)}
        className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
          active === null
            ? "bg-rail-chili text-rail-paper"
            : "bg-rail-paper/10 text-rail-paper/80 hover:bg-rail-paper/20"
        }`}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          type="button"
          role="tab"
          aria-selected={active === cat}
          onClick={() => onChange(cat)}
          className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition ${
            active === cat
              ? "bg-rail-chili text-rail-paper"
              : "bg-rail-paper/10 text-rail-paper/80 hover:bg-rail-paper/20"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
