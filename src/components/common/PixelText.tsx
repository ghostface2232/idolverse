import type { HTMLAttributes } from "react";

interface PixelTextProps extends HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "p" | "h1" | "h2" | "h3";
}

export function PixelText({
  as: Component = "span",
  className = "",
  ...props
}: PixelTextProps) {
  return (
    <Component
      className={[
        "uppercase tracking-[0.08em] [font-family:'DungGeunMo',monospace] [text-shadow:2px_2px_0_#0f172a,4px_4px_0_rgba(6,182,212,0.34)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
