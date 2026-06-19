import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  Brain,
  CheckCircle2,
  CloudUpload,
  FileSpreadsheet,
  MessageSquare,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { FileTypeIcon, formatBytes } from "@/components/app/FileBits";
import { useStore, type UploadedFile } from "@/lib/store";
import { formatINR } from "@/lib/demo-data";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload — BizLens AI" },
      { name: "description", content: "Drop CSV, XLSX, or PDF — BizLens AI analyzes instantly." },
    ],
  }),
  component: UploadPage,
});

type Step = "idle" | "uploading" | "reading" | "analyzing" | "done";

type Analysis = {
  summary: string[];
  topCategoryChart?: { name: string; value: number }[];
  trendChart?: { name: string; value: number }[];
};

function UploadPage() {
  const navigate = useNavigate();
  const addFile = useStore((s) => s.addFile);
  const addInsight = useStore((s) => s.addInsight);

  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleFile = useCallback(
    async (input: File) => {
      const ext = (input.name.split(".").pop() ?? "").toLowerCase();
      const type: UploadedFile["type"] =
        ext === "csv" ? "csv" : ext === "xlsx" ? "xlsx" : ext === "pdf" ? "pdf" : "image";

      setStep("uploading");
      setProgress(0);
      // simulate upload tick
      for (let p = 0; p <= 100; p += 10) {
        await wait(45);
        setProgress(p);
      }

      setStep("reading");
      await wait(700);

      let rows: (string | number)[][] = [];
      let columns: string[] = [];
      if (type === "csv") {
        const text = await input.text();
        const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
        if (parsed.data.length) {
          columns = parsed.data[0];
          rows = parsed.data.slice(1).map((r) =>
            r.map((c) => (isFiniteNumber(c) ? Number(c) : c)),
          );
        }
      }

      setStep("analyzing");
      await wait(900);

      const newFile: UploadedFile = {
        id: `up-${Date.now()}`,
        name: input.name,
        type,
        size: input.size,
        uploadedAt: Date.now(),
        status: "analyzed",
        rowCount: rows.length,
        columnNames: columns,
        rows,
        source: "upload",
      };

      const a = buildAnalysis(newFile);
      setFile(newFile);
      setAnalysis(a);
      addFile(newFile);
      a.summary.slice(0, 2).forEach((content, idx) =>
        addInsight({
          id: `${newFile.id}-i-${idx}`,
          fileId: newFile.id,
          fileName: newFile.name,
          content,
          createdAt: Date.now(),
        }),
      );
      setStep("done");
      toast.success("Analysis ready", { description: newFile.name });
    },
    [addFile, addInsight],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (accepted) => accepted[0] && handleFile(accepted[0]),
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false,
  });

  const reset = () => {
    setStep("idle");
    setProgress(0);
    setFile(null);
    setAnalysis(null);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-semibold tracking-tight">
            Upload your <span className="text-gradient">business data</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            BizLens AI reads it, finds patterns, and writes the insights.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "idle" && (
            <motion.div
              key="zone"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              {...(getRootProps() as Record<string, unknown>)}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                isDragActive
                  ? "border-primary bg-primary/8 glow-primary"
                  : "border-primary/50 bg-card hover:border-primary hover:bg-primary/5"
              }`}
            >
              <input {...getInputProps()} />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] glow-primary"
              >
                <CloudUpload className="h-8 w-8 text-white" />
              </motion.div>
              <h3 className="text-lg font-semibold">
                {isDragActive ? "Drop to analyze" : "Drop your business data here"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Supports CSV, XLSX, PDF, PNG, JPG — up to 50MB
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {["CSV", "XLSX", "PDF", "PNG", "JPG"].map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {(step === "uploading" || step === "reading" || step === "analyzing") && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card-surface p-8"
            >
              <ProgressStep
                active={step === "uploading"}
                done={step !== "uploading"}
                label="Uploading file..."
                icon={<CloudUpload className="h-4 w-4" />}
                progress={progress}
              />
              <ProgressStep
                active={step === "reading"}
                done={step === "analyzing"}
                label="Reading your data..."
                icon={<Brain className="h-4 w-4" />}
                spin={step === "reading"}
              />
              <ProgressStep
                active={step === "analyzing"}
                done={false}
                label="Generating insights..."
                icon={<Sparkles className="h-4 w-4" />}
                spin={step === "analyzing"}
                last
              />
            </motion.div>
          )}

          {step === "done" && file && analysis && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Metadata */}
              <div className="card-surface p-5">
                <div className="flex items-start gap-4">
                  <FileTypeIcon type={file.type} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-base font-semibold">{file.name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{formatBytes(file.size)}</span>
                      {file.rowCount !== undefined && (
                        <span>
                          <b className="text-foreground font-mono-num">{file.rowCount}</b> rows
                        </span>
                      )}
                      {file.columnNames?.length ? (
                        <span>
                          <b className="text-foreground font-mono-num">
                            {file.columnNames.length}
                          </b>{" "}
                          columns
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    onClick={reset}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:border-primary"
                  >
                    Upload another
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="card-surface p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold">AI Summary</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.summary.map((line, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex gap-3 rounded-lg border-l-2 border-primary bg-surface px-3 py-2 text-sm"
                    >
                      <span className="text-primary-glow">•</span>
                      <span className="text-foreground/90">{line}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Charts */}
              {(analysis.topCategoryChart || analysis.trendChart) && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {analysis.topCategoryChart && (
                    <ChartCard title="Top items by total" type="bar" data={analysis.topCategoryChart} />
                  )}
                  {analysis.trendChart && (
                    <ChartCard title="Trend over time" type="line" data={analysis.trendChart} />
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => navigate({ to: "/chat" })}
                  className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.02]"
                >
                  <MessageSquare className="h-4 w-4" /> Start Chatting
                </button>
                <button
                  onClick={() => navigate({ to: "/reports" })}
                  className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-5 py-2.5 text-sm font-medium hover:border-primary"
                >
                  <FileText className="h-4 w-4" /> Generate Report
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

/* ---------- helpers ---------- */

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isFiniteNumber(s: string) {
  if (s === "" || s == null) return false;
  return !isNaN(Number(s)) && isFinite(Number(s));
}

function buildAnalysis(f: UploadedFile): Analysis {
  if (f.type !== "csv" || !f.rows?.length || !f.columnNames?.length) {
    return {
      summary: [
        `${f.name} uploaded successfully (${formatBytes(f.size)}).`,
        "Open chat to ask questions about this file.",
      ],
    };
  }

  const cols = f.columnNames;
  // find numeric + label columns
  const numericIdx = cols.findIndex((_, i) =>
    f.rows!.slice(0, 5).every((r) => typeof r[i] === "number"),
  );
  const labelIdx = cols.findIndex((_, i) =>
    f.rows!.slice(0, 5).every((r) => typeof r[i] === "string"),
  );

  const summary: string[] = [
    `Found ${f.rows.length} rows across ${cols.length} columns: ${cols.slice(0, 4).join(", ")}${cols.length > 4 ? "…" : ""}.`,
  ];

  let topCategoryChart: Analysis["topCategoryChart"];
  let trendChart: Analysis["trendChart"];

  if (numericIdx >= 0 && labelIdx >= 0) {
    const sums = new Map<string, number>();
    for (const r of f.rows) {
      const k = String(r[labelIdx]);
      sums.set(k, (sums.get(k) ?? 0) + (Number(r[numericIdx]) || 0));
    }
    const sorted = [...sums.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    topCategoryChart = sorted.map(([name, value]) => ({ name, value }));
    const [topName, topVal] = sorted[0] ?? ["", 0];
    summary.push(
      `Top ${cols[labelIdx]}: ${topName} contributes ${formatINR(topVal)} across ${cols[numericIdx]}.`,
    );

    // trend if there's a date-ish column
    const dateIdx = cols.findIndex((c) => /date|month|day/i.test(c));
    if (dateIdx >= 0) {
      const trend = new Map<string, number>();
      for (const r of f.rows) {
        const k = String(r[dateIdx]);
        trend.set(k, (trend.get(k) ?? 0) + (Number(r[numericIdx]) || 0));
      }
      trendChart = [...trend.entries()].slice(0, 12).map(([name, value]) => ({ name, value }));
      summary.push(
        `Movement spans ${trend.size} ${cols[dateIdx].toLowerCase()} buckets — open chat to dig into the swings.`,
      );
    }
  } else {
    summary.push("Data looks mostly textual — start chatting to extract structured insights.");
  }

  summary.push("Click Start Chatting to ask BizLens AI specific questions about this data.");
  return { summary, topCategoryChart, trendChart };
}

/* ---------- subcomponents ---------- */

function ProgressStep({
  active,
  done,
  label,
  icon,
  spin,
  progress,
  last,
}: {
  active: boolean;
  done: boolean;
  label: string;
  icon: React.ReactNode;
  spin?: boolean;
  progress?: number;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 ${!last ? "border-b border-border pb-4 mb-4" : ""}`}>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
          done
            ? "bg-success/20 text-[oklch(0.82_0.16_175)]"
            : active
              ? "bg-primary/20 text-primary-glow"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {done ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : spin ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1">
        <div
          className={`text-sm font-medium ${
            active || done ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {label}
        </div>
        {progress !== undefined && active && (
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-[image:var(--gradient-brand)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  type,
  data,
}: {
  title: string;
  type: "bar" | "line";
  data: { name: string; value: number }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-surface p-5"
    >
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h4>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.27 0.018 270)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<TooltipBox />} cursor={{ fill: "oklch(0.58 0.22 287 / 0.08)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={700}>
                {data.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "oklch(0.58 0.22 287)" : "oklch(0.58 0.22 287 / 0.55)"} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.27 0.018 270)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<TooltipBox />} cursor={{ stroke: "oklch(0.58 0.22 287 / 0.3)" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="oklch(0.78 0.16 175)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "oklch(0.78 0.16 175)" }}
                animationDuration={900}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-foreground">{label}</div>
      <div className="font-mono-num text-primary-glow">{payload[0].value.toLocaleString("en-IN")}</div>
    </div>
  );
}
