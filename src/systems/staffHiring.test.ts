import { describe, expect, it } from "vitest";
import { FOUNDING_STAFF_ABILITY_CAP, STAFF_HIRING } from "@/data/balance";
import { generateStaffCandidates } from "@/systems/recruitSystem";
import type { Staff } from "@/types/game";

function sampleFoundingPool(batches: number): Staff[] {
  const pool: Staff[] = [];
  for (let seed = 1; seed <= batches; seed++) {
    pool.push(
      ...generateStaffCandidates("producer", seed * 101, 4, FOUNDING_STAFF_ABILITY_CAP),
    );
  }
  return pool;
}

describe("창단 스태프 채용 풀 분포", () => {
  const pool = sampleFoundingPool(50); // 200명, 시드 고정이라 결정론

  it("능력은 10~60 전 구간에서 나온다", () => {
    for (const staff of pool) {
      expect(staff.ability).toBeGreaterThanOrEqual(STAFF_HIRING.abilityMin);
      expect(staff.ability).toBeLessThanOrEqual(FOUNDING_STAFF_ABILITY_CAP);
    }
    // 저편중 분포: 바닥 근처와 중간대가 실제로 등장한다.
    expect(pool.some((staff) => staff.ability < 20)).toBe(true);
    expect(pool.some((staff) => staff.ability >= 40)).toBe(true);
  });

  it("45 이상은 드물게 나온다", () => {
    const highShare =
      pool.filter((staff) => staff.ability >= 45).length / pool.length;
    expect(highShare).toBeGreaterThan(0); // 아예 안 나오면 상위 채용이 죽는다.
    expect(highShare).toBeLessThan(0.3);
  });

  it("월급은 능력을 따라가되 완전 비례하지는 않는다", () => {
    const sorted = [...pool].sort((a, b) => a.ability - b.ability);
    const quartile = Math.floor(sorted.length / 4);
    const avg = (list: Staff[]) =>
      list.reduce((sum, staff) => sum + staff.salary, 0) / list.length;
    const bottomAvg = avg(sorted.slice(0, quartile));
    const topAvg = avg(sorted.slice(-quartile));
    expect(topAvg).toBeGreaterThan(bottomAvg * 1.3);

    // 협상 편차: 능력이 높은데 월급은 더 싼 역전 쌍이 존재한다.
    const inversion = pool.some((a) =>
      pool.some((b) => a.ability > b.ability + 5 && a.salary < b.salary),
    );
    expect(inversion).toBe(true);
  });
});
