import {
  Bell,
  Building,
  ChevronRight,
  Landmark,
  Users,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { SectionHeader } from "@/components/common/SectionHeader";
import { INVESTOR_PROFILES } from "@/data/investors";
import { useFinanceStore } from "@/stores/financeStore";
import { useGameStore } from "@/stores/gameStore";
import { formatKoreanWon } from "@/utils/formatKoreanWon";

interface MoreOverviewProps {
  onOpenNotifications: () => void;
  onOpenFinance: () => void;
  onOpenStaff: () => void;
  onOpenFacilities: () => void;
}

export function MoreOverview({
  onOpenNotifications,
  onOpenFinance,
  onOpenStaff,
  onOpenFacilities,
}: MoreOverviewProps) {
  const companyName = useGameStore((state) => state.companyName);
  const investorType = useGameStore((state) => state.investorType);
  const money = useFinanceStore((state) => state.money);
  const weeklyFixedTotal = useFinanceStore((state) => state.weeklyFixedTotal);
  const investor = INVESTOR_PROFILES[investorType];
  const runwayWeeks =
    weeklyFixedTotal > 0 ? Math.max(0, Math.floor(money / weeklyFixedTotal)) : null;

  return (
    <section className="h-full overflow-y-auto p-4 sm:p-5">
      <div className="mx-auto max-w-xl">
      <SectionHeader
        eyebrow="회사 경영"
        title="경영"
        description="스태프와 시설, 회사의 지출 구조를 관리합니다."
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
        <button
          type="button"
          className="rounded-3xl bg-surface-panel p-4 text-left shadow-[var(--shadow-surface)] transition-transform active:scale-[0.96]"
          onClick={onOpenFinance}
        >
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <WalletCards className="size-4 text-action-secondary" aria-hidden="true" />
            재무 요약
          </div>
          <dl className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] text-text-muted">보유 자금</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-text-primary">
                {formatKoreanWon(money, { symbol: true })}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-text-muted">주간 고정비</dt>
              <dd className="mt-0.5 truncate text-sm font-semibold tabular-nums text-text-primary">
                {formatKoreanWon(weeklyFixedTotal, { symbol: true })}
              </dd>
            </div>
            <div className="col-span-2 rounded-xl bg-surface-shell/55 px-3 py-2">
              <dt className="text-[11px] text-text-muted">현재 자금 여유</dt>
              <dd className="mt-0.5 text-sm font-semibold text-text-primary">
                {runwayWeeks === null
                  ? "고정비 없음"
                  : runwayWeeks > 52
                    ? "1년 이상 안정"
                    : `${runwayWeeks}주 유지 가능`}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs font-semibold text-cyan-200">
            자금 흐름 자세히 보기
          </p>
        </button>
      </div>
      <h2 className="mb-2 mt-5 text-sm font-semibold text-text-primary">이번 주 경영 업무</h2>
      <div className="grid gap-2.5">
        <Button
          className="w-full !justify-start gap-3 !px-3.5 !py-3 text-left"
          tone="secondary"
          onPress={onOpenStaff}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-200">
            <Users className="size-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">스태프 관리</span>
            <span className="mt-0.5 block text-xs font-normal text-text-muted">
              채용과 교육 계획을 조정합니다.
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
        </Button>
        <Button
          className="w-full !justify-start gap-3 !px-3.5 !py-3 text-left"
          tone="secondary"
          onPress={onOpenFacilities}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-pink-400/10 text-pink-200">
            <Building className="size-4.5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">시설 투자</span>
            <span className="mt-0.5 block text-xs font-normal text-text-muted">
              연습실과 숙소 환경을 개선합니다.
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
        </Button>
      </div>
      <Button
        className="mt-2.5 w-full !justify-start gap-3 !px-3.5 !py-3 text-left"
        tone="ghost"
        onPress={onOpenNotifications}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-text-secondary">
          <Bell className="size-4.5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">소식 기록</span>
          <span className="mt-0.5 block text-xs font-normal text-text-muted">
            지난 알림과 업계 소식을 다시 봅니다.
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
      </Button>
      </div>
    </section>
  );
}
