import { useState } from "react";
import { Card } from "@/components/common/Card";
import { TraineeDetail } from "@/components/TraineeDetail";
import { CHEMISTRY_CONFLICT_THRESHOLD } from "@/data/balance";
import { POSITION_LABELS } from "@/data/founding";
import { useFinanceStore } from "@/stores/financeStore";
import { gameVanillaStore, useGameStore } from "@/stores/gameStore";
import { traineeVanillaStore, useTraineeStore } from "@/stores/traineeStore";
import { getEffectiveSatisfaction } from "@/systems/satisfactionSystem";
import type {
  Trainee,
  TraineeActivity,
  TraineeStatKey,
  TrainingIntensity,
} from "@/types/game";

const STAT_KEYS: TraineeStatKey[] = [
  "visual",
  "vocal",
  "dance",
  "charm",
  "stamina",
  "mental",
];

const STAT_LABELS: Record<TraineeStatKey, string> = {
  visual: "비주얼",
  vocal: "보컬",
  dance: "댄스",
  charm: "끼",
  stamina: "체력",
  mental: "멘탈",
};

const INTENSITY_OPTIONS: {
  key: TrainingIntensity;
  label: string;
  description: string;
}[] = [
  { key: "normal", label: "보통", description: "안정적 성장 · 스트레스 소폭 ↑" },
  { key: "hard", label: "강화", description: "성장 1.5× · 스트레스 ↑ · 부상 위험 소폭" },
  { key: "extreme", label: "극한", description: "성장 2× · 스트레스 급증 · 부상 위험 ↑" },
];

const FOCUS_OPTIONS: {
  key: TraineeStatKey | null;
  label: string;
}[] = [
  { key: null, label: "없음" },
  { key: "vocal", label: "보컬" },
  { key: "dance", label: "댄스" },
  { key: "visual", label: "비주얼" },
  { key: "charm", label: "끼" },
  { key: "stamina", label: "체력" },
];

const ACTIVITY_OPTIONS: {
  key: Exclude<TraineeActivity, null>;
  label: string;
  warning?: string;
}[] = [
  { key: "training", label: "훈련" },
  {
    key: "entertainment",
    label: "예능",
    warning: "이번 주 훈련 불가. 대중 인지도 상승 기회",
  },
  { key: "individual", label: "개인 레슨" },
  { key: "rest", label: "휴식" },
];

const ACTIVITY_LABEL: Record<Exclude<TraineeActivity, null>, string> = {
  training: "훈련 중",
  entertainment: "예능 출연",
  individual: "개인 레슨",
  rest: "휴식",
  vacation: "휴가",
};

const ACTIVITY_TONE: Record<Exclude<TraineeActivity, null>, string> = {
  training: "border-cyan-400/40 bg-cyan-400/10 text-cyan-200",
  entertainment: "border-pink-400/40 bg-pink-400/10 text-pink-200",
  individual: "border-purple-400/40 bg-purple-400/10 text-purple-200",
  rest: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  vacation: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
};

function statBarColor(value: number): string {
  if (value >= 61) return "bg-emerald-400";
  if (value >= 31) return "bg-amber-400";
  return "bg-red-400";
}

function statusIcon(label: "mood" | "stress" | "condition", value: number) {
  if (label === "stress") {
    if (value >= 70) return { icon: "X", tone: "text-red-300", title: "스트레스 높음" };
    if (value >= 40) return { icon: "~", tone: "text-amber-300", title: "스트레스 보통" };
    return { icon: "♪", tone: "text-emerald-300", title: "스트레스 낮음" };
  }
  if (value >= 70) return { icon: "♥", tone: "text-emerald-300", title: `${label} 좋음` };
  if (value >= 40) return { icon: "~", tone: "text-amber-300", title: `${label} 보통` };
  return { icon: "X", tone: "text-red-300", title: `${label} 나쁨` };
}

function bestAndWorstChemistry(trainee: Trainee, others: readonly Trainee[]) {
  let best: { name: string; value: number } | null = null;
  let conflict: { name: string; value: number } | null = null;
  for (const other of others) {
    if (other.id === trainee.id) continue;
    const v = trainee.chemistry[other.id] ?? 0;
    if (best === null || v > best.value) {
      best = { name: other.name, value: v };
    }
    if (v < CHEMISTRY_CONFLICT_THRESHOLD) {
      if (conflict === null || v < conflict.value) {
        conflict = { name: other.name, value: v };
      }
    }
  }
  return { best, conflict };
}

interface ToggleGroupProps<T extends string | null> {
  value: T;
  options: { key: T; label: string }[];
  onChange: (value: T) => void;
}

