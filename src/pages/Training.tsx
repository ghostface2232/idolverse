import { useState } from "react";
import { Card } from "@/components/common/Card";
import { TabPanel } from "@/components/common/TabPanel";
import { TraineeDetail } from "@/components/TraineeDetail";
import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  INJURY_RISK_CRITICAL_THRESHOLD,
  INJURY_RISK_WARNING_THRESHOLD,
} from "@/data/balance";
import { POSITION_LABELS } from "@/data/founding";
import { useAlbumStore } from "@/stores/albumStore";
import { useFinanceStore } from "@/stores/financeStore";
import { gameVanillaStore, useGameStore } from "@/stores/gameStore";
import { useStaffStore } from "@/stores/staffStore";
import { traineeVanillaStore, useTraineeStore } from "@/stores/traineeStore";
import { getEffectiveSatisfaction } from "@/systems/satisfactionSystem";
import {
  previewTraineeWeek,
  type TraineeWeekPreview,
} from "@/systems/trainingSystem";
import type {
  Trainee,
  TraineeActivity,
  TraineeStatKey,
  TrainingIntensity,
} from "@/types/game";
import { withJosa } from "@/utils/josa";

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
  { key: "normal", label: "보통", description: "무리 없는 페이스로 꾸준히 나아갑니다" },
  { key: "hard", label: "강화", description: "빠르게 실력을 끌어올리지만 피로가 눈에 띄게 쌓입니다" },
  { key: "extreme", label: "극한", description: "한계까지 몰아붙입니다. 성과는 크지만 몸과 마음이 버텨줘야 합니다" },
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
    warning: "이번 주는 연습 대신 방송에 나갑니다. 얼굴을 알릴 기회지만, 대중의 반응은 뚜껑을 열어봐야 압니다",
  },
  {
    key: "individual",
    label: "개인 레슨",
    warning: "개인 역량을 키우지만, 대신 팀 결속과 멤버 간 케미가 정체됩니다",
  },
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

function statusIcon(kind: "mood" | "stress" | "condition", value: number) {
  const noun =
    kind === "mood" ? "만족도" : kind === "stress" ? "스트레스" : "컨디션";
  if (kind === "stress") {
    if (value >= 70) return { icon: "X", tone: "text-red-300", title: "스트레스가 높습니다" };
    if (value >= 40) return { icon: "~", tone: "text-amber-300", title: "스트레스가 쌓이고 있습니다" };
    return { icon: "♪", tone: "text-emerald-300", title: "스트레스는 걱정 없는 수준입니다" };
  }
  if (value >= 70) return { icon: "♥", tone: "text-emerald-300", title: `${withJosa(noun, "이/가")} 좋습니다` };
  if (value >= 40) return { icon: "~", tone: "text-amber-300", title: `${withJosa(noun, "은/는")} 무난한 편입니다` };
  return { icon: "X", tone: "text-red-300", title: `${withJosa(noun, "이/가")} 좋지 않습니다` };
}

function injuryRiskLabel(probability: number): string | null {
  // 확률 수치를 그대로 노출하지 않고 트레이너의 어조로 옮긴다.
  if (probability <= 0) return null;
  if (probability < INJURY_RISK_WARNING_THRESHOLD) return null;
  if (probability < INJURY_RISK_CRITICAL_THRESHOLD) return "몸에 무리가 갈 수 있어 보입니다";
  return "이대로면 부상이 걱정됩니다";
}

