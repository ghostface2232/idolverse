import { useState } from "react";
import {
  CalendarCheck2,
  ChevronDown,
  HeartPulse,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { GamePhase, WeeklyDecisionTrigger } from "@/types/game";
import { PHASE_LABELS } from "@/data/labels";

interface HomeBriefingProps {
  groupName: string;
  phase: GamePhase;
  projectTitle?: string;
  projectDeadline?: string;
  averageCondition: number;
  attentionCount: number;
  totalDecisions: number;
  remainingDecisions: number;
  riskSeverity?: WeeklyDecisionTrigger["severity"];
  onOpenMembers: () => void;
  onOpenGoals: () => void;
  onOpenWeek: () => void;
}

export function HomeBriefing({
  groupName,
  phase,
  projectTitle,
  projectDeadline,
  averageCondition,
  attentionCount,
  totalDecisions,
  remainingDecisions,
  riskSeverity,
  onOpenMembers,
  onOpenGoals,
  onOpenWeek,
}: HomeBriefingProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = (callback: () => void) => {
    setIsExpanded(false);
    callback();
  };
  const decisionLabel =
    totalDecisions === 0
      ? "매니저 일정 확인 완료"
      : remainingDecisions > 0
        ? `안건 ${remainingDecisions}개 결정 필요`
        : "이번 주 계획 확정 준비";
  const hasCriticalRisk = riskSeverity === "critical";

  return (
    <aside
      aria-label="홈 브리핑"
      className="relative z-20 shrink-0 bg-slate-950/94 px-3 py-2 shadow-[0_10px_28px_rgba(2,6,23,0.32)]"
    >
      <div className="flex min-h-12 items-center gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-cyan-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            실시간 브리핑
            <span className="font-medium tracking-normal text-text-muted">
              · {PHASE_LABELS[phase]}
            </span>
          </p>
          <h1 className="mt-0.5 truncate text-base font-bold tracking-[-0.02em] text-text-primary">
            {groupName}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => navigate(onOpenWeek)}
          aria-label={`${decisionLabel}, 이번 주 안건 열기`}
          className={[
            "ml-auto min-h-11 shrink-0 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold tabular-nums transition-transform active:scale-[0.96]",
            hasCriticalRisk
              ? "bg-state-danger/15 text-rose-200"
              : remainingDecisions > 0
                ? "bg-action-primary/15 text-pink-100"
                : "bg-state-success/12 text-emerald-200",
          ].join(" ")}
        >
          {decisionLabel}
        </button>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls="home-briefing-details"
          aria-label={isExpanded ? "브리핑 접기" : "브리핑 자세히 보기"}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-text-secondary transition-[scale,background-color,color] duration-[var(--motion-press)] hover:bg-white/[0.1] hover:text-text-primary active:scale-[0.96]"
          onClick={() => setIsExpanded((value) => !value)}
        >
          <ChevronDown
            className={[
              "size-4 transition-transform duration-[var(--motion-state)] ease-out",
              isExpanded ? "rotate-180" : "",
            ].join(" ")}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        id="home-briefing-details"
        className={[
          "absolute left-3 right-3 top-full -mt-1 origin-top rounded-2xl bg-slate-950/96 p-2 shadow-[0_18px_40px_rgba(2,6,23,0.55)] transition-[translate,scale,opacity,visibility] duration-[var(--motion-state)] ease-out",
          isExpanded
            ? "visible translate-y-0 scale-100 opacity-100"
            : "invisible pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
        ].join(" ")}
        aria-hidden={!isExpanded}
      >
        <div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate(onOpenMembers)}
              className="min-h-14 rounded-2xl bg-white/[0.055] px-3 py-2.5 text-left transition-transform active:scale-[0.97]"
            >
              <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <HeartPulse className="size-3.5 text-cyan-300" aria-hidden="true" />
                팀 컨디션
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                평균 <span className="tabular-nums">{averageCondition}</span>
              </p>
            </button>
            <button
              type="button"
              onClick={() => navigate(onOpenMembers)}
              className="min-h-14 rounded-2xl bg-white/[0.055] px-3 py-2.5 text-left transition-transform active:scale-[0.97]"
            >
              <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <ShieldAlert
                  className={[
                    "size-3.5",
                    attentionCount > 0 ? "text-amber-300" : "text-emerald-300",
                  ].join(" ")}
                  aria-hidden="true"
                />
                멤버 상태
              </p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {attentionCount > 0 ? `관리 필요 ${attentionCount}명` : "모두 안정"}
              </p>
            </button>
          </div>

          {projectTitle ? (
            <button
              type="button"
              onClick={() => navigate(onOpenGoals)}
              className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-2xl bg-action-secondary/[0.08] px-3 py-2.5 text-left transition-transform active:scale-[0.97]"
            >
              <CalendarCheck2
                className="size-4 shrink-0 text-cyan-300"
                aria-hidden="true"
              />
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-text-secondary">
                {projectTitle}
              </p>
              {projectDeadline ? (
                <span className="shrink-0 text-xs font-semibold tabular-nums text-cyan-100">
                  {projectDeadline}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
