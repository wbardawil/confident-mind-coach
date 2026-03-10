import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/utils/constants";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        The Confident Mind Coach
      </h1>
      <p className="max-w-md text-center text-muted-foreground">
        Build, protect, and deploy confidence as a trainable skill through
        structured reflection, preparation, and post-performance reviews.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href={ROUTES.SIGN_UP}>Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={ROUTES.SIGN_IN}>Sign In</Link>
        </Button>
      </div>
    </div>
  );
}
