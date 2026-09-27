"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { type Idea, toggledStatus, upsertIdea } from "@/lib/ideas";
import type { useToasts } from "./useToasts";

export const UNDO_MS = 5000;

type Push = ReturnType<typeof useToasts>["push"];
type PendingDelete = { timer: ReturnType<typeof setTimeout>; toastId: number };

/**
 * Owns the idea list: optimistic writes with rollback, delayed deletes with
 * Undo, and Supabase realtime sync across devices.
 */
export function useIdeas(initial: Idea[], userId: string, push: Push, dismissToast: (id: number) => void) {
  const supabase = useMemo<SupabaseClient>(() => createClient(), []);
  const [ideas, setIdeas] = useState<Idea[]>(initial);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const pendingDeletes = useRef(new Map<string, PendingDelete>());
  const inflightInserts = useRef(new Set<string>());
  const ideasRef = useRef(ideas);
  useEffect(() => {
    ideasRef.current = ideas;
  }, [ideas]);

  const fail = useCallback(
    (what: string, message?: string) => {
      const network = !message || /fetch|network|load failed/i.test(message);
      push({
        kind: "error",
        message: `Couldn't ${what}. ${network ? "Check your connection and try again." : message}`,
      });
    },
    [push],
  );

  // ---- Create ---------------------------------------------------------------
  const addIdea = useCallback(
    async (title: string, description: string): Promise<boolean> => {
      const now = new Date().toISOString();
      const idea: Idea = {
        id: crypto.randomUUID(),
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        status: "not_started",
        created_at: now,
        updated_at: now,
      };
      inflightInserts.current.add(idea.id);
      setIdeas((list) => upsertIdea(list, idea));
      const { data, error } = await supabase
        .from("ideas")
        .insert({ id: idea.id, title: idea.title, description: idea.description })
        .select()
        .single();
      inflightInserts.current.delete(idea.id);
      if (error) {
        setIdeas((list) => list.filter((i) => i.id !== idea.id));
        fail("save your idea", error.message);
        return false;
      }
      setIdeas((list) => upsertIdea(list, data as Idea));
      return true;
    },
    [supabase, userId, fail],
  );

  // ---- Update (status + edit share the same optimistic path) -----------------
  const updateIdea = useCallback(
    async (id: string, patch: Partial<Pick<Idea, "title" | "description" | "status">>, what: string) => {
      const before = ideasRef.current.find((i) => i.id === id);
      if (!before) return false;
      setIdeas((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      const { data, error } = await supabase.from("ideas").update(patch).eq("id", id).select().single();
      if (error) {
        // Roll back only the fields we changed, in case something else changed meanwhile.
        setIdeas((list) =>
          list.map((i) => (i.id === id ? { ...i, ...pick(before, Object.keys(patch) as (keyof Idea)[]) } : i)),
        );
        fail(what, error.message);
        return false;
      }
      setIdeas((list) => upsertIdea(list, data as Idea));
      return true;
    },
    [supabase, fail],
  );

  const toggleStatus = useCallback(
    (id: string) => {
      const idea = ideasRef.current.find((i) => i.id === id);
      if (idea) void updateIdea(id, { status: toggledStatus(idea.status) }, "update the status");
    },
    [updateIdea],
  );

  const editIdea = useCallback(
    (id: string, title: string, description: string) =>
      updateIdea(id, { title: title.trim(), description: description.trim() || null }, "save your changes"),
    [updateIdea],
  );

  // ---- Delete with Undo -------------------------------------------------------
  const commitDelete = useCallback(
    async (id: string) => {
      const pending = pendingDeletes.current.get(id);
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingDeletes.current.delete(id);
      const { error } = await supabase.from("ideas").delete().eq("id", id);
      if (error) {
        setHidden((h) => without(h, id));
        fail("delete the idea", error.message);
        return;
      }
      setIdeas((list) => list.filter((i) => i.id !== id));
      setHidden((h) => without(h, id));
    },
    [supabase, fail],
  );

  const undoDelete = useCallback(
    (id: string) => {
      const pending = pendingDeletes.current.get(id);
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingDeletes.current.delete(id);
      dismissToast(pending.toastId);
      setHidden((h) => without(h, id));
    },
    [dismissToast],
  );

  const deleteIdea = useCallback(
    (id: string) => {
      const idea = ideasRef.current.find((i) => i.id === id);
      if (!idea || pendingDeletes.current.has(id)) return;
      setHidden((h) => new Set(h).add(id));
      const toastId = push({
        kind: "info",
        message: `Deleted “${truncate(idea.title, 40)}”`,
        duration: UNDO_MS,
        action: { label: "Undo", onClick: () => undoDelete(id) },
      });
      const timer = setTimeout(() => void commitDelete(id), UNDO_MS);
      pendingDeletes.current.set(id, { timer, toastId });
    },
    [push, undoDelete, commitDelete],
  );

  // If the page is closed during the Undo window, delete right away.
  useEffect(() => {
    const flush = () => pendingDeletes.current.forEach((_, id) => void commitDelete(id));
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [commitDelete]);

  // ---- Sync ---------------------------------------------------------------------
  const refetch = useCallback(async () => {
    const { data, error } = await supabase.from("ideas").select("*").order("created_at", { ascending: false });
    if (error || !data) return;
    setIdeas((local) => {
      const server = data as Idea[];
      const ids = new Set(server.map((i) => i.id));
      const stillInflight = local.filter((i) => inflightInserts.current.has(i.id) && !ids.has(i.id));
      return [...stillInflight, ...server];
    });
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const channel = supabase.channel(`ideas:${userId}`);
    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ideas", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const id = (payload.old as Partial<Idea>).id;
            if (!id) return;
            const pending = pendingDeletes.current.get(id);
            if (pending) {
              clearTimeout(pending.timer);
              pendingDeletes.current.delete(id);
            }
            setIdeas((list) => list.filter((i) => i.id !== id));
            return;
          }
          const row = payload.new as Idea;
          setIdeas((list) => {
            const current = list.find((i) => i.id === row.id);
            // Ignore stale echoes older than what we already have.
            if (current && current.updated_at > row.updated_at) return list;
            return upsertIdea(list, row);
          });
        },
      );

    // Realtime needs the user's JWT so RLS applies; then subscribe.
    void supabase.realtime.setAuth().then(() => {
      if (cancelled) return;
      channel.subscribe((status) => {
        // After a reconnect we may have missed events: reconcile.
        if (status === "SUBSCRIBED") void refetch();
      });
    });

    const onVisible = () => document.visibilityState === "visible" && void refetch();
    window.addEventListener("online", refetch);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("online", refetch);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, refetch]);

  const shown = useMemo(() => ideas.filter((i) => !hidden.has(i.id)), [ideas, hidden]);

  return { ideas: shown, addIdea, toggleStatus, editIdea, deleteIdea };
}

function without(set: Set<string>, id: string) {
  const next = new Set(set);
  next.delete(id);
  return next;
}

function pick<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Partial<T>;
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
