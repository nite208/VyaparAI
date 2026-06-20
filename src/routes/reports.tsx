import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Download, FileText, Lightbulb, Printer, Sparkles, Target, TrendingUp, X } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { InlineChart } from "./chat";
import { useStore, type Report } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Reports — BizLens AI" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const reports = useStore((s) => s.reports);
  const [active, setActive] = useState<Report | null>(null);

  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Your <span className="text-gradient">analytical reports</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tap any report to open the full-screen view and print to PDF.
        </p>
      </motion.div>

      {reports.length === 0 ? (
        <EmptyReports />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reports.map((r, i) => (
            <motion.button
              key={r.id}
              onClick={() => setActive(r)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-surface card-hover group p-5 text-left"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] glow-primary">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                  Ready
                </div>
              </div>
              <div className="truncate text-base font-semibold text-foreground">{r.title}</div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{r.fileName}</div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {r.payload.summary}
              </p>
              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </span>
                <span className="font-semibold text-primary-glow opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && <ReportModal report={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}

function ReportModal({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm p-4 md:p-8"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl border border-border-strong bg-card shadow-[0_24px_80px_-12px_rgba(0,0,0,0.7)]"
      >
        {/* Header — hidden in print via .no-print on wrapper */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] glow-primary">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold">{report.title}</h3>
              <p className="text-xs text-muted-foreground">
                {report.fileName} · {new Date(report.createdAt).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
            >
              <Printer className="h-4 w-4" /> Export PDF
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Printable body */}
        <ReportBody report={report} />
      </motion.div>
    </motion.div>
  );
}

function ReportBody({ report }: { report: Report }) {
  const { summary, insights, metrics, recommendations, chart } = report.payload;
  return (
    <div className="space-y-6 px-6 py-6 md:px-8 md:py-8 print:bg-white print:text-black">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Executive report · generated {new Date(report.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      </section>

      <section className="card-surface p-5">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Executive summary</h2>
        </div>
        <p className="text-base leading-relaxed text-foreground/90">{summary}</p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m, i) => (
          <div key={i} className={cn("card-surface p-4")}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {m.label}
            </div>
            <div className="mt-1 font-mono-num text-xl font-semibold text-foreground">{m.value}</div>
          </div>
        ))}
      </section>

      {chart && (
        <section>
          <InlineChart chart={chart} />
        </section>
      )}

      <section className="card-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Key insights</h2>
        </div>
        <ul className="space-y-2">
          {insights.map((it, i) => (
            <li key={i} className="flex gap-3 rounded-lg border-l-2 border-primary bg-surface px-3 py-2 text-sm">
              <span className="text-primary-glow">•</span>
              <span className="text-foreground/90">{it}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface p-5">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold uppercase tracking-wider">Recommendations</h2>
        </div>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-3 rounded-lg bg-[image:var(--gradient-brand-soft)] px-3 py-2.5 text-sm">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary-glow" />
              <span className="text-foreground/90">{rec}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function EmptyReports() {
  return (
    <div className="card-surface p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand-soft)]">
        <FileText className="h-6 w-6 text-primary-glow" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No reports yet</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Upload a file or load a demo — a report is generated automatically.
      </p>
      <div className="mt-5 flex justify-center gap-2">
        <Link
          to="/upload"
          className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
        >
          <Download className="h-4 w-4" /> Upload data
        </Link>
      </div>
    </div>
  );
}
