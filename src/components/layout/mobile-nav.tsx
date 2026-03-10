"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { Menu, Zap, User } from "lucide-react";
import {
  LayoutDashboard,
  Trophy,
  Sun,
  Target,
  RotateCcw,
  ClipboardList,
  BookOpen,
  Settings,
} from "lucide-react";

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkReady =
  clerkPk.startsWith("pk_") && !clerkPk.includes("...");

const ClerkUserButton = isClerkReady
  ? dynamic(() => import("@clerk/nextjs").then((mod) => mod.UserButton))
  : null;
import { cn } from "@/lib/utils";
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
  { href: ROUTES.DAILY_ESP, label: "Daily ESP", icon: Sun },
  { href: ROUTES.TOP_TEN, label: "Top Ten", icon: Trophy },
  { href: ROUTES.PREGAME, label: "Pregame", icon: Target },
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
        {ClerkUserButton ? (
          <ClerkUserButton afterSignOutUrl="/" />
        ) : (
          <User className="h-5 w-5 text-muted-foreground" />
        )}
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
