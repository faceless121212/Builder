"use client";

import { useCallback, useRef, useState } from "react";

export type Toast = {
  id: number;
  message: string;
  kind: "info" | "error";
  duration: number;
  action?: { label: string; onClick: () => void };
};

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (toast: Omit<Toast, "id" | "duration"> & { duration?: number }) => {
      const id = nextId.current++;
      const duration = toast.duration ?? 4000;
      setToasts((t) => [...t.slice(-2), { ...toast, id, duration }]);
      setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
