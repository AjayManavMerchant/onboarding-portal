"use client";

import { RequireRole } from "@/components/RequireRole";
import { managedTeam } from "@/lib/domain";

// Placeholder until Phase 3 (pending approvals + team progress).
export default function ManagerPage() {
  return (
    <RequireRole role="MANAGER">
      {({ state, currentUser }) => {
        const team = managedTeam(state, currentUser.id);
        return (
          <div className="space-y-6">
            <h1 className="page-title">
              Manager Dashboard — {team?.name} ({team?.department})
            </h1>
            <p className="card text-sm text-gray-600">No pending requests for your team.</p>
          </div>
        );
      }}
    </RequireRole>
  );
}
