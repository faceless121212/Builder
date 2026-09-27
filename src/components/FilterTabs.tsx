"use client";

import { FILTERS, type Filter } from "@/lib/ideas";

export function FilterTabs({
  value,
  counts,
  onChange,
}: {
  value: Filter;
  counts: Record<Filter, number>;
  onChange: (f: Filter) => void;
}) {
  return (
    <div role="tablist" aria-label="Filter ideas" className="flex gap-1 rounded-2xl border border-line bg-surface/80 p-1 backdrop-blur">
      {FILTERS.map((f) => {
        const active = f.value === value;
        return (
          <button
            key={f.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.value)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-2 text-[14px] font-medium whitespace-nowrap transition sm:min-h-10 sm:flex-none sm:px-4 ${
              active ? "bg-ink text-paper" : "text-muted hover:text-ink"
            }`}
          >
            {f.label}
            <span
              className={`rounded-md px-1.5 font-mono text-[11px] tabular-nums ${active ? "bg-paper/15" : "bg-surface-2"}`}
            >
              {counts[f.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
