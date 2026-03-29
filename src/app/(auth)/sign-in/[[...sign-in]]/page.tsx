import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkReady =
  clerkPk.startsWith("pk_") &&
  !clerkPk.includes("...") &&
  !clerkPk.includes("placeholder") &&
  clerkPk.length > 30;

const ClerkSignIn = isClerkReady
  ? dynamic(() => import("@clerk/nextjs").then((mod) => mod.SignIn))
  : null;

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      {ClerkSignIn ? (
        <ClerkSignIn />
      ) : (
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground">
            Authentication is not configured yet.
          </p>
          <Button asChild>
            <Link href="/dashboard">Continue to Dashboard</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
