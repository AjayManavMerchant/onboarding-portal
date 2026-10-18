"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useStore, type LoadedStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";
import { Loading } from "./Loading";

/** Route guard (frontend-spec §2.4): renders children only for a logged-in user with `role`, else redirects to /login. */
export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: (data: LoadedStore & { currentUser: User }) => ReactNode;
}) {
  const data = useStore();
  const router = useRouter();
  const allowed = data?.currentUser?.role === role;

  // Redirect only visitors who arrive without access. A sign-out on this page (Switch user,
  // Reset demo data) navigates on its own; redirecting here too would race it.
  const wasAllowed = useRef(false);
  useEffect(() => {
    if (allowed) wasAllowed.current = true;
    else if (data && !wasAllowed.current) router.replace("/login");
  }, [data, allowed, router]);

  if (!data || !allowed) return <Loading />;
  return <>{children(data as LoadedStore & { currentUser: User })}</>;
}
