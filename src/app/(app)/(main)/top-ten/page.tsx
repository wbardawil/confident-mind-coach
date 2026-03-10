import { getAchievements } from "@/lib/actions/top-ten";
import { AchievementList } from "@/components/top-ten/achievement-list";

export default async function TopTenPage() {
  const achievements = await getAchievements();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Top Ten</h1>
        <p className="mt-2 text-muted-foreground">
          Your ten most meaningful accomplishments. These form the foundation of
          your confidence memory.
        </p>
      </div>
      <AchievementList achievements={achievements} />
    </div>
  );
}
