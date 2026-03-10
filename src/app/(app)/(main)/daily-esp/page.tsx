import { getRecentEspEntries } from "@/lib/actions/esp";
import { EspForm } from "@/components/daily-esp/esp-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function DailyEspPage() {
  const recentEntries = await getRecentEspEntries(5);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Daily ESP</h1>
        <p className="mt-2 text-muted-foreground">
          Reflect on your Effort, Success, and Progress.
        </p>
      </div>

      <EspForm />

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Recent Reflections</h2>
          <div className="space-y-4">
            {recentEntries.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <CardDescription>
                    {entry.createdAt.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Effort:</span>{" "}
                    {entry.effort}
                  </div>
                  <Separator />
                  <div>
                    <span className="font-medium">Success:</span>{" "}
                    {entry.success}
                  </div>
                  <Separator />
                  <div>
                    <span className="font-medium">Progress:</span>{" "}
                    {entry.progress}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
