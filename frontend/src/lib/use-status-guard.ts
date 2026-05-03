"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, getAuthToken, getAuthUser } from "@/lib/api";
import { routeForStatut } from "@/lib/status-routing";

type UseStatusGuardOptions = {
  allowedStatuts: string[];
  redirectIfNoSession?: string;
};

type UseStatusGuardResult = {
  ready: boolean;
  user: AuthUser | null;
};

export function useStatusGuard(options: UseStatusGuardOptions): UseStatusGuardResult {
  const router = useRouter();

  const hasWindow = typeof window !== "undefined";
  const token = hasWindow ? getAuthToken() : "";
  const user = hasWindow ? getAuthUser() : null;
  const isAllowed = Boolean(token && user && options.allowedStatuts.includes(user.statut));
  const allowedStatutsKey = options.allowedStatuts.join("|");

  useEffect(() => {
    if (!hasWindow) {
      return;
    }

    if (!token || !user) {
      router.replace(options.redirectIfNoSession ?? "/login");
      return;
    }

    if (!options.allowedStatuts.includes(user.statut)) {
      router.replace(routeForStatut(user.statut));
      return;
    }
  }, [allowedStatutsKey, hasWindow, options.allowedStatuts, options.redirectIfNoSession, router, token, user]);

  return { ready: hasWindow && isAllowed, user: isAllowed ? user : null };
}
