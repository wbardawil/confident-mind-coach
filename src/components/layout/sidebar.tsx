"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Sun,
  Target,
  Crosshair,
  Flame,
  RotateCcw,
  ClipboardList,
  BookOpen,
  MessageCircle,
  Settings,
  Zap,
  HelpCircle,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/utils/constants";
import { Separator } from "@/components/ui/separator";
import { ClerkLoaded } from "@/components/providers/clerk-loaded";

const navGroups = [
  {
    label: "Daily",
    items: [
      { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
      { href: ROUTES.COACH, label: "Coach", icon: MessageCircle },
      { href: ROUTES.DAILY_ESP, label: "Daily ESP", icon: Sun },
      { href: ROUTES.INSTANT_RESET, label: "Instant Reset", icon: Zap },
      { href: ROUTES.GUIDE, label: "Guide", icon: HelpCircle },
    ],
  },
  {
    label: "Performance",
    items: [
      { href: ROUTES.PREGAME, label: "Pregame", icon: Crosshair },
      { href: ROUTES.RESET, label: "Reset", icon: RotateCcw },
      { href: ROUTES.AAR, label: "After Action Review", icon: ClipboardList },
      { href: ROUTES.CHALLENGES, label: "Challenges", icon: Flame },
    ],
  },
  {
    label: "Your Profile",
    items: [
      { href: ROUTES.VISION, label: "10x Vision", icon: Compass },
      { href: ROUTES.GOALS, label: "Goals", icon: Target },
      { href: ROUTES.TOP_TEN, label: "Top Ten", icon: Trophy },
      { href: ROUTES.LEDGER, label: "Confidence Ledger", icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isSettingsActive = pathname === ROUTES.SETTINGS;

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>

      <Separator />

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <Separator />

      {/* Bottom: Settings + Clerk */}
      <div className="flex items-center justify-between px-3 py-4">
        <Link
          href={ROUTES.SETTINGS}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isSettingsActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <ClerkLoaded>
          {(UserButton) => (
            <div className="px-3">
              <UserButton afterSignOutUrl="/" />
            </div>
          )}
        </ClerkLoaded>
      </div>
    </aside>
  );
}
