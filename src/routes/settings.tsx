import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  ImagePlus,
  KeyRound,
  Languages,
  Loader2,
  Palette,
  Sparkles,
  Trash2,
  Wand2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { useSettings } from "@/lib/settings";
import { useStore } from "@/lib/store";
import { testGroqKey } from "@/lib/groq";
import { initSchema, testNeonConnection } from "@/lib/neon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — BizLens AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          <span className="text-gradient">Settings</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring your own keys — everything stays in your browser.
        </p>
      </motion.div>

      <div className="space-y-6">
        <AISection />
        <DatabaseSection />
        <CloudinarySection />
        <PreferencesSection />
        <DataSection />
      </div>
    </AppShell>
  );
}

/* ---------------- AI ---------------- */

function AISection() {
  const { groqApiKey, groqModel, set } = useSettings();
  const envKey = import.meta.env.VITE_GROQ_API_KEY ?? "";
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onTest() {
    const key = groqApiKey || envKey;
    if (!key) {
      toast.error("Add a key first");
      return;
    }
    setBusy(true);
    const r = await testGroqKey(key, groqModel);
    setBusy(false);
    r.ok ? toast.success(r.message) : toast.error(r.message);
  }

  return (
    <SectionCard icon={<Wand2 className="h-4 w-4 text-white" />} title="AI Configuration" subtitle="Groq API for chat and analysis">
      <Field label="Groq API Key">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              value={groqApiKey}
              onChange={(e) => set({ groqApiKey: e.target.value })}
              placeholder={envKey ? "Loaded from VITE_GROQ_API_KEY" : "gsk_…"}
              className="w-full rounded-lg border border-border bg-surface px-9 py-2 text-sm font-mono outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={onTest} disabled={busy} className={testBtnCls}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
          </button>
        </div>
      </Field>
      <Field label="Model">
        <select
          value={groqModel}
          onChange={(e) => set({ groqModel: e.target.value })}
          className={inputCls}
        >
          <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (recommended)</option>
          <option value="llama-3.1-8b-instant">llama-3.1-8b-instant</option>
          <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
        </select>
      </Field>
      {envKey && !groqApiKey && (
        <p className="text-xs text-muted-foreground">
          Using API key from <span className="font-mono">VITE_GROQ_API_KEY</span> environment variable.
        </p>
      )}
    </SectionCard>
  );
}

/* ---------------- Database ---------------- */

function DatabaseSection() {
  const { neonConnectionString, set } = useSettings();
  const [busy, setBusy] = useState(false);

  async function onTest() {
    if (!neonConnectionString) return toast.error("Add a connection string first");
    setBusy(true);
    const r = await testNeonConnection(neonConnectionString);
    if (r.ok) {
      await initSchema();
      toast.success("Connected — schema ready");
    } else {
      toast.error(r.message);
    }
    setBusy(false);
  }

  return (
    <SectionCard icon={<Database className="h-4 w-4 text-white" />} title="Database Configuration" subtitle="Neon Postgres for persistence">
      <Field label="Neon connection string">
        <div className="flex gap-2">
          <input
            type="password"
            value={neonConnectionString}
            onChange={(e) => set({ neonConnectionString: e.target.value })}
            placeholder="postgresql://user:pass@ep-xyz.neon.tech/db?sslmode=require"
            className={cn(inputCls, "font-mono")}
          />
          <button onClick={onTest} disabled={busy} className={testBtnCls}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
          </button>
        </div>
      </Field>
      <p className="text-xs text-muted-foreground">
        Tables are auto-created on first successful test: files, insights, messages, reports, stats.
      </p>
    </SectionCard>
  );
}

/* ---------------- Cloudinary ---------------- */

