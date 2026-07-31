import { useState } from "react";
import {
  Heart,
  Minus,
  Music,
  TriangleAlert,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/common/Card";
import { TabPanel } from "@/components/common/TabPanel";
import { radioTileClasses } from "@/components/common/selectionTokens";
import { TraineeDetail } from "@/components/TraineeDetail";
import { MemberPortrait } from "@/components/visual/MemberPortrait";
import { SceneThumb } from "@/components/visual/SceneThumb";
import type { SceneKey } from "@/data/sceneArt";
import {
  CHEMISTRY_CONFLICT_THRESHOLD,
  INJURY_RISK_CRITICAL_THRESHOLD,
  INJURY_RISK_WARNING_THRESHOLD,
} from "@/data/balance";
import { POSITION_LABELS } from "@/data/founding";
import { STAT_KEYS, STAT_LABELS } from "@/data/traineeStats";
import { useAlbumStore } from "@/stores/albumStore";
import { useFinanceStore } from "@/stores/financeStore";
import { gameVanillaStore, useGameStore } from "@/stores/gameStore";
import { useStaffStore } from "@/stores/staffStore";
import { traineeVanillaStore, useTraineeStore } from "@/stores/traineeStore";
import { toCumulativeWeek } from "@/systems/progressionSystem";
import { getEffectiveSatisfaction } from "@/systems/satisfactionSystem";
import {
  countContractSlotsByTrainee,
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

const INTENSITY_OPTIONS: {
  key: TrainingIntensity;
  label: string;
  description: string;
}[] = [
  { key: "normal", label: "보통", description: "무리 없는 페이스로 꾸준히 갑니다" },
  { key: "hard", label: "강화", description: "성장은 빠르지만 피로가 쌓입니다" },
  { key: "extreme", label: "극한", description: "성과는 크지만 몸과 마음이 버텨줘야 합니다" },
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
  scene: SceneKey;
  warning?: string;
}[] = [
  { key: "training", label: "훈련", scene: "practice" },
  {
    key: "entertainment",
    label: "예능",
    scene: "variety",
    warning: "연습 대신 방송에 나갑니다. 반응은 열어봐야 압니다",
  },
  {
    key: "individual",
    label: "개인 레슨",
    scene: "lesson",
    warning: "개인 기량은 늘지만 팀 케미는 멈춥니다",
  },
  { key: "rest", label: "휴식", scene: "dorm" },
];

const ACTIVITY_LABEL: Record<Exclude<TraineeActivity, null>, string> = {
  training: "훈련 중",
  entertainment: "예능 출연",
  individual: "개인 레슨",
  rest: "휴식",
  vacation: "휴가",
};

const ACTIVITY_TONE: Record<Exclude<TraineeActivity, null>, string> = {
  training: "border-activity-training/40 bg-activity-training/10 text-activity-training",
  entertainment: "border-action-primary/40 bg-action-primary/10 text-pink-200",
  individual: "border-activity-office/40 bg-activity-office/10 text-activity-office",
  rest: "border-activity-rest/40 bg-activity-rest/10 text-activity-rest",
  vacation: "border-activity-rest/40 bg-activity-rest/10 text-activity-rest",
};

function statusIcon(
  kind: "mood" | "stress" | "condition",
  value: number,
): { Icon: LucideIcon; tone: string; title: string } {
  const noun =
    kind === "mood" ? "만족도" : kind === "stress" ? "스트레스" : "컨디션";
  if (kind === "stress") {
    if (value >= 70) return { Icon: X, tone: "text-state-danger", title: "스트레스가 높습니다" };
    if (value >= 40) return { Icon: Minus, tone: "text-state-warning", title: "스트레스가 쌓이고 있습니다" };
    return { Icon: Music, tone: "text-state-success", title: "스트레스는 걱정 없는 수준입니다" };
  }
  if (value >= 70) return { Icon: Heart, tone: "text-state-success", title: `${withJosa(noun, "이/가")} 좋습니다` };
  if (value >= 40) return { Icon: Minus, tone: "text-state-warning", title: `${withJosa(noun, "은/는")} 무난한 편입니다` };
  return { Icon: X, tone: "text-state-danger", title: `${withJosa(noun, "이/가")} 좋지 않습니다` };
}

function injuryRiskLabel(probability: number): string | null {
  // 확률 수치를 그대로 노출하지 않고 트레이너의 어조로 옮긴다.
  if (probability <= 0) return null;
  if (probability < INJURY_RISK_WARNING_THRESHOLD) return null;
  if (probability < INJURY_RISK_CRITICAL_THRESHOLD) return "몸에 무리가 갈 수 있어 보입니다";
  return "이대로면 부상이 걱정됩니다";
}

// 정확한 성장/델타 수치는 사전 공개하지 않는다(결과로만 힌트). 매니저의
// 어조로 이번 주 흐름만 전달한다. 문장은 최대 2개: 모드 1 + 리스크/피로 1.
function formatPreview(preview: TraineeWeekPreview): string {
  const growthEntries = Object.entries(preview.statGrowth).filter(
    ([, value]) => (value ?? 0) > 0,
  );
  const totalGrowth = growthEntries.reduce((sum, [, v]) => sum + (v ?? 0), 0);

  let modeSentence: string;
  if (preview.mode === "injured") {
    modeSentence = "이번 주는 치료와 회복에 전념시키겠습니다";
  } else if (preview.mode === "entertainment") {
    modeSentence = "이번 주는 방송 스케줄을 소화합니다";
  } else if (preview.mode === "individual" && growthEntries.length === 1) {
    const [stat] = growthEntries[0];
    modeSentence = `${STAT_LABELS[stat as TraineeStatKey]} 실력이 눈에 띄게 붙을 것으로 보입니다`;
  } else if (preview.mode === "rest") {
    modeSentence = "푹 쉬면서 재충전합니다";
  } else if (totalGrowth >= 0.5) {
    modeSentence = "훈련 성과가 잘 나올 것 같습니다";
  } else if (totalGrowth > 0) {
    modeSentence = "성장세는 완만할 것으로 보입니다";
  } else {
    modeSentence = "이번 주는 연습 진도가 없습니다";
  }

  // 부상 경고가 항상 최우선, 없으면 피로/회복 중 하나만 덧붙인다.
  let secondSentence = injuryRiskLabel(preview.injuryProbability);
  if (!secondSentence) {
    if (preview.stressDelta >= 10) {
      secondSentence = "피로가 상당히 쌓일 겁니다";
    } else if (preview.stressDelta >= 5) {
      secondSentence = "피로가 눈에 띄게 쌓이겠습니다";
    } else if (preview.stressDelta <= -15) {
      secondSentence = "스트레스가 크게 풀리겠습니다";
    } else if (preview.stressDelta <= -5) {
      secondSentence = "스트레스가 한결 풀리겠습니다";
    } else if (preview.conditionDelta >= 5) {
      secondSentence = "컨디션도 회복될 겁니다";
    }
  }

  return secondSentence
    ? `${modeSentence}. ${secondSentence}.`
    : `${modeSentence}.`;
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

function topStrengths(trainee: Trainee): TraineeStatKey[] {
  return [...STAT_KEYS]
    .sort((a, b) => trainee.stats[b] - trainee.stats[a])
    .slice(0, 2);
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
              "flex min-h-11 items-center rounded-full border px-4 text-xs transition duration-150 ease-out active:scale-[0.96]",
              active ? "text-text-primary" : "text-text-secondary",
              radioTileClasses(active, true),
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
  const activeCommercialContracts = useGameStore(
    (s) => s.activeCommercialContracts,
  );
  const currentYear = useGameStore((s) => s.currentYear);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const upgrades = useFinanceStore((s) => s.upgrades);
  const staff = useStaffStore((s) => s.staff);
  const currentAlbum = useAlbumStore((s) => s.currentAlbum);
  const [openTraineeId, setOpenTraineeId] = useState<string | null>(null);

  const manager = staff.find((member) => member.role === "manager") ?? null;
  const albumConcept = currentAlbum?.concept.mood ?? null;
  // 광고·OST 일정 중인 멤버의 프리뷰가 실제 주간 처리와 같은 성장 페널티를
  // 보여주도록, weekProcessor와 동일한 집계를 쓴다.
  const contractSlotsByTrainee = countContractSlotsByTrainee(
    activeCommercialContracts,
    trainees.map((t) => t.id),
    toCumulativeWeek(currentYear, currentWeek),
  );

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
          <p className="text-sm text-text-secondary">훈련 강도</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {INTENSITY_OPTIONS.map((opt) => {
              const active = trainingSchedule.intensity === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setIntensity(opt.key)}
                  className={[
                    "flex min-h-11 items-center justify-center rounded-2xl border-2 px-2 py-2 text-sm transition duration-150 ease-out active:scale-[0.96]",
                    active ? "text-text-primary" : "text-text-secondary",
                    radioTileClasses(active, true),
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-text-muted [word-break:keep-all]">
            {intensityDescription}
          </p>
        </div>

        <div>
          <p className="text-sm text-text-secondary">훈련 포커스</p>
          <div className="mt-2">
            <ToggleGroup
              value={trainingSchedule.focus}
              options={FOCUS_OPTIONS}
              onChange={setFocus}
            />
          </div>
          {trainingSchedule.focus !== null && (
            <p className="mt-2 text-[11px] text-text-muted [word-break:keep-all]">
              이번 주 연습은 {STAT_LABELS[trainingSchedule.focus]} 위주로 진행합니다
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-2xl bg-surface-shell/70 px-3 py-3">
          <div>
            <p className="text-sm text-text-primary">휴식일</p>
            <p className="text-[11px] text-text-muted [word-break:keep-all]">
              일주일에 하루는 완전히 쉬고, 연습 진도는 조금 늦춥니다
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={trainingSchedule.restDay}
            aria-label="휴식일"
            onClick={() => setRestDay(!trainingSchedule.restDay)}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center"
          >
            <span
              className={[
                "relative block h-7 w-12 rounded-full ring-1 ring-inset ring-white/10 transition-colors",
                trainingSchedule.restDay
                  ? "bg-action-primary/50"
                  : "bg-surface-raised",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute top-1 h-5 w-5 rounded-full bg-text-primary transition-transform",
                  trainingSchedule.restDay ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </span>
          </button>
        </div>
      </Card>

      <div className="space-y-3">
        {trainees.length === 0 ? (
          <Card className="text-center text-xs text-text-muted">
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
              contractSlotsByTrainee[trainee.id] ?? 0,
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
            const strengths = topStrengths(trainee);

            return (
              <Card key={trainee.id} className="space-y-3">
                <button
                  type="button"
                  onClick={() => setOpenTraineeId(trainee.id)}
                  className="flex min-h-11 w-full items-start justify-between gap-2 text-left"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <MemberPortrait traineeId={trainee.id} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {trainee.name}
                      </p>
                      <p className="truncate text-[11px] text-text-muted">
                        {trainee.position
                          ? POSITION_LABELS[trainee.position]
                          : "포지션 미배정"}
                        {trainee.subPosition
                          ? ` · ${POSITION_LABELS[trainee.subPosition]}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      "shrink-0 rounded-full border px-2 py-0.5 text-[11px]",
                      injured
                        ? "border-state-danger/50 bg-state-danger/10 text-state-danger"
                        : ACTIVITY_TONE[activity],
                    ].join(" ")}
                  >
                    {injured
                      ? `부상 회복 중 (${trainee.injuryWeeks}주 남음)`
                      : ACTIVITY_LABEL[activity]}
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px]">
                  {strengths.map((key) => (
                    <span
                      key={key}
                      className="rounded-md bg-white/[0.05] px-1.5 py-0.5 tabular-nums text-text-secondary"
                      title="팀에서 손꼽히는 강점입니다"
                    >
                      {STAT_LABELS[key]} {Math.round(trainee.stats[key])}
                    </span>
                  ))}
                  <span
                    className={["flex items-center gap-1", moodIcon.tone].join(" ")}
                    title={moodIcon.title}
                  >
                    <moodIcon.Icon className="size-3.5" aria-hidden="true" /> 만족
                  </span>
                  <span
                    className={["flex items-center gap-1", stressIcon.tone].join(" ")}
                    title={stressIcon.title}
                  >
                    <stressIcon.Icon className="size-3.5" aria-hidden="true" /> 스트레스
                  </span>
                  <span
                    className={["flex items-center gap-1", conditionIcon.tone].join(" ")}
                    title={conditionIcon.title}
                  >
                    <conditionIcon.Icon className="size-3.5" aria-hidden="true" /> 컨디션
                  </span>
                  {best && best.value >= 30 && (
                    <span
                      className="flex items-center gap-1 text-pink-200"
                      title={`${withJosa(best.name, "과/와")} 합이 잘 맞습니다`}
                    >
                      <Heart className="size-3.5" aria-hidden="true" /> {best.name}
                    </span>
                  )}
                  {conflict && (
                    <span
                      className="flex items-center gap-1 text-state-danger"
                      title={`${withJosa(conflict.name, "과/와")} 사이가 좋지 않습니다`}
                    >
                      <Zap className="size-3.5" aria-hidden="true" /> {conflict.name}
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
                            "flex min-h-11 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-xs transition duration-150 ease-out [word-break:keep-all]",
                            active ? "text-text-primary" : "text-text-secondary",
                            radioTileClasses(active, !injured),
                            injured
                              ? "cursor-not-allowed opacity-40"
                              : "active:scale-[0.96]",
                          ].join(" ")}
                        >
                          <SceneThumb
                            scene={opt.scene}
                            variant="chip"
                            className={active ? "" : "opacity-70"}
                          />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-text-muted [word-break:keep-all]">
                    {formatPreview(preview)}
                  </p>
                  {!injured && activityWarning && (
                    <p className="flex items-start gap-1 text-[11px] text-pink-200 [word-break:keep-all]">
                      <TriangleAlert
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{activityWarning}</span>
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
    </TabPanel>
  );
}
