import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/user";

/**
 * Layout for all main app routes (everything except /onboarding).
 * Redirects users who haven't completed onboarding.
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const user = await getCurrentUser();
    if (user && !user.profile?.onboardingCompleted) {
      redirect("/onboarding");
    }
  } catch (e: unknown) {
    if (e instanceof Error && "digest" in e) throw e; // Next.js redirect
  }

  return <>{children}</>;
}
