"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkReady =
  clerkPk.startsWith("pk_") && !clerkPk.includes("...") && !clerkPk.includes("placeholder") && clerkPk.length > 30;

const ClerkSignOutButton = isClerkReady
  ? dynamic(() => import("@clerk/nextjs").then((mod) => mod.SignOutButton))
  : null;

export function SignOutButton() {
  const router = useRouter();

  if (ClerkSignOutButton) {
    return (
      <ClerkSignOutButton redirectUrl="/">
        <Button variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </ClerkSignOutButton>
    );
  }

  // Dev fallback: redirect to home (no real session to clear)
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={() => router.push("/")}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}
