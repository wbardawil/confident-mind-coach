"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { PLANS } from "@/lib/stripe/config";

interface SubscriptionCardProps {
  tier: string;
  status: string | null;
}

export function SubscriptionCard({ tier, status }: SubscriptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isPro = tier === "pro";

  function handleUpgrade() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to start checkout");
      }
    });
  }

  function handleManage() {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Failed to open billing portal");
      }
    });
  }

  return (
    <Card className={isPro ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subscription</CardTitle>
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>
        <CardDescription>
          {isPro
            ? `Your Pro subscription is ${status ?? "active"}.`
            : "Upgrade to Pro for the full coaching experience."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isPro && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold mb-2">{PLANS.free.name}</h3>
                <ul className="space-y-1">
                  {PLANS.free.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                <h3 className="text-sm font-semibold mb-1 flex items-center gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  {PLANS.pro.name} — {PLANS.pro.price}
                </h3>
                <ul className="space-y-1">
                  {PLANS.pro.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs">
                      <Check className="h-3 w-3 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Button onClick={handleUpgrade} disabled={isPending} className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              {isPending ? "Loading..." : "Upgrade to Pro — $29/month"}
            </Button>
          </>
        )}

        {isPro && (
          <Button variant="outline" onClick={handleManage} disabled={isPending}>
            {isPending ? "Loading..." : "Manage Subscription"}
          </Button>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
