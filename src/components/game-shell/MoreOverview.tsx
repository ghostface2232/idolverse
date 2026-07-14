import { Bell, Building, Landmark, WalletCards } from "lucide-react";
import { Button } from "@/components/common/Button";
import { INVESTOR_PROFILES } from "@/data/investors";
import { useFinanceStore } from "@/stores/financeStore";
import { useGameStore } from "@/stores/gameStore";

interface MoreOverviewProps {
  onOpenNotifications: () => void;
}

export function MoreOverview({ onOpenNotifications }: MoreOverviewProps) {
  const companyName = useGameStore((state) => state.companyName);
  const investorType = useGameStore((state) => state.investorType);
  const money = useFinanceStore((state) => state.money);
  const weeklyFixedTotal = useFinanceStore((state) => state.weeklyFixedTotal);
  const investor = INVESTOR_PROFILES[investorType];

  return (
    <section className="h-full overflow-y-auto p-4">
      <header className="mb-4">
        <p className="text-xs font-semibold text-action-secondary">COMPANY</p>
        <h1 className="mt-1 text-xl font-semibold text-text-primary">더보기</h1>
        <p className="mt-1 text-sm text-text-muted">회사 운영과 기록을 확인합니다.</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoCard icon={Building} label="회사" value={companyName} />
        <InfoCard icon={Landmark} label="투자자" value={investor.label} />
        <InfoCard icon={WalletCards} label="보유 자금" value={`₩${money.toLocaleString("ko-KR")}`} />
        <InfoCard
          icon={WalletCards}
          label="주간 고정비"
          value={`₩${weeklyFixedTotal.toLocaleString("ko-KR")}`}
        />
      </div>
      <Button className="mt-4 w-full gap-2" tone="secondary" onPress={onOpenNotifications}>
        <Bell className="size-4" aria-hidden="true" /> 알림 센터 열기
      </Button>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-3xl bg-surface-panel p-4 shadow-[var(--shadow-surface)]">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Icon className="size-4 text-action-secondary" aria-hidden="true" /> {label}
      </div>
      <p className="mt-2 break-words text-sm font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </article>
  );
}
