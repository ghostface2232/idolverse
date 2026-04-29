import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "primary" | "secondary" | "ghost" | "danger" | "success";
}

const toneClasses: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary:
    "border-brand-pink bg-brand-pink text-white shadow-[0_5px_0_#9d174d,0_14px_30px_rgba(236,72,153,0.28)] hover:bg-pink-400 active:translate-y-1 active:shadow-[0_2px_0_#9d174d,0_8px_18px_rgba(236,72,153,0.2)]",
  secondary:
    "border-slate-500 bg-slate-800 text-slate-100 shadow-[0_5px_0_#334155] hover:bg-slate-700 active:translate-y-1 active:shadow-[0_2px_0_#334155]",
  ghost:
    "border-slate-600 bg-slate-950/30 text-slate-200 shadow-[0_5px_0_rgba(71,85,105,0.75)] hover:bg-white/6 active:translate-y-1 active:shadow-[0_2px_0_rgba(71,85,105,0.75)]",
  danger:
    "border-red-400 bg-red-500 text-white shadow-[0_5px_0_#991b1b] hover:bg-red-400 active:translate-y-1 active:shadow-[0_2px_0_#991b1b]",
  success:
    "border-emerald-400 bg-emerald-500 text-slate-950 shadow-[0_5px_0_#047857] hover:bg-emerald-400 active:translate-y-1 active:shadow-[0_2px_0_#047857]",
};

export function Button({
  type = "button",
  tone = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-2xl border-2 px-4 py-3 text-sm tracking-wide transition duration-150 ease-out",
        "[font-family:'DungGeunMo',monospace]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/80",
        "disabled:cursor-not-allowed disabled:opacity-50",
        toneClasses[tone],
        className,
      ].join(" ")}
      {...props}
    >
      <span className="[font-family:'DungGeunMo',monospace]">
        {children}
      </span>
    </button>
  );
}

