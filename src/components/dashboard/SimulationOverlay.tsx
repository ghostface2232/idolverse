import { PixelText } from "@/components/common/PixelText";
import { useTraineeStore } from "@/stores/traineeStore";
import type { TraineeActivity } from "@/types/game";

type SimulationArea = "practice" | "dorm" | "office" | "external";

const ROOM_OVERLAYS = [
  {
    key: "practice",
    label: "연습실",
    dotClassName: "bg-indigo-400",
    countClassName: "text-indigo-200",
  },
  {
    key: "dorm",
    label: "숙소",
    dotClassName: "bg-amber-400",
    countClassName: "text-amber-200",
  },
  {
    key: "office",
    label: "사무실",
    dotClassName: "bg-brand-cyan",
    countClassName: "text-cyan-200",
  },
] as const;

function activityArea(activity: TraineeActivity): SimulationArea {
  if (activity === "training" || activity === "individual") return "practice";
  if (activity === "rest" || activity === "vacation") return "dorm";
  if (activity === "entertainment") return "external";
  return "office";
}

export function SimulationOverlay() {
  const trainees = useTraineeStore((state) => state.trainees);
  const counts: Record<SimulationArea, number> = {
    practice: 0,
    dorm: 0,
    office: 0,
    external: 0,
  };

  for (const trainee of trainees) {
    counts[activityArea(trainee.currentActivity)] += 1;
  }

  return (
    <div className="pointer-events-none absolute inset-0 grid grid-rows-3 gap-2.5 p-3">
      {ROOM_OVERLAYS.map((room, index) => (
        <div key={room.key} className="relative min-h-0">
          <div className="absolute left-2 top-2 flex min-h-8 items-center gap-2 rounded-xl bg-slate-950 px-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.1)]">
            <span className={["size-2 rounded-full", room.dotClassName].join(" ")} />
            <PixelText className="text-xs tracking-[0.05em] text-slate-100 [text-shadow:none]">
              {room.label}
            </PixelText>
            <span
              className={[
                "text-[11px] tabular-nums",
                room.countClassName,
              ].join(" ")}
            >
              {counts[room.key]}명
            </span>
          </div>

          {index === 0 && counts.external > 0 ? (
            <div className="absolute right-2 top-2 flex min-h-8 items-center gap-1.5 rounded-xl bg-slate-950 px-2.5 text-[11px] text-pink-200 shadow-[0_0_0_1px_rgba(236,72,153,0.35)]">
              <span className="size-1.5 rounded-full bg-brand-pink" />
              <span>외부 활동</span>
              <span className="tabular-nums text-slate-100">
                {counts.external}명
              </span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
