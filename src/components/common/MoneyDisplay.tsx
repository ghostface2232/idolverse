interface MoneyDisplayProps {
  amount: number;
  className?: string;
}

export function MoneyDisplay({ amount, className = "" }: MoneyDisplayProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/12 px-3 py-1 text-sm font-black text-emerald-200",
        className,
      ].join(" ")}
    >
      <span aria-hidden="true">₩</span>
      {new Intl.NumberFormat("ko-KR").format(amount)}
    </span>
  );
}
