"use client";

import type { Toast } from "@/hooks/useToasts";

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2 px-4 sm:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.kind === "error" ? "alert" : "status"}
          className={`animate-pop-in pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl py-2 pr-2 pl-4 text-[15px] shadow-card ${
            t.kind === "error" ? "bg-danger text-white" : "bg-ink text-paper"
          }`}
        >
          <span className="min-w-0 flex-1 truncate py-2">{t.message}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                onDismiss(t.id);
              }}
              className="min-h-11 rounded-xl px-4 font-mono text-sm font-semibold tracking-wider text-accent uppercase hover:bg-paper/10"
            >
              {t.action.label}
            </button>
          )}
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="grid size-11 shrink-0 place-items-center rounded-xl opacity-70 hover:opacity-100"
          >
            ✕
          </button>
          {/* countdown bar */}
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[3px] bg-accent"
            style={{ animation: `toast-countdown ${t.duration}ms linear forwards` }}
          />
        </div>
      ))}
      <style>{`@keyframes toast-countdown { from { width: 100% } to { width: 0 } }`}</style>
    </div>
  );
}
