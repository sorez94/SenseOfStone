"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import type { AuthSession, User } from "@/domain";
import { isApiError } from "@/lib/api/errors";
import { tokenStorage } from "@/lib/api/token-storage";
import { useServices } from "@/providers/services-context";

export const sessionQueryKey = ["auth", "me"] as const;

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface SessionValue {
  status: SessionStatus;
  user: User | null;
  /** Persist a session returned by login/register/Google. */
  signIn: (session: AuthSession) => void;
  /** Replace the cached user (e.g. after a profile update). */
  setUser: (user: User) => void;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const services = useServices();
  const queryClient = useQueryClient();
  // `undefined` during SSR/hydration → "loading", avoiding hydration mismatches.
  const token = useSyncExternalStore(tokenStorage.subscribe, tokenStorage.get, () => undefined);

  const query = useQuery({
    queryKey: sessionQueryKey,
    queryFn: async (): Promise<User | null> => {
      try {
        return await services.auth.me();
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          tokenStorage.clear();
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  const user = token ? (query.data ?? null) : null;
  const status: SessionStatus =
    token === undefined || (token && query.isPending) ? "loading" : user ? "authenticated" : "unauthenticated";

  const signIn = useCallback(
    (session: AuthSession) => {
      queryClient.setQueryData(sessionQueryKey, session.user);
      tokenStorage.set(session.accessToken, session.expiresAt);
    },
    [queryClient],
  );

  const setUser = useCallback((next: User) => queryClient.setQueryData(sessionQueryKey, next), [queryClient]);

  const signOut = useCallback(async () => {
    try {
      await services.auth.logout();
    } catch {
      // Logging out locally is enough if the backend is unreachable.
    }
    tokenStorage.clear();
    // Drop every cached private query (pre-orders, admin data, …).
    queryClient.removeQueries();
    queryClient.setQueryData(sessionQueryKey, null);
  }, [queryClient, services]);

  const value = useMemo(() => ({ status, user, signIn, setUser, signOut }), [status, user, signIn, setUser, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside <SessionProvider>");
  return value;
}
