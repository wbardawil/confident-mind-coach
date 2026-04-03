import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/utils/user";

/**
 * Layout for all main app routes (everything except /onboarding).
 * Redirects users who haven't completed onboarding or welcome flow.
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

    // Redirect to welcome if not completed (but not if already on /welcome)
    const headerList = headers();
    const pathname = headerList.get("x-next-pathname") ?? "";
    if (
      user?.profile?.onboardingCompleted &&
      !user.profile.welcomeCompleted &&
      !pathname.includes("/welcome")
    ) {
      redirect("/welcome");
    }
  } catch (e: unknown) {
    if (e instanceof Error && "digest" in e) throw e; // Next.js redirect
  }

  return <>{children}</>;
}
