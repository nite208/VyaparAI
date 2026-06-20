import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChartType = "bar" | "line" | "pie" | "area";
export type Language = "en" | "hi";

export type SettingsState = {
  claudeApiKey: string;
  claudeModel: string;
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
  claudeApiKey: "",
  claudeModel: "claude-sonnet-4-5",
  neonConnectionString: "",
  cloudinaryCloudName: "",
  cloudinaryUploadPreset: "",
  appName: "BizLens AI",
  defaultChartType: "bar" as ChartType,
  language: "en" as Language,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      set: (patch) => set(patch),
      reset: () => set(defaults),
    }),
    { name: "bizlens-settings" },
  ),
);
