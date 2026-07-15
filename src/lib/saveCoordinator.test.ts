import { describe, expect, it } from "vitest";
import { SaveCoordinator } from "@/lib/saveCoordinator";

describe("SaveCoordinator", () => {
  it("같은 슬롯의 저장을 호출 순서대로 직렬화하고 revision을 증가시킨다", async () => {
    const coordinator = new SaveCoordinator();
    const order: string[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = coordinator.enqueue("user:1", 4, async (revision) => {
      order.push(`first:start:${revision}`);
      await firstGate;
      order.push("first:end");
      return "first";
    });
    const second = coordinator.enqueue("user:1", 4, async (revision) => {
      order.push(`second:start:${revision}`);
      return "second";
    });

    await Promise.resolve();
    expect(order).toEqual(["first:start:5"]);
    releaseFirst();

    await expect(first).resolves.toEqual({ value: "first", revision: 5 });
    await expect(second).resolves.toEqual({ value: "second", revision: 6 });
    expect(order).toEqual(["first:start:5", "first:end", "second:start:6"]);
  });

  it("실패한 저장이 뒤의 저장 큐를 막지 않는다", async () => {
    const coordinator = new SaveCoordinator();
    const failed = coordinator.enqueue("user:1", 2, async () => {
      throw new Error("network");
    });
    const recovered = coordinator.enqueue("user:1", 2, async (revision) => revision);

    await expect(failed).rejects.toThrow("network");
    await expect(recovered).resolves.toEqual({ value: 3, revision: 3 });
  });

  it("로드한 서버 revision보다 낮은 스냅샷을 기준으로 삼지 않는다", async () => {
    const coordinator = new SaveCoordinator();
    coordinator.noteLoadedRevision("user:1", 9);

    await expect(
      coordinator.enqueue("user:1", 3, async (revision) => revision),
    ).resolves.toEqual({ value: 10, revision: 10 });
  });
});
