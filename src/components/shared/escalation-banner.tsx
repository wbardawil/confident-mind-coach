"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ESCALATION_MESSAGE } from "@/lib/safety/escalation";

interface EscalationBannerProps {
  escalation: typeof ESCALATION_MESSAGE;
}

export function EscalationBanner({ escalation }: EscalationBannerProps) {
  return (
    <Card className="border-destructive">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">
            {escalation.heading}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{escalation.body}</p>
        <p className="text-sm font-medium">{escalation.action}</p>
        <ul className="space-y-2">
          {escalation.resources.map((r) => (
            <li
              key={r.name}
              className="flex items-start gap-2 rounded-md bg-muted p-3 text-sm"
            >
              <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="mx-1 text-muted-foreground">&mdash;</span>
                <span className="text-muted-foreground">{r.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
