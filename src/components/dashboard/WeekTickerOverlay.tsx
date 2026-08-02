import { useEffect, useMemo, useRef, useState } from "react";
import type { WeekDelta, WeeklyReportSnapshot } from "@/types/game";
import { formatKoreanWon } from "@/utils/formatKoreanWon";
import { isGoodWeekDelta } from "@/utils/weekDeltaTone";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;
/** 하루가 흐르는 시간. 7일 합산 약 2.6초, 탭하면 즉시 결산으로 넘어간다. */
const DAY_DURATION_MS = 370;

const SEVERITY_RANK: Record<WeekDelta["severity"], number> = {
  critical: 3,
  warning: 2,
  notice: 1,
  info: 0,
};

interface DayToast {
  id: string;
  day: number;
  text: string;
  tone: "good" | "bad" | "neutral";
}

interface WeekTickerOverlayProps {
  report: WeeklyReportSnapshot;
  endingMoney: number;
  onComplete: () => void;
}

/**
 * 주 넘김 연출 — 결산 모달이 뜨기 전에 월~일이 월드 위로 흐르며
 * 그 요일에 일어난 변화(WeekDelta.day)를 토스트로 흘린다.
 * 어디를 탭해도 즉시 완료되고, 정보는 전부 결산 리포트에 다시 나온다.
 */