function CloudinarySection() {
  const { cloudinaryCloudName, cloudinaryUploadPreset, set } = useSettings();
  return (
    <SectionCard icon={<ImagePlus className="h-4 w-4 text-white" />} title="Cloudinary Configuration" subtitle="Unsigned uploads for file storage">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cloud name">
          <input
            value={cloudinaryCloudName}
            onChange={(e) => set({ cloudinaryCloudName: e.target.value })}
            placeholder="your-cloud-name"
            className={inputCls}
          />
        </Field>
        <Field label="Upload preset">
          <input
            value={cloudinaryUploadPreset}
            onChange={(e) => set({ cloudinaryUploadPreset: e.target.value })}
            placeholder="unsigned_preset"
            className={inputCls}
          />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">
        Create an <span className="font-semibold">unsigned</span> preset in Cloudinary → Settings → Upload. We only store the returned URL.
      </p>
    </SectionCard>
  );
}

/* ---------------- Preferences ---------------- */

function PreferencesSection() {
  const { appName, defaultChartType, language, set } = useSettings();
  return (
    <SectionCard icon={<Palette className="h-4 w-4 text-white" />} title="App Preferences" subtitle="Branding and defaults">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="App name">
          <input value={appName} onChange={(e) => set({ appName: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Default chart type">
          <select value={defaultChartType} onChange={(e) => set({ defaultChartType: e.target.value as never })} className={inputCls}>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="pie">Pie</option>
          </select>
        </Field>
        <Field label="Response language">
          <div className="inline-flex rounded-lg border border-border bg-surface p-1">
            {(["en", "hi"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => set({ language: lang })}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  language === lang ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {lang === "en" ? <Globe className="h-3 w-3" /> : <Languages className="h-3 w-3" />}
                {lang === "en" ? "English" : "हिंदी"}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </SectionCard>
  );
}

/* ---------------- Data Management ---------------- */

function DataSection() {
  const files = useStore((s) => s.files);
  const insights = useStore((s) => s.insights);
  const messages = useStore((s) => s.messages);
  const reports = useStore((s) => s.reports);
  const clearAll = useStore((s) => s.clearAll);
  const [confirm, setConfirm] = useState(false);

  // approximate storage usage (localStorage cap ~5MB)
  const used = typeof window !== "undefined"
    ? new Blob([localStorage.getItem("bizlens-store") ?? "", localStorage.getItem("bizlens-settings") ?? ""]).size
    : 0;
  const cap = 5 * 1024 * 1024;
  const pct = Math.min(100, Math.round((used / cap) * 100));

  function exportAll() {
    const blob = new Blob(
      [JSON.stringify({ files, insights, messages, reports, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bizlens-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready");
  }

  async function onClear() {
    await clearAll();
    setConfirm(false);
    toast.success("All data cleared");
  }

  return (
    <SectionCard icon={<HardDrive className="h-4 w-4 text-white" />} title="Data Management" subtitle="Local + Neon backed">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Files" value={files.length} />
        <Metric label="Messages" value={messages.length} />
        <Metric label="Reports" value={reports.length} />
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Local storage</span>
          <span>{(used / 1024).toFixed(1)} KB / 5 MB</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[image:var(--gradient-brand)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={exportAll} className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-card px-4 py-2 text-sm font-medium hover:border-primary">
          <Download className="h-4 w-4" /> Export all data
        </button>
        <button
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-[oklch(0.82_0.18_22)] hover:border-destructive"
        >
          <Trash2 className="h-4 w-4" /> Clear all data
        </button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-border-strong bg-card p-6"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-[oklch(0.82_0.18_22)]">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold">Clear everything?</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Files, insights, messages, reports, and stats will be removed locally and from Neon. Settings are preserved.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(false)} className="rounded-full border border-border bg-card px-4 py-2 text-sm">
                Cancel
              </button>
              <button onClick={onClear} className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground">
                Delete everything
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </SectionCard>
  );
}

/* ---------------- Primitives ---------------- */

const inputCls =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const testBtnCls =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-strong bg-card px-4 py-2 text-sm font-medium hover:border-primary min-w-[80px]";

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-surface overflow-hidden">
      <header className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[image:var(--gradient-brand)] glow-primary">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </motion.section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono-num text-xl font-semibold">{value}</div>
    </div>
  );
}

// silence unused warnings — kept for future use
void Sparkles;
void CheckCircle2;
void XCircle;
