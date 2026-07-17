import { useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { traitLabels } from "@/data/memberTraits";
import {
  calculatePositionFitness,
  POSITION_LABELS,
  positionFitnessToRating,
  potentialToStars,
} from "@/data/founding";
import { getEffectiveSatisfaction } from "@/systems/satisfactionSystem";
import { CHEMISTRY_CONFLICT_THRESHOLD } from "@/data/balance";
import type { Position, Trainee, TraineeStatKey } from "@/types/game";
import { withJosa } from "@/utils/josa";

interface TraineeDetailProps {
  trainee: Trainee;
  trainees: readonly Trainee[];
  dormLevel: 1 | 2 | 3 | 4;
  livingExpenseLevel: 1 | 2 | 3 | 4;
  onClose: () => void;
}

const STAT_LABELS: Record<TraineeStatKey, string> = {
  visual: "비주얼",
  vocal: "보컬",
  dance: "댄스",
  charm: "끼",
  stamina: "체력",
  mental: "멘탈",
};

const STAT_KEYS: TraineeStatKey[] = [
  "visual",
  "vocal",
  "dance",
  "charm",
  "stamina",
  "mental",
];

const ALL_POSITIONS: Position[] = [
  "leader",
  "mainVocal",
  "mainDancer",
  "center",
  "visual",
  "variety",
  "producing",
];

function statTone(value: number): string {
  if (value >= 61) return "text-emerald-300";
  if (value >= 31) return "text-amber-300";
  return "text-red-300";
}

function statBarColor(value: number): string {
  if (value >= 61) return "bg-emerald-400";
  if (value >= 31) return "bg-amber-400";
  return "bg-red-400";
}

function fitnessTone(value: number): string {
  if (value >= 70) return "text-emerald-300 border-emerald-400/40 bg-emerald-400/10";
  if (value >= 40) return "text-amber-200 border-amber-400/40 bg-amber-400/10";
  return "text-red-300 border-red-400/40 bg-red-400/10";
}

function affinityColor(value: number): string {
  if (value >= 75) return "bg-pink-400";
  if (value >= 55) return "bg-pink-500/80";
  if (value >= 35) return "bg-slate-500";
  return "bg-slate-700";
}

function chemistryTone(value: number): string {
  if (value >= 30) return "text-emerald-300";
  if (value > 0) return "text-emerald-200/80";
  if (value > CHEMISTRY_CONFLICT_THRESHOLD) return "text-slate-400";
  return "text-red-300";
}

// 케미 내부 수치는 노출하지 않는다 — 관계의 온도만 전한다.
function chemistryLabel(value: number): string {
  if (value >= 30) return "합이 잘 맞습니다";
  if (value > 0) return "원만합니다";
  if (value > CHEMISTRY_CONFLICT_THRESHOLD) return "데면데면합니다";
  return "사이가 좋지 않습니다";
}

function pickComment(
  trainee: Trainee,
  effectiveSatisfaction: number,
  conflictPartner: string | null,
): string {
  if (conflictPartner) {
    return `${withJosa(conflictPartner, "이랑/랑")} 좀 힘들어요…`;
  }
  if (trainee.injuryWeeks > 0) {
    return "빨리 복귀할게요…";
  }
  if (trainee.stress >= 75) {
    return "좀 쉬고 싶어요…";
  }
  if (effectiveSatisfaction >= 70) {
    const high = ["오늘 컨디션 최고예요!", "이 콘셉트 너무 좋아요!"];
    return high[trainee.id.length % high.length];
  }
  if (effectiveSatisfaction >= 40) {
    const mid = ["열심히 할게요", "좀 더 쉬고 싶긴 한데…"];
    return mid[trainee.id.length % mid.length];
  }
  const low = [
    "저 이거 계속 해야 하나요…",
    "좀 쉬고 싶어요…",
    "회사가 절 신경 써주긴 하나요?",
  ];
  return low[trainee.id.length % low.length];
}

function buildRadarPath(values: number[], radius: number): string {
  const angleStep = (Math.PI * 2) / values.length;
  return values
    .map((v, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      const r = (v / 100) * radius;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

export function TraineeDetail({
  trainee,
  trainees,
  dormLevel,
  livingExpenseLevel,
  onClose,
}: TraineeDetailProps) {
  const radarSize = 220;
  const radarRadius = 80;
  const statValues = STAT_KEYS.map((k) => trainee.stats[k]);
  const radarPath = useMemo(
    () => buildRadarPath(statValues, radarRadius),
    [statValues],
  );

  const effectiveSatisfaction = getEffectiveSatisfaction(
    trainee.satisfaction,
    dormLevel,
    livingExpenseLevel,
  );

  const otherTrainees = trainees.filter((t) => t.id !== trainee.id);
  const chemistryEntries = otherTrainees
    .map((other) => ({
      id: other.id,
      name: other.name,
      value: trainee.chemistry[other.id] ?? 0,
    }))
    .sort((a, b) => b.value - a.value);

  const conflictPartner = chemistryEntries.find(
    (e) => e.value < CHEMISTRY_CONFLICT_THRESHOLD,
  );

  const comment = pickComment(
    trainee,
    effectiveSatisfaction,
    conflictPartner ? conflictPartner.name : null,
  );

  const angleStep = (Math.PI * 2) / STAT_KEYS.length;
  const labelOffset = radarRadius + 18;

  return (
    <Modal title={trainee.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {trainee.position
              ? POSITION_LABELS[trainee.position]
              : "포지션 미배정"}
          </span>
          <span title="트레이너들이 가늠한 잠재력입니다">
            잠재력 {"★".repeat(potentialToStars(trainee.potential))}
            {"☆".repeat(5 - potentialToStars(trainee.potential))}
          </span>
        </div>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-cyan">
            능력치
          </p>
          <div className="flex justify-center">
            <svg
              width={radarSize}
              height={radarSize}
              viewBox={`-${radarSize / 2} -${radarSize / 2} ${radarSize} ${radarSize}`}
              className="overflow-visible"
            >
              {[0.25, 0.5, 0.75, 1].map((scale) => (
                <polygon
                  key={scale}
                  points={STAT_KEYS.map((_, i) => {
                    const a = -Math.PI / 2 + i * angleStep;
                    const r = radarRadius * scale;
                    return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
                  }).join(" ")}
                  fill="none"
                  stroke="rgba(148,163,184,0.25)"
                  strokeWidth={1}
                />
              ))}
              {STAT_KEYS.map((_, i) => {
                const a = -Math.PI / 2 + i * angleStep;
                const x2 = (Math.cos(a) * radarRadius).toFixed(1);
                const y2 = (Math.sin(a) * radarRadius).toFixed(1);
                return (
                  <line
                    key={i}
                    x1={0}
                    y1={0}
                    x2={x2}
                    y2={y2}
                    stroke="rgba(148,163,184,0.25)"
                    strokeWidth={1}
                  />
                );
              })}
              <path
                d={radarPath}
                fill="rgba(236,72,153,0.32)"
                stroke="#ec4899"
                strokeWidth={2}
                strokeLinejoin="round"
              />
              {STAT_KEYS.map((key, i) => {
                const a = -Math.PI / 2 + i * angleStep;
                const lx = Math.cos(a) * labelOffset;
                const ly = Math.sin(a) * labelOffset;
                return (
                  <text
                    key={key}
                    x={lx}
                    y={ly}
                    fill="#cbd5f5"
                    fontSize="11"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {STAT_LABELS[key]} {Math.round(trainee.stats[key])}
                  </text>
                );
              })}
            </svg>
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-cyan">
            포지션 적합도
          </p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_POSITIONS.map((pos) => {
              const fitness = calculatePositionFitness(trainee.stats, pos);
              return (
                <div
                  key={pos}
                  className={[
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-xs",
                    fitnessTone(fitness),
                  ].join(" ")}
                >
                  <span>{POSITION_LABELS[pos]}</span>
                  <span className="font-medium">
                    {"★".repeat(positionFitnessToRating(fitness))}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 컨셉과의 어울림은 수치로 알려주지 않는다 — 특성을 보고 추측하고,
            발매 결과의 반응으로 확인하는 것이 컨텐츠다. */}
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-cyan">
            특성
          </p>
          <div className="flex flex-wrap gap-2">
            {traitLabels(trainee).map((label) => (
              <span
                key={label}
                className="rounded-full border border-pink-400/30 bg-pink-500/10 px-2.5 py-1 text-xs text-pink-200"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-[11px] leading-4 text-slate-500">
            어떤 컨셉과 만났을 때 빛나는지는 무대가 말해줍니다.
          </p>
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-cyan">
            케미 관계도
          </p>
          {chemistryEntries.length === 0 ? (
            <p className="text-xs text-slate-500">다른 멤버 정보가 없습니다.</p>
          ) : (
            <div className="space-y-1">
              {chemistryEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs"
                >
                  <span className="text-slate-200">{entry.name}</span>
                  <span className={chemistryTone(entry.value)}>
                    {chemistryLabel(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-cyan">
            상태
          </p>
          <div className="space-y-2 text-[11px]">
            {[
              {
                label: "만족도",
                value: effectiveSatisfaction,
                hint: `기본 ${Math.round(trainee.satisfaction)}`,
              },
              { label: "컨디션", value: trainee.condition, hint: null },
              { label: "스트레스", value: trainee.stress, hint: null },
            ].map(({ label, value, hint }) => (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between text-slate-300">
                  <span>{label}</span>
                  <span className={statTone(value)}>
                    {Math.round(value)}
                    {hint && (
                      <span className="ml-2 text-slate-500">({hint})</span>
                    )}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={["h-full rounded-full", statBarColor(value)].join(
                      " ",
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-brand-cyan">
            성장 추이 (최근 4주)
          </p>
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-4 text-center text-xs text-slate-500">
            아직 기록된 성장 변화가 없습니다.
          </div>
        </section>

        <section className="rounded-xl border border-pink-400/30 bg-pink-400/5 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-pink-200">
            한마디
          </p>
          <p className="mt-1 text-sm text-slate-100">"{comment}"</p>
        </section>
      </div>
    </Modal>
  );
}
