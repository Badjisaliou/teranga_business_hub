"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AdminUser, clearAdminSession, getAdminToken, getAdminUser, isApiError, refreshAdminUser } from "@/lib/api";
import { routeForSessionError, routeForStatut } from "@/lib/status-routing";

type UseAdminGuardOptions = {
  requireAdminRole?: boolean;
  allowedStatuts?: string[];
  redirectIfNoSession?: string;
};

type UseAdminGuardResult = {
  ready: boolean;
  user: AdminUser | null;
};

const SESSION_REVALIDATE_INTERVAL_MS = 60_000;

function subscribeToHydration() {
  return () => undefined;
}

export function useAdminGuard(options: UseAdminGuardOptions = {}): UseAdminGuardResult {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);

  const requireAdminRole = options.requireAdminRole ?? true;
  const allowedStatuts = useMemo(() => options.allowedStatuts ?? ["actif"], [options.allowedStatuts]);
  const [serverUser, setServerUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const allowedStatutsKey = allowedStatuts.join("|");

  useEffect(() => {
    let cancelled = false;
    let validating = false;

    if (!isHydrated) {
      return () => {
        cancelled = true;
      };
    }

    async function validateSession(currentToken: string) {
      const allowedStatuts = allowedStatutsKey.split("|");

      try {
        const freshUser = await refreshAdminUser(currentToken);

        if (cancelled) {
          return;
        }

        if (requireAdminRole && freshUser.role !== "admin") {
          clearAdminSession();
          setReady(false);
          setServerUser(null);
          router.replace("/login");
          return;
        }

        if (!allowedStatuts.includes(freshUser.statut)) {
          setReady(false);
          setServerUser(null);
          router.replace(routeForStatut(freshUser.statut));
          return;
        }

        setServerUser(freshUser);
        setReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isApiError(error)) {
          clearAdminSession();
          setReady(false);
          setServerUser(null);
          router.replace(routeForSessionError(error.errorCode));
          return;
        }

        setReady(false);
        setServerUser(null);
        router.replace(options.redirectIfNoSession ?? "/login");
      }
    }

    function scheduleValidation() {
      if (cancelled || validating) {
        return;
      }

      const currentToken = getAdminToken();
      const currentUser = getAdminUser();

      if (!currentToken || !currentUser) {
        setReady(false);
        setServerUser(null);
        router.replace(options.redirectIfNoSession ?? "/login");
        return;
      }

      validating = true;
      validateSession(currentToken).finally(() => {
        validating = false;
      });
    }

    function validateOnVisible() {
      if (document.visibilityState === "visible") {
        scheduleValidation();
      }
    }

    const timeoutId = window.setTimeout(scheduleValidation, 0);
    const intervalId = window.setInterval(scheduleValidation, SESSION_REVALIDATE_INTERVAL_MS);
    window.addEventListener("focus", scheduleValidation);
    document.addEventListener("visibilitychange", validateOnVisible);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
      window.removeEventListener("focus", scheduleValidation);
      document.removeEventListener("visibilitychange", validateOnVisible);
    };
  }, [
    allowedStatutsKey,
    isHydrated,
    options.redirectIfNoSession,
    requireAdminRole,
    router,
  ]);

  return { ready: isHydrated && ready, user: ready ? serverUser : null };
}