function ToggleGroup<T extends string | null>({
  value,
  options,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={String(opt.key ?? "none")}
            type="button"
            onClick={() => onChange(opt.key)}
            className={[
              "min-h-9 rounded-full border px-3 text-xs transition",
              active
                ? "border-brand-pink bg-brand-pink/20 text-pink-100"
                : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Training() {
  const trainees = useTraineeStore((s) => s.trainees);
  const trainingSchedule = useGameStore((s) => s.trainingSchedule);
  const upgrades = useFinanceStore((s) => s.upgrades);
  const [openTraineeId, setOpenTraineeId] = useState<string | null>(null);

  const setIntensity = (intensity: TrainingIntensity) => {
    gameVanillaStore.getState().setTrainingSchedule({ intensity });
  };
  const setFocus = (focus: TraineeStatKey | null) => {
    gameVanillaStore.getState().setTrainingSchedule({ focus });
  };
  const setRestDay = (restDay: boolean) => {
    gameVanillaStore.getState().setTrainingSchedule({ restDay });
  };

  const handleActivityChange = (
    traineeId: string,
    activity: Exclude<TraineeActivity, null>,
  ) => {
    traineeVanillaStore
      .getState()
      .updateCondition(traineeId, { currentActivity: activity });
  };

  const openTrainee = trainees.find((t) => t.id === openTraineeId) ?? null;
  const intensityDescription =
    INTENSITY_OPTIONS.find((o) => o.key === trainingSchedule.intensity)
      ?.description ?? "";

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-pink">
            훈련 강도
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {INTENSITY_OPTIONS.map((opt) => {
              const active = trainingSchedule.intensity === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setIntensity(opt.key)}
                  className={[
                    "flex min-h-12 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-xs transition",
                    active
                      ? "border-brand-pink bg-brand-pink/20 text-pink-100"
                      : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500",
                  ].join(" ")}
                >
                  <span className="text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">{intensityDescription}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-pink">
            훈련 포커스
          </p>
          <div className="mt-2">
            <ToggleGroup
              value={trainingSchedule.focus}
              options={FOCUS_OPTIONS}
              onChange={setFocus}
            />
          </div>
          {trainingSchedule.focus !== null && (
            <p className="mt-2 text-[11px] text-slate-400">
              {STAT_LABELS[trainingSchedule.focus]} 훈련 가중치 ↑
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/40 px-3 py-3">
          <div>
            <p className="text-sm text-slate-100">휴식일</p>
            <p className="text-[11px] text-slate-400">
              ON 시 이번 주 하루 휴식 — 스트레스 ↓, 성장 소폭 ↓
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={trainingSchedule.restDay}
            onClick={() => setRestDay(!trainingSchedule.restDay)}
            className={[
              "relative h-7 w-12 rounded-full border transition",
              trainingSchedule.restDay
                ? "border-brand-pink bg-brand-pink/40"
                : "border-slate-600 bg-slate-700",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 h-5 w-5 rounded-full bg-slate-100 transition-transform",
                trainingSchedule.restDay ? "translate-x-5" : "translate-x-0.5",
              ].join(" ")}
            />
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {trainees.length === 0 ? (
          <Card className="text-center text-xs text-slate-400">
            연습생이 없습니다.
          </Card>
        ) : (
          trainees.map((trainee) => {
            const injured = trainee.injuryWeeks > 0;
            const activity =
              (trainee.currentActivity ?? "training") as Exclude<
                TraineeActivity,
                null
              >;
            const { best, conflict } = bestAndWorstChemistry(trainee, trainees);
            const moodIcon = statusIcon("mood", trainee.mood);
            const stressIcon = statusIcon("stress", trainee.stress);
            const conditionIcon = statusIcon("condition", trainee.condition);
            const effectiveSatisfaction = getEffectiveSatisfaction(
              trainee.satisfaction,
              upgrades.dormLevel,
              upgrades.livingExpenseLevel,
            );

            return (
              <Card key={trainee.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => setOpenTraineeId(trainee.id)}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <div>
                    <p className="text-sm text-slate-50">{trainee.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {trainee.position
                        ? POSITION_LABELS[trainee.position]
                        : "포지션 미배정"}
                      {trainee.subPosition
                        ? ` · ${POSITION_LABELS[trainee.subPosition]}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px]",
                      injured
                        ? "border-red-400/50 bg-red-400/10 text-red-200"
                        : ACTIVITY_TONE[activity],
                    ].join(" ")}
                  >
                    {injured
                      ? `부상 회복 중 (${trainee.injuryWeeks}주 남음)`
                      : ACTIVITY_LABEL[activity]}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {STAT_KEYS.map((key) => {
                    const value = trainee.stats[key];
                    return (
                      <div key={key} className="text-[10px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>{STAT_LABELS[key]}</span>
                          <span className="text-slate-400">{value}</span>
                        </div>
                        <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={[
                              "h-full rounded-full",
                              statBarColor(value),
                            ].join(" ")}
                            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                  <span className={moodIcon.tone} title={`만족도 ${Math.round(effectiveSatisfaction)}`}>
                    {moodIcon.icon} 만족
                  </span>
                  <span className={stressIcon.tone} title={`스트레스 ${trainee.stress}`}>
                    {stressIcon.icon} 스트레스
                  </span>
                  <span className={conditionIcon.tone} title={`컨디션 ${trainee.condition}`}>
                    {conditionIcon.icon} 컨디션
                  </span>
                  {best && best.value > 0 && (
                    <span className="text-pink-200">
                      ♥ {best.name} ({best.value > 0 ? "+" : ""}
                      {best.value})
                    </span>
                  )}
                  {conflict && (
                    <span className="text-red-300">
                      ⚡ {conflict.name} ({conflict.value})
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-1.5">
                    {ACTIVITY_OPTIONS.map((opt) => {
                      const active = activity === opt.key && !injured;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          disabled={injured}
                          onClick={() => handleActivityChange(trainee.id, opt.key)}
                          className={[
                            "min-h-9 rounded-xl border px-1 py-1.5 text-[10px] transition",
                            active
                              ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                              : "border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500",
                            injured ? "cursor-not-allowed opacity-40" : "",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {!injured && activity === "entertainment" && (
                    <p className="text-[10px] text-pink-200">
                      ⚠ 이번 주 훈련 불가. 대중 인지도 상승 기회
                    </p>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {openTrainee && (
        <TraineeDetail
          trainee={openTrainee}
          trainees={trainees}
          dormLevel={upgrades.dormLevel}
          livingExpenseLevel={upgrades.livingExpenseLevel}
          onClose={() => setOpenTraineeId(null)}
        />
      )}
    </div>
  );
}
