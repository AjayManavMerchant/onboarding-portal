"use client";

import { Banner } from "@/components/Banner";
import { RequireRole } from "@/components/RequireRole";
import { StatusBadge } from "@/components/StatusBadge";
import { currentTeamId, overallStatus, teamById } from "@/lib/domain";
import { COPY } from "@/lib/labels";

// Phase 1 placeholder: header strip + approval banner. Checklists arrive in Phase 2.
export default function EmployeePage() {
  return (
    <RequireRole role="EMPLOYEE">
      {({ state, currentUser }) => {
        const team = teamById(state, currentTeamId(state, currentUser.id));
        return (
          <div className="space-y-6">
            <section className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="page-title">{currentUser.name}</h1>
                <p className="text-sm text-gray-600">
                  Current Team: <strong>{team ? `${team.name} — ${team.department}` : "Not assigned"}</strong>
                </p>
              </div>
              <StatusBadge status={overallStatus(state, currentUser.id)} />
            </section>
            {currentUser.registrationId && <Banner variant="success">{COPY.accountApproved}</Banner>}
            <p className="card text-sm text-gray-600">Your onboarding checklists will appear here.</p>
          </div>
        );
      }}
    </RequireRole>
  );
}
