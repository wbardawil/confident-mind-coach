"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Sun,
  Target,
  RotateCcw,
  ClipboardList,
  BookOpen,
  Settings,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { APP_NAME, ROUTES } from "@/lib/utils/constants";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkReady =
  clerkPk.startsWith("pk_") && !clerkPk.includes("...");

const ClerkUserButton = isClerkReady
  ? dynamic(() => import("@clerk/nextjs").then((mod) => mod.UserButton))
  : null;

const navItems = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.DAILY_ESP, label: "Daily ESP", icon: Sun },
  { href: ROUTES.TOP_TEN, label: "Top Ten", icon: Trophy },
  { href: ROUTES.PREGAME, label: "Pregame", icon: Target },
  { href: ROUTES.RESET, label: "Reset", icon: RotateCcw },
  { href: ROUTES.AAR, label: "After Action Review", icon: ClipboardList },
  { href: ROUTES.LEDGER, label: "Confidence Ledger", icon: BookOpen },
];

const bottomItems = [
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">{APP_NAME}</span>
      </div>

      <Separator />

      {/* Main nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
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
      </nav>

      <Separator />

      {/* Bottom nav */}
      <div className="space-y-1 px-3 py-4">
        {bottomItems.map((item) => {
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

        {/* User button */}
        <div className="flex items-center gap-3 px-3 py-2">
          {ClerkUserButton ? (
            <ClerkUserButton afterSignOutUrl="/" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">Account</span>
        </div>
      </div>
    </aside>
  );
}
