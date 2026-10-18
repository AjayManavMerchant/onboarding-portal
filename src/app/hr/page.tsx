"use client";

import { useState } from "react";
import { Banner } from "@/components/Banner";
import { DecisionControls } from "@/components/DecisionControls";
import { RequireRole } from "@/components/RequireRole";
import { StatusBadge } from "@/components/StatusBadge";
import { DomainError } from "@/lib/domain";
import { formatDate } from "@/lib/labels";
import { store, type LoadedStore } from "@/lib/store";
import type { Decision, User } from "@/lib/types";

type Tab = "PENDING" | "ALL";
type Message = { variant: "success" | "error"; text: string };

function HrDashboard({ state, currentUser }: LoadedStore & { currentUser: User }) {
  const [tab, setTab] = useState<Tab>("PENDING");
  const [message, setMessage] = useState<Message | null>(null);

  const regs = state.registrations;
  const pending = regs.filter((r) => r.status === "PENDING_HR_APPROVAL");
  const counts = [
    { label: "Pending approval", value: pending.length, highlight: true },
    { label: "Approved", value: regs.filter((r) => r.status === "APPROVED").length },
    { label: "Rejected", value: regs.filter((r) => r.status === "REJECTED").length },
    { label: "Total", value: regs.length },
  ];
  const rows = (tab === "PENDING" ? pending : regs).toSorted((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  function decide(regId: string, decision: Decision, comment: string) {
    try {
      store.decideRegistration(regId, decision, comment, currentUser.id);
      setMessage({ variant: "success", text: `${regId} ${decision === "APPROVE" ? "approved" : "rejected"}.` });
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
      setMessage({ variant: "error", text: err.message });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">HR Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Approving a registration activates the employee&apos;s account only. Team assignment is approved by the selected
          team&apos;s manager.
        </p>
      </div>

      {message && <Banner variant={message.variant}>{message.text}</Banner>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className={`card p-4 ${c.highlight && c.value > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
            <p className="text-xs text-gray-600">{c.label}</p>
            <p className="text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>

      <div role="tablist" aria-label="Filter registrations" className="flex gap-2">
        {(["PENDING", "ALL"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`btn ${tab === t ? "btn-primary" : "btn-secondary"}`}
          >
            {t === "PENDING" ? `Pending (${pending.length})` : `All (${regs.length})`}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="card text-center text-sm text-gray-600">
          {tab === "PENDING" ? "No registrations awaiting approval." : "No registrations yet."}
        </p>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600">
              <tr>
                {["Request ID", "Full Name", "Official Email", "Employee ID", "Department", "Date of Joining", "Submitted", "Status", "Actions / Comment"].map(
                  (h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-3 py-2 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 align-top">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-3 font-medium">{r.id}</td>
                  <td className="px-3 py-3">{r.fullName}</td>
                  <td className="px-3 py-3">{r.email}</td>
                  <td className="px-3 py-3">{r.employeeId ?? "—"}</td>
                  <td className="px-3 py-3">{r.department ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(r.dateOfJoining)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{formatDate(r.submittedAt)}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-3">
                    {r.status === "PENDING_HR_APPROVAL" ? (
                      <DecisionControls label={r.id} onDecide={(d, c) => decide(r.id, d, c)} />
                    ) : (
                      <span className="text-gray-700">{r.hrComment ?? "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function HrPage() {
  return <RequireRole role="HR">{(data) => <HrDashboard {...data} />}</RequireRole>;
}
