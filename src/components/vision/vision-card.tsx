"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { deleteVision } from "@/lib/actions/vision";
import { VisionForm } from "@/components/vision/vision-form";
import {
  VISION_DOMAIN_LABELS,
  type VisionDomainType,
} from "@/lib/validators/vision";

interface VisionDomainData {
  id: string;
  domain: string;
  vision: string;
  currentState: string | null;
  gap: string | null;
  priority: number;
  status: string;
}

export function VisionCard({ vision }: { vision: VisionDomainData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const label = VISION_DOMAIN_LABELS[vision.domain as VisionDomainType] ?? vision.domain;
  const isPrimary = vision.priority === 0;

  function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    startTransition(async () => {
      await deleteVision(vision.id);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <Card className={vision.status === "paused" ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{label}</CardTitle>
            <div className="flex items-center gap-2">
              {isPrimary && (
                <Badge variant="default" className="text-xs">
                  Primary Focus
                </Badge>
              )}
              {vision.status === "paused" && (
                <Badge variant="secondary">Paused</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <VisionForm
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              }
              defaultValues={{
                id: vision.id,
                domain: vision.domain,
                vision: vision.vision,
                currentState: vision.currentState ?? "",
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className={`h-8 p-0 ${
                confirming
                  ? "w-auto px-2 text-destructive"
                  : "w-8 text-muted-foreground hover:text-destructive"
              }`}
            >
              {confirming ? (
                <span className="text-xs">Confirm?</span>
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vision */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            10x Vision
          </p>
          <p className="text-sm">{vision.vision}</p>
        </div>

        {/* Current state */}
        {vision.currentState && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Current State
            </p>
            <p className="text-sm text-muted-foreground">
              {vision.currentState}
            </p>
          </div>
        )}

        {/* Gap analysis */}
        {vision.gap && (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-medium">Gap Analysis</p>
            </div>
            <p className="text-sm text-muted-foreground">{vision.gap}</p>
          </div>
        )}

        {/* Missing current state prompt */}
        {!vision.currentState && (
          <p className="text-xs text-muted-foreground italic">
            Add your current state to get an AI gap analysis.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
