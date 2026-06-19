import { motion } from "framer-motion";
import { FileSpreadsheet, FileText, Image as ImageIcon, type LucideIcon } from "lucide-react";
import type { UploadedFile } from "@/lib/store";

const iconFor: Record<UploadedFile["type"], { Icon: LucideIcon; tint: string }> = {
  csv: { Icon: FileSpreadsheet, tint: "text-[oklch(0.78_0.16_175)] bg-[oklch(0.78_0.16_175/0.12)]" },
  xlsx: { Icon: FileSpreadsheet, tint: "text-[oklch(0.78_0.16_175)] bg-[oklch(0.78_0.16_175/0.12)]" },
  pdf: { Icon: FileText, tint: "text-[oklch(0.75_0.22_22)] bg-[oklch(0.75_0.22_22/0.12)]" },
  image: { Icon: ImageIcon, tint: "text-primary-glow bg-primary/12" },
};

export function FileTypeIcon({
  type,
  size = "md",
}: {
  type: UploadedFile["type"];
  size?: "sm" | "md";
}) {
  const { Icon, tint } = iconFor[type];
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const i = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg ${tint}`}
    >
      <Icon className={i} />
    </motion.div>
  );
}

export function StatusBadge({ status }: { status: UploadedFile["status"] }) {
  const map = {
    analyzed: { label: "Analyzed", cls: "bg-success/15 text-[oklch(0.82_0.16_175)]" },
    processing: { label: "Processing", cls: "bg-warning/15 text-[oklch(0.82_0.16_70)]" },
    failed: { label: "Failed", cls: "bg-destructive/15 text-[oklch(0.78_0.22_22)]" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function relativeTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
