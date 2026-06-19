import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Activity,
  FileSpreadsheet,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Trash2,
  FileText,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { StatCard } from "@/components/app/StatCard";
import { FileTypeIcon, StatusBadge, formatBytes, relativeTime } from "@/components/app/FileBits";
import { useStore } from "@/lib/store";
import { coachingDemo, restaurantDemo } from "@/lib/demo-data";
import { useHydrated } from "@/hooks/use-hydrated";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BizLens AI" },
      { name: "description", content: "Your AI-powered business intelligence dashboard." },
    ],
  }),
  component: DashboardPage,
});

const sparks = [
  [3, 5, 4, 7, 6, 9, 11],
  [2, 4, 3, 6, 8, 7, 12],
  [5, 4, 6, 5, 7, 6, 8],
  [8, 12, 10, 15, 14, 18, 22],
];

function DashboardPage() {
  const hydrated = useHydrated();
  const navigate = useNavigate();
  const stats = useStore((s) => s.stats);
  const files = useStore((s) => s.files);
  const insights = useStore((s) => s.insights);
  const loadDemo = useStore((s) => s.loadDemo);
  const removeFile = useStore((s) => s.removeFile);

  const cards = [
    { label: "Files Analyzed", value: stats.filesAnalyzed, delta: "+12%", positive: true, spark: sparks[0], icon: FileSpreadsheet },
    { label: "Insights Generated", value: stats.insightsGenerated, delta: "+28%", positive: true, spark: sparks[1], icon: Lightbulb },
    { label: "Reports Exported", value: stats.reportsExported, delta: "+8%", positive: true, spark: sparks[2], icon: FileText },
    { label: "Questions Asked", value: stats.questionsAsked, delta: "+34%", positive: true, spark: sparks[3], icon: MessageCircle },
  ];

  const handleDemo = (which: "coaching" | "restaurant") => {
    const f = loadDemo(which === "coaching" ? coachingDemo : restaurantDemo);
    toast.success(`${f.name} loaded`, { description: "Opening chat..." });
    navigate({ to: "/chat" });
  };

  return (
    <AppShell>
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-end justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Welcome back <span className="text-gradient">— here's the pulse</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time view of files, insights, and conversations across your data.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c, i) => (
          <StatCard key={c.label} {...c} index={i} />
        ))}
      </section>

      {/* Demo banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card-surface relative mt-6 overflow-hidden p-6"
        style={{ backgroundImage: "var(--gradient-brand-soft)" }}
      >
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-brand)] glow-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold">See BizLens in action</h3>
              <p className="text-sm text-muted-foreground">
                Load sample business data instantly — no upload needed.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleDemo("coaching")}
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-foreground"
            >
              Load Coaching Class Data
            </button>
            <button
              onClick={() => handleDemo("restaurant")}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
            >
              Load Restaurant Data
            </button>
          </div>
        </div>
      </motion.div>

      {/* Activity */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Recent uploads */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-surface lg:col-span-3"
        >
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Recent Uploads</h3>
            </div>
            <span className="text-xs text-muted-foreground">{hydrated ? files.length : 0} total</span>
          </header>

          {!hydrated ? (
            <div className="space-y-2 p-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted/40" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <EmptyUploads />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">File</th>
                    <th className="px-3 py-2.5 font-medium">Size</th>
                    <th className="px-3 py-2.5 font-medium">Uploaded</th>
                    <th className="px-3 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.slice(0, 6).map((f, i) => (
                    <motion.tr
                      key={f.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group border-t border-border transition-colors hover:bg-primary/5"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <FileTypeIcon type={f.type} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">{f.name}</div>
                            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                              {f.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono-num text-muted-foreground">
                        {formatBytes(f.size)}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {relativeTime(f.uploadedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="inline-flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => navigate({ to: "/chat" })}
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-xs hover:border-primary hover:text-foreground"
                            aria-label="Chat"
                          >
                            <MessageSquare className="h-3 w-3" /> Chat
                          </button>
                          <button
                            onClick={() => navigate({ to: "/reports" })}
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-card px-2.5 text-xs hover:border-primary hover:text-foreground"
                          >
                            <FileText className="h-3 w-3" /> Report
                          </button>
                          <button
                            onClick={() => {
                              removeFile(f.id);
                              toast("File removed");
                            }}
                            aria-label="Delete"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-[oklch(0.78_0.22_22)]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* Insights feed */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-surface lg:col-span-2"
        >
          <header className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">AI Insights Feed</h3>
            </div>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              Live
            </span>
          </header>

          <div className="space-y-3 p-5">
            {!hydrated ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/40" />
              ))
            ) : insights.length === 0 ? (
              <div className="py-10 text-center">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Upload data or load a demo to see insights appear here.
                </p>
              </div>
            ) : (
              insights.slice(0, 5).map((i, idx) => (
                <motion.div
                  key={i.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary/40"
                >
                  <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary-glow">
                    <FileSpreadsheet className="h-3 w-3" />
                    <span className="max-w-[12rem] truncate">{i.fileName}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{i.content}</p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {relativeTime(i.createdAt)}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </motion.section>
      </div>
    </AppShell>
  );
}

function EmptyUploads() {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <FileSpreadsheet className="h-6 w-6 text-primary-glow" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">No uploads yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Drop a CSV or load a sample to get started.
      </p>
    </div>
  );
}
