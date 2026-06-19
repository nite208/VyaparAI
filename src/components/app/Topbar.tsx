import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Upload } from "lucide-react";
import { motion } from "framer-motion";

const titleMap: Record<string, string> = {
  "/": "Dashboard",
  "/upload": "Upload",
  "/chat": "Chat",
  "/reports": "Reports",
  "/settings": "Settings",
};

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title =
    titleMap[pathname] ??
    Object.entries(titleMap).find(([k]) => k !== "/" && pathname.startsWith(k))?.[1] ??
    "Dashboard";

  return (
    <header
      data-topbar
      className="no-print sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/70 px-6 backdrop-blur-xl"
    >
      <motion.h1
        key={title}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[17px] font-semibold tracking-tight"
      >
        {title}
      </motion.h1>

      <div className="flex items-center gap-2">
        <button
          aria-label="Notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="h-4 w-4" />
          New Upload
        </Link>
      </div>
    </header>
  );
}
