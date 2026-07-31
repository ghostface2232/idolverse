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

type Tone = NonNullable<ButtonProps["tone"]>;

const toneClasses: Record<Tone, string> = {
  primary: "border-action-primary bg-action-primary text-white hover:bg-pink-400",
  secondary: "border-[#164267] bg-[#183d5d] text-slate-50 hover:bg-[#1c4568]",
  ghost:
    "border-transparent bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]",
  danger: "border-state-danger bg-state-danger text-slate-950 hover:bg-rose-300",
  success:
    "border-state-success bg-state-success text-slate-950 hover:bg-emerald-300",
};

/* 받침(0_4px_0) 그림자. 눌리면 받침이 줄어드는 만큼 버튼이 내려앉는다. */
const toneShadow: Record<Tone, string> = {
  primary:
    "translate-y-0 shadow-[0_4px_0_#9d174d,0_12px_26px_rgba(236,72,153,0.22)]",
  secondary: "translate-y-0 shadow-[0_4px_0_#0d2947,var(--shadow-surface)]",
  ghost: "translate-y-0 shadow-[0_4px_0_#0b1220,var(--shadow-surface)]",
  danger: "translate-y-0 shadow-[0_4px_0_#9f1239]",
  success: "translate-y-0 shadow-[0_4px_0_#047857]",
};

const toneShadowPressed: Record<Tone, string> = {
  primary:
    "translate-y-[3px] scale-[0.96] shadow-[0_1px_0_#9d174d,0_4px_12px_rgba(236,72,153,0.16)]",
  secondary:
    "translate-y-[3px] scale-[0.96] shadow-[0_1px_0_#0d2947,var(--shadow-surface)]",
  ghost:
    "translate-y-[3px] scale-[0.96] shadow-[0_1px_0_#0b1220,var(--shadow-surface)]",
  danger: "translate-y-[3px] scale-[0.96] shadow-[0_1px_0_#9f1239]",
  success: "translate-y-[3px] scale-[0.96] shadow-[0_1px_0_#047857]",
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
          "transition-[translate,scale,background-color,color,box-shadow,opacity] duration-[var(--motion-press)] ease-out",
          isFocusVisible ? "outline-none ring-2 ring-action-secondary ring-offset-2 ring-offset-surface-shell" : "outline-none",
          isDisabled ? "cursor-not-allowed opacity-45" : "",
          toneClasses[tone],
          !isStatic && isPressed ? toneShadowPressed[tone] : toneShadow[tone],
          className,
        ].join(" ")
      }
      {...props}
    >
      {children}
    </AriaButton>
  );
}
