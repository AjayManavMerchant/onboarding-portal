"use client";

import { useState } from "react";
import { Banner } from "@/components/Banner";
import { DecisionControls } from "@/components/DecisionControls";
import { RequireRole } from "@/components/RequireRole";
import { StatusBadge } from "@/components/StatusBadge";
import {
  DomainError,
  managedTeam,
  managerPendingRequests,
  managerRecentDecisions,
  managerTeamProgress,
  teamById,
  userById,
} from "@/lib/domain";
import { REQUEST_TYPE_LABELS, formatDate } from "@/lib/labels";
import { store, type LoadedStore } from "@/lib/store";
import type { Decision, User } from "@/lib/types";

type Message = { variant: "success" | "error"; text: string };

const TH = "whitespace-nowrap px-3 py-2 font-medium";

function ManagerDashboard({ state, currentUser }: LoadedStore & { currentUser: User }) {
  const [message, setMessage] = useState<Message | null>(null);
  const team = managedTeam(state, currentUser.id);
  if (!team) return <Banner variant="error">No team is assigned to this manager.</Banner>;

  const pending = managerPendingRequests(state, currentUser.id);
  const recent = managerRecentDecisions(state, currentUser.id);
  const rows = managerTeamProgress(state, currentUser.id);
  const name = (id: string) => userById(state, id)?.name ?? id;

  function decide(reqId: string, decision: Decision, comment: string) {
    try {
      store.decideTeamRequest(reqId, decision, comment, currentUser.id);
      setMessage({ variant: "success", text: `${reqId} ${decision === "APPROVE" ? "approved" : "rejected"}.` });
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
      setMessage({ variant: "error", text: err.message });
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="page-title">
        Manager Dashboard — {team.name} ({team.department})
      </h1>
      {message && <Banner variant={message.variant}>{message.text}</Banner>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Pending Approvals</h2>
        {pending.length === 0 ? (
          <p className="card text-center text-sm text-gray-600">No pending requests for your team.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  {["Request ID", "Employee Name", "Request Type", "Requested Team", "Status", "Actions"].map((h) => (
                    <th key={h} scope="col" className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 align-top">
                {pending.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap px-3 py-3 font-medium">{r.id}</td>
                    <td className="px-3 py-3">{name(r.employeeId)}</td>
                    <td className="px-3 py-3">
                      {REQUEST_TYPE_LABELS[r.type]}
                      {r.type === "INTERNAL_MOVEMENT" && (
                        <div className="mt-1 text-xs text-gray-600">
                          From {teamById(state, r.fromTeamId)?.name}
                          {r.employeeComment && <> · “{r.employeeComment}”</>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">{teamById(state, r.toTeamId)?.name}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-3">
                      <DecisionControls label={r.id} onDecide={(d, c) => decide(r.id, d, c)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recent.length > 0 && (
          <details className="card p-4 text-sm">
            <summary className="cursor-pointer font-medium">Recent decisions ({recent.length})</summary>
            <ul className="mt-3 divide-y divide-gray-100">
              {recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-2 py-2">
                  <strong>{r.id}</strong> {name(r.employeeId)} · {REQUEST_TYPE_LABELS[r.type]} · {formatDate(r.decidedAt)}
                  <StatusBadge status={r.status} />
                  <span className="text-gray-600">{r.managerComment ?? "—"}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Team Progress</h2>
        {rows.length === 0 ? (
          <p className="card text-center text-sm text-gray-600">No employees in your team yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  {["Employee", "Access progress", "Training progress", "Overall status"].map((h) => (
                    <th key={h} scope="col" className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr key={row.employee.id}>
                    <td className="px-3 py-3 font-medium">{row.employee.name}</td>
                    <td className="px-3 py-3">
                      {row.access.completed}/{row.access.total}
                    </td>
                    <td className="px-3 py-3">
                      {row.training.completed}/{row.training.total}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function ManagerPage() {
  return <RequireRole role="MANAGER">{(data) => <ManagerDashboard {...data} />}</RequireRole>;
}
