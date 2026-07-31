import { describe, expect, it } from "vitest";
import {
  formatKoreanWon,
  roundToMillionWon,
} from "@/utils/formatKoreanWon";

describe("formatKoreanWon", () => {
  it.each([
    [0, "0원"],
    [9_500, "1만 원"],
    [824_000, "82만 원"],
    [35_000_000, "3500만 원"],
    [35_400_000, "3500만 원"],
    [35_600_000, "3600만 원"],
    [100_000_000, "1억 원"],
    [120_400_000, "1억 2000만 원"],
    [1_234_005_000, "12억 3400만 원"],
    [-35_000_000, "-3500만 원"],
  ])("%i원을 %s로 표시한다", (amount, expected) => {
    expect(formatKoreanWon(amount)).toBe(expected);
  });

  it("금액 칩에서는 통화 기호를 쓰고 마지막 원 표기를 생략한다", () => {
    expect(formatKoreanWon(35_000_000, { symbol: true })).toBe("₩3500만");
    expect(formatKoreanWon(-824_000, { symbol: true })).toBe("-₩82만");
  });
});

describe("roundToMillionWon", () => {
  it("100만 원 미만 자릿수를 반올림한다", () => {
    expect(roundToMillionWon(35_400_000)).toBe(35_000_000);
    expect(roundToMillionWon(35_600_000)).toBe(36_000_000);
    expect(roundToMillionWon(-35_600_000)).toBe(-36_000_000);
  });
});
