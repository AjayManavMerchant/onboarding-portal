"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Banner } from "@/components/Banner";
import { Loading } from "@/components/Loading";
import { StatusBadge } from "@/components/StatusBadge";
import { DomainError } from "@/lib/domain";
import { COPY } from "@/lib/labels";
import { store, useStore } from "@/lib/store";

const FIELDS = [
  { name: "fullName", label: "Full Name", type: "text", required: true, autoComplete: "name" },
  { name: "email", label: "Official Email", type: "email", required: true, autoComplete: "email" },
  { name: "employeeId", label: "Employee ID", type: "text", required: false, autoComplete: "off" },
  { name: "department", label: "Department", type: "text", required: false, autoComplete: "off" },
  { name: "dateOfJoining", label: "Date of Joining", type: "date", required: true, autoComplete: "off" },
] as const;

type FieldName = (typeof FIELDS)[number]["name"];
const EMPTY: Record<FieldName, string> = { fullName: "", email: "", employeeId: "", department: "", dateOfJoining: "" };

export default function RegisterPage() {
  const data = useStore();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  if (!data) return <Loading />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setSubmittedId(store.submitRegistration(values));
      setErrors({});
    } catch (err) {
      if (err instanceof DomainError) setErrors(err.fieldErrors);
      else throw err;
    }
  }

  if (submittedId) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="page-title">Registration submitted</h1>
        <Banner variant="success">
          <p className="font-semibold">{COPY.registrationSubmitted}</p>
          <p className="mt-2 flex flex-wrap items-center gap-2">
            Request ID: <strong>{submittedId}</strong> · Status: <StatusBadge status="PENDING_HR_APPROVAL" />
          </p>
        </Banner>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href={`/register/status?id=${submittedId}`} className="link">
            Check status
          </Link>
          <Link href="/" className="link">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="page-title">New joiner registration</h1>
      <form onSubmit={onSubmit} noValidate className="card space-y-4">
        {FIELDS.map((f) => {
          const id = `reg-${f.name}`;
          const error = errors[f.name];
          return (
            <div key={f.name}>
              <label htmlFor={id} className="mb-1 block text-sm font-medium">
                {f.label} {f.required ? <span className="text-red-600">*</span> : <span className="text-gray-500">(optional)</span>}
              </label>
              <input
                id={id}
                name={f.name}
                type={f.type}
                autoComplete={f.autoComplete}
                value={values[f.name]}
                onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                aria-invalid={!!error}
                aria-describedby={error ? `${id}-error` : undefined}
                className="input"
              />
              {error && (
                <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          );
        })}
        <button type="submit" className="btn btn-primary w-full sm:w-auto">
          Submit registration
        </button>
      </form>
    </div>
  );
}
