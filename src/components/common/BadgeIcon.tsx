import type { ReactNode } from "react";

interface BadgeIconProps {
  icon: ReactNode;
  label: string;
  tone?: "pink" | "cyan" | "emerald" | "amber" | "slate";
  className?: string;
}

const toneClasses: Record<NonNullable<BadgeIconProps["tone"]>, string> = {
  pink: "border-pink-300/50 bg-pink-400/14 text-pink-100",
  cyan: "border-cyan-300/50 bg-cyan-400/14 text-cyan-100",
  emerald: "border-emerald-300/50 bg-emerald-400/14 text-emerald-100",
  amber: "border-amber-300/50 bg-amber-400/14 text-amber-100",
  slate: "border-slate-500 bg-slate-700/70 text-slate-100",
};

export function BadgeIcon({
  icon,
  label,
  tone = "slate",
  className = "",
}: BadgeIconProps) {
  return (
    <span
      className={[
        "inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black",
        toneClasses[tone],
        className,
      ].join(" ")}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}
