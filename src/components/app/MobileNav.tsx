import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Upload, MessageSquare, FileText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="no-print fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden">
      {items.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors",
              active ? "text-primary-glow" : "text-muted-foreground",
            )}
          >
            <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_6px_oklch(0.68_0.19_287)]")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
