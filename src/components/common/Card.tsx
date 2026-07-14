import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
  variant?: "raised" | "panel";
}

export function Card({ className = "", variant = "raised", children }: CardProps) {
  return (
    <section
      className={[
        "border-2 border-slate-600/80 bg-slate-800 p-4 transition duration-150 ease-out",
        variant === "panel"
          ? "rounded-2xl shadow-none"
          : "rounded-[28px] shadow-[0_10px_0_rgba(15,23,42,0.72),0_20px_48px_rgba(15,23,42,0.34)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

