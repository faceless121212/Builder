"use client";

import { useRef, useState } from "react";
import type { Idea } from "@/lib/ideas";
import { StatusBadge } from "./StatusBadge";

const SWIPE_DELETE_PX = 110;

export function IdeaCard({
  idea,
  fig,
  onOpen,
  onToggle,
  onDelete,
}: {
  idea: Idea;
  fig: string;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { dx, handlers } = useSwipeLeft(onDelete);
  const working = idea.status === "working_on_it";

  return (
    <li className="animate-pop-in relative list-none overflow-hidden rounded-2xl">
      {/* Revealed behind the card while swiping */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-end rounded-2xl bg-danger pr-6 font-mono text-xs tracking-widest text-white uppercase"
        style={{ opacity: Math.min(1, -dx / SWIPE_DELETE_PX) }}
      >
        Delete
      </div>
      <article
        {...handlers}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        tabIndex={0}
        aria-label={`Open idea: ${idea.title}`}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        className={`group relative flex h-full cursor-pointer flex-col rounded-2xl border bg-surface p-4 shadow-card transition-[border-color,transform] duration-150 outline-none hover:border-ink/25 focus-visible:ring-4 focus-visible:ring-accent/25 sm:p-5 ${
          working ? "border-accent/35" : "border-line"
        } ${dx ? "transition-none" : ""}`}
      >
        {working && <span aria-hidden className="absolute top-4 bottom-4 left-0 w-[3px] rounded-r bg-accent" />}
        <div className="flex items-start gap-3">
          <span className="mt-1 shrink-0 font-mono text-[11px] tracking-widest text-muted">FIG.{fig}</span>
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[17px] leading-snug font-semibold tracking-tight break-words" title={idea.title}>
            {idea.title}
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${idea.title}`}
            title="Delete"
            className="-mt-2 -mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-danger/10 hover:text-danger sm:size-9 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <TrashIcon />
          </button>
        </div>
        {idea.description ? (
          <p className="mt-1.5 line-clamp-2 text-[15px] leading-relaxed break-words text-muted">{idea.description}</p>
        ) : (
          <p className="mt-1.5 text-[15px] text-muted/50 italic">No notes yet</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
          <StatusBadge status={idea.status} onToggle={onToggle} />
          <time dateTime={idea.created_at} suppressHydrationWarning className="font-mono text-[11px] tracking-wide text-muted">
            {formatDate(idea.created_at)}
          </time>
        </div>
      </article>
    </li>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
}

/** Horizontal swipe-left to delete on touch devices; vertical scroll is left alone. */
function useSwipeLeft(onDelete: () => void) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; axis: "x" | "y" | null } | null>(null);
  const moved = useRef(false);

  return {
    dx,
    handlers: {
      onTouchStart(e: React.TouchEvent) {
        const t = e.touches[0];
        start.current = { x: t.clientX, y: t.clientY, axis: null };
        moved.current = false;
      },
      onTouchMove(e: React.TouchEvent) {
        const s = start.current;
        if (!s) return;
        const t = e.touches[0];
        const mx = t.clientX - s.x;
        const my = t.clientY - s.y;
        if (!s.axis && Math.hypot(mx, my) > 8) s.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
        if (s.axis === "x") {
          moved.current = true;
          setDx(Math.min(0, mx));
        }
      },
      onTouchEnd() {
        if (dx <= -SWIPE_DELETE_PX) onDelete();
        setDx(0);
        start.current = null;
      },
      onClickCapture(e: React.MouseEvent) {
        // A swipe shouldn't also count as a tap that opens the card.
        if (moved.current) {
          e.stopPropagation();
          moved.current = false;
        }
      },
    },
  };
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}
