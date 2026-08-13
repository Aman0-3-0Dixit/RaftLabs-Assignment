"use client";

import { useMemo, useState } from "react";
import type { MenuItem } from "@/lib/repositories/types";
import { CategoryFilter } from "./CategoryFilter";
import { VirtualizedMenuGrid } from "./VirtualizedMenuGrid";

export function MenuBrowser({ items }: { items: MenuItem[] }) {
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items]
  );

  const filtered = useMemo(
    () => (category ? items.filter((i) => i.category === category) : items),
    [items, category]
  );

  return (
    <div>
      <CategoryFilter categories={categories} active={category} onChange={setCategory} />
      <VirtualizedMenuGrid items={filtered} />
    </div>
  );
}
