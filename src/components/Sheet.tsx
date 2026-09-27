"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Native <dialog>: a bottom sheet on phones, a centered panel on larger screens.
 * Esc / backdrop click closes. Keeps above the iOS keyboard via visualViewport.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const keyboard = useKeyboardInset(open);

  // Layout effect so showModal() + autofocus run inside the tap's task (iOS
  // only raises the keyboard for focus() calls made during a user gesture).
  useLayoutEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ marginBottom: keyboard ? keyboard : undefined }}
      className="animate-sheet-up sm:animate-pop-in m-0 mt-auto w-full max-w-none rounded-t-3xl border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-[#0b0c24]/45 backdrop:backdrop-blur-[2px] sm:m-auto sm:max-w-lg sm:rounded-2xl"
    >
      {open && (
        <div className="safe-bottom px-5 pt-3 sm:p-6">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden />
          {children}
        </div>
      )}
    </dialog>
  );
}

function useKeyboardInset(active: boolean) {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!active || !vv) return;
    const update = () => setInset(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      setInset(0);
    };
  }, [active]);
  return inset;
}
