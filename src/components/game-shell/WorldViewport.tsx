import { BriefcaseBusiness, Coffee, Dumbbell, Radio } from "lucide-react";
import { useTraineeStore } from "@/stores/traineeStore";
import type { Trainee, TraineeActivity } from "@/types/game";

const ROOMS = [
  {
    key: "training",
    label: "트레이닝 룸",
    description: "팀 훈련과 개인 레슨",
    icon: Dumbbell,
    color: "text-activity-training",
    surface: "bg-activity-training/[0.07]",
  },
  {
    key: "rest",
    label: "라운지",
    description: "휴식과 컨디션 회복",
    icon: Coffee,
    color: "text-activity-rest",
    surface: "bg-activity-rest/[0.07]",
  },
  {
    key: "external",
    label: "외부 스케줄",
    description: "예능과 프로모션 현장",
    icon: Radio,
    color: "text-activity-external",
    surface: "bg-activity-external/[0.07]",
  },
  {
    key: "office",
    label: "오피스",
    description: "대기와 운영 업무",
    icon: BriefcaseBusiness,
    color: "text-activity-office",
    surface: "bg-activity-office/[0.07]",
  },
] as const;

type RoomKey = (typeof ROOMS)[number]["key"];

export function WorldViewport() {
  const trainees = useTraineeStore((state) => state.trainees);

  return (
    <section
      aria-label="회사 활동 현황"
      className="pixel-grid-bg flex h-full min-h-0 flex-col overflow-y-auto p-3 sm:p-4"
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-action-secondary">
            Company live
          </p>
          <h1 className="mt-1 text-lg font-semibold text-text-primary">오늘의 사옥</h1>
        </div>
        <span className="rounded-lg bg-surface-panel/80 px-2 py-1 text-[10px] tabular-nums text-text-muted shadow-[var(--shadow-surface)]">
          멤버 {trainees.length}명
        </span>
      </div>

      <div className="grid min-h-[23rem] flex-1 grid-cols-2 grid-rows-2 gap-2.5 sm:gap-3">
        {ROOMS.map((room) => {
          const Icon = room.icon;
          const members = trainees.filter(
            (trainee) => activityRoom(trainee.currentActivity) === room.key,
          );

          return (
            <article
              key={room.key}
              className={`flex min-h-0 flex-col rounded-3xl p-2.5 shadow-[var(--shadow-surface)] sm:p-3 ${room.surface}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-xs font-semibold text-text-primary">
                    {room.label}
                  </h2>
                  <p className="mt-0.5 hidden text-[10px] text-text-muted min-[390px]:block">
                    {room.description}
                  </p>
                </div>
                <Icon className={`size-4 shrink-0 ${room.color}`} aria-hidden="true" />
              </div>
              <ul className="mt-2 grid content-start gap-1.5" aria-label={`${room.label} 멤버`}>
                {members.map((trainee) => (
                  <WorldMember key={trainee.id} trainee={trainee} />
                ))}
              </ul>
              {members.length === 0 ? (
                <p className="m-auto text-[10px] text-text-muted/70">현재 활동 없음</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function WorldMember({ trainee }: { trainee: Trainee }) {
  return (
    <li className="flex min-h-9 items-center gap-2 rounded-xl bg-surface-shell/72 px-2 py-1.5 shadow-[var(--shadow-surface)]">
      <span
        className="grid size-6 shrink-0 place-items-center rounded-lg bg-action-primary/15 text-[10px] font-bold text-pink-200"
        aria-hidden="true"
      >
        {trainee.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-text-secondary">
        {trainee.name}
      </span>
      <span
        className={`size-2 shrink-0 rounded-full ${conditionColor(trainee.condition)}`}
        aria-label={`컨디션 ${trainee.condition}`}
      />
    </li>
  );
}

function activityRoom(activity: TraineeActivity): RoomKey {
  if (activity === "training" || activity === "individual") return "training";
  if (activity === "rest" || activity === "vacation") return "rest";
  if (activity === "entertainment") return "external";
  return "office";
}

function conditionColor(condition: number) {
  if (condition < 40) return "bg-state-danger";
  if (condition < 70) return "bg-state-warning";
  return "bg-state-success";
}
