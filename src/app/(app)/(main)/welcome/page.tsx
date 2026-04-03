import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/utils/user";
import { MoodSelector } from "@/components/welcome/mood-selector";
import { Zap } from "lucide-react";

export default async function WelcomePage() {
  const user = await getCurrentUser();

  // If already completed welcome, go to dashboard
  if (user?.profile?.welcomeCompleted) {
    redirect("/dashboard");
  }

  const name = user?.name ?? user?.profile?.role ?? "there";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your coach is ready. How are you feeling right now?
        </p>
      </div>
      <MoodSelector />
    </div>
  );
}
