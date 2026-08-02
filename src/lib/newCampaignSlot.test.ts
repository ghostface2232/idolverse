import { beforeEach, describe, expect, it, vi } from "vitest";

const upserts: Array<Record<string, unknown>> = [];
/** 슬롯에 남아 있는 서버 세이브의 revision. null이면 빈 슬롯. */
let serverRevision: number | null = null;

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            abortSignal: () => ({
              maybeSingle: async () => ({
                data:
                  serverRevision === null
                    ? null
                    : { save_revision: serverRevision },
                error: null,
              }),
            }),
          }),
        }),
      }),
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

import { prepareSlotForNewCampaign, saveGame } from "@/lib/saveSystem";
import { makeGameSnapshot, toGameStateSnapshot } from "@/test/gameStateFixture";

describe("점유된 슬롯 위 새 캠페인 시작", () => {
  beforeEach(() => {
    upserts.length = 0;
    serverRevision = null;
  });

  it("기존 세이브가 남은 슬롯은 서버 revision을 시드해 첫 저장이 그 위로 이어진다", async () => {
    serverRevision = 50;
    await prepareSlotForNewCampaign("new-campaign-user-a", 1);

    // 새 캠페인 상태는 revision 0에서 시작한다.
    const state = toGameStateSnapshot(makeGameSnapshot({ week: 1 }));
    state.gameStore.saveRevision = 0;
    const result = await saveGame("new-campaign-user-a", 1, state);

    // 시드 없이는 revision 1이 나가 DB 비증가 가드에 거부됐을 저장이다.
    expect(result.saveRevision).toBe(51);
    expect(upserts[0]?.save_revision).toBe(51);
  });

  it("빈 슬롯에서는 시드 없이 revision 1부터 시작한다", async () => {
    await prepareSlotForNewCampaign("new-campaign-user-b", 1);

    const state = toGameStateSnapshot(makeGameSnapshot({ week: 1 }));
    state.gameStore.saveRevision = 0;
    const result = await saveGame("new-campaign-user-b", 1, state);

    expect(result.saveRevision).toBe(1);
  });

  it("직전 캠페인의 지문 캐시를 비워, 같은 내용이라도 새 캠페인 첫 저장은 실제로 업서트한다", async () => {
    const state = toGameStateSnapshot(makeGameSnapshot({ week: 1 }));
    state.gameStore.saveRevision = 0;
    await saveGame("new-campaign-user-c", 1, state);
    expect(upserts).toHaveLength(1);

    // 같은 내용을 그대로 다시 저장하면 dedup이 업서트를 생략하지만,
    serverRevision = 1;
    await saveGame("new-campaign-user-c", 1, state);
    expect(upserts).toHaveLength(1);

    // 새 캠페인 준비 뒤에는 같은 내용이라도 다시 업서트한다.
    await prepareSlotForNewCampaign("new-campaign-user-c", 1);
    const rerun = await saveGame("new-campaign-user-c", 1, state);
    expect(upserts).toHaveLength(2);
    expect(rerun.saveRevision).toBe(2);
  });
});
