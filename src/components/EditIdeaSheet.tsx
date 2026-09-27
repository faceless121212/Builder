"use client";

import { useState } from "react";
import type { Idea } from "@/lib/ideas";
import { IdeaForm } from "./IdeaForm";
import { Sheet } from "./Sheet";
import { StatusBadge } from "./StatusBadge";

/** Opened by tapping a card: full title + description, editable. */
export function EditIdeaSheet({
  idea,
  fig,
  onClose,
  onSave,
  onToggle,
  onDelete,
  offline,
}: {
  idea: Idea | null;
  fig?: string;
  onClose: () => void;
  onSave: (id: string, title: string, description: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  offline: boolean;
}) {
  return (
    <Sheet open={!!idea} onClose={onClose} label="Edit idea">
      {idea && (
        <EditBody
          key={idea.id}
          idea={idea}
          fig={fig}
          onClose={onClose}
          onSave={onSave}
          onToggle={onToggle}
          onDelete={onDelete}
          offline={offline}
        />
      )}
    </Sheet>
  );
}

function EditBody({
  idea,
  fig,
  onClose,
  onSave,
  onToggle,
  onDelete,
  offline,
}: Omit<Parameters<typeof EditIdeaSheet>[0], "idea"> & { idea: Idea }) {
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description ?? "");

  return (
    <>
      <IdeaForm
        heading={`FIG.${fig ?? "--"} — Edit idea`}
        title={title}
        description={description}
        onChange={(p) => {
          if (p.title !== undefined) setTitle(p.title);
          if (p.description !== undefined) setDescription(p.description);
        }}
        onCancel={onClose}
        submitLabel="Save changes"
        autoFocus={false}
        offline={offline}
        onSubmit={() => {
          if (title !== idea.title || description !== (idea.description ?? "")) {
            onSave(idea.id, title, description);
          }
          onClose();
        }}
        extra={<StatusBadge status={idea.status} onToggle={() => onToggle(idea.id)} />}
      />
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3 font-mono text-[11px] tracking-wide text-muted">
        <span suppressHydrationWarning>Created {new Date(idea.created_at).toLocaleString()}</span>
        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete(idea.id);
          }}
          className="min-h-11 rounded-lg px-2 tracking-widest text-danger uppercase hover:bg-danger/10"
        >
          Delete
        </button>
      </div>
    </>
  );
}
