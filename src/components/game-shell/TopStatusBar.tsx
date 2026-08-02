import { Bell } from "lucide-react";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";
import { formatKoreanWon } from "@/utils/formatKoreanWon";

interface TopStatusBarProps {
  year: number;
  week: number;
  seasonLabel: string;
  money: number;
  alertCount: number;
  onOpenFinance: () => void;
  onOpenNotifications: () => void;
}

export function TopStatusBar({
  year,
  week,
  seasonLabel,
  money,
  alertCount,
  onOpenFinance,
  onOpenNotifications,
}: TopStatusBarProps) {
  return (
    <header className="relative z-30 flex min-h-12 shrink-0 items-center justify-between gap-2 bg-surface-shell/92 px-3 shadow-[var(--shadow-chrome)] backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[13px] font-semibold tracking-[-0.01em] tabular-nums text-text-primary sm:text-sm">
          {year}년차 · {week}주차
        </span>
        <span className="rounded-lg bg-action-secondary/10 px-1.5 py-1 text-[11px] font-medium text-action-secondary shadow-[var(--shadow-surface)] sm:px-2 sm:text-xs">
          {seasonLabel} 시즌
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-1.5">
        <button
          type="button"
          className="min-h-11 rounded-full transition-transform active:scale-[0.96]"
          aria-label={`자금 흐름 열기, 현재 ${formatKoreanWon(money)}`}
          onClick={onOpenFinance}
        >
          <MoneyDisplay
            amount={money}
            size="sm"
            className="max-w-[9.5rem] truncate px-2.5 sm:max-w-none sm:px-3"
          />
        </button>
        {/* 히트 영역은 44px을 유지하되, 시각 칩은 자금 pill과 비슷한
            높이(size-8)로 줄여 상단바 요소들과 체급을 맞춘다. 자금 버튼과
            같은 네이티브 버튼 패턴을 쓴다(Button ghost는 자체 배경·그림자가
            있어 칩이 커 보인다). */}
        <button
          type="button"
          className="grid min-h-11 min-w-11 shrink-0 place-items-center transition-transform active:scale-[0.96]"
          aria-label={`알림 열기${alertCount > 0 ? `, ${alertCount}개` : ""}`}
          onClick={onOpenNotifications}
        >
          <span className="relative grid size-8 place-items-center rounded-full bg-white/[0.06] shadow-[var(--shadow-surface)]">
            <Bell
              className="size-4 shrink-0 text-slate-100"
              strokeWidth={2.2}
              aria-hidden="true"
            />
            {alertCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-action-primary px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--color-surface-shell)]">
                {alertCount > 99 ? "99+" : alertCount}
              </span>
            ) : null}
          </span>
        </button>
      </div>
    </header>
  );
}
