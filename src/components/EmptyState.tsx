import type { Filter } from "@/lib/ideas";

export function EmptyState({ filter, onAdd }: { filter: Filter; onAdd: () => void }) {
  const copy =
    filter === "all"
      ? { title: "A blank sheet.", body: "Every great build starts as a rough sketch. Drop your first idea here." }
      : filter === "working_on_it"
        ? { title: "Nothing on the bench.", body: "Tap a status badge to mark an idea as “Working on it”." }
        : { title: "Everything's in motion.", body: "No ideas waiting to be started." };

  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="empty-illustration size-44 opacity-80 sm:size-52" role="img" aria-label="Blueprint sketch of a light bulb" />
      <p className="mt-6 font-mono text-[11px] tracking-[0.25em] text-muted uppercase">FIG.00 — Empty</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">{copy.title}</h2>
      <p className="mt-2 max-w-sm text-muted">{copy.body}</p>
      {filter === "all" && (
        <button
          onClick={onAdd}
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 font-semibold text-accent-ink transition active:scale-[0.98]"
        >
          <span aria-hidden className="text-lg">+</span> Add your first idea
        </button>
      )}
      {filter === "all" && (
        <p className="mt-3 hidden text-sm text-muted sm:block">
          or press <kbd className="rounded border border-line px-1.5 font-mono text-xs">N</kbd>
        </p>
      )}
    </div>
  );
}
