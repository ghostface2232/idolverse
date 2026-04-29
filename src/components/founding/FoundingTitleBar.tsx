import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { PixelText } from "@/components/common/PixelText";
import { useFinanceStore } from "@/stores/financeStore";

interface FoundingTitleBarProps {
  title: string;
}

export function FoundingTitleBar({ title }: FoundingTitleBarProps) {
  const money = useFinanceStore((s) => s.money);

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <PixelText as="h2" className="min-w-0 text-2xl text-slate-50">
        {title}
      </PixelText>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <span className="text-xs text-slate-400">잔액</span>
        <MoneyDisplay amount={money} size="lg" />
      </div>
    </div>
  );
}
