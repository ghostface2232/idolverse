import { ChevronRight, Dumbbell } from "lucide-react";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { useGameStore } from "@/stores/gameStore";
import { useTraineeStore } from "@/stores/traineeStore";
import type { Trainee, TraineeStatKey, TrainingIntensity } from "@/types/game";

const INTENSITY_LABELS: Record<TrainingIntensity, string> = {
  normal: "보통",
  hard: "강화",
  extreme: "극한",
};

const FOCUS_LABELS: Record<TraineeStatKey, string> = {
  visual: "비주얼",
  vocal: "보컬",
  dance: "댄스",
  charm: "끼",
  stamina: "체력",
  mental: "멘탈",
};

const ACTIVITY_SEGMENTS = [
  { key: "training", label: "훈련", barClass: "bg-cyan-400/80" },
  { key: "entertainment", label: "예능", barClass: "bg-pink-400/80" },
  { key: "individual", label: "개인 레슨", barClass: "bg-purple-400/80" },
  { key: "rest", label: "휴식", barClass: "bg-emerald-400/80" },
  { key: "injured", label: "부상", barClass: "bg-red-400/80" },
] as const;

interface TrainingSummaryCardProps {
  onOpen: () => void;
}

/** 멤버 초상화에 붙는 활동 상태 점의 색. 분포 막대의 색과 같은 문법을 쓴다. */
function activityDotClass(trainee: Trainee): string {
  if (trainee.injuryWeeks > 0) return "bg-red-400/90";
  const activity = trainee.currentActivity ?? "training";
  if (activity === "entertainment") return "bg-pink-400/90";
  if (activity === "individual") return "bg-purple-400/90";
  if (activity === "rest" || activity === "vacation") return "bg-emerald-400/90";
  return "bg-cyan-400/90";
}

/**
 * 이번 주 탭 상단의 훈련·활동 배치 요약. 세부 화면에 들어가기 전에
 * 현재 방침과 멤버 배치 분포를 한눈에 보여준다.
 */
export function TrainingSummaryCard({ onOpen }: TrainingSummaryCardProps) {
  const trainingSchedule = useGameStore((state) => state.trainingSchedule);
  const trainees = useTraineeStore((state) => state.trainees);

  const counts: Record<(typeof ACTIVITY_SEGMENTS)[number]["key"], number> = {
    training: 0,
    entertainment: 0,
    individual: 0,
    rest: 0,
    injured: 0,
  };
  trainees.forEach((trainee) => {
    if (trainee.injuryWeeks > 0) {
      counts.injured += 1;
      return;
    }
    const activity = trainee.currentActivity ?? "training";
    if (activity === "vacation") {
      counts.rest += 1;
    } else if (activity in counts) {
      counts[activity as keyof typeof counts] += 1;
    } else {
      counts.training += 1;
    }
  });
  const total = trainees.length;
  const activeSegments = ACTIVITY_SEGMENTS.filter(
    (segment) => counts[segment.key] > 0,
  );

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl bg-surface-panel p-3.5 text-left shadow-[var(--shadow-surface)] transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Dumbbell className="size-4 text-action-secondary" aria-hidden="true" />
          훈련·활동 배치
        </p>
        <span className="flex items-center gap-0.5 text-xs text-text-muted">
          자세히
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-text-secondary">
          강도 {INTENSITY_LABELS[trainingSchedule.intensity]}
        </span>
        <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-text-secondary">
          포커스{" "}
          {trainingSchedule.focus ? FOCUS_LABELS[trainingSchedule.focus] : "없음"}
        </span>
        <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-text-secondary">
          휴식일 {trainingSchedule.restDay ? "있음" : "없음"}
        </span>
      </div>

      {total > 0 ? (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
            {trainees.map((trainee) => (
              <span key={trainee.id} className="relative">
                <MemberPortrait traineeId={trainee.id} size="xs" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-surface-panel ${activityDotClass(trainee)}`}
                />
              </span>
            ))}
          </div>
          <div
            className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-surface-shell/80"
            aria-hidden="true"
          >
            {activeSegments.map((segment) => (
              <span
                key={segment.key}
                className={segment.barClass}
                style={{ width: `${(counts[segment.key] / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-muted">
            {activeSegments.map((segment) => (
              <span key={segment.key} className="inline-flex items-center gap-1.5">
                <span
                  className={`size-1.5 rounded-full ${segment.barClass}`}
                  aria-hidden="true"
                />
                {segment.label} {counts[segment.key]}명
              </span>
            ))}
          </div>
        </>
      ) : null}
    </button>
  );
}
