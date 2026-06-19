import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — BizLens AI" }] }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <AppShell>
      <ComingSoon
        icon={<MessageSquare className="h-7 w-7 text-white" />}
        title="AI Chat — coming next"
        description="Stream real conversations with Claude over your data, with inline charts. We're staging the build — upload page and dashboard are live now."
      />
    </AppShell>
  );
}

export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-12 max-w-xl"
    >
      <div className="card-surface relative overflow-hidden p-10 text-center">
        <div className="absolute inset-0 opacity-50 bg-grid" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] glow-primary">
            {icon}
          </div>
          <h2 className="mt-5 text-xl font-semibold">{title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
            >
              <Sparkles className="h-4 w-4" /> Try Upload
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-5 py-2.5 text-sm font-medium hover:border-primary"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
