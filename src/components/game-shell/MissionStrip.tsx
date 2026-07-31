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
 * 각 칩은 타이틀과 핵심 정보 하나만 보여주고, 상세는 탭해서 브리핑 모달로 본다.
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
      {/* 오른쪽 엣지 마스크: 카드가 잘려 보이며 "더 있음"을 암시한다. */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 py-2 scroll-px-4 [mask-image:linear-gradient(90deg,black_calc(100%-28px),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* 1. 현재 프로젝트 — 이번 주 결정의 1차 맥락 */}
        <MissionChip
          icon={Target}
          accent="text-cyan-300"
          label={projectGoal ? "현재 프로젝트" : "다음 목표"}
          value={
            projectGoal ? (projectGoal.deadlineLabel ?? "진행 중") : "준비 중"
          }
          hasAlert={hasGoalRisk}
          onPress={onOpenGoals}
        />

        {/* 2. 투자사 약속 — 로고가 있는 기대치 */}
        {investorGoal ? (
          <MissionChip
            logoSrc={
              investorType ? assetUrl(INVESTOR_LOGOS[investorType]) : undefined
            }
            icon={Target}
            accent="text-indigo-300"
            label="투자사 약속"
            value={investorGoal.deadlineLabel ?? "진행 중"}
            onPress={onOpenGoals}
          />
        ) : null}

        {/* 3. 차트 현황 — 경쟁의 현재 위치 */}
        <MissionChip
          icon={TrendingUp}
          accent="text-teal-300"
          label="차트 최고"
          value={bestChartRank !== null ? `${bestChartRank}위` : "진입 전"}
          onPress={onOpenMarket}
        />

        {/* 4. 라이벌 일정 — 시장의 다음 위협 */}
        {nextRivalComeback ? (
          <MissionChip
            badge={<GroupBadge name={nextRivalComeback.name} size="sm" />}
            icon={TrendingUp}
            accent="text-purple-300"
            label="라이벌 컴백"
            value={
              nextRivalComeback.weeksUntil <= 0
                ? "이번 주"
                : `D-${nextRivalComeback.weeksUntil}주`
            }
            onPress={onOpenMarket}
          />
        ) : null}

        {/* 5. 신인상 창 — 있는 동안만 노출되는 캠페인 시계 */}
        {rookieGoal ? (
          <MissionChip
            icon={Medal}
            accent="text-amber-300"
            label="신인상 도전"
            value={rookieGoal.deadlineLabel ?? "도전 중"}
            onPress={onOpenGoals}
          />
        ) : null}

        {/* 6. 전속계약 시계 */}
        {contractDeadlineLabel ? (
          <MissionChip
            icon={CalendarClock}
            accent="text-slate-300"
            label="전속계약"
            value={contractDeadlineLabel}
            onPress={onOpenContracts}
          />
        ) : null}
      </div>
    </nav>
  );
}

interface MissionChipProps {
  icon: LucideIcon;
  accent: string;
  label: string;
  value: string;
  hasAlert?: boolean;
  logoSrc?: string;
  badge?: React.ReactNode;
  onPress: () => void;
}

/** 타이틀 + 핵심 정보 하나만 담는 컴팩트 칩. 상세는 탭해서 본다. */
function MissionChip({
  icon: Icon,
  accent,
  label,
  value,
  hasAlert = false,
  logoSrc,
  badge,
  onPress,
}: MissionChipProps) {
  return (
    <Button
      aria-label={`${label}: ${value}${hasAlert ? ", 확인할 주의 사항 있음" : ""}`}
      onPress={onPress}
      className={({ isFocusVisible, isHovered, isPressed }) =>
        [
          "flex min-h-11 shrink-0 snap-start touch-manipulation items-center gap-2 rounded-xl bg-white/[0.045] px-3 shadow-[var(--shadow-surface)] outline-none",
          "transition-[scale,background-color,box-shadow] duration-[var(--motion-press)] ease-out",
          isHovered ? "bg-white/[0.075] shadow-[var(--shadow-surface-hover)]" : "",
          isPressed ? "scale-[0.97] bg-white/[0.09]" : "scale-100",
          isFocusVisible
            ? "ring-2 ring-action-secondary ring-offset-2 ring-offset-surface-panel"
            : "",
        ].join(" ")
      }
    >
      {badge ??
        (logoSrc ? (
          <img
            src={logoSrc}
            alt=""
            className="size-4.5 shrink-0 rounded-[5px] object-cover"
          />
        ) : (
          <span
            className={`relative grid size-4.5 shrink-0 place-items-center ${accent}`}
          >
            <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
            {hasAlert ? (
              <span
                className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-state-warning"
                aria-hidden="true"
              />
            ) : null}
          </span>
        ))}
      <span className="whitespace-nowrap text-[11px] font-medium text-text-secondary">
        {label}
      </span>
      <span className="whitespace-nowrap text-xs font-bold tabular-nums text-text-primary">
        {value}
      </span>
    </Button>
  );
}
