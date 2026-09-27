"use client";

import { STATUS_LABEL, type IdeaStatus } from "@/lib/ideas";

/** One tap toggles Not started ↔ Working on it. */
export function StatusBadge({ status, onToggle }: { status: IdeaStatus; onToggle: () => void }) {
  const working = status === "working_on_it";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={working}
      title={working ? "Mark as not started" : "Mark as working on it"}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition active:scale-95 sm:min-h-9 ${
        working
          ? "border-accent/40 bg-accent-soft text-accent"
          : "border-line bg-surface-2/70 text-muted hover:text-ink"
      }`}
    >
      <StatusGlyph working={working} />
      {STATUS_LABEL[status]}
    </button>
  );
}

function StatusGlyph({ working }: { working: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <circle
        cx="7"
        cy="7"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray={working ? undefined : "2.2 2"}
      />
      {working && <path d="M7 1.5 A5.5 5.5 0 0 1 7 12.5 Z" fill="currentColor" />}
    </svg>
  );
}
