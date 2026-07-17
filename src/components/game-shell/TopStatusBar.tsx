import { Bell } from "lucide-react";
import { Button } from "@/components/common/Button";
import { MoneyDisplay } from "@/components/common/MoneyDisplay";

interface TopStatusBarProps {
  year: number;
  week: number;
  seasonLabel: string;
  money: number;
  alertCount: number;
  onOpenNotifications: () => void;
}

export function TopStatusBar({
  year,
  week,
  seasonLabel,
  money,
  alertCount,
  onOpenNotifications,
}: TopStatusBarProps) {
  return (
    <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-white/8 bg-surface-shell/95 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-sm font-semibold tracking-[-0.01em] tabular-nums text-text-primary">
          {year}년차 {week}주차
        </span>
        <span className="rounded-lg bg-action-secondary/10 px-2 py-1 text-xs font-medium text-action-secondary shadow-[var(--shadow-surface)]">
          {seasonLabel}
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-1.5">
        <MoneyDisplay
          amount={money}
          size="sm"
          className="max-w-[9.5rem] truncate px-2.5 sm:max-w-none sm:px-3"
        />
        <Button
          tone="ghost"
          className="relative min-w-11 shrink-0 px-0"
          aria-label={`알림 열기${alertCount > 0 ? `, ${alertCount}개` : ""}`}
          onPress={onOpenNotifications}
        >
          <Bell className="size-5" strokeWidth={1.8} aria-hidden="true" />
          {alertCount > 0 ? (
            <span className="absolute right-1 top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-action-primary px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--color-surface-shell)]">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          ) : null}
        </Button>
      </div>
    </header>
  );
}
