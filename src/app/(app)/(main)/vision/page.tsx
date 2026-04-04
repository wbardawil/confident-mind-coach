import { getVisions } from "@/lib/actions/vision";
import { VisionCard } from "@/components/vision/vision-card";
import { VisionForm } from "@/components/vision/vision-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Compass } from "lucide-react";
import {
  VISION_DOMAINS,
  VISION_DOMAIN_LABELS,
  type VisionDomainType,
} from "@/lib/validators/vision";

export default async function VisionPage() {
  const visions = await getVisions();
  const activeVisions = visions.filter((v) => v.status === "active");
  const takenDomains = visions.map((v) => v.domain);
  const unexploredDomains = VISION_DOMAINS.filter(
    (d) => !takenDomains.includes(d),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">10x Vision</h1>
          <p className="mt-2 text-muted-foreground">
            Define what 10x looks like — then build toward it.
          </p>
        </div>
        {unexploredDomains.length > 0 && (
          <VisionForm
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Domain
              </Button>
            }
            takenDomains={takenDomains}
          />
        )}
      </div>

      {visions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Compass className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">
            What does 10x look like for you?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Not 10% better — 10x. Pick the one area of your life that matters
            most right now and describe what it looks like when you&apos;re
            operating at a completely different level. Your goals, your daily
            systems, and your coaching will all build toward this.
          </p>
          <VisionForm
            trigger={
              <Button className="mt-6">
                <Plus className="h-4 w-4 mr-2" />
                Define Your First Vision
              </Button>
            }
            takenDomains={takenDomains}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active visions */}
          <div className="grid gap-4 lg:grid-cols-2">
            {activeVisions.map((v) => (
              <VisionCard key={v.id} vision={v} />
            ))}
          </div>

          {/* Unexplored domains */}
          {unexploredDomains.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Unexplored Domains
                </h2>
                <div className="flex flex-wrap gap-2">
                  {unexploredDomains.map((d) => (
                    <VisionForm
                      key={d}
                      trigger={
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-accent transition-colors py-1.5 px-3"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {VISION_DOMAIN_LABELS[d as VisionDomainType]}
                        </Badge>
                      }
                      takenDomains={takenDomains}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your coach will nudge you to expand into these areas when the
                  time is right.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
