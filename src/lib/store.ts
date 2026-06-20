import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoDataset } from "./demo-data";
import { dbAddFile, dbAddInsight, dbAddMessage, dbAddReport, dbBumpStat, dbClearAll, dbDeleteFile, dbLoadAll } from "./neon";
import { demoAnalysis, detectDemoKind } from "./demo-responses";
import type { AnalysisBlock } from "./claude";

export type UploadedFile = {
  id: string;
  name: string;
  type: "csv" | "xlsx" | "pdf" | "image";
  size: number;
  uploadedAt: number;
  status: "analyzed" | "processing" | "failed";
  rowCount?: number;
  columnNames?: string[];
  rows?: (string | number)[][];
  source?: "demo" | "upload";
  cloudinaryUrl?: string;
};

export type Insight = {
  id: string;
  fileId: string;
  fileName: string;
  content: string;
  createdAt: number;
};

export type ChatMessage = {
  id: string;
  fileId: string | null;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type Report = {
  id: string;
  fileId: string;
  fileName: string;
  title: string;
  payload: AnalysisBlock & {
    chart?: { type: "bar" | "line" | "pie" | "area"; title?: string; data: { name: string; value: number }[] };
  };
  createdAt: number;
};

type Stats = {
  filesAnalyzed: number;
  insightsGenerated: number;
  reportsExported: number;
  questionsAsked: number;
};

type State = {
  files: UploadedFile[];
  insights: Insight[];
  messages: ChatMessage[];
  reports: Report[];
  stats: Stats;
  sidebarCollapsed: boolean;

  addFile: (f: UploadedFile) => void;
  removeFile: (id: string) => void;
  addInsight: (i: Insight) => void;
  addMessage: (m: ChatMessage) => void;
  addReport: (r: Report) => void;
  bumpStat: (k: keyof Stats, by?: number) => void;
  toggleSidebar: () => void;
  loadDemo: (d: DemoDataset) => UploadedFile;
  clearAll: () => Promise<void>;
  hydrateFromDb: () => Promise<void>;
};

const seedInsights = (fileId: string, fileName: string): Omit<Insight, "id">[] => [
  {
    fileId,
    fileName,
    content: fileName.includes("Spice")
      ? "Biryani drives 24% of revenue — push it harder on Fri/Sat."
      : "₹13,500 in fees still pending across 5 students — May collection at 70%.",
    createdAt: Date.now() - 1000 * 60 * 3,
  },
  {
    fileId,
    fileName,
    content: fileName.includes("Spice")
      ? "Beverages attach rate is 22% vs industry 45% — biggest revenue leak."
      : "Class 12 is top earner at ₹26,750 (38% of total) — your money-maker.",
    createdAt: Date.now() - 1000 * 60 * 8,
  },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      files: [],
      insights: [],
      messages: [],
      reports: [],
      stats: { filesAnalyzed: 0, insightsGenerated: 0, reportsExported: 0, questionsAsked: 0 },
      sidebarCollapsed: false,

      addFile: (f) => {
        set((s) => ({
          files: [f, ...s.files],
          stats: { ...s.stats, filesAnalyzed: s.stats.filesAnalyzed + 1 },
        }));
        void dbAddFile(f, f.cloudinaryUrl);
        void dbBumpStat("filesAnalyzed");
      },

      removeFile: (id) => {
        set((s) => ({
          files: s.files.filter((f) => f.id !== id),
          insights: s.insights.filter((i) => i.fileId !== id),
          messages: s.messages.filter((m) => m.fileId !== id),
          reports: s.reports.filter((r) => r.fileId !== id),
        }));
        void dbDeleteFile(id);
      },

      addInsight: (i) => {
        set((s) => ({
          insights: [i, ...s.insights].slice(0, 50),
          stats: { ...s.stats, insightsGenerated: s.stats.insightsGenerated + 1 },
        }));
        void dbAddInsight(i);
        void dbBumpStat("insightsGenerated");
      },

      addMessage: (m) => {
        set((s) => ({
          messages: [...s.messages, m].slice(-500),
          stats: m.role === "user" ? { ...s.stats, questionsAsked: s.stats.questionsAsked + 1 } : s.stats,
        }));
        void dbAddMessage(m);
        if (m.role === "user") void dbBumpStat("questionsAsked");
      },

      addReport: (r) => {
        set((s) => ({
          reports: [r, ...s.reports].slice(0, 50),
          stats: { ...s.stats, reportsExported: s.stats.reportsExported + 1 },
        }));
        void dbAddReport(r);
        void dbBumpStat("reportsExported");
      },

      bumpStat: (k, by = 1) => set((s) => ({ stats: { ...s.stats, [k]: s.stats[k] + by } })),

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      loadDemo: (d) => {
        const id = `${d.id}-${Date.now()}`;
        const file: UploadedFile = {
          id,
          name: d.name,
          type: "csv",
          size: 1024 * 12,
          uploadedAt: Date.now(),
          status: "analyzed",
          rowCount: d.rows.length,
          columnNames: d.columns,
          rows: d.rows,
          source: "demo",
        };
        set((s) => ({
          files: [file, ...s.files],
          stats: {
            ...s.stats,
            filesAnalyzed: s.stats.filesAnalyzed + 1,
            insightsGenerated: s.stats.insightsGenerated + 2,
          },
        }));
        void dbAddFile(file);
        void dbBumpStat("filesAnalyzed");

        const insights = seedInsights(id, d.name).map((i) => ({
          ...i,
          id: `${id}-i-${Math.random().toString(36).slice(2, 8)}`,
        }));
        set((s) => ({ insights: [...insights, ...s.insights].slice(0, 50) }));
        insights.forEach((i) => void dbAddInsight(i));

        // auto-create a Report from demo analysis
        const kind = detectDemoKind(file);
        const analysis = demoAnalysis(kind, file);
        const report: Report = {
          id: `${id}-r`,
          fileId: id,
          fileName: file.name,
          title: file.name.replace(/\.[^.]+$/, ""),
          payload: analysis,
          createdAt: Date.now(),
        };
        set((s) => ({ reports: [report, ...s.reports].slice(0, 50) }));
        void dbAddReport(report);

        return file;
      },

      clearAll: async () => {
        set({
          files: [],
          insights: [],
          messages: [],
          reports: [],
          stats: { filesAnalyzed: 0, insightsGenerated: 0, reportsExported: 0, questionsAsked: 0 },
        });
        await dbClearAll();
      },

      hydrateFromDb: async () => {
        const loaded = await dbLoadAll();
        if (!loaded) return;
        const existing = get();
        // merge by id, db wins for files/insights/messages/reports
        const mergeById = <T extends { id: string }>(a: T[], b: T[]) => {
          const map = new Map(a.map((x) => [x.id, x] as const));
          for (const x of b) map.set(x.id, x);
          return [...map.values()];
        };
        set({
          files: mergeById(existing.files, loaded.files).sort((a, b) => b.uploadedAt - a.uploadedAt),
          insights: mergeById(existing.insights, loaded.insights).sort((a, b) => b.createdAt - a.createdAt),
          messages: mergeById(existing.messages, loaded.messages).sort((a, b) => a.createdAt - b.createdAt),
          reports: mergeById(existing.reports, loaded.reports).sort((a, b) => b.createdAt - a.createdAt),
          stats: {
            filesAnalyzed: loaded.stats.filesAnalyzed ?? existing.stats.filesAnalyzed,
            insightsGenerated: loaded.stats.insightsGenerated ?? existing.stats.insightsGenerated,
            reportsExported: loaded.stats.reportsExported ?? existing.stats.reportsExported,
            questionsAsked: loaded.stats.questionsAsked ?? existing.stats.questionsAsked,
          },
        });
      },
    }),
    { name: "bizlens-store" },
  ),
);
