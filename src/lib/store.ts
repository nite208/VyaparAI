import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoDataset } from "./demo-data";

export type UploadedFile = {
  id: string;
  name: string;
  type: "csv" | "xlsx" | "pdf" | "image";
  size: number;
  uploadedAt: number; // epoch ms
  status: "analyzed" | "processing" | "failed";
  rowCount?: number;
  columnNames?: string[];
  rows?: (string | number)[][];
  source?: "demo" | "upload";
};

export type Insight = {
  id: string;
  fileId: string;
  fileName: string;
  content: string;
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
  stats: Stats;
  sidebarCollapsed: boolean;
  addFile: (f: UploadedFile) => void;
  removeFile: (id: string) => void;
  addInsight: (i: Insight) => void;
  bumpStat: (k: keyof Stats, by?: number) => void;
  loadDemo: (d: DemoDataset) => UploadedFile;
  toggleSidebar: () => void;
};

const seedInsights = (fileId: string, fileName: string): Omit<Insight, "id">[] => [
  {
    fileId,
    fileName,
    content:
      fileName.includes("Spice")
        ? "Biryani drives 38% of weekend revenue — push it harder on Friday/Saturday."
        : "₹13,500 in fees still pending across 5 students — May collection at 70%.",
    createdAt: Date.now() - 1000 * 60 * 3,
  },
  {
    fileId,
    fileName,
    content:
      fileName.includes("Spice")
        ? "Beverages are under-ordered: only 22% attach rate vs typical 45% in mid-tier restaurants."
        : "Class 9 Commerce has the lowest collection — 0% paid for the only May student.",
    createdAt: Date.now() - 1000 * 60 * 8,
  },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      files: [],
      insights: [],
      stats: {
        filesAnalyzed: 0,
        insightsGenerated: 0,
        reportsExported: 0,
        questionsAsked: 0,
      },
      sidebarCollapsed: false,

      addFile: (f) =>
        set((s) => ({
          files: [f, ...s.files],
          stats: { ...s.stats, filesAnalyzed: s.stats.filesAnalyzed + 1 },
        })),

      removeFile: (id) =>
        set((s) => ({
          files: s.files.filter((f) => f.id !== id),
          insights: s.insights.filter((i) => i.fileId !== id),
        })),

      addInsight: (i) =>
        set((s) => ({
          insights: [i, ...s.insights].slice(0, 50),
          stats: { ...s.stats, insightsGenerated: s.stats.insightsGenerated + 1 },
        })),

      bumpStat: (k, by = 1) =>
        set((s) => ({ stats: { ...s.stats, [k]: s.stats[k] + by } })),

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
        const insights = seedInsights(id, d.name).map((i) => ({
          ...i,
          id: `${id}-i-${Math.random().toString(36).slice(2, 8)}`,
        }));
        set((s) => ({ insights: [...insights, ...s.insights].slice(0, 50) }));
        return file;
      },
    }),
    { name: "bizlens-store" },
  ),
);
