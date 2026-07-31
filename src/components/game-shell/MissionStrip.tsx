import type { LucideIcon } from "lucide-react";
import { CalendarClock, Medal, Target, TrendingUp } from "lucide-react";
import { Button } from "react-aria-components";
import { GroupBadge } from "@/components/visual/GroupBadge";
import type { GoalLaneItem } from "@/systems/progressionSystem";
import type { InvestorType } from "@/types/game";
import { assetUrl } from "@/utils/assets";

/** 투자사 유형별 로고. NewGame의 소개 화면과 같은 에셋을 쓴다. */
const INVESTOR_LOGOS: Record<InvestorType, string> = {
  it: "/investors/nextbeat.png",
  entertainment: "/investors/crownmusic-ent.png",
  vc: "/investors/summit-capital.png",
  cosmetic: "/investors/lumiere-beauty.png",
  fashion: "/investors/maison-group.png",
};

interface MissionStripProps {
  projectGoal: GoalLaneItem | null;
  investorGoal: GoalLaneItem | null;
  investorType: InvestorType | null;
  rookieGoal: GoalLaneItem | null;
  contractDeadlineLabel: string | null;
  bestChartRank: number | null;
  nextRivalComeback: { name: string; weeksUntil: number } | null;
  hasGoalRisk: boolean;
  onOpenGoals: () => void;
  onOpenContracts: () => void;
  onOpenMarket: () => void;
}

/**
 * 미션 스트립 — "지금 무엇을 왜 하는가"를 화면 상단에 상시 노출한다.
 * 프로젝트 D-day, 투자사 약속, 차트 위치, 라이벌 일정, 계약 시계가
 * 가로 스크롤 카드로 늘어서서 매주의 결정에 맥락을 붙인다.
 */
export function MissionStrip({
  projectGoal,
  investorGoal,
  investorType,
  rookieGoal,
  contractDeadlineLabel,
  bestChartRank,
  nextRivalComeback,
  hasGoalRisk,
  onOpenGoals,
  onOpenContracts,
  onOpenMarket,
}: MissionStripProps) {
  return (
    <nav
      aria-label="운영 목표 브리핑"
      className="shrink-0 border-b border-white/8 bg-surface-panel/92"
    >
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 py-2.5 [scrollbar-width:none] sm:px-4 [&::-webkit-scrollbar]:hidden">
        {/* 1. 현재 프로젝트 — 이번 주 결정의 1차 맥락 */}
        <MissionCard
          icon={Target}
          accent="text-cyan-300"
          label={projectGoal ? "현재 프로젝트" : "다음 목표"}
          title={projectGoal?.title ?? "다음 이정표를 준비 중"}
          deadline={projectGoal?.deadlineLabel}
          progressRatio={projectGoal?.progressRatio}
          hasAlert={hasGoalRisk}
          onPress={onOpenGoals}
        />

        {/* 2. 투자사 약속 — 로고가 있는 기대치 */}
        {investorGoal ? (
          <MissionCard
            logoSrc={
              investorType ? assetUrl(INVESTOR_LOGOS[investorType]) : undefined
            }
            icon={Target}
            accent="text-indigo-300"
            label="투자사 약속"
            title={investorGoal.title}
            deadline={investorGoal.deadlineLabel}
            onPress={onOpenGoals}
          />
        ) : null}

        {/* 3. 차트 현황 — 경쟁의 현재 위치 */}
        <MissionCard
          icon={TrendingUp}
          accent="text-teal-300"
          label="차트 최고 순위"
          title={
            bestChartRank !== null
              ? `${bestChartRank}위`
              : "차트 진입 전"
          }
          titleEmphasis={bestChartRank !== null}
          onPress={onOpenMarket}
        />

        {/* 4. 라이벌 일정 — 시장의 다음 위협 */}
        {nextRivalComeback ? (
          <MissionCard
            badge={<GroupBadge name={nextRivalComeback.name} size="sm" />}
            icon={TrendingUp}
            accent="text-purple-300"
            label="라이벌 컴백"
            title={nextRivalComeback.name}
            deadline={
              nextRivalComeback.weeksUntil <= 0
                ? "이번 주"
                : `D-${nextRivalComeback.weeksUntil}주`
            }
            onPress={onOpenMarket}
          />
        ) : null}

        {/* 5. 신인상 창 — 있는 동안만 노출되는 캠페인 시계 */}
        {rookieGoal ? (
          <MissionCard
            icon={Medal}
            accent="text-amber-300"
            label="신인상 도전"
            title="자격이 유지되는 동안 승부를 걸어야 합니다"
            deadline={rookieGoal.deadlineLabel}
            onPress={onOpenGoals}
          />
        ) : null}

        {/* 6. 전속계약 시계 */}
        {contractDeadlineLabel ? (
          <MissionCard
            icon={CalendarClock}
            accent="text-slate-300"
            label="전속계약 만료"
            title="멤버들과의 약속"
            deadline={contractDeadlineLabel}
            onPress={onOpenContracts}
          />
        ) : null}
      </div>
    </nav>
  );
}

