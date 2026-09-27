"use client";

import { forwardRef, useState } from "react";
import { useDraft } from "@/hooks/useDraft";
import { TITLE_MAX, validateTitle } from "@/lib/ideas";

/** Desktop quick-add: type a title, press Enter. */
export const AddIdeaInline = forwardRef<
  HTMLInputElement,
  { onAdd: (title: string, description: string) => Promise<boolean>; offline: boolean }
>(function AddIdeaInline({ onAdd, offline }, ref) {
  const { draft, setDraft, clear } = useDraft("inline");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validateTitle(draft.title);
    if (problem) return setError(problem);
    if (offline) return setError("You're offline — your idea is kept here. Press Enter again once you're back online.");
    const title = draft.title;
    clear();
    const ok = await onAdd(title, "");
    if (!ok) setDraft({ title }); // give the text back so nothing is lost
  }

  return (
    <form onSubmit={submit} noValidate className="hidden sm:block">
      <div className="group flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 shadow-card transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
        <span className="font-mono text-lg text-accent" aria-hidden>
          +
        </span>
        <label htmlFor="quick-add" className="sr-only">
          Add idea
        </label>
        <input
          id="quick-add"
          ref={ref}
          maxLength={TITLE_MAX}
          value={draft.title}
          onChange={(e) => {
            setDraft({ title: e.target.value });
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === "Escape" && e.currentTarget.blur()}
          placeholder="Add idea — type a title and press Enter"
          aria-invalid={!!error}
          aria-describedby={error ? "quick-add-error" : undefined}
          className="h-14 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted/70"
        />
        <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted group-focus-within:hidden">
          N
        </kbd>
        <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-muted group-focus-within:inline">
          ↵
        </kbd>
      </div>
      {error && (
        <p id="quick-add-error" role="alert" className="mt-2 pl-1 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
});
