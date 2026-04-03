"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap, Sun, Crosshair, LayoutDashboard } from "lucide-react";
import { completeWelcome } from "@/lib/actions/welcome";

const options = [
  {
    icon: Zap,
    label: "I need help right now",
    description: "Get an instant confidence reset",
    href: "/instant-reset",
    color: "border-red-500/30 bg-red-500/5 hover:border-red-500/60",
    iconColor: "text-red-500",
  },
  {
    icon: Sun,
    label: "I want to start building",
    description: "Make your first confidence deposit",
    href: "/daily-esp",
    color: "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/60",
    iconColor: "text-yellow-500",
  },
  {
    icon: Crosshair,
    label: "I have something coming up",
    description: "Prepare mentally for an event",
    href: "/pregame",
    color: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60",
    iconColor: "text-blue-500",
  },
  {
    icon: LayoutDashboard,
    label: "I want to explore",
    description: "See everything the app offers",
    href: "/dashboard",
    color: "border-green-500/30 bg-green-500/5 hover:border-green-500/60",
    iconColor: "text-green-500",
  },
];

export function MoodSelector() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSelect(href: string) {
    startTransition(async () => {
      await completeWelcome();
      router.push(href);
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((opt) => (
        <button
          key={opt.href}
          onClick={() => handleSelect(opt.href)}
          disabled={isPending}
          className={`flex items-center gap-4 rounded-xl border p-5 text-left transition-colors ${opt.color}`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-background/80 ${opt.iconColor}`}>
            <opt.icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
