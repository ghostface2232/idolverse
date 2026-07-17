import { Bell, Building, Landmark, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/common/Button";
import { INVESTOR_PROFILES } from "@/data/investors";
import { useFinanceStore } from "@/stores/financeStore";
import { useGameStore } from "@/stores/gameStore";

interface MoreOverviewProps {
  onOpenNotifications: () => void;
  onOpenStaff: () => void;
  onOpenFacilities: () => void;
}

export function MoreOverview({
  onOpenNotifications,
  onOpenStaff,
  onOpenFacilities,
}: MoreOverviewProps) {
  const companyName = useGameStore((state) => state.companyName);
  const investorType = useGameStore((state) => state.investorType);
  const money = useFinanceStore((state) => state.money);
  const weeklyFixedTotal = useFinanceStore((state) => state.weeklyFixedTotal);
  const investor = INVESTOR_PROFILES[investorType];

  return (
    <section className="h-full overflow-y-auto p-4">
      <header className="mb-4">
        <p className="text-xs font-semibold text-action-secondary">회사</p>
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
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button className="w-full gap-2" tone="secondary" onPress={onOpenStaff}>
          <Users className="size-4" aria-hidden="true" /> 인사 관리
        </Button>
        <Button className="w-full gap-2" tone="secondary" onPress={onOpenFacilities}>
          <Building className="size-4" aria-hidden="true" /> 시설 투자
        </Button>
      </div>
      <Button className="mt-3 w-full gap-2" tone="secondary" onPress={onOpenNotifications}>
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
