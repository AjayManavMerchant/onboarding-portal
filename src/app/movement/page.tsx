"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Banner } from "@/components/Banner";
import { ChecklistSection } from "@/components/ChecklistSection";
import { RequireRole } from "@/components/RequireRole";
import { StatusBadge } from "@/components/StatusBadge";
import { TeamSelect } from "@/components/TeamSelect";
import {
  DomainError,
  currentTeamId,
  latestTeamRequest,
  overallStatus,
  pendingTeamRequest,
  progress,
  teamById,
  teamHistory,
  teamRequirements,
  userById,
} from "@/lib/domain";
import { COPY, formatDate } from "@/lib/labels";
import { store, type LoadedStore } from "@/lib/store";
import type { TeamId, User } from "@/lib/types";

function MovementPage({ state, currentUser }: LoadedStore & { currentUser: User }) {
  const empId = currentUser.id;
  const [toTeamId, setToTeamId] = useState<TeamId | "">("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const team = teamById(state, currentTeamId(state, empId));
  const manager = userById(state, team?.managerId);
  const pending = pendingTeamRequest(state, empId);
  const latestMove = latestTeamRequest(state, empId, "INTERNAL_MOVEMENT");
  const movedIn = latestMove?.status === "APPROVED" && latestMove.toTeamId === team?.id;
  const teamReqs = team ? teamRequirements(state, team.id) : [];
  const teamDone = progress(state, empId, teamReqs).pending === 0;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!toTeamId) return setError("Please select a team.");
    try {
      store.submitMoveRequest(empId, toTeamId, comment);
      setError(null);
      setToTeamId("");
      setComment("");
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Internal movement</h1>
        <StatusBadge status={overallStatus(state, empId)} />
      </div>
      <Banner variant="info">{COPY.movementWelcome}</Banner>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Current Team</h2>
        <p>
          {team ? (
            <>
              <strong>{team.name}</strong> — {team.department} · Manager: <strong>{manager?.name}</strong>
            </>
          ) : (
            "Not assigned"
          )}
        </p>
      </section>

      {!team ? (
        <Banner variant="warning">
          Internal movement is available once you have a team.{" "}
          <Link href="/employee" className="link">
            Go to my dashboard
          </Link>
        </Banner>
      ) : pending ? (
        <Banner variant="info">
          <span className="inline-flex flex-wrap items-center gap-1">
            Your request <strong>{pending.id}</strong> to move to <strong>{teamById(state, pending.toTeamId)?.name}</strong> is{" "}
            <StatusBadge status={pending.status} /> with <strong>{userById(state, pending.managerId)?.name}</strong>. Your
            current team stays <strong>{team.name}</strong> until it is approved.
          </span>
        </Banner>
      ) : (
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Request a move</h2>
          {latestMove?.status === "REJECTED" && (
            <Banner variant="warning">
              <p>
                Your request {latestMove.id} to move to {teamById(state, latestMove.toTeamId)?.name} was rejected by{" "}
                {userById(state, latestMove.managerId)?.name}.
              </p>
              <p className="mt-1">Manager comment: {latestMove.managerComment ?? "No comment provided."}</p>
            </Banner>
          )}
          <form onSubmit={submit} className="space-y-4">
            <TeamSelect state={state} value={toTeamId} onChange={setToTeamId} label="New Team" excludeTeamId={team.id} />
            <div>
              <label htmlFor="move-comment" className="mb-1 block text-sm font-medium">
                Comment <span className="text-gray-500">(optional)</span>
              </label>
              <textarea
                id="move-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                className="input"
              />
            </div>
            {error && <Banner variant="error">{error}</Banner>}
            <button type="submit" disabled={!toTeamId} className="btn btn-primary">
              Submit movement request
            </button>
          </form>
        </section>
      )}

      {team && movedIn && (
        <>
          {!teamDone && (
            <Banner variant="success">
              Your move to {team.name} has been approved. Complete your new team&apos;s onboarding below.
            </Banner>
          )}
          <p className="text-sm text-gray-600">ℹ️ {COPY.selfConfirmed}</p>
          <ChecklistSection title={`Team-Specific Accesses — ${team.name}`} kind="ACCESS" requirements={teamReqs} state={state} empId={empId} />
          <ChecklistSection title={`Team-Specific Training — ${team.name}`} kind="TRAINING" requirements={teamReqs} state={state} empId={empId} />
          {teamDone && (
            <Banner variant="success">All onboarding requirements are complete. Your onboarding status is Completed.</Banner>
          )}
        </>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Team history</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                {["Team", "Department", "From", "To", "Via request"].map((h) => (
                  <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamHistory(state, empId).map((a) => {
                const t = teamById(state, a.teamId);
                return (
                  <tr key={`${a.teamId}-${a.startDate}-${a.viaRequestId ?? "seed"}`}>
                    <td className="px-3 py-2 font-medium">{t?.name}</td>
                    <td className="px-3 py-2">{t?.department}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(a.startDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2">{a.endDate ? formatDate(a.endDate) : "Current"}</td>
                    <td className="px-3 py-2">{a.viaRequestId ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <Link href="/employee" className="link inline-block">
        Go to my dashboard
      </Link>
    </div>
  );
}

export default function Page() {
  return <RequireRole role="EMPLOYEE">{(data) => <MovementPage {...data} />}</RequireRole>;
}
