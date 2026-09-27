export function OfflineBanner() {
  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-ink px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 text-center text-sm text-paper"
    >
      <span className="size-2 rounded-full bg-accent" aria-hidden />
      <span>
        <strong className="font-mono tracking-widest uppercase">Offline</strong> — changes can&apos;t be saved right
        now. What you type is kept.
      </span>
    </div>
  );
}
