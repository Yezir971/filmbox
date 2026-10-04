"use client";

import * as React from "react";
import type { Session } from "@/types/api";

interface SessionContextType {
  user: Session["user"];
  isAuthenticated: boolean;
}

const SessionContext = React.createContext<SessionContextType>({
  user: null,
  isAuthenticated: false,
});

export function SessionProvider({
  initialSession,
  children,
}: {
  initialSession: Session;
  children: React.ReactNode;
}) {
  const value = React.useMemo<SessionContextType>(
    () => ({
      user: initialSession?.user ?? null,
      isAuthenticated: Boolean(initialSession?.user),
    }),
    [initialSession]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  return React.useContext(SessionContext);
}
