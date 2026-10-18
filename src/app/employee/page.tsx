"use client";

import Link from "next/link";
import { useState } from "react";
import { Banner } from "@/components/Banner";
import { ChecklistSection } from "@/components/ChecklistSection";
import { RequireRole } from "@/components/RequireRole";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamSelect } from "@/components/TeamSelect";
import {
  basicComplete,
  basicLocked,
  basicRequirements,
  currentTeamId,
  overallStatus,
  progress,
  teamById,
  teamRequirements,
  userById,
} from "@/lib/domain";
import { COPY } from "@/lib/labels";
import type { LoadedStore } from "@/lib/store";
import type { AppState, TeamId, User } from "@/lib/types";

function LockIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-5 shrink-0">
      <path
        fillRule="evenodd"
        d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TeamSection({ state, empId }: { state: AppState; empId: string }) {
  const [teamId, setTeamId] = useState<TeamId | "">("");
  const team = teamById(state, currentTeamId(state, empId));

  let body;
  if (team) {
    body = (
      <p className="flex flex-wrap items-center gap-2">
        Team: <strong>{team.name}</strong> · Manager: <strong>{userById(state, team.managerId)?.name}</strong>
        <StatusBadge status="APPROVED" />
      </p>
    );
  } else if (!basicComplete(state, empId)) {
    const remaining = progress(state, empId, basicRequirements(state)).pending;
    body = (
      <div className="flex items-start gap-3 rounded-lg bg-gray-100 p-4 text-gray-700">
        <LockIcon />
        <p>Complete all basic accesses and trainings to unlock team selection ({remaining} items remaining).</p>
      </div>
    );
  } else {
    body = (
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <TeamSelect state={state} value={teamId} onChange={setTeamId} />
        <button type="submit" disabled className="btn btn-primary">
          Submit team request
        </button>
      </form>
    );
  }

  return (
    <section className="card space-y-4">
      <h2 className="text-lg font-semibold">Select Team and Manager</h2>
      {body}
    </section>
  );
}

function EmployeeDashboard({ state, currentUser }: LoadedStore & { currentUser: User }) {
  const empId = currentUser.id;
  const status = overallStatus(state, empId);
  const team = teamById(state, currentTeamId(state, empId));
  const basics = basicRequirements(state);
  const locked = basicLocked(state, empId);
  const lockNote = locked
    ? team
      ? "Basic items are locked because you have been assigned to a team."
      : "Basic items are locked because your team request has been submitted."
    : undefined;
  const teamReqs = team ? teamRequirements(state, team.id) : [];

  return (
    <div className="space-y-6">
      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{currentUser.name}</h1>
          <p className="text-sm text-gray-600">
            Current Team: <strong>{team ? `${team.name} — ${team.department}` : "Not assigned"}</strong>
          </p>
        </div>
        <StatusBadge status={status} />
      </section>

      {currentUser.registrationId && <Banner variant="success">{COPY.accountApproved}</Banner>}
      <p className="text-sm text-gray-600">ℹ️ {COPY.selfConfirmed}</p>

      <ChecklistSection title="Mandatory Basic Accesses" kind="ACCESS" requirements={basics} state={state} empId={empId} readOnly={locked} note={lockNote} />
      <ChecklistSection title="Mandatory Training" kind="TRAINING" requirements={basics} state={state} empId={empId} readOnly={locked} note={lockNote} />

      {basicComplete(state, empId) && <Banner variant="success">{COPY.basicComplete}</Banner>}

      <TeamSection state={state} empId={empId} />

      {team && (
        <>
          <ChecklistSection title={`Team-Specific Accesses — ${team.name}`} kind="ACCESS" requirements={teamReqs} state={state} empId={empId} />
          <ChecklistSection title={`Team-Specific Training — ${team.name}`} kind="TRAINING" requirements={teamReqs} state={state} empId={empId} />
        </>
      )}

      {status === "COMPLETED" && (
        <Banner variant="success">All onboarding requirements are complete. Your onboarding status is Completed.</Banner>
      )}

      {team && (
        <p className="text-sm">
          Moving to another team?{" "}
          <Link href="/movement" className="link">
            Start internal movement
          </Link>
        </p>
      )}
    </div>
  );
}

export default function EmployeePage() {
  return <RequireRole role="EMPLOYEE">{(data) => <EmployeeDashboard {...data} />}</RequireRole>;
}