export function WeekTickerOverlay({
  report,
  endingMoney,
  onComplete,
}: WeekTickerOverlayProps) {
  const [dayIndex, setDayIndex] = useState(0);
  const doneRef = useRef(false);

  const toastsByDay = useMemo(() => buildDayToasts(report.deltas ?? []), [report]);

  useEffect(() => {
    if (dayIndex >= DAY_LABELS.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        const timer = window.setTimeout(onComplete, 220);
        return () => window.clearTimeout(timer);
      }
      return;
    }
    const timer = window.setTimeout(
      () => setDayIndex((current) => current + 1),
      DAY_DURATION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [dayIndex, onComplete]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  const visibleToasts = toastsByDay
    .filter((toast) => toast.day <= dayIndex + 1)
    .slice(-3);
  const incomeTotal = sumValues(report.finance.income);
  const expenseTotal = sumValues(report.finance.expenses);
  const net = incomeTotal - expenseTotal;
  const startMoney = endingMoney - net;
  const progress = Math.min(1, (dayIndex + 1) / DAY_LABELS.length);
  const visibleMoney = Math.round(startMoney + net * progress);
  const albumIncome = report.finance.income.album ?? 0;

  return (
    // 화면 전체를 덮는다(fixed) — 연출 중에는 상단바의 갱신된 수치가 미리
    // 보이거나 배경 버튼이 눌리면 안 된다. 배경 전체를 블러로 가려
    // 뒤쪽의 구체적인 내용이 읽히지 않게 하고, 연출 요소만 또렷이 남긴다.
    <button
      type="button"
      aria-label="주간 진행 연출 건너뛰기"
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-between bg-gradient-to-b from-slate-950/60 via-slate-950/35 to-slate-950/72 px-4 pb-24 pt-16 text-left backdrop-blur-md"
      onClick={skip}
    >
      <div className="relative flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-950/78 px-3 py-2 shadow-[var(--shadow-surface)] backdrop-blur-sm">
          <span className="mr-1 text-[11px] font-semibold tabular-nums text-text-muted">
            {report.week}주차
          </span>
          {DAY_LABELS.map((label, index) => {
            const state =
              index < dayIndex ? "past" : index === dayIndex ? "now" : "future";
            return (
              <span
                key={label}
                className={[
                  "grid size-6 place-items-center rounded-lg text-[11px] font-bold transition-colors duration-150",
                  state === "now"
                    ? "bg-brand-pink text-white"
                    : state === "past"
                      ? "bg-white/[0.14] text-text-secondary"
                      : "bg-white/[0.05] text-text-muted",
                ].join(" ")}
              >
                {label}
              </span>
            );
          })}
        </div>
        <div className="rounded-2xl bg-slate-950/82 px-3 py-2 text-center shadow-[var(--shadow-surface)] backdrop-blur-sm">
          <p className="text-[11px] text-text-muted">회사 잔액</p>
          <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
            {formatKoreanWon(visibleMoney, { symbol: true })}
            <span
              className={[
                "ml-2 text-xs",
                net >= 0 ? "text-emerald-300" : "text-rose-300",
              ].join(" ")}
            >
              {net >= 0 ? "+" : "-"}
              {formatKoreanWon(Math.abs(net), { symbol: true })}
            </span>
          </p>
        </div>
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-1.5">
        {albumIncome > 0 ? (
          <div className="mb-2 w-full rounded-2xl bg-slate-950/86 px-4 py-3 shadow-[var(--shadow-raised)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-pink-200">
                이번 주 음반 정산
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-200">
                +{formatKoreanWon(albumIncome, { symbol: true })}
              </span>
            </div>
            <div className="mt-2 flex h-10 items-end gap-1" aria-hidden="true">
              {[10, 18, 27, 23, 35, 29, 42].map((height, index) => (
                <span
                  key={index}
                  className={[
                    "flex-1 rounded-t-sm transition-[height,opacity,background-color] duration-200",
                    index <= dayIndex
                      ? "bg-gradient-to-t from-pink-600 to-cyan-300 opacity-100"
                      : "bg-white/10 opacity-45",
                  ].join(" ")}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        ) : null}
        {visibleToasts.map((toast) => (
          <span
            key={toast.id}
            className={[
              "week-toast-in max-w-full truncate rounded-full px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-surface)] backdrop-blur-sm",
              toast.tone === "good"
                ? "bg-emerald-950/82 text-emerald-200"
                : toast.tone === "bad"
                  ? "bg-rose-950/82 text-rose-200"
                  : "bg-slate-950/82 text-text-secondary",
            ].join(" ")}
          >
            {toast.text}
          </span>
        ))}
        <span className="mt-1 text-[11px] text-white/65">
          탭하면 바로 결산으로 넘어갑니다
        </span>
      </div>
    </button>
  );
}

function sumValues(values: Record<string, number>) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

/** 요일별 대표 변화 1건씩. 심각도 우선, 그다음 변화량 크기로 고른다. */
function buildDayToasts(deltas: WeekDelta[]): DayToast[] {
  const byDay = new Map<number, WeekDelta[]>();
  for (const delta of deltas) {
    if (typeof delta.before !== "number" || typeof delta.after !== "number") {
      continue;
    }
    if (Math.abs(delta.after - delta.before) < 0.05) continue;
    const bucket = byDay.get(delta.day) ?? [];
    bucket.push(delta);
    byDay.set(delta.day, bucket);
  }

  const toasts: DayToast[] = [];
  for (const [day, bucket] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    const top = bucket.reduce((best, candidate) => {
      const severityGap =
        SEVERITY_RANK[candidate.severity] - SEVERITY_RANK[best.severity];
      if (severityGap !== 0) return severityGap > 0 ? candidate : best;
      const bestDiff = Math.abs((best.after as number) - (best.before as number));
      const candidateDiff = Math.abs(
        (candidate.after as number) - (candidate.before as number),
      );
      return candidateDiff > bestDiff ? candidate : best;
    });

    const diff = (top.after as number) - (top.before as number);
    const rounded = Math.round(diff);
    if (rounded === 0) continue;
    const magnitude =
      top.target.kind === "finance"
        ? formatKoreanWon(Math.abs(diff))
        : String(Math.abs(rounded));
    const isGood = isGoodWeekDelta(top);

    toasts.push({
      id: top.id,
      day,
      text: `${DAY_LABELS[day - 1]} · ${top.target.label} ${rounded > 0 ? "+" : "-"}${magnitude} (${top.source.label})`,
      tone:
        isGood === null ? "neutral" : isGood ? "good" : "bad",
    });
  }

  return toasts;
}
