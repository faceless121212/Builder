export type IdeaStatus = "not_started" | "working_on_it";

export type Idea = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  created_at: string;
  updated_at: string;
};

export type Filter = "all" | IdeaStatus;

export const TITLE_MAX = 120;

export const STATUS_LABEL: Record<IdeaStatus, string> = {
  not_started: "Not started",
  working_on_it: "Working on it",
};

export const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "working_on_it", label: "Working on it" },
  { value: "not_started", label: "Not started" },
];

/** Returns an error message, or null when the title can be saved. */
export function validateTitle(title: string): string | null {
  const t = title.trim();
  if (!t) return "Give your idea a title first.";
  if (t.length > TITLE_MAX) return `Keep the title under ${TITLE_MAX} characters.`;
  return null;
}

export function toggledStatus(status: IdeaStatus): IdeaStatus {
  return status === "working_on_it" ? "not_started" : "working_on_it";
}

export function countByFilter(ideas: Idea[]): Record<Filter, number> {
  let working = 0;
  for (const i of ideas) if (i.status === "working_on_it") working++;
  return { all: ideas.length, working_on_it: working, not_started: ideas.length - working };
}

/** Newest first; optionally with "Working on it" pinned to the top. */
export function visibleIdeas(ideas: Idea[], filter: Filter, pinWorking: boolean): Idea[] {
  const list = filter === "all" ? [...ideas] : ideas.filter((i) => i.status === filter);
  return list.sort((a, b) => {
    if (pinWorking && a.status !== b.status) return a.status === "working_on_it" ? -1 : 1;
    return b.created_at.localeCompare(a.created_at);
  });
}

/** Stable "FIG. NN" number per idea, by creation order (oldest = 01). */
export function figureNumbers(ideas: Idea[]): Map<string, string> {
  const sorted = [...ideas].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return new Map(sorted.map((i, n) => [i.id, String(n + 1).padStart(2, "0")]));
}

/** Insert or replace by id. */
export function upsertIdea(ideas: Idea[], idea: Idea): Idea[] {
  const idx = ideas.findIndex((i) => i.id === idea.id);
  if (idx === -1) return [idea, ...ideas];
  const next = ideas.slice();
  next[idx] = idea;
  return next;
}
