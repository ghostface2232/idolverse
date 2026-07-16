import { describe, expect, it } from "vitest";
import { directDebutPacing } from "@/systems/pacingDirector";

describe("pacingDirector", () => {
  it("개인 사건·라이벌·공개 평가를 각 보장 창 안에 결정론적으로 배치한다", () => {
    const seed = 1028;
    const all = directDebutPacing(20, new Set(), seed);
    const byKind = new Map(all.map((beat) => [beat.kind, beat]));
    expect(byKind.get("personal")?.targetWeek).toBeGreaterThanOrEqual(2);
    expect(byKind.get("personal")?.targetWeek).toBeLessThanOrEqual(4);
    expect(byKind.get("rival")?.targetWeek).toBeGreaterThanOrEqual(8);
    expect(byKind.get("rival")?.targetWeek).toBeLessThanOrEqual(12);
    expect(byKind.get("public-evaluation")?.targetWeek).toBeGreaterThanOrEqual(12);
    expect(byKind.get("public-evaluation")?.targetWeek).toBeLessThanOrEqual(16);
    expect(directDebutPacing(20, new Set(), seed)).toEqual(all);
  });

  it("이미 발생한 사건은 다시 지시하지 않는다", () => {
    const beats = directDebutPacing(
      20,
      new Set(["debut-personal-strength", "debut-rival-arrival"]),
      1028,
    );
    expect(beats.map((beat) => beat.kind)).toEqual(["public-evaluation"]);
  });
});
