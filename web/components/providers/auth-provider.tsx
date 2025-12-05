"use client";

import { AuthProvider as AuthContextProvider } from "@/lib/hooks/use-auth.tsx";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>;
}
