import type { LucideIcon } from "lucide-react";
import { FileSignature, Target, TrendingUp } from "lucide-react";
import { Button } from "react-aria-components";

interface OverviewPillsProps {
  goalSummary: string;
  contractSummary: string;
  marketSummary: string;
  hasGoalRisk: boolean;
  onOpenGoals: () => void;
  onOpenContracts: () => void;
  onOpenMarket: () => void;
}

interface OverviewPillProps {
  icon: LucideIcon;
  label: string;
  summary: string;
  hasAlert?: boolean;
  onPress: () => void;
}

function OverviewPill({
  icon: Icon,
  label,
  summary,
  hasAlert = false,
  onPress,
}: OverviewPillProps) {
  return (
    <Button
      aria-label={`${label} 보기, ${summary}${hasAlert ? ", 확인할 주의 사항 있음" : ""}`}
      onPress={onPress}
      className={({ isFocusVisible, isHovered, isPressed }) =>
        [
          "flex min-h-12 min-w-0 touch-manipulation items-center gap-2 rounded-full bg-white/[0.045] pl-3 pr-3.5 text-left shadow-[var(--shadow-surface)] outline-none",
          "transition-[scale,background-color,box-shadow] duration-[var(--motion-press)] ease-out",
          isHovered ? "bg-white/[0.075] shadow-[var(--shadow-surface-hover)]" : "",
          isPressed ? "scale-[0.96] bg-white/[0.09]" : "scale-100",
          isFocusVisible
            ? "ring-2 ring-action-secondary ring-offset-2 ring-offset-surface-panel"
            : "",
        ].join(" ")
      }
    >
      <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-white/[0.055] text-text-secondary">
        <Icon className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
        {hasAlert ? (
          <span
            className="absolute right-0 top-0 size-2 rounded-full bg-state-warning shadow-[0_0_0_2px_var(--color-surface-panel)]"
            aria-hidden="true"
          />
        ) : null}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block text-[13px] font-semibold text-text-primary">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[11px] tabular-nums text-text-muted">
          {summary}
        </span>
      </span>
    </Button>
  );
}

export function OverviewPills({
  goalSummary,
  contractSummary,
  marketSummary,
  hasGoalRisk,
  onOpenGoals,
  onOpenContracts,
  onOpenMarket,
}: OverviewPillsProps) {
  return (
    <nav
      aria-label="운영 브리핑"
      className="grid shrink-0 grid-cols-3 gap-2 border-b border-white/8 bg-surface-panel/92 px-3 py-2.5 sm:px-4"
    >
      <OverviewPill
        icon={Target}
        label="목표"
        summary={goalSummary}
        hasAlert={hasGoalRisk}
        onPress={onOpenGoals}
      />
      <OverviewPill
        icon={FileSignature}
        label="계약"
        summary={contractSummary}
        onPress={onOpenContracts}
      />
      <OverviewPill
        icon={TrendingUp}
        label="시장"
        summary={marketSummary}
        onPress={onOpenMarket}
      />
    </nav>
  );
}
