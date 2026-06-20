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
  Loader2,
  MessageSquare,
  FileText,
  Sparkles,
  Target,
  Lightbulb,
  Image as ImageIcon,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { FileTypeIcon, formatBytes } from "@/components/app/FileBits";
import { useStore, type UploadedFile, type Report } from "@/lib/store";
import { useSettings } from "@/lib/settings";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  buildFileContext,
  callClaude,
  parseAnalysisBlock,
  parseChartBlocks,
  type AnalysisBlock,
} from "@/lib/claude";
import { demoAnalysis, detectDemoKind } from "@/lib/demo-responses";
import { InlineChart } from "./chat";

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

function UploadPage() {
  const navigate = useNavigate();
  const addFile = useStore((s) => s.addFile);
  const addInsight = useStore((s) => s.addInsight);
  const addReport = useStore((s) => s.addReport);
  const hasKey = useSettings((s) => !!s.claudeApiKey);
  const hasCloud = useSettings((s) => !!s.cloudinaryCloudName && !!s.cloudinaryUploadPreset);

  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisBlock | null>(null);
  const [chart, setChart] = useState<NonNullable<Report["payload"]["chart"]> | null>(null);

  const handleFile = useCallback(
    async (input: File) => {
      const ext = (input.name.split(".").pop() ?? "").toLowerCase();
      const type: UploadedFile["type"] =
        ext === "csv" ? "csv" : ext === "xlsx" ? "xlsx" : ext === "pdf" ? "pdf" : "image";

      setStep("uploading");
      setProgress(0);

      // Cloudinary (if configured)
      let cloudinaryUrl: string | undefined;
      if (hasCloud) {
        try {
          const up = uploadToCloudinary(input);
          // fake progress while upload runs
          for (let p = 0; p <= 60; p += 12) {
            await wait(80);
            setProgress(p);
          }
          cloudinaryUrl = (await up) ?? undefined;
          setProgress(80);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Cloudinary upload failed");
        }
      } else {
        for (let p = 0; p <= 100; p += 10) {
          await wait(45);
          setProgress(p);
        }
      }

      setStep("reading");
      await wait(450);

      let rows: (string | number)[][] = [];
      let columns: string[] = [];
      if (type === "csv") {
        const text = await input.text();
        const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true });
        if (parsed.data.length) {
          columns = parsed.data[0];
          rows = parsed.data
            .slice(1)
            .map((r) => r.map((c) => (isFiniteNumber(c) ? Number(c) : c)));
        }
      }

      setStep("analyzing");

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
        cloudinaryUrl,
      };

      let result: AnalysisBlock;
      let chartBlock: NonNullable<Report["payload"]["chart"]> | null = null;

      if (hasKey && type === "csv") {
        try {
          const reply = await callClaude(
            [
              {
                role: "user",
                content: `Analyze this dataset and return only an \`\`\`analysis JSON block. Include one \`\`\`chartdata block.\n\n${buildFileContext(newFile)}`,
              },
            ],
          );
          const parsed = parseAnalysisBlock(reply);
          if (parsed) result = parsed;
          else throw new Error("No analysis block in Claude response");
          const charts = parseChartBlocks(reply);
          if (charts[0]) chartBlock = charts[0];
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Claude analysis failed — using fallback");
          result = demoAnalysis(detectDemoKind(newFile), newFile);
        }
      } else {
        await wait(700);
        result = demoAnalysis(detectDemoKind(newFile), newFile);
      }

      setFile(newFile);
      setAnalysis(result);
      setChart(chartBlock);
      addFile(newFile);

      result.insights.slice(0, 2).forEach((content, idx) =>
        addInsight({
          id: `${newFile.id}-i-${idx}`,
          fileId: newFile.id,
          fileName: newFile.name,
          content,
          createdAt: Date.now(),
        }),
      );

      const report: Report = {
        id: `${newFile.id}-r`,
        fileId: newFile.id,
        fileName: newFile.name,
        title: newFile.name.replace(/\.[^.]+$/, ""),
        payload: { ...result, chart: chartBlock ?? undefined },
        createdAt: Date.now(),
      };
      addReport(report);

      setStep("done");
      toast.success("Analysis ready", { description: newFile.name });
    },
    [addFile, addInsight, addReport, hasCloud, hasKey],
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
    setChart(null);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Upload your <span className="text-gradient">business data</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            BizLens AI reads it, finds patterns, and writes the insights.
            {!hasKey && (
              <span className="ml-1 text-warning">
                · Add a Claude key in Settings for live analysis (demo analysis runs without it).
              </span>
            )}
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
                label={hasCloud ? "Uploading to Cloudinary..." : "Reading file..."}
                icon={<CloudUpload className="h-4 w-4" />}
                progress={progress}
              />
              <ProgressStep
                active={step === "reading"}
                done={step === "analyzing"}
                label="Parsing your data..."
                icon={<Brain className="h-4 w-4" />}
                spin={step === "reading"}
              />
              <ProgressStep
                active={step === "analyzing"}
                done={false}
                label={hasKey ? "Asking Claude for insights..." : "Generating demo insights..."}
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
                          <b className="text-foreground font-mono-num">{file.columnNames.length}</b> columns
                        </span>
                      ) : null}
                      {file.cloudinaryUrl && (
                        <a
                          href={file.cloudinaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary-glow hover:underline"
                        >
                          <ImageIcon className="h-3 w-3" /> View on Cloudinary
                        </a>
                      )}
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

              {/* Analysis Card */}
              <div className="card-surface p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-semibold">Executive Summary</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{analysis.summary}</p>

                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {analysis.metrics.map((m, i) => (
                    <div key={i} className="rounded-lg border border-border bg-surface p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {m.label}
                      </div>
                      <div className="mt-0.5 font-mono-num text-lg font-semibold">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Lightbulb className="h-3.5 w-3.5 text-accent" /> Insights
                    </div>
                    <ul className="space-y-1.5">
                      {analysis.insights.map((it, i) => (
                        <li key={i} className="flex gap-2 rounded-lg border-l-2 border-primary bg-surface px-3 py-1.5 text-sm">
                          <span className="text-primary-glow">•</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      <Target className="h-3.5 w-3.5 text-accent" /> Recommendations
                    </div>
                    <ul className="space-y-1.5">
                      {analysis.recommendations.map((it, i) => (
                        <li key={i} className="flex gap-2 rounded-lg bg-[image:var(--gradient-brand-soft)] px-3 py-1.5 text-sm">
                          <span className="text-primary-glow">→</span>
                          <span>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {chart && <InlineChart chart={chart} />}

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
                  <FileText className="h-4 w-4" /> View Report
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
