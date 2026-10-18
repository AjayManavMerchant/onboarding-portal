"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { StatusBadge } from "@/components/StatusBadge";
import { findRegistration } from "@/lib/domain";
import { formatDate } from "@/lib/labels";
import { useStore } from "@/lib/store";

function StatusLookup() {
  const data = useStore();
  const initialId = useSearchParams().get("id") ?? "";
  const [input, setInput] = useState(initialId);
  const [query, setQuery] = useState(initialId);

  if (!data) return <Loading />;
  const reg = query.trim() ? findRegistration(data.state, query) : undefined;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setQuery(input);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="card flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="request-id" className="mb-1 block text-sm font-medium">
            Request ID
          </label>
          <input id="request-id" value={input} onChange={(e) => setInput(e.target.value)} placeholder="REG-001" className="input" />
        </div>
        <button type="submit" className="btn btn-primary">
          Check status
        </button>
      </form>

      {query.trim() && !reg && <Banner variant="warning">No registration found with that request ID.</Banner>}

      {reg && (
        <section className="card space-y-4" aria-label="Registration status">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-500">Request ID</dt>
            <dd className="font-semibold">{reg.id}</dd>
            <dt className="text-gray-500">Name</dt>
            <dd>{reg.fullName}</dd>
            <dt className="text-gray-500">Submitted</dt>
            <dd>{formatDate(reg.submittedAt)}</dd>
            <dt className="text-gray-500">Status</dt>
            <dd>
              <StatusBadge status={reg.status} />
            </dd>
          </dl>

          {reg.status === "PENDING_HR_APPROVAL" && <Banner variant="info">HR has not reviewed your request yet.</Banner>}
          {reg.status === "APPROVED" && (
            <Banner variant="success">
              <p>Your account has been approved. You can now log in.</p>
              <Link href="/login" className="btn btn-primary mt-3">
                Log in
              </Link>
            </Banner>
          )}
          {reg.status === "REJECTED" && (
            <Banner variant="error">
              <p className="font-semibold">Your registration was rejected.</p>
              <p className="mt-1">
                <strong>HR comment:</strong> {reg.hrComment ? `“${reg.hrComment}”` : "No comment provided."}
              </p>
              <p className="mt-2">
                <Link href="/register" className="link">
                  You can submit a new registration.
                </Link>
              </p>
            </Banner>
          )}
        </section>
      )}
    </div>
  );
}

export default function RegistrationStatusPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="page-title">Check registration status</h1>
      <Suspense fallback={<Loading />}>
        <StatusLookup />
      </Suspense>
    </div>
  );
}
