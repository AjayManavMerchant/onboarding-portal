"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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

  useEffect(() => {
    if (data && !allowed) router.replace("/login");
  }, [data, allowed, router]);

  if (!data || !allowed) return <Loading />;
  return <>{children(data as LoadedStore & { currentUser: User })}</>;
}
