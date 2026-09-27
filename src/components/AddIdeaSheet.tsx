"use client";

import { useDraft } from "@/hooks/useDraft";
import { IdeaForm } from "./IdeaForm";
import { Sheet } from "./Sheet";

/** Mobile add form in a bottom sheet (also opened by the "New idea" app shortcut). */
export function AddIdeaSheet({
  open,
  onClose,
  onAdd,
  offline,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => Promise<boolean>;
  offline: boolean;
}) {
  const { draft, setDraft, clear } = useDraft("sheet");

  return (
    <Sheet open={open} onClose={onClose} label="New idea">
      <IdeaForm
        heading="New idea"
        title={draft.title}
        description={draft.description}
        onChange={setDraft}
        onCancel={onClose}
        submitLabel="Save idea"
        offline={offline}
        onSubmit={async () => {
          const saved = { ...draft };
          clear();
          onClose();
          const ok = await onAdd(saved.title, saved.description);
          if (!ok) setDraft(saved);
        }}
      />
    </Sheet>
  );
}
