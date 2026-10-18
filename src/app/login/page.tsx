"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Loading } from "@/components/Loading";
import { currentTeamId, loginableUsers } from "@/lib/domain";
import { store, useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";

const GROUPS: { role: Role; label: string }[] = [
  { role: "HR", label: "HR" },
  { role: "MANAGER", label: "Managers" },
  { role: "EMPLOYEE", label: "Employees" },
];

const HOME_BY_ROLE: Record<Role, string> = { HR: "/hr", MANAGER: "/manager", EMPLOYEE: "/employee" };

function optionLabel(u: User) {
  return u.registrationId ? `${u.name} (New joiner)` : u.name;
}

function LoginForm() {
  const data = useStore();
  const router = useRouter();
  const isMovement = useSearchParams().get("flow") === "internal-movement";
  const [userId, setUserId] = useState("");

  if (!data) return <Loading />;

  // Internal movement is open to any employee with a current team (Q2).
  const users = loginableUsers(data.state).filter(
    (u) => !isMovement || (u.role === "EMPLOYEE" && currentTeamId(data.state, u.id)),
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    store.setCurrentUser(user.id);
    router.push(isMovement && user.role === "EMPLOYEE" ? "/movement" : HOME_BY_ROLE[user.role]);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="page-title">{isMovement ? "Internal Movement — demo login" : "Demo login"}</h1>
        <p className="mt-1 text-gray-600">No password needed — pick a demo user.</p>
      </div>
      <form onSubmit={onSubmit} className="card space-y-4">
        <div>
          <label htmlFor="demo-user" className="mb-1 block text-sm font-medium">
            Demo user
          </label>
          <select id="demo-user" value={userId} onChange={(e) => setUserId(e.target.value)} className="input" aria-describedby="demo-user-help">
            <option value="">Select a user…</option>
            {GROUPS.map((g) => {
              const members = users.filter((u) => u.role === g.role);
              return members.length === 0 ? null : (
                <optgroup key={g.role} label={g.label}>
                  {members.map((u) => (
                    <option key={u.id} value={u.id}>
                      {optionLabel(u)}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <p id="demo-user-help" className="mt-1 text-sm text-gray-500">
            New joiners appear here after HR approves their registration.
          </p>
        </div>
        <button type="submit" disabled={!userId} className="btn btn-primary w-full">
          Log in
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
}
