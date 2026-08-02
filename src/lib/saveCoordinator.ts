export interface CoordinatedSaveResult<T> {
  value: T;
  revision: number;
}

interface PendingSave {
  baseRevision: number;
  operation: (revision: number) => Promise<unknown>;
  settlers: Array<{
    resolve: (result: CoordinatedSaveResult<unknown>) => void;
    reject: (error: unknown) => void;
  }>;
}

/**
 * Serializes writes per save slot and assigns a strictly increasing revision.
 * The database independently rejects non-increasing revisions, so this queue
 * handles same-session ordering while the DB guard covers stale tabs/clients.
 *
 * 대기 병합: 진행 중인 저장이 끝나기 전에 새 스냅샷이 오면, 아직 시작하지
 * 않은 대기 저장을 최신 스냅샷으로 교체한다(슬롯당 대기 1건). 스냅샷은
 * 누적 상태라 최신본이 이전 변경을 전부 포함하므로, 교체된 호출들도 최신
 * 저장 결과로 함께 해소된다 — 연속 저장 폭주가 업서트 2건(진행 중 1 + 최신
 * 1)으로 줄어드는 서버 부하 완충 장치다.
 */
export class SaveCoordinator {
  private readonly revisions = new Map<string, number>();
  private readonly inFlight = new Set<string>();
  private readonly pending = new Map<string, PendingSave>();

  noteLoadedRevision(key: string, revision: number) {
    const normalized = normalizeRevision(revision);
    this.revisions.set(key, Math.max(this.revisions.get(key) ?? 0, normalized));
  }

  enqueue<T>(
    key: string,
    baseRevision: number,
    operation: (revision: number) => Promise<T>,
  ): Promise<CoordinatedSaveResult<T>> {
    return new Promise<CoordinatedSaveResult<T>>((resolve, reject) => {
      const settler = {
        resolve: resolve as (result: CoordinatedSaveResult<unknown>) => void,
        reject,
      };
      const waiting = this.pending.get(key);
      if (waiting) {
        waiting.baseRevision = Math.max(
          waiting.baseRevision,
          normalizeRevision(baseRevision),
        );
        waiting.operation = operation as PendingSave["operation"];
        waiting.settlers.push(settler);
        return;
      }

      this.pending.set(key, {
        baseRevision: normalizeRevision(baseRevision),
        operation: operation as PendingSave["operation"],
        settlers: [settler],
      });
      if (!this.inFlight.has(key)) {
        void this.run(key);
      }
    });
  }

  private async run(key: string) {
    const entry = this.pending.get(key);
    if (!entry) return;
    this.pending.delete(key);
    this.inFlight.add(key);

    const revision =
      Math.max(this.revisions.get(key) ?? 0, entry.baseRevision) + 1;
    try {
      const value = await entry.operation(revision);
      this.revisions.set(key, revision);
      for (const settler of entry.settlers) {
        settler.resolve({ value, revision });
      }
    } catch (error) {
      for (const settler of entry.settlers) {
        settler.reject(error);
      }
    } finally {
      this.inFlight.delete(key);
      if (this.pending.has(key)) {
        void this.run(key);
      }
    }
  }

  forget(key: string) {
    this.revisions.delete(key);
  }
}

function normalizeRevision(value: number) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
