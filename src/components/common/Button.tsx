import {
  Button as AriaButton,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

interface ButtonProps extends Omit<AriaButtonProps, "className"> {
  tone?: "primary" | "secondary" | "ghost" | "danger" | "success";
  className?: string;
  static?: boolean;
  disabled?: boolean;
}

const toneClasses: Record<NonNullable<ButtonProps["tone"]>, string> = {
  primary:
    "border-action-primary bg-action-primary text-white shadow-[0_4px_0_#9d174d,0_12px_26px_rgba(236,72,153,0.22)] hover:bg-pink-400",
  secondary:
    "border-action-secondary/70 bg-action-secondary/12 text-cyan-100 shadow-[var(--shadow-surface)] hover:bg-action-secondary/20",
  ghost:
    "border-transparent bg-white/[0.04] text-text-secondary shadow-[var(--shadow-surface)] hover:bg-white/[0.08]",
  danger:
    "border-state-danger bg-state-danger text-slate-950 shadow-[0_4px_0_#9f1239] hover:bg-rose-300",
  success:
    "border-state-success bg-state-success text-slate-950 shadow-[0_4px_0_#047857] hover:bg-emerald-300",
};

export function Button({
  type = "button",
  tone = "primary",
  className = "",
  static: isStatic = false,
  disabled,
  isDisabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <AriaButton
      type={type}
      isDisabled={isDisabled ?? disabled}
      className={({ isDisabled, isFocusVisible, isPressed }) =>
        [
          "inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold tracking-[-0.01em]",
          "transition-[scale,background-color,color,box-shadow,opacity] duration-[var(--motion-press)] ease-out",
          isFocusVisible ? "outline-none ring-2 ring-action-secondary ring-offset-2 ring-offset-surface-shell" : "outline-none",
          isDisabled ? "cursor-not-allowed opacity-45" : "",
          !isStatic && isPressed ? "scale-[0.96]" : "scale-100",
          toneClasses[tone],
          className,
        ].join(" ")
      }
      {...props}
    >
      {children}
    </AriaButton>
  );
}

