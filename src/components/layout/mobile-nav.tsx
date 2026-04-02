"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Zap } from "lucide-react";
import {
  LayoutDashboard,
  Trophy,
  Sun,
  Target,
  Crosshair,
  RotateCcw,
  ClipboardList,
  BookOpen,
  MessageCircle,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ClerkLoaded } from "@/components/providers/clerk-loaded";
import { APP_NAME, ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

const navItems = [
  { href: ROUTES.DASHBOARD, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.COACH, label: "Coach", icon: MessageCircle },
  { href: ROUTES.INSTANT_RESET, label: "Instant Reset", icon: Zap },
  { href: ROUTES.GOALS, label: "Goals", icon: Target },
  { href: ROUTES.DAILY_ESP, label: "Daily ESP", icon: Sun },
  { href: ROUTES.TOP_TEN, label: "Top Ten", icon: Trophy },
  { href: ROUTES.PREGAME, label: "Pregame", icon: Crosshair },
  { href: ROUTES.RESET, label: "Reset", icon: RotateCcw },
  { href: ROUTES.AAR, label: "After Action Review", icon: ClipboardList },
  { href: ROUTES.LEDGER, label: "Confidence Ledger", icon: BookOpen },
  { href: ROUTES.SETTINGS, label: "Settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between border-b px-4 py-3 md:hidden">
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold">{APP_NAME}</span>
      </div>

      <div className="flex items-center gap-3">
        <ClerkLoaded>
          {(UserButton) => <UserButton afterSignOutUrl="/" />}
        </ClerkLoaded>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="px-6 py-5 text-lg font-semibold">
              {APP_NAME}
            </SheetTitle>
            <Separator />
            <nav className="space-y-1 px-3 py-4">
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
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
