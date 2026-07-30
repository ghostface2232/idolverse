import type { TraineeStatKey } from "@/types/game";

/** 능력치 표시 순서. UI에서 스탯을 나열할 때는 항상 이 순서를 따른다. */
export const STAT_KEYS: TraineeStatKey[] = [
  "visual",
  "vocal",
  "dance",
  "charm",
  "stamina",
  "mental",
];

export const STAT_LABELS: Record<TraineeStatKey, string> = {
  visual: "비주얼",
  vocal: "보컬",
  dance: "댄스",
  charm: "끼",
  stamina: "체력",
  mental: "멘탈",
};

/** 값 구간별 바 색: 61 이상 안정, 31 이상 보통, 그 아래 위험 */
export function statBarColor(value: number): string {
  if (value >= 61) return "bg-state-success";
  if (value >= 31) return "bg-state-warning";
  return "bg-state-danger";
}
