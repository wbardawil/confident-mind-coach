import { getCurrentUser } from "@/lib/utils/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Sun, Target, ClipboardList } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const name = user?.profile?.role ?? "there";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your confidence overview at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={ROUTES.DAILY_ESP}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Daily ESP</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Reflect on your Effort, Success, and Progress.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href={ROUTES.TOP_TEN}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Trophy className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Top Ten</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Review your meaningful accomplishments.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href={ROUTES.PREGAME}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Pregame</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Prepare your mind before an event.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href={ROUTES.AAR}>
          <Card className="transition-colors hover:border-primary">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <ClipboardList className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">AAR</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                After Action Review: learn from experience.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
