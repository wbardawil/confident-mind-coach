import { getCurrentUser } from "@/lib/utils/user";
import { db } from "@/lib/utils/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  const [facts, sessions, espCount, aarCount, goalCount, achievementCount, affirmationCount, coachingSessionCount] = await Promise.all([
    db.memoryFact.findMany({
      where: { userId: user.id, active: true },
      orderBy: { learnedAt: "desc" },
      select: { category: true, subject: true, content: true, confidence: true, learnedAt: true },
    }),
    db.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, summary: true, updatedAt: true, _count: { select: { messages: true } } },
      take: 20,
    }),
    db.eSPEntry.count({ where: { userId: user.id } }),
    db.aAREntry.count({ where: { userId: user.id } }),
    db.confidenceGoal.count({ where: { userId: user.id, status: "active" } }),
    db.achievement.count({ where: { userId: user.id } }),
    db.affirmation.count({ where: { userId: user.id, active: true } }),
    db.coachingSession.count({ where: { userId: user.id } }),
  ]);

  // Group facts by subject
  const factsBySubject = new Map<string, typeof facts>();
  for (const fact of facts) {
    const arr = factsBySubject.get(fact.subject) ?? [];
    arr.push(fact);
    factsBySubject.set(fact.subject, arr);
  }

  const totalMessages = sessions.reduce((sum: number, s: { _count: { messages: number } }) => sum + s._count.messages, 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">What Your Coach Knows</h1>
        <p className="mt-2 text-muted-foreground">
          Everything your AI coach remembers about you. The more you share,
          the sharper your coaching becomes.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <StatCard label="Facts Remembered" value={facts.length} />
        <StatCard label="Conversations" value={sessions.length} />
        <StatCard label="Total Messages" value={totalMessages} />
        <StatCard label="Structured Sessions" value={coachingSessionCount} />
        <StatCard label="ESP Entries" value={espCount} />
        <StatCard label="After Action Reviews" value={aarCount} />
        <StatCard label="Active Goals" value={goalCount} />
        <StatCard label="Top Ten Memories" value={achievementCount} />
        <StatCard label="Active Affirmations" value={affirmationCount} />
        <StatCard label="Unique Topics" value={factsBySubject.size} />
      </div>

      {/* Memory facts grouped by subject */}
      {facts.length > 0 ? (
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold">What Your Coach Remembers</h2>
          <p className="text-sm text-muted-foreground">
            These facts were extracted from your conversations. Your coach references them
            naturally — this is why it remembers your story.
          </p>
          {Array.from(factsBySubject.entries()).map(([subject, subjectFacts]) => (
            <Card key={subject}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{formatSubject(subject)}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {subjectFacts.map((fact: { category: string; content: string; confidence: number; learnedAt: Date }, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge variant="secondary" className="mt-0.5 shrink-0 text-xs">
                        {fact.category}
                      </Badge>
                      <span className={fact.confidence < 0.8 ? "text-muted-foreground italic" : ""}>
                        {fact.content}
                        {fact.confidence < 0.8 && " (uncertain — coach will verify)"}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">No remembered facts yet</CardTitle>
            <CardDescription>
              Start a conversation with your coach and share about your life, goals,
              and challenges. After each session, the coach extracts key facts and
              remembers them for next time.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Recent Conversations</h2>
          {sessions.slice(0, 10).map((session: { id: string; title: string | null; summary: string | null; updatedAt: Date; _count: { messages: number } }) => (
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
              {session.summary && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{session.summary}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
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

function formatSubject(subject: string): string {
  if (subject === "user") return "About You";
  if (subject.startsWith("user.")) {
    const part = subject.slice(5);
    return "Your " + part.charAt(0).toUpperCase() + part.slice(1).replace(/\./g, " — ");
  }
  return subject.charAt(0).toUpperCase() + subject.slice(1);
}