// 정확한 성장/델타 수치는 사전 공개하지 않는다(결과로만 힌트). 매니저의
// 어조로 이번 주 흐름만 전달한다.
function formatPreview(preview: TraineeWeekPreview): string {
  const parts: string[] = [];
  const growthEntries = Object.entries(preview.statGrowth).filter(
    ([, value]) => (value ?? 0) > 0,
  );
  const totalGrowth = growthEntries.reduce((sum, [, v]) => sum + (v ?? 0), 0);
  if (preview.mode === "injured") {
    parts.push("이번 주는 치료와 회복에 전념시키겠습니다");
  } else if (preview.mode === "entertainment") {
    parts.push("이번 주는 방송 스케줄을 소화합니다");
  } else if (preview.mode === "individual" && growthEntries.length === 1) {
    const [stat] = growthEntries[0];
    parts.push(
      `${STAT_LABELS[stat as TraineeStatKey]} 실력이 눈에 띄게 붙을 것으로 보입니다`,
    );
  } else if (preview.mode === "rest") {
    parts.push("푹 쉬면서 재충전합니다");
  } else if (totalGrowth >= 0.5) {
    parts.push("훈련 성과가 잘 나올 것 같습니다");
  } else if (totalGrowth > 0) {
    parts.push("성장세는 완만할 것으로 보입니다");
  } else {
    parts.push("이번 주는 연습 진도가 없습니다");
  }
  if (preview.stressDelta >= 10) {
    parts.push("피로가 상당히 쌓일 겁니다");
  } else if (preview.stressDelta >= 5) {
    parts.push("피로가 눈에 띄게 쌓이겠습니다");
  } else if (preview.stressDelta <= -15) {
    parts.push("스트레스가 크게 풀리겠습니다");
  } else if (preview.stressDelta <= -5) {
    parts.push("스트레스가 한결 풀리겠습니다");
  }
  if (preview.conditionDelta >= 5) {
    parts.push("컨디션도 회복될 겁니다");
  }
  const risk = injuryRiskLabel(preview.injuryProbability);
  if (risk) {
    parts.push(risk);
  }
  return `${parts.join(". ")}.`;
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

interface TrainingProps {
  onBack: () => void;
}

export function Training({ onBack }: TrainingProps) {
  const trainees = useTraineeStore((s) => s.trainees);
  const trainingSchedule = useGameStore((s) => s.trainingSchedule);
  const upgrades = useFinanceStore((s) => s.upgrades);
  const staff = useStaffStore((s) => s.staff);
  const currentAlbum = useAlbumStore((s) => s.currentAlbum);
  const [openTraineeId, setOpenTraineeId] = useState<string | null>(null);

  const manager = staff.find((member) => member.role === "manager") ?? null;
  const albumConcept = currentAlbum?.concept.mood ?? null;

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
    <TabPanel title="트레이닝" onBack={onBack}>
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
              이번 주 연습은 {STAT_LABELS[trainingSchedule.focus]} 위주로 진행합니다
            </p>
          )}
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-900/40 px-3 py-3">
          <div>
            <p className="text-sm text-slate-100">휴식일</p>
            <p className="text-[11px] text-slate-400">
              일주일에 하루는 완전히 쉬어갑니다. 숨을 돌리는 대신 연습 진도는 조금 늦어집니다
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
            const preview = previewTraineeWeek(
              trainee,
              {
                intensity: trainingSchedule.intensity,
                focus: trainingSchedule.focus ?? undefined,
                restDay: trainingSchedule.restDay,
              },
              manager,
              albumConcept,
              {
                dormLevel: upgrades.dormLevel,
                studioLevel: upgrades.studioLevel,
              },
            );
            const activityWarning = ACTIVITY_OPTIONS.find(
              (opt) => opt.key === activity,
            )?.warning;
            const effectiveSatisfaction = getEffectiveSatisfaction(
              trainee.satisfaction,
              upgrades.dormLevel,
              upgrades.livingExpenseLevel,
            );
            const moodIcon = statusIcon("mood", effectiveSatisfaction);
            const stressIcon = statusIcon("stress", trainee.stress);
            const conditionIcon = statusIcon("condition", trainee.condition);

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
                    const value = Math.round(trainee.stats[key]);
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
                  <span className={moodIcon.tone} title={moodIcon.title}>
                    {moodIcon.icon} 만족
                  </span>
                  <span className={stressIcon.tone} title={stressIcon.title}>
                    {stressIcon.icon} 스트레스
                  </span>
                  <span className={conditionIcon.tone} title={conditionIcon.title}>
                    {conditionIcon.icon} 컨디션
                  </span>
                  {best && best.value >= 30 && (
                    <span
                      className="text-pink-200"
                      title={`${withJosa(best.name, "과/와")} 합이 잘 맞습니다`}
                    >
                      ♥ {best.name}
                    </span>
                  )}
                  {conflict && (
                    <span
                      className="text-red-300"
                      title={`${withJosa(conflict.name, "과/와")} 사이가 좋지 않습니다`}
                    >
                      ⚡ {conflict.name}
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
                  <p className="text-[10px] text-slate-400">
                    {formatPreview(preview)}
                  </p>
                  {!injured && activityWarning && (
                    <p className="text-[10px] text-pink-200">⚠ {activityWarning}</p>
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
    </TabPanel>
  );
}
