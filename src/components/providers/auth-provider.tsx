"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkReady =
  pk.startsWith("pk_") &&
  !pk.includes("...") &&
  !pk.includes("placeholder") &&
  pk.length > 30;

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!isClerkReady) {
    return <>{children}</>;
  }
  return <ClerkProvider>{children}</ClerkProvider>;
}
