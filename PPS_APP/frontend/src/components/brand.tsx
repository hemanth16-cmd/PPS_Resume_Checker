import { useId } from "react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // Unique per instance: a shared gradient id breaks when the first copy is display:none.
  const gid = `pps-g-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" className="fill-[#0B0D14] dark:fill-[#1A1D2B]" />
      <path d="M10 8.5h7a5.5 5.5 0 0 1 0 11h-3.5v4H10z" fill="none" stroke={`url(#${gid})`} strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="22.5" cy="22.5" r="2.2" fill="#34D399" />
    </svg>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      {!collapsed && (
        <div className="whitespace-nowrap leading-none">
          <div className="text-[15px] font-semibold tracking-tight">PPS</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-fg-subtle">Placement Prep</div>
        </div>
      )}
    </div>
  );
}
