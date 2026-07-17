import {
  CONTRACT_SENTIMENT_SATISFIED_MIN,
  CONTRACT_TERM_WEEKS,
  GAME_BALANCE,
  SATISFACTION_WARNING_THRESHOLD,
} from "@/data/balance";

export type ContractSentiment = "satisfied" | "neutral" | "dissatisfied";

export function getContractRemainingWeeks(
  currentYear: number,
  currentWeek: number,
): number {
  const elapsedWeeks =
    (currentYear - 1) * GAME_BALANCE.weeksPerYear + currentWeek - 1;
  return Math.max(0, CONTRACT_TERM_WEEKS - elapsedWeeks);
}

export function getContractSentiment(satisfaction: number): ContractSentiment {
  if (satisfaction <= SATISFACTION_WARNING_THRESHOLD) return "dissatisfied";
  if (satisfaction >= CONTRACT_SENTIMENT_SATISFIED_MIN) return "satisfied";
  return "neutral";
}
