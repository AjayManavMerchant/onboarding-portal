"use client";

import { useId } from "react";
import { teamById, userById } from "@/lib/domain";
import type { AppState, TeamId } from "@/lib/types";

/** Team picker with the manager auto-filled from the chosen team (BR4). */
export function TeamSelect({
  state,
  value,
  onChange,
  label = "Team",
  excludeTeamId,
}: {
  state: AppState;
  value: TeamId | "";
  onChange: (teamId: TeamId | "") => void;
  label?: string;
  excludeTeamId?: TeamId;
}) {
  const id = useId();
  const team = teamById(state, value || undefined);
  const manager = userById(state, team?.managerId);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-team`} className="mb-1 block text-sm font-medium">
          {label}
        </label>
        <select id={`${id}-team`} value={value} onChange={(e) => onChange(e.target.value as TeamId | "")} className="input">
          <option value="">Select a team…</option>
          {state.teams
            .filter((t) => t.id !== excludeTeamId)
            .map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.department}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-manager`} className="mb-1 block text-sm font-medium">
          Manager
        </label>
        <input
          id={`${id}-manager`}
          readOnly
          value={manager?.name ?? ""}
          placeholder="Filled in from the team"
          className="input bg-gray-100 text-gray-700"
        />
      </div>
    </div>
  );
}
