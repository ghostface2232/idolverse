import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ className = "", children }: CardProps) {
  return (
    <section
      className={[
        "rounded-[28px] border border-white/10 bg-slate-900/72 p-4 shadow-[0_16px_48px_rgba(15,23,42,0.28)] backdrop-blur-md",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

