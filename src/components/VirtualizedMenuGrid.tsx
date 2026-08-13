"use client";

import { useMemo } from "react";
import { List, type RowComponentProps } from "react-window";
import type { MenuItem } from "@/lib/repositories/types";
import { MenuItemCard } from "./MenuItemCard";
import { useElementSize } from "@/hooks/useElementSize";

function columnsForWidth(width: number): number {
  if (width === 0) return 1; // not measured yet
  if (width < 480) return 1;
  if (width < 760) return 2;
  if (width < 1040) return 3;
  return 4;
}

function rowHeightForColumns(columns: number): number {
  // Narrower columns mean a wider card, so its 3:2 image is taller too —
  // give single/double-column rows more vertical room than a 4-up grid.
  if (columns === 1) return 430;
  if (columns === 2) return 390;
  return 350;
}

interface RowData {
  rows: MenuItem[][];
  columns: number;
}

function Row({ index, style, rows, columns }: RowComponentProps<RowData>) {
  const row = rows[index];
  return (
    <div
      style={{ ...style, gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      className="grid gap-4 px-1 pb-4"
    >
      {row.map((item) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function VirtualizedMenuGrid({ items }: { items: MenuItem[] }) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>();
  const columns = columnsForWidth(width);
  const rowHeight = rowHeightForColumns(columns);

  const rows = useMemo(() => {
    const chunks: MenuItem[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      chunks.push(items.slice(i, i + columns));
    }
    return chunks;
  }, [items, columns]);

  const listHeight = Math.min(rows.length * rowHeight, 760);

  return (
    <div ref={containerRef} className="w-full">
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-rail-paper/30 p-10 text-center text-rail-paper/60">
          No dishes match this filter right now.
        </div>
      ) : width > 0 ? (
        <List
          rowComponent={Row}
          rowCount={rows.length}
          rowHeight={rowHeight}
          rowProps={{ rows, columns }}
          overscanCount={2}
          style={{ height: listHeight }}
          className="scrollbar-thin"
        />
      ) : null}
    </div>
  );
}
