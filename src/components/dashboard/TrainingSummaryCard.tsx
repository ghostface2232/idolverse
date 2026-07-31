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

interface TrainingSummaryCardProps {
  onOpen: () => void;
}

/** 멤버 초상화에 붙는 활동 상태 점의 색. */
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
 * 현재 방침과 멤버별 배치를 한눈에 보여준다.
 */
export function TrainingSummaryCard({ onOpen }: TrainingSummaryCardProps) {
  const trainingSchedule = useGameStore((state) => state.trainingSchedule);
  const trainees = useTraineeStore((state) => state.trainees);
  const injuredCount = trainees.filter((trainee) => trainee.injuryWeeks > 0).length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl bg-surface-panel p-3 text-left shadow-[var(--shadow-surface)] transition-transform duration-[var(--motion-press)] active:scale-[0.96]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Dumbbell className="size-4 text-action-secondary" aria-hidden="true" />
          주간 배치
        </p>
        <span className="flex items-center gap-0.5 text-xs text-text-muted">
          배치 변경
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
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

      {trainees.length > 0 ? (
        <>
          <div className="mt-2.5 flex flex-wrap gap-1.5" aria-hidden="true">
            {trainees.slice(0, 8).map((trainee) => (
              <span
                key={trainee.id}
                className="relative rounded-xl outline outline-1 -outline-offset-1 outline-white/10"
              >
                <MemberPortrait traineeId={trainee.id} size="sm" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface-panel ${activityDotClass(trainee)}`}
                />
              </span>
            ))}
          </div>
          <span className="sr-only">
            멤버 {trainees.length}명, 부상 {injuredCount}명
          </span>
        </>
      ) : null}
    </button>
  );
}
