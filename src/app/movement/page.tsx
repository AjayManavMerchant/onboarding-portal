"use client";

import Link from "next/link";
import { Banner } from "@/components/Banner";
import { RequireRole } from "@/components/RequireRole";
import { COPY } from "@/lib/labels";

// Placeholder until Phase 4 (movement request form, pending state, team history).
export default function MovementPage() {
  return (
    <RequireRole role="EMPLOYEE">
      {() => (
        <div className="space-y-6">
          <h1 className="page-title">Internal movement</h1>
          <Banner variant="info">{COPY.movementWelcome}</Banner>
          <Link href="/employee" className="link">
            Go to my dashboard
          </Link>
        </div>
      )}
    </RequireRole>
  );
}
