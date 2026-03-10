import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/user";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  try {
    const user = await getCurrentUser();

    // Already onboarded — go to dashboard
    if (user?.profile?.onboardingCompleted) {
      redirect("/dashboard");
    }
  } catch (e: unknown) {
    if (e instanceof Error && "digest" in e) throw e; // Next.js redirect
  }

  return (
    <div className="flex flex-col items-center py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="mt-2 text-muted-foreground">
          Let&apos;s set up your coaching profile.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
