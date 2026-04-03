import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/user";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default async function DashboardPage() {
  // Redirect to welcome if not completed
  const user = await getCurrentUser();
  if (user?.profile?.onboardingCompleted && !user.profile.welcomeCompleted) {
    redirect("/welcome");
  }

  return (
    <div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
