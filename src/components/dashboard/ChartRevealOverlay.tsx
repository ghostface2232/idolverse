import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/common/Button";
import { presentationBus, type PresentationEvents } from "@/game/EventBus";

type ChartRevealCommand = PresentationEvents["chartReveal"];

interface ChartRevealOverlayProps {
  onComplete: (eventId: string) => void | Promise<void>;
}

function buildCountdown(finalRank: number): number[] {
  return [...new Set([100, 50, 20, 10, finalRank])]
    .filter((rank) => rank >= finalRank)
    .sort((a, b) => b - a);
}

export function ChartRevealOverlay({ onComplete }: ChartRevealOverlayProps) {
  const [command, setCommand] = useState<ChartRevealCommand | null>(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(
    () =>
      presentationBus.on("chartReveal", (next) => {
        setCommand(next);
        setStep(0);
      }),
    [],
  );

  const countdown = useMemo(
    () => (command ? buildCountdown(command.rank) : []),
    [command],
  );
  const isFinal = command ? step >= countdown.length - 1 : false;

  useEffect(() => {
    if (!command || isFinal) return;
    const timer = window.setTimeout(
      () => setStep((current) => Math.min(current + 1, countdown.length - 1)),
      460,
    );
    return () => window.clearTimeout(timer);
  }, [command, countdown.length, isFinal, step]);

  if (!command) return null;

  const finish = async () => {
    if (saving) return;
    if (!isFinal) {
      setStep(countdown.length - 1);
      return;
    }
    setSaving(true);
    try {
      await onComplete(command.eventId);
      setCommand(null);
    } finally {
      setSaving(false);
    }
  };

  const displayedRank = countdown[step] ?? command.rank;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/92 px-4 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="차트 진입 순위 공개"
    >
      <div className="w-full max-w-md rounded-[32px] bg-surface-panel p-3 shadow-[var(--shadow-raised)]">
        <div className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.24),transparent_45%),linear-gradient(180deg,#111b31,#0f172a)] px-5 py-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            {command.chartName}
          </p>
          <div key={displayedRank} className="chart-rank-sweep mt-7">
            <p className="text-[11px] tracking-[0.2em] text-text-muted">
              신규 진입
            </p>
            <p className="mt-1 text-8xl font-black leading-none tabular-nums text-white">
              {displayedRank}
            </p>
            <p className="mt-2 text-sm font-semibold text-pink-300">위</p>
          </div>

          <div className="mt-8 space-y-1">
            <h2 className="text-xl font-semibold text-text-primary">
              {command.trackTitle}
            </h2>
            <p className="text-sm text-text-muted">{command.albumTitle}</p>
          </div>

          {isFinal ? (
            <div className="chart-rank-sweep mx-auto mt-6 flex w-fit items-center gap-2 rounded-full bg-emerald-400/12 px-3 py-1.5 text-xs font-semibold text-emerald-200 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.24)]">
              <Trophy className="size-4" aria-hidden="true" />
              데뷔 차트 진입 성공
            </div>
          ) : (
            <p className="mt-6 text-xs text-text-muted">순위 집계 중…</p>
          )}
        </div>
        <Button
          className="mt-3 min-h-11 w-full transition-transform active:scale-[0.96]"
          isDisabled={saving}
          onPress={finish}
        >
          {saving ? "저장 중…" : isFinal ? "첫 기록 확인" : "결과 바로 보기"}
        </Button>
      </div>
    </div>
  );
}
