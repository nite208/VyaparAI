import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

export function CountUp({
  to,
  duration = 1.2,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
}) {
  const v = useMotionValue(0);
  const rounded = useTransform(v, (n) => format(n));
  useEffect(() => {
    const controls = animate(v, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return controls.stop;
  }, [to, duration, v]);
  return <motion.span>{rounded}</motion.span>;
}
