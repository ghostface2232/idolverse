interface MoneyDisplayProps {
  amount: number;
  size?: "sm" | "lg" | "2xl";
  className?: string;
}

const sizeClasses: Record<NonNullable<MoneyDisplayProps["size"]>, string> = {
  sm: "text-sm px-3 py-1",
  lg: "text-lg px-4 py-1.5",
  "2xl": "text-2xl px-5 py-2",
};

export function MoneyDisplay({ amount, size = "sm", className = "" }: MoneyDisplayProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/12 text-emerald-200",
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      <span className="font-semibold tracking-[-0.01em] tabular-nums">
        <span aria-hidden="true">₩</span>
        {new Intl.NumberFormat("ko-KR").format(amount)}
      </span>
    </span>
  );
}
