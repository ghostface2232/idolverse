import type { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ className = "", children }: CardProps) {
  return (
    <section
      className={[
        "rounded-[28px] border-2 border-slate-600/80 bg-slate-800/82 p-4 shadow-[0_10px_0_rgba(15,23,42,0.72),0_20px_48px_rgba(15,23,42,0.34)] backdrop-blur-md transition duration-150 ease-out",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

