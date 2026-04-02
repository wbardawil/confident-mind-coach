import { ResetStream } from "@/components/instant-reset/reset-stream";
import { Zap } from "lucide-react";

export default function InstantResetPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instant Reset</h1>
          <p className="text-sm text-muted-foreground">
            Breathe. Your coach is here.
          </p>
        </div>
      </div>
      <ResetStream />
    </div>
  );
}
