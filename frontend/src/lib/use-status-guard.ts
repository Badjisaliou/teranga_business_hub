"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, AuthUser, clearAuthSession, getAuthToken, getAuthUser, isApiError, refreshAuthUser } from "@/lib/api";
import { routeForSessionError, routeForStatut } from "@/lib/status-routing";

type UseStatusGuardOptions = {
  allowedStatuts: string[];
  redirectIfNoSession?: string;
};

type UseStatusGuardResult = {
  ready: boolean;
  user: AuthUser | null;
};

const SESSION_REVALIDATE_INTERVAL_MS = 60_000;

export function useStatusGuard(options: UseStatusGuardOptions): UseStatusGuardResult {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const allowedStatutsKey = options.allowedStatuts.join("|");
  const redirectIfNoSession = options.redirectIfNoSession ?? "/login";

  useEffect(() => {
    let cancelled = false;
    let validating = false;

    async function validateSession() {
      const token = getAuthToken();
      const cachedUser = getAuthUser();
      const allowedStatuts = allowedStatutsKey.split("|");

      if (!token || !cachedUser) {
        setReady(false);
        setSessionUser(null);
        router.replace(redirectIfNoSession);
        return;
      }

      try {
        const user = await refreshAuthUser(token);

        if (cancelled) {
          return;
        }

        if (user.role !== "membre") {
          clearAuthSession();
          setReady(false);
          setSessionUser(null);
          router.replace("/login");
          return;
        }

        if (!allowedStatuts.includes(user.statut)) {
          setReady(false);
          setSessionUser(null);
          router.replace(routeForStatut(user.statut));
          return;
        }

        setSessionUser(user);
        setReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (isApiError(error)) {
          clearAuthSession();
          setReady(false);
          setSessionUser(null);
          router.replace(routeForSessionError(error.errorCode));
          return;
        }

        throw error;
      }
    }

    function scheduleValidation() {
      if (cancelled || validating) {
        return;
      }

      validating = true;
      validateSession().catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        const apiError = error instanceof ApiError ? error : null;
        if (apiError) {
          clearAuthSession();
          setReady(false);
          setSessionUser(null);
          router.replace(routeForSessionError(apiError.errorCode));
          return;
        }

        setReady(false);
        setSessionUser(null);
        router.replace(redirectIfNoSession);
      }).finally(() => {
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
  }, [allowedStatutsKey, redirectIfNoSession, router]);

  return { ready, user: sessionUser };
}
