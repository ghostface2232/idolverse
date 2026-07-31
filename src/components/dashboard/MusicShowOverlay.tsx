import { useEffect, useState } from "react";
import { Trophy, Mic2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PresentationDialog } from "@/components/common/PresentationDialog";
import { GroupBadge } from "@/components/visual/GroupBadge";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { presentationBus, type PresentationEvents } from "@/game/EventBus";
import { useGameStore } from "@/stores/gameStore";
import { useTraineeStore } from "@/stores/traineeStore";

type MusicShowCommand = PresentationEvents["musicShow"];

interface MusicShowOverlayProps {
  onComplete: (eventId: string) => void | Promise<void>;
}

/** 발표 단계: 후보 소개 → 점수 공개 → 결과. 클릭으로 앞당길 수 있다. */
type RevealStep = "candidates" | "scores" | "result";

export function MusicShowOverlay({ onComplete }: MusicShowOverlayProps) {
  const [command, setCommand] = useState<MusicShowCommand | null>(null);
  const [step, setStep] = useState<RevealStep>("candidates");
  const [saving, setSaving] = useState(false);
  const groupName = useGameStore((state) => state.groupName);
  const trainees = useTraineeStore((state) => state.trainees);

  useEffect(
    () =>
      presentationBus.on("musicShow", (next) => {
        setCommand(next);
        setStep("candidates");
      }),
    [],
  );

  useEffect(() => {
    if (!command || step === "result") return;
    const timer = window.setTimeout(
      () => setStep((current) => (current === "candidates" ? "scores" : "result")),
      900,
    );
    return () => window.clearTimeout(timer);
  }, [command, step]);

  if (!command) return null;

  const isFinal = step === "result";
  const finish = async () => {
    if (saving) return;
    if (!isFinal) {
      setStep("result");
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

  const showScores = step !== "candidates";

  return (
    <PresentationDialog label="음악방송 1위 발표">
        <div className="overflow-hidden rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.22),transparent_45%),linear-gradient(180deg,#1a1130,#0f172a)] px-5 py-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-300">
            {command.showName}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-text-muted">
            이번 주 1위 후보
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <ContenderCard
              name={command.trackTitle}
              subName={groupName}
              score={command.playerScore}
              showScore={showScores}
              highlighted={isFinal && command.won}
              isPlayer
              visual={
                trainees.length > 0 ? (
                  <span className="flex justify-center -space-x-2">
                    {trainees.slice(0, 4).map((trainee) => (
                      <MemberPortrait
                        key={trainee.id}
                        traineeId={trainee.id}
                        outfit="stage"
                        size="sm"
                        className="ring-2 ring-slate-950/70"
                      />
                    ))}
                  </span>
                ) : null
              }
            />
            <ContenderCard
              name={command.rivalName}
              score={command.rivalScore}
              showScore={showScores}
              highlighted={isFinal && !command.won}
              visual={
                <span className="flex justify-center">
                  <GroupBadge name={command.rivalName} size="md" className="rounded-full" />
                </span>
              }
            />
          </div>

          {isFinal ? (
            <div
              className={`chart-rank-sweep mx-auto mt-7 flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                command.won
                  ? "bg-amber-400/12 text-amber-200 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.28)]"
                  : "bg-slate-400/12 text-slate-200 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.24)]"
              }`}
            >
              {command.won ? (
                <Trophy className="size-4" aria-hidden="true" />
              ) : (
                <Mic2 className="size-4" aria-hidden="true" />
              )}
              {command.won ? "음악방송 1위!" : "아쉬운 2위, 다음 무대를 기약합니다"}
            </div>
          ) : (
            <p className="mt-7 text-xs text-text-muted">집계 중…</p>
          )}
        </div>
        <Button
          autoFocus
          className="mt-3 min-h-11 w-full transition-transform active:scale-[0.96]"
          isDisabled={saving}
          onPress={finish}
        >
          {saving ? "저장 중…" : isFinal ? "무대 마치기" : "결과 바로 보기"}
        </Button>
    </PresentationDialog>
  );
}

function ContenderCard({
  name,
  subName,
  score,
  showScore,
  highlighted,
  isPlayer = false,
  visual,
}: {
  name: string;
  subName?: string;
  score: number;
  showScore: boolean;
  highlighted: boolean;
  isPlayer?: boolean;
  visual?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-4 transition-shadow duration-300 ${
        highlighted
          ? "bg-white/[0.08] shadow-[inset_0_0_0_2px_rgba(251,191,36,0.5)]"
          : "bg-white/[0.04] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        {isPlayer ? "우리 팀" : "경쟁 후보"}
      </p>
      {visual ? <div className="mt-2.5">{visual}</div> : null}
      <p className="mt-2 truncate text-sm font-semibold text-text-primary">
        {name}
      </p>
      {subName ? (
        <p className="truncate text-[11px] text-text-muted">{subName}</p>
      ) : null}
      <p
        className={`mt-2.5 text-3xl font-black tabular-nums transition-opacity duration-300 ${
          showScore ? "opacity-100" : "opacity-0"
        } ${isPlayer ? "text-cyan-200" : "text-slate-200"}`}
      >
        {showScore ? score.toLocaleString("ko-KR") : "····"}
      </p>
    </div>
  );
}