interface MissionCardProps {
  icon: LucideIcon;
  accent: string;
  label: string;
  title: string;
  titleEmphasis?: boolean;
  deadline?: string;
  progressRatio?: number;
  hasAlert?: boolean;
  logoSrc?: string;
  badge?: React.ReactNode;
  onPress: () => void;
}

function MissionCard({
  icon: Icon,
  accent,
  label,
  title,
  titleEmphasis = false,
  deadline,
  progressRatio,
  hasAlert = false,
  logoSrc,
  badge,
  onPress,
}: MissionCardProps) {
  return (
    <Button
      aria-label={`${label}: ${title}${deadline ? `, ${deadline}` : ""}${hasAlert ? ", 확인할 주의 사항 있음" : ""}`}
      onPress={onPress}
      className={({ isFocusVisible, isHovered, isPressed }) =>
        [
          "flex min-h-[62px] w-[180px] shrink-0 snap-start touch-manipulation flex-col justify-between rounded-2xl bg-white/[0.045] px-3 py-2 text-left shadow-[var(--shadow-surface)] outline-none",
          "transition-[scale,background-color,box-shadow] duration-[var(--motion-press)] ease-out",
          isHovered ? "bg-white/[0.075] shadow-[var(--shadow-surface-hover)]" : "",
          isPressed ? "scale-[0.97] bg-white/[0.09]" : "scale-100",
          isFocusVisible
            ? "ring-2 ring-action-secondary ring-offset-2 ring-offset-surface-panel"
            : "",
        ].join(" ")
      }
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className={`flex min-w-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${accent}`}>
          {badge ??
            (logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="size-4 shrink-0 rounded-[4px] object-cover"
              />
            ) : (
              <span className="relative grid size-4 shrink-0 place-items-center">
                <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
                {hasAlert ? (
                  <span
                    className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-state-warning"
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            ))}
          <span className="truncate">{label}</span>
        </span>
        {deadline ? (
          <span className="shrink-0 rounded-md bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-text-secondary">
            {deadline}
          </span>
        ) : null}
      </span>

      <span
        className={[
          "mt-1 block w-full truncate",
          titleEmphasis
            ? "text-lg font-bold leading-6 text-text-primary"
            : "text-xs font-semibold leading-5 text-text-primary",
        ].join(" ")}
      >
        {title}
      </span>

      {progressRatio !== undefined ? (
        <span
          aria-hidden="true"
          className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-white/[0.08]"
        >
          <span
            className="block h-full rounded-full bg-action-secondary"
            style={{
              width: `${Math.round(Math.min(1, Math.max(0, progressRatio)) * 100)}%`,
            }}
          />
        </span>
      ) : null}
    </Button>
  );
}
