"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AdminUser, clearAdminSession, getAdminToken, getAdminUser } from "@/lib/api";
import { routeForStatut } from "@/lib/status-routing";

type UseAdminGuardOptions = {
  requireAdminRole?: boolean;
  allowedStatuts?: string[];
  redirectIfNoSession?: string;
};

type UseAdminGuardResult = {
  ready: boolean;
  user: AdminUser | null;
};

function subscribeToHydration() {
  return () => undefined;
}

export function useAdminGuard(options: UseAdminGuardOptions = {}): UseAdminGuardResult {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const token = isHydrated ? getAdminToken() : "";
  const user = isHydrated ? getAdminUser() : null;

  const requireAdminRole = options.requireAdminRole ?? true;
  const allowedStatuts = useMemo(() => options.allowedStatuts ?? ["actif"], [options.allowedStatuts]);
  const isAdminOk = !requireAdminRole || user?.role === "admin";
  const isStatutOk = Boolean(user && allowedStatuts.includes(user.statut));
  const isAllowed = Boolean(token && user && isAdminOk && isStatutOk);
  const allowedStatutsKey = allowedStatuts.join("|");

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!token || !user) {
      router.replace(options.redirectIfNoSession ?? "/login");
      return;
    }

    if (requireAdminRole && user.role !== "admin") {
      clearAdminSession();
      router.replace("/login");
      return;
    }

    if (!allowedStatuts.includes(user.statut)) {
      router.replace(routeForStatut(user.statut));
      return;
    }
  }, [
    allowedStatuts,
    allowedStatutsKey,
    isHydrated,
    options.redirectIfNoSession,
    requireAdminRole,
    router,
    token,
    user,
  ]);

  return { ready: isHydrated && isAllowed, user: isAllowed ? user : null };
}
