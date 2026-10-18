"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { COPY, ROLE_LABELS } from "@/lib/labels";
import { store, useStore } from "@/lib/store";

export function AppHeader() {
  const data = useStore();
  const router = useRouter();
  const user = data?.currentUser;

  function reset() {
    if (!window.confirm(COPY.resetConfirm)) return;
    store.resetDemoData();
    router.push("/?reset=1");
  }

  function switchUser() {
    store.logout();
    router.push("/login");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-indigo-700">
          Onboarding Portal
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {user ? (
            <>
              <span className="text-gray-700">
                Signed in as <strong>{user.name}</strong> · {ROLE_LABELS[user.role]}
              </span>
              <button type="button" onClick={switchUser} className="btn btn-secondary">
                Switch user
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-secondary">
              Demo login
            </Link>
          )}
          <button type="button" onClick={reset} className="btn btn-secondary">
            Reset demo data
          </button>
        </div>
      </div>
      <div className="bg-amber-50 px-4 py-1 text-center text-xs text-amber-900">{COPY.demoNotice}</div>
    </header>
  );
}
