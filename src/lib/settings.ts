import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChartType = "bar" | "line" | "pie" | "area";
export type Language = "en" | "hi";

export type SettingsState = {
  groqApiKey: string;
  groqModel: string;
  neonConnectionString: string;
  cloudinaryCloudName: string;
  cloudinaryUploadPreset: string;
  appName: string;
  defaultChartType: ChartType;
  language: Language;
  set: (patch: Partial<Omit<SettingsState, "set" | "reset">>) => void;
  reset: () => void;
};

const defaults = {
  groqApiKey: "",
  groqModel: "llama-3.3-70b-versatile",
  neonConnectionString: "",
  cloudinaryCloudName: "",
  cloudinaryUploadPreset: "",
  appName: "BizLens AI",
  defaultChartType: "bar" as ChartType,
  language: "en" as Language,
};

const GROQ_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
]);

function normalizeGroqModel(model: string): string {
  return GROQ_MODELS.has(model) ? model : defaults.groqModel;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    {
      name: "bizlens-settings",
      version: 3,
      migrate: (persisted, version) => {
        const s = persisted as Record<string, unknown>;
        const legacyKey =
          (s.groqApiKey as string) ||
          (s.geminiApiKey as string) ||
          (s.claudeApiKey as string) ||
          "";
        const legacyModel =
          (s.groqModel as string) ||
          (s.geminiModel as string) ||
          (s.claudeModel as string) ||
          "";

        return {
          ...defaults,
          ...s,
          groqApiKey: legacyKey,
          groqModel: normalizeGroqModel(legacyModel),
        };
      },
    },
  ),
);
