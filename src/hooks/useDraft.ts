"use client";

import { useCallback, useEffect, useState } from "react";

export type Draft = { title: string; description: string };
const EMPTY: Draft = { title: "", description: "" };

/** Form state that survives reloads, crashes and going offline (localStorage). */
export function useDraft(key: string) {
  const storageKey = `fig09:draft:${key}`;
  const [draft, setDraftState] = useState<Draft>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
      if (raw) setDraftState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {}
  }, [storageKey]);

  const setDraft = useCallback(
    (update: Partial<Draft>) =>
      setDraftState((prev) => {
        const next = { ...prev, ...update };
        try {
          if (next.title || next.description) localStorage.setItem(storageKey, JSON.stringify(next));
          else localStorage.removeItem(storageKey);
        } catch {}
        return next;
      }),
    [storageKey],
  );

  const clear = useCallback(() => setDraft(EMPTY), [setDraft]);
  return { draft, setDraft, clear };
}
