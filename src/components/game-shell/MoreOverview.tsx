import { Bell, Building, Landmark, Users, WalletCards } from "lucide-react";
import { Button } from "@/components/common/Button";
import { SectionHeader } from "@/components/common/SectionHeader";
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
    <section className="h-full overflow-y-auto p-4 sm:p-5">
      <div className="mx-auto max-w-xl">
      <SectionHeader
        title="운영"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-3xl bg-surface-panel p-4 shadow-[var(--shadow-surface)]">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Building className="size-4 text-action-secondary" aria-hidden="true" />
            우리 회사
          </div>
          <p className="mt-2 text-base font-semibold text-text-primary">{companyName}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
            <Landmark className="size-3.5" aria-hidden="true" />
            {investor.label}와 함께 운영 중
          </p>
        </article>
        <article className="rounded-3xl bg-surface-panel p-4 shadow-[var(--shadow-surface)]">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <WalletCards className="size-4 text-action-secondary" aria-hidden="true" />
            재무 요약
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] text-text-muted">보유 자금</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-text-primary">
                ₩{money.toLocaleString("ko-KR")}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-text-muted">주간 고정비</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-text-primary">
                ₩{weeklyFixedTotal.toLocaleString("ko-KR")}
              </dd>
            </div>
          </dl>
        </article>
      </div>
      <h2 className="mb-2 mt-5 text-sm font-semibold text-text-primary">운영 업무</h2>
      <div className="grid grid-cols-2 gap-3">
        <Button className="w-full gap-2" tone="secondary" onPress={onOpenStaff}>
          <Users className="size-4" aria-hidden="true" /> 인사 관리
        </Button>
        <Button className="w-full gap-2" tone="secondary" onPress={onOpenFacilities}>
          <Building className="size-4" aria-hidden="true" /> 시설 투자
        </Button>
      </div>
      <Button className="mt-3 w-full gap-2" tone="secondary" onPress={onOpenNotifications}>
        <Bell className="size-4" aria-hidden="true" /> 알림
      </Button>
      </div>
    </section>
  );
}
