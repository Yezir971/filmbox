"use client";

import * as React from "react";
import type { Session } from "@/types/api";

interface SessionContextType {
  user: Session["user"];
  isAuthenticated: boolean;
}

const DEFAULT_USER: Session["user"] = {
  id: "1",
  pseudo: "cinephile_92",
  email: "cinephile_92@filmbox.cinema",
  avatarUrl: "",
};

const SessionContext = React.createContext<SessionContextType>({
  user: DEFAULT_USER,
  isAuthenticated: true,
});

export function SessionProvider({
  initialSession,
  children,
}: {
  initialSession: Session;
  children: React.ReactNode;
}) {
  const [session, setSession] = React.useState<Session>(
    initialSession?.user ? initialSession : { user: DEFAULT_USER }
  );

  React.useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) setSession(data);
      })
      .catch(() => {});
  }, []);

  const value = React.useMemo<SessionContextType>(
    () => ({
      user: session?.user ?? DEFAULT_USER,
      isAuthenticated: Boolean(session?.user ?? DEFAULT_USER),
    }),
    [session]
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
