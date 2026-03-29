"use client";

import { ReactNode, useEffect, useState } from "react";

/**
 * Safely renders Clerk UI components only when ClerkProvider is active.
 * Uses render props pattern to pass the UserButton component to children.
 * This avoids hydration mismatches and timing issues with dynamic imports.
 */
export function ClerkLoaded({
  children,
}: {
  children: (UserButton: React.ComponentType<{ afterSignOutUrl?: string }>) => ReactNode;
}) {
  const [ClerkComponent, setClerkComponent] = useState<{
    UserButton: React.ComponentType<{ afterSignOutUrl?: string }>;
  } | null>(null);

  useEffect(() => {
    const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
    const isReady =
      pk.startsWith("pk_") &&
      !pk.includes("...") &&
      !pk.includes("placeholder") &&
      pk.length > 30;

    if (!isReady) return;

    import("@clerk/nextjs").then((mod) => {
      setClerkComponent({ UserButton: mod.UserButton });
    });
  }, []);

  if (!ClerkComponent) return null;

  return <>{children(ClerkComponent.UserButton)}</>;
}
