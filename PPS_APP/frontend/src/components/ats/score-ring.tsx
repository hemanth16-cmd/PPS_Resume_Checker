import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: number;
  max: number;
  color: string;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
  decimals?: number;
}

/** Animated circular gauge. The number counts up with the arc. */
export function ScoreRing({ value, max, color, size = 168, stroke = 12, label, className, decimals = 0 }: Props) {
  const reduce = useReducedMotion();
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const mv = useMotionValue(reduce ? value : 0);
  const display = useTransform(mv, (v) => v.toFixed(decimals));
  const dash = useTransform(mv, (v) => c * (1 - Math.max(0, Math.min(1, v / max))));

  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 });
    return () => controls.stop();
  }, [value, mv, reduce]);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "Score"}: ${value} out of ${max}`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.75} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-subtle)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          style={{ strokeDashoffset: reduce ? c * (1 - pct) : dash }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span className="tabular text-[2.6em] font-semibold leading-none tracking-tight" style={{ fontSize: size * 0.24 }}>
          {display}
        </motion.span>
        <span className="mt-1.5 text-xs font-medium text-fg-subtle">of {max}</span>
      </div>
    </div>
  );
}
