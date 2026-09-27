"use client";

import { useState } from "react";
import { TITLE_MAX, validateTitle } from "@/lib/ideas";

/** Title + description form used by the mobile add sheet and the edit sheet. */
export function IdeaForm({
  heading,
  title,
  description,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  offline,
  extra,
  autoFocus = true,
}: {
  heading: string;
  title: string;
  description: string;
  onChange: (patch: { title?: string; description?: string }) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  offline: boolean;
  extra?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const problem = validateTitle(title);
    if (problem) return setError(problem);
    if (offline) return setError("You're offline — your text is kept here. Save once you're back online.");
    onSubmit();
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs tracking-[0.2em] text-muted uppercase">{heading}</h2>
        {extra}
      </div>
      <label className="sr-only" htmlFor="idea-title">
        Title
      </label>
      {/* Textarea so long titles wrap and show in full; Enter still saves. */}
      <textarea
        id="idea-title"
        rows={1}
        autoFocus={autoFocus}
        enterKeyHint="done"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        maxLength={TITLE_MAX}
        value={title}
        onChange={(e) => {
          onChange({ title: e.target.value.replace(/\n/g, " ") });
          if (error) setError(null);
        }}
        placeholder="What do you want to build?"
        aria-invalid={!!error}
        aria-describedby={error ? "idea-error" : undefined}
        className="block w-full resize-none bg-transparent text-xl leading-snug font-semibold tracking-tight break-words outline-none [field-sizing:content] placeholder:text-muted/60"
      />
      <div className="mt-1 flex h-5 items-center justify-between text-xs">
        {error ? (
          <p id="idea-error" role="alert" className="text-danger">
            {error}
          </p>
        ) : (
          <span />
        )}
        {title.length > TITLE_MAX - 20 && (
          <span className="font-mono text-muted">
            {title.length}/{TITLE_MAX}
          </span>
        )}
      </div>
      <label className="sr-only" htmlFor="idea-description">
        Description
      </label>
      <textarea
        id="idea-description"
        rows={4}
        value={description}
        onChange={(e) => onChange({ description: e.target.value })}
        placeholder="Notes, why it matters, first step… (optional)"
        className="mt-2 block max-h-[45dvh] min-h-28 w-full resize-none rounded-xl border border-line bg-surface-2/60 p-3 leading-relaxed outline-none [field-sizing:content] placeholder:text-muted/60 focus:border-accent"
      />
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 flex-1 rounded-xl border border-line font-medium text-muted transition hover:text-ink sm:flex-none sm:px-5"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="h-12 flex-[2] rounded-xl bg-accent font-semibold text-accent-ink transition active:scale-[0.99] sm:ml-auto sm:flex-none sm:px-6"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
