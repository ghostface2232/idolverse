import { beforeEach, describe, expect, it, vi } from "vitest";

const upserts: Array<Record<string, unknown>> = [];

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      upsert: (payload: Record<string, unknown>) => {
        upserts.push(payload);
        return {
          select: () => ({
            single: async () => ({
              data: {
                slot_number: payload.slot_number,
                save_name: payload.save_name,
                played_weeks: payload.played_weeks,
                current_phase: payload.current_phase,
                group_name: payload.group_name,
                save_revision: payload.save_revision,
                updated_at: "2026-08-02T00:00:00Z",
              },
              error: null,
            }),
          }),
        };
      },
    }),
  }),
}));

import { saveGame } from "@/lib/saveSystem";
import { makeGameSnapshot, toGameStateSnapshot } from "@/test/gameStateFixture";

describe("saveGame 중복 저장 완충", () => {
  beforeEach(() => {
    upserts.length = 0;
  });

  it("같은 내용의 연속 저장은 업서트를 생략하고 직전 결과를 돌려준다", async () => {
    const state = toGameStateSnapshot(makeGameSnapshot({ week: 9 }));

    const first = await saveGame("dedup-user-a", 1, state);
    const second = await saveGame("dedup-user-a", 1, state);

    expect(upserts).toHaveLength(1);
    expect(second.saveRevision).toBe(first.saveRevision);
  });

  it("내용이 달라지면 다시 업서트한다", async () => {
    const state = toGameStateSnapshot(makeGameSnapshot({ week: 9 }));
    await saveGame("dedup-user-b", 1, state);

    const changed = toGameStateSnapshot(makeGameSnapshot({ week: 9 }));
    changed.financeStore.money += 1;
    const result = await saveGame("dedup-user-b", 1, changed);

    expect(upserts).toHaveLength(2);
    expect(result.saveRevision).toBe(2);
  });
});
