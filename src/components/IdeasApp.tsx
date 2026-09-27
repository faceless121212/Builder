"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIdeas } from "@/hooks/useIdeas";
import { useOnline } from "@/hooks/useOnline";
import { useToasts } from "@/hooks/useToasts";
import { countByFilter, figureNumbers, visibleIdeas, type Filter, type Idea } from "@/lib/ideas";
import { AddIdeaInline } from "./AddIdeaInline";
import { AddIdeaSheet } from "./AddIdeaSheet";
import { EditIdeaSheet } from "./EditIdeaSheet";
import { EmptyState } from "./EmptyState";
import { FilterTabs } from "./FilterTabs";
import { IdeaCard } from "./IdeaCard";
import { Logo } from "./Logo";
import { OfflineBanner } from "./OfflineBanner";
import { Toasts } from "./Toasts";

const PIN_KEY = "fig09:pin-working";
const isDesktop = () => window.matchMedia("(min-width: 640px)").matches;

export function IdeasApp({ initialIdeas, userId, email }: { initialIdeas: Idea[]; userId: string; email: string }) {
  const { toasts, push, dismiss } = useToasts();
  const { ideas, addIdea, toggleStatus, editIdea, deleteIdea } = useIdeas(initialIdeas, userId, push, dismiss);
  const online = useOnline();

  const [filter, setFilter] = useState<Filter>("all");
  const [pinWorking, setPinWorking] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inlineRef = useRef<HTMLInputElement>(null);

  const counts = useMemo(() => countByFilter(ideas), [ideas]);
  const shown = useMemo(() => visibleIdeas(ideas, filter, pinWorking), [ideas, filter, pinWorking]);
  const figs = useMemo(() => figureNumbers(ideas), [ideas]);
  const editing = ideas.find((i) => i.id === editingId) ?? null;

  const openAdd = useCallback(() => {
    if (isDesktop()) {
      inlineRef.current?.focus();
      inlineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      setSheetOpen(true);
    }
  }, []);

  // Restore the "pin working" preference.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      setPinWorking(localStorage.getItem(PIN_KEY) === "1");
    } catch {}
  }, []);
  const togglePin = () =>
    setPinWorking((p) => {
      try {
        localStorage.setItem(PIN_KEY, p ? "0" : "1");
      } catch {}
      return !p;
    });

  // "New idea" app shortcut → /?new=1 opens the add form directly.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("new") === "1") {
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.pathname + url.search);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the launch URL
      openAdd();
    }
  }, [openAdd]);

  // Keyboard shortcut: N focuses the add input.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable=true], dialog")) return;
      e.preventDefault();
      openAdd();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openAdd]);

  return (
    <>
      {!online && <OfflineBanner />}
      <div className="mx-auto w-full max-w-[900px] px-4 pb-32 sm:px-6 sm:pb-16">
        <header className="flex items-center justify-between pt-[calc(1rem+env(safe-area-inset-top))] pb-6 sm:pt-8">
          <Logo />
          <form action="/auth/signout" method="post" className="flex items-center gap-3">
            <span className="hidden max-w-[220px] truncate text-sm text-muted md:inline">{email}</span>
            <button className="min-h-11 rounded-xl px-3 text-sm text-muted transition hover:bg-surface-2 hover:text-ink">
              Sign out
            </button>
          </form>
        </header>

        <section className="mb-5">
          <p className="font-mono text-[11px] tracking-[0.25em] text-muted uppercase">
            Sheet 01 · {counts.all} {counts.all === 1 ? "idea" : "ideas"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Ideas to build</h1>
        </section>

        <AddIdeaInline ref={inlineRef} onAdd={addIdea} offline={!online} />

        <div className="sticky top-0 z-20 -mx-4 mt-4 bg-gradient-to-b from-paper via-paper/95 to-paper/0 px-4 pt-2 pb-3 sm:static sm:mx-0 sm:bg-none sm:px-0 sm:pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FilterTabs value={filter} counts={counts} onChange={setFilter} />
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 self-end text-sm text-muted select-none sm:self-auto">
              <span>Pin “Working on it” to top</span>
              <input type="checkbox" role="switch" checked={pinWorking} onChange={togglePin} className="peer sr-only" />
              <span
                aria-hidden
                className="relative h-6 w-10 rounded-full bg-line transition peer-checked:bg-accent peer-focus-visible:ring-4 peer-focus-visible:ring-accent/25 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-surface after:shadow after:transition peer-checked:after:translate-x-4"
              />
            </label>
          </div>
        </div>

        {shown.length === 0 ? (
          <EmptyState filter={filter} onAdd={openAdd} />
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {shown.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                fig={figs.get(idea.id) ?? "--"}
                onOpen={() => setEditingId(idea.id)}
                onToggle={() => toggleStatus(idea.id)}
                onDelete={() => deleteIdea(idea.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Mobile floating add button */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Add idea"
        className="fixed right-[calc(1.25rem+env(safe-area-inset-right))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-30 grid size-16 place-items-center rounded-2xl bg-accent text-accent-ink shadow-[0_12px_30px_-8px_rgba(255,90,31,0.6)] transition active:scale-95 sm:hidden"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <AddIdeaSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onAdd={addIdea} offline={!online} />
      <EditIdeaSheet
        idea={editing}
        fig={editing ? figs.get(editing.id) : undefined}
        onClose={() => setEditingId(null)}
        onSave={editIdea}
        onToggle={toggleStatus}
        onDelete={deleteIdea}
        offline={!online}
      />
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
