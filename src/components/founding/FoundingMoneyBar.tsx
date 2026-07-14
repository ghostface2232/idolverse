import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { useFinanceStore } from "@/stores/financeStore";

export function FoundingMoneyBar() {
  const money = useFinanceStore((s) => s.money);
  const weeklyFixedTotal = useFinanceStore((s) => s.weeklyFixedTotal);

  return (
    <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-600/60 bg-slate-800 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">잔액</span>
        <MoneyDisplay amount={money} size="sm" />
      </div>
      {weeklyFixedTotal > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">주간 고정비</span>
          <span className="text-xs text-red-300">
            ₩{new Intl.NumberFormat("ko-KR").format(weeklyFixedTotal)}
          </span>
        </div>
      )}
    </div>
  );
}
