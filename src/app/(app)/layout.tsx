import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Mobile nav */}
        <MobileNav />

        {/* Page content */}
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
