"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Banner } from "@/components/Banner";
import { COPY } from "@/lib/labels";

function ResetBanner() {
  const params = useSearchParams();
  if (params.get("reset") !== "1") return null;
  return <Banner variant="success">{COPY.resetDone}</Banner>;
}

export default function HomePage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={null}>
        <ResetBanner />
      </Suspense>
      <h1 className="page-title text-center sm:text-3xl">Employee Onboarding &amp; Internal Movement Portal</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card flex flex-col gap-4">
          <h2 className="text-xl font-semibold">New Joiner</h2>
          <p className="text-gray-700">Register, get HR approval and complete your onboarding.</p>
          <div className="mt-auto flex flex-col gap-3">
            <Link href="/register" className="btn btn-primary">
              Register
            </Link>
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <Link href="/register/status" className="link">
                Check registration status
              </Link>
              <Link href="/login" className="link">
                Approved? Log in
              </Link>
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Internal Movement</h2>
          <p className="text-gray-700">
            Moving to a new team? Request the move and complete the new team&apos;s onboarding.
          </p>
          <Link href="/login?flow=internal-movement" className="btn btn-primary mt-auto">
            Start internal movement
          </Link>
        </section>
      </div>

      <p className="text-center text-sm">
        <Link href="/login" className="link">
          Demo login for HR and managers
        </Link>
      </p>
    </div>
  );
}
