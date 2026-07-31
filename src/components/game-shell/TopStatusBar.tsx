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
    <header className="relative z-30 flex min-h-12 shrink-0 items-center justify-between gap-2 bg-surface-shell/92 px-3 shadow-[var(--shadow-chrome)] backdrop-blur-xl sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-[13px] font-semibold tracking-[-0.01em] tabular-nums text-text-primary sm:text-sm">
          {year}년차 · {week}주
        </span>
        <span className="rounded-lg bg-action-secondary/10 px-1.5 py-1 text-[11px] font-medium text-action-secondary shadow-[var(--shadow-surface)] sm:px-2 sm:text-xs">
          {seasonLabel} 시즌
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
          static
          className="relative size-8 !min-h-8 !min-w-8 shrink-0 rounded-xl bg-white/[0.06] !px-0 !py-0 text-text-primary shadow-[var(--shadow-surface)] transition-transform active:scale-[0.96] before:absolute before:-inset-1.5 before:content-['']"
          aria-label={`알림 열기${alertCount > 0 ? `, ${alertCount}개` : ""}`}
          onPress={onOpenNotifications}
        >
          <Bell
            className="size-5 shrink-0 text-slate-100"
            strokeWidth={2.2}
            aria-hidden="true"
          />
          {alertCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-3.5 min-w-3.5 items-center justify-center rounded-full bg-action-primary px-1 text-[8px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--color-surface-shell)]">
              {alertCount > 99 ? "99+" : alertCount}
            </span>
          ) : null}
        </Button>
      </div>
    </header>
  );
}
