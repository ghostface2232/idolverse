import { describe, expect, it } from "vitest";
import {
  CONTRACT_SENTIMENT_SATISFIED_MIN,
  CONTRACT_TERM_WEEKS,
  SATISFACTION_WARNING_THRESHOLD,
} from "@/data/balance";
import {
  getContractRemainingWeeks,
  getContractSentiment,
} from "@/systems/contractSystem";

describe("contractSystem", () => {
  it("현재 연도와 주차에서 전속계약 잔여 주를 계산한다", () => {
    expect(getContractRemainingWeeks(1, 1)).toBe(CONTRACT_TERM_WEEKS);
    expect(getContractRemainingWeeks(2, 1)).toBe(CONTRACT_TERM_WEEKS - 52);
    expect(getContractRemainingWeeks(4, 52)).toBe(0);
  });

  it("만족도를 계약에 대한 현재 생각 세 구간으로 분류한다", () => {
    expect(getContractSentiment(SATISFACTION_WARNING_THRESHOLD)).toBe(
      "dissatisfied",
    );
    expect(getContractSentiment(SATISFACTION_WARNING_THRESHOLD + 1)).toBe(
      "neutral",
    );
    expect(getContractSentiment(CONTRACT_SENTIMENT_SATISFIED_MIN)).toBe(
      "satisfied",
    );
  });
});
