"use client";

import { useState } from "react";
import { DomainError, isCompleted, progress } from "@/lib/domain";
import { store } from "@/lib/store";
import type { AppState, Requirement, RequirementKind } from "@/lib/types";
import { Banner } from "./Banner";
import { ChecklistTable } from "./ChecklistTable";
import { ProgressSummary } from "./ProgressSummary";

/** Heading + progress summary + checklist for one kind of requirement. Toggles go straight to the store. */
export function ChecklistSection({
  title,
  kind,
  requirements,
  state,
  empId,
  readOnly,
  note,
}: {
  title: string;
  kind: RequirementKind;
  requirements: Requirement[];
  state: AppState;
  empId: string;
  readOnly?: boolean;
  note?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const items = requirements.filter((r) => r.kind === kind);

  function toggle(reqId: string, checked: boolean) {
    try {
      store.toggleCompletion(empId, reqId, checked);
      setError(null);
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
      setError(err.message);
    }
  }

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ProgressSummary {...progress(state, empId, items)} />
      {note && <p className="text-sm text-gray-600">{note}</p>}
      {error && <Banner variant="error">{error}</Banner>}
      <ChecklistTable
        kind={kind}
        items={items}
        isDone={(id) => isCompleted(state, empId, id)}
        onToggle={toggle}
        readOnly={readOnly}
      />
    </section>
  );
}
