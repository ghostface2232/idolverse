import { describe, expect, it } from "vitest";
import { getMarketStanding } from "@/data/marketStanding";

describe("getMarketStanding", () => {
  it("실제 해금 구간에 맞춰 코어 팬덤 체급을 반환한다", () => {
    expect(getMarketStanding("fandom", 49)).toMatchObject({
      label: "팬콘 매진권",
      nextLabel: "아레나 투어급",
      tierIndex: 3,
    });
    expect(getMarketStanding("fandom", 50)).toMatchObject({
      label: "아레나 투어급",
      nextLabel: "고척돔 입성권",
      tierIndex: 4,
    });
  });

  it("최고 단계에서는 다음 단계가 없다", () => {
    expect(getMarketStanding("global", 100)).toMatchObject({
      label: "글로벌 헤드라이너",
      nextLabel: null,
    });
  });

  it("유효하지 않은 값은 시작 단계로 안전하게 처리한다", () => {
    expect(getMarketStanding("public", Number.NaN).label).toBe(
      "인지도 쌓는 중",
    );
  });
});
