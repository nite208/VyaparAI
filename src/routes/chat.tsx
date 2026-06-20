import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, FileSpreadsheet, Loader2, MessageSquare, Send, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { FileTypeIcon, relativeTime } from "@/components/app/FileBits";
import { useStore } from "@/lib/store";
import {
  type ChartBlock,
  buildFileContext,
  callGroq,
  hasGroqKey,
  parseChartBlocks,
  stripBlocks,
} from "@/lib/groq";
import { SUGGESTED_QUESTIONS, demoAnswer, detectDemoKind } from "@/lib/demo-responses";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "Chat — BizLens AI" }] }),
  component: ChatPage,
});

const CHART_COLORS = [
  "oklch(0.58 0.22 287)",
  "oklch(0.78 0.16 175)",
  "oklch(0.68 0.19 287)",
  "oklch(0.78 0.16 70)",
  "oklch(0.66 0.22 22)",
  "oklch(0.72 0.18 220)",
];

function ChatPage() {
  const files = useStore((s) => s.files);
  const allMessages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const hasKey = hasGroqKey();

  const [activeFileId, setActiveFileId] = useState<string | null>(files[0]?.id ?? null);
  useEffect(() => {
    if (!activeFileId && files[0]) setActiveFileId(files[0].id);
  }, [files, activeFileId]);

  const activeFile = files.find((f) => f.id === activeFileId) ?? null;
  const messages = useMemo(
    () => allMessages.filter((m) => m.fileId === activeFileId),
    [allMessages, activeFileId],
  );

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, pending]);

  const kind = detectDemoKind(activeFile);
  const suggestions = SUGGESTED_QUESTIONS[kind];

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    if (!activeFile) {
      toast.error("Pick a file first");
      return;
    }
    const userMsg = {
      id: `m-${Date.now()}`,
      fileId: activeFileId,
      role: "user" as const,
      content: trimmed,
      createdAt: Date.now(),
    };
    addMessage(userMsg);
    setInput("");
    setPending(true);

    try {
      let reply: string;
      if (hasKey) {
        const turns = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
        const context = `\n\nActive dataset context:\n${buildFileContext(activeFile)}`;
        reply = await callGroq(turns, context);
      } else {
        // demo mode
        await new Promise((r) => setTimeout(r, 600));
        reply = demoAnswer(kind, trimmed);
      }
      addMessage({
        id: `m-${Date.now() + 1}`,
        fileId: activeFileId,
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      {files.length === 0 ? (
        <EmptyChat />
      ) : (
        <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 md:h-[calc(100vh-8rem)] md:grid-cols-[280px_minmax(0,1fr)]">
          {/* File list */}
          <aside className="card-surface hidden flex-col overflow-hidden md:flex">
            <div className="border-b border-border px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your files
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {files.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFileId(f.id)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors",
                    f.id === activeFileId
                      ? "bg-primary/15 text-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  <FileTypeIcon type={f.type} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{f.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {f.rowCount ?? 0} rows · {relativeTime(f.uploadedAt)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile file selector */}
          <div className="md:hidden">
            <select
              value={activeFileId ?? ""}
              onChange={(e) => setActiveFileId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chat panel */}
          <section className="card-surface flex min-h-0 flex-col overflow-hidden">
            <header className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] glow-primary">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {activeFile?.name ?? "Pick a file"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {hasKey ? "Live AI · Groq" : "Demo mode · add a key in Settings for live AI"}
                  </div>
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
              {messages.length === 0 && (
                <div className="mx-auto max-w-md py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand-soft)]">
                    <Bot className="h-6 w-6 text-primary-glow" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">Ask anything about {activeFile?.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pick a starter question or type your own below.
                  </p>
                </div>
              )}

              <div className="space-y-5">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <MessageBubble key={m.id} role={m.role} content={m.content} />
                  ))}
                </AnimatePresence>
                {pending && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-glow" />
                    Thinking…
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border-strong bg-surface px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
              className="flex items-end gap-2 border-t border-border bg-background/40 px-4 py-3"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
                placeholder="Ask anything about your data…"
                rows={1}
                className="max-h-32 flex-1 resize-none rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-brand)] text-white shadow-[var(--shadow-glow)] transition-transform hover:scale-[1.03] disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const charts = role === "assistant" ? parseChartBlocks(content) : [];
  const text = role === "assistant" ? stripBlocks(content) : content;
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-brand)] text-white">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}
      <div className={cn("min-w-0 max-w-[85%] space-y-3", isUser && "items-end")}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {text}
          </div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none rounded-2xl rounded-tl-sm border border-border bg-surface/60 px-4 py-3 text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary-glow prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
          </div>
        )}
        {charts.map((c, i) => (
          <InlineChart key={i} chart={c} />
        ))}
      </div>
      {isUser && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </motion.div>
  );
}

export function InlineChart({ chart }: { chart: ChartBlock }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/60 p-3"
    >
      {chart.title && (
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {chart.title}
        </div>
      )}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "line" ? (
            <LineChart data={chart.data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.27 0.018 270)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="oklch(0.68 0.19 287)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          ) : chart.type === "pie" ? (
            <PieChart>
              <Tooltip contentStyle={tooltipStyle} />
              <Pie data={chart.data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80} paddingAngle={2}>
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : chart.type === "area" ? (
            <AreaChart data={chart.data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.58 0.22 287)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="oklch(0.58 0.22 287)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.27 0.018 270)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="value" stroke="oklch(0.68 0.19 287)" strokeWidth={2} fill="url(#area-grad)" />
            </AreaChart>
          ) : (
            <BarChart data={chart.data} margin={{ top: 6, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="oklch(0.27 0.018 270)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "oklch(0.66 0.022 268)", fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "oklch(0.58 0.22 287 / 0.08)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chart.data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

const tooltipStyle = {
  background: "oklch(0.22 0.014 268)",
  border: "1px solid oklch(0.27 0.018 270)",
  borderRadius: 8,
  fontSize: 12,
};

function EmptyChat() {
  return (
    <div className="mx-auto mt-12 max-w-lg">
      <div className="card-surface relative overflow-hidden p-10 text-center">
        <div className="absolute inset-0 opacity-50 bg-grid" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] glow-primary">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <h2 className="mt-5 text-xl font-semibold">No files to chat with yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Upload data or load a demo dataset to start asking questions.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 rounded-full bg-[image:var(--gradient-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-glow)]"
            >
              <FileSpreadsheet className="h-4 w-4" /> Upload data
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-5 py-2.5 text-sm font-medium hover:border-primary"
            >
              Try a demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep export for any older imports
export function ComingSoon({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="mx-auto mt-12 max-w-xl">
      <div className="card-surface p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-brand)] glow-primary">
          {icon}
        </div>
        <h2 className="mt-5 text-xl font-semibold">{title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
