import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PresentationDialog } from "@/components/common/PresentationDialog";
import { AlbumArt } from "@/components/visual/AlbumArt";
import { presentationBus, type PresentationEvents } from "@/game/EventBus";
import { useNumberScramble } from "@/lib/useNumberScramble";

type ChartRevealCommand = PresentationEvents["chartReveal"];

interface ChartRevealOverlayProps {
  onComplete: (eventId: string) => void | Promise<void>;
}

export function ChartRevealOverlay({ onComplete }: ChartRevealOverlayProps) {
  const [command, setCommand] = useState<ChartRevealCommand | null>(null);
  const [fastForward, setFastForward] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(
    () =>
      presentationBus.on("chartReveal", (next) => {
        setCommand(next);
        setFastForward(false);
      }),
    [],
  );

  const rank = command?.rank ?? 1;
  // 순위는 100위권을 훑다가 진짜 순위로 좁혀 내려온다 — 목표보다 좋은
  // 순위가 먼저 스쳐 보이면 안착이 실망으로 읽히므로 위쪽으로만 흔든다.
  const { value: displayedRank, settled } = useNumberScramble(rank, {
    durationMs: 3000,
    maxOffset: Math.max(12, 100 - rank),
    min: 1,
    direction: "above",
    active: command !== null && !fastForward,
  });

  if (!command) return null;

  const isFinal = settled;

  const finish = async () => {
    if (saving) return;
    if (!isFinal) {
      setFastForward(true);
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

  return (
    <PresentationDialog label="차트 진입 순위 공개">
        <div className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.24),transparent_45%),linear-gradient(180deg,#111b31,#0f172a)] px-5 py-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            {command.chartName}
          </p>
          <div key={isFinal ? "final" : "rolling"} className={isFinal ? "chart-rank-sweep mt-7" : "mt-7"}>
            <p className="text-[11px] tracking-[0.2em] text-text-muted">
              신규 진입
            </p>
            <p
              className={`mt-1 text-8xl font-black leading-none tabular-nums transition-colors duration-300 ${
                isFinal ? "text-white" : "text-white/70"
              }`}
            >
              {displayedRank}
            </p>
            <p className="mt-2 text-sm font-semibold text-pink-300">위</p>
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-left">
            <AlbumArt title={command.albumTitle} size="md" />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-text-primary">
                {command.trackTitle}
              </h2>
              <p className="truncate text-sm text-text-muted">
                {command.albumTitle}
              </p>
            </div>
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
          autoFocus
          className="mt-3 min-h-11 w-full transition-transform active:scale-[0.96]"
          isDisabled={saving}
          onPress={finish}
        >
          {saving ? "저장 중…" : isFinal ? "첫 기록 확인" : "결과 바로 보기"}
        </Button>
    </PresentationDialog>
  );
}
