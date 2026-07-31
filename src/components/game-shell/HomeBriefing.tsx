import {
  CalendarCheck2,
  HeartPulse,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type { GamePhase, WeeklyDecisionTrigger } from "@/types/game";

const PHASE_LABELS: Record<GamePhase, string> = {
  prologue: "프롤로그",
  founding: "창단",
  training: "데뷔 준비",
  debut: "데뷔 활동",
  growth: "성장기",
  peak: "전성기",
};

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
}: HomeBriefingProps) {
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
      className="pointer-events-none absolute left-3 right-3 top-3 z-20 max-w-sm rounded-3xl bg-slate-950/72 p-3.5 shadow-[var(--shadow-raised)] backdrop-blur-xl sm:left-4 sm:right-auto sm:top-4 sm:w-[22rem]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.12em] text-cyan-200">
          <Sparkles className="size-3.5" aria-hidden="true" />
          실시간 브리핑
        </p>
        <span className="rounded-full bg-white/[0.08] px-2 py-1 text-[11px] font-medium text-text-secondary">
          {PHASE_LABELS[phase]}
        </span>
      </div>

      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-text-muted">지금 관리 중인 팀</p>
          <h1 className="mt-0.5 truncate text-lg font-bold tracking-[-0.02em] text-text-primary">
            {groupName}
          </h1>
        </div>
        <span
          className={[
            "shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-semibold",
            hasCriticalRisk
              ? "bg-state-danger/15 text-rose-200"
              : remainingDecisions > 0
                ? "bg-action-primary/15 text-pink-100"
                : "bg-state-success/12 text-emerald-200",
          ].join(" ")}
        >
          {decisionLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white/[0.055] px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
            <HeartPulse className="size-3.5 text-cyan-300" aria-hidden="true" />
            팀 컨디션
          </p>
          <p className="mt-1 text-sm font-semibold text-text-primary">
            평균 <span className="tabular-nums">{averageCondition}</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white/[0.055] px-3 py-2.5">
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
        </div>
      </div>

      {projectTitle ? (
        <div className="mt-2 flex items-center gap-2 rounded-2xl bg-action-secondary/[0.08] px-3 py-2.5">
          <CalendarCheck2 className="size-4 shrink-0 text-cyan-300" aria-hidden="true" />
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-text-secondary">
            {projectTitle}
          </p>
          {projectDeadline ? (
            <span className="shrink-0 text-xs font-semibold tabular-nums text-cyan-100">
              {projectDeadline}
            </span>
          ) : null}
        </div>
      ) : null}
    </aside>
  );
}
