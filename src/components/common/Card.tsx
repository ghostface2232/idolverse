import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
  variant?: "raised" | "panel";
}

export function Card({ className = "", variant = "raised", children }: CardProps) {
  return (
    <section
      className={[
        "bg-surface-panel p-4 transition-[box-shadow,background-color] duration-[var(--motion-state)] ease-out",
        variant === "panel"
          ? "rounded-2xl shadow-[var(--shadow-surface)]"
          : "rounded-3xl shadow-[var(--shadow-raised)]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

