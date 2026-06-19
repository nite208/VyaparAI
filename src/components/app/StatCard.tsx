import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CountUp } from "./CountUp";

export function StatCard({
  label,
  value,
  delta,
  positive = true,
  spark,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: number;
  delta: string;
  positive?: boolean;
  spark: number[];
  icon: LucideIcon;
  index?: number;
}) {
  const data = spark.map((y, i) => ({ x: i, y }));
  const gradId = `spark-${label.replace(/\s+/g, "-")}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="card-surface card-hover relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            positive
              ? "bg-success/15 text-[oklch(0.82_0.16_175)]"
              : "bg-destructive/15 text-[oklch(0.75_0.22_22)]"
          }`}
        >
          {positive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {delta}
        </span>
      </div>

      <div className="mt-3 font-mono-num text-3xl font-semibold tracking-tight text-foreground">
        <CountUp to={value} />
      </div>

      <div className="mt-3 h-12 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.58 0.22 287)" stopOpacity={0.6} />
                <stop offset="100%" stopColor="oklch(0.58 0.22 287)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="y"
              stroke="oklch(0.78 0.16 175)"
              strokeWidth={1.75}
              fill={`url(#${gradId})`}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
