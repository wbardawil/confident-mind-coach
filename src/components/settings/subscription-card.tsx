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
import { Check, Zap, Crown } from "lucide-react";
import { PLANS } from "@/lib/stripe/config";

interface SubscriptionCardProps {
  tier: string;
  status: string | null;
}

export function SubscriptionCard({ tier, status }: SubscriptionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [annual, setAnnual] = useState(true);
  const isPro = tier === "pro";
  const isElite = tier === "elite";
  const isPaid = isPro || isElite;

  function handleCheckout(plan: "pro" | "elite", billing: "monthly" | "annual") {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subscription</CardTitle>
          <Badge variant={isPaid ? "default" : "secondary"}>
            {isElite ? "Elite" : isPro ? "Pro" : "Free"}
          </Badge>
        </div>
        <CardDescription>
          {isPaid
            ? `Your ${isElite ? "Elite" : "Pro"} subscription is ${status ?? "active"}.`
            : "Upgrade for the full coaching experience."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPaid && (
          <Button variant="outline" onClick={handleManage} disabled={isPending}>
            {isPending ? "Loading..." : "Manage Subscription"}
          </Button>
        )}

        {!isPaid && (
          <>
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className={!annual ? "font-semibold" : "text-muted-foreground"}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setAnnual(!annual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  annual ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    annual ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className={annual ? "font-semibold" : "text-muted-foreground"}>
                Annual <Badge variant="secondary" className="ml-1 text-xs">Save 31%</Badge>
              </span>
            </div>

            {/* Plan comparison */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Free */}
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold">{PLANS.free.name}</h3>
                <p className="text-2xl font-bold mt-1">$0</p>
                <ul className="mt-3 space-y-1.5">
                  {PLANS.free.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground text-center">Current plan</p>
              </div>

              {/* Pro */}
              <div className="rounded-lg border border-primary p-4 relative">
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs">
                  Most Popular
                </Badge>
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  {PLANS.pro.name}
                </h3>
                <p className="text-2xl font-bold mt-1">
                  {annual ? "$8.99" : "$12.99"}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                {annual && (
                  <p className="text-xs text-muted-foreground">Billed annually ($107.88/yr)</p>
                )}
                <ul className="mt-3 space-y-1.5">
                  {PLANS.pro.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout("pro", annual ? "annual" : "monthly")}
                  disabled={isPending}
                  className="w-full mt-3"
                  size="sm"
                >
                  {isPending ? "..." : "Upgrade to Pro"}
                </Button>
              </div>

              {/* Elite */}
              <div className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold flex items-center gap-1">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  {PLANS.elite.name}
                </h3>
                <p className="text-2xl font-bold mt-1">
                  {annual ? "$24.99" : "$29.99"}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                {annual && (
                  <p className="text-xs text-muted-foreground">Billed annually ($299.88/yr)</p>
                )}
                <ul className="mt-3 space-y-1.5">
                  {PLANS.elite.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check className="h-3 w-3 mt-0.5 shrink-0 text-yellow-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleCheckout("elite", annual ? "annual" : "monthly")}
                  disabled={isPending}
                  variant="outline"
                  className="w-full mt-3"
                  size="sm"
                >
                  {isPending ? "..." : "Go Elite"}
                </Button>
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
