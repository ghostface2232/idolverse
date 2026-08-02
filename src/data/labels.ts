import type { EffectKey, GamePhase } from "@/types/game";
import { STAT_LABELS } from "@/data/traineeStats";

/**
 * 지표 표기 단일 사전.
 * 같은 지표가 화면마다 다른 이름으로 불리지 않도록, 사용자 노출 라벨은 반드시 여기서 가져온다.
 * 기준 표기는 weekDelta의 리포트 라벨과 일치시킨다.
 */
export const METRIC_LABELS: Record<EffectKey, string> = {
  money: "자금",
  public: "대중 인지도",
  fandom: "코어 팬덤",
  fandomLoyalty: "팬덤 충성도",
  fandomDisappointment: "팬 실망도",
  global: "해외 팬덤",
  industry: "업계 평판",
  investorPressure: "투자사 압박",
  condition: "컨디션",
  stress: "스트레스",
  satisfaction: "만족도",
  injuryWeeks: "부상 기간",
  chemistry: "팀 케미",
  ...STAT_LABELS,
  albumSong: "음원 완성도",
  albumChoreography: "안무 완성도",
  albumVisual: "비주얼 완성도",
  albumMarketing: "홍보 준비",
};

/** 진행 단계 표기 단일 사전. */
export const PHASE_LABELS: Record<GamePhase, string> = {
  prologue: "프롤로그",
  founding: "창단",
  training: "데뷔 준비",
  debut: "데뷔 활동",
  growth: "성장기",
  peak: "전성기",
};
