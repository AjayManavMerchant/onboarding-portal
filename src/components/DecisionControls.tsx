"use client";

import { useId, useState } from "react";
import type { Decision } from "@/lib/types";

/** Optional comment + Approve / Reject. Shared by HR and manager dashboards. */
export function DecisionControls({ label, onDecide }: { label: string; onDecide: (d: Decision, comment: string) => void }) {
  const [comment, setComment] = useState("");
  const id = useId();
  return (
    <div className="flex min-w-56 flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        Comment for {label} (optional)
      </label>
      <textarea
        id={id}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={2}
        placeholder="Comment (optional)"
        className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => onDecide("APPROVE", comment)} className="btn btn-success flex-1">
          Approve
        </button>
        <button type="button" onClick={() => onDecide("REJECT", comment)} className="btn btn-danger flex-1">
          Reject
        </button>
      </div>
    </div>
  );
}
