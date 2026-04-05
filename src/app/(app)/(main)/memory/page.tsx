import { getCurrentUser } from "@/lib/utils/user";
import { db } from "@/lib/utils/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MemoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coach Memory</h1>
        <p className="mt-2 text-muted-foreground">Please sign in to view your coach&apos;s memory.</p>
      </div>
    );
  }

  const [sessions, espCount, aarCount, goalCount, achievementCount, affirmationCount, coachingSessionCount] = await Promise.all([
    db.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, _count: { select: { messages: true } } },
      take: 20,
    }),
    db.eSPEntry.count({ where: { userId: user.id } }),
    db.aAREntry.count({ where: { userId: user.id } }),
    db.confidenceGoal.count({ where: { userId: user.id, status: "active" } }),
    db.achievement.count({ where: { userId: user.id } }),
    db.affirmation.count({ where: { userId: user.id, active: true } }),
    db.coachingSession.count({ where: { userId: user.id } }),
  ]);

  const totalMessages = sessions.reduce((sum: number, s: { _count: { messages: number } }) => sum + s._count.messages, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">What Your Coach Knows</h1>
        <p className="mt-2 text-muted-foreground">
          Everything your AI coach draws on when coaching you. The more you share,
          the sharper your coaching becomes.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Conversations" value={sessions.length} />
        <StatCard label="Total Messages" value={totalMessages} />
        <StatCard label="Structured Sessions" value={coachingSessionCount} />
        <StatCard label="ESP Entries" value={espCount} />
        <StatCard label="After Action Reviews" value={aarCount} />
        <StatCard label="Active Goals" value={goalCount} />
        <StatCard label="Top Ten Memories" value={achievementCount} />
        <StatCard label="Active Affirmations" value={affirmationCount} />
      </div>

      {/* Coach context summary */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">How Your Coach Uses This</CardTitle>
          <CardDescription>
            Before every conversation, your coach loads your profile, recent sessions,
            ESP reflections, AARs, goals, achievements, affirmations, uploaded documents,
            and coaching journal notes into its context. This is why it remembers your
            story and can reference past conversations naturally.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Recent sessions */}
      {sessions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Conversations</h2>
          {sessions.slice(0, 10).map((session: { id: string; title: string | null; updatedAt: Date; _count: { messages: number } }) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {session.title ?? "Untitled"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {session._count.messages} messages
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {session.updatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No conversations yet</CardTitle>
            <CardDescription>
              Start a conversation with your coach to build your coaching history.
              The more you share about your life, goals, and challenges, the more
              personalized your coaching becomes.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
