import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: "primary" | "secondary" | "ghost";
}

const toneClasses: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary:
    "bg-brand-pink text-white shadow-[0_12px_30px_rgba(236,72,153,0.28)] hover:bg-pink-400",
  secondary:
    "bg-slate-800 text-slate-100 ring-1 ring-white/10 hover:bg-slate-700",
  ghost:
    "bg-transparent text-slate-200 ring-1 ring-white/12 hover:bg-white/6",
};

export function Button({
  type = "button",
  tone = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/80",
        "disabled:cursor-not-allowed disabled:opacity-50",
        toneClasses[tone],
        className,
      ].join(" ")}
      {...props}
    />
  );
}

