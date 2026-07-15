export interface CoordinatedSaveResult<T> {
  value: T;
  revision: number;
}

/**
 * Serializes writes per save slot and assigns a strictly increasing revision.
 * The database independently rejects non-increasing revisions, so this queue
 * handles same-session ordering while the DB guard covers stale tabs/clients.
 */
export class SaveCoordinator {
  private readonly tails = new Map<string, Promise<void>>();
  private readonly revisions = new Map<string, number>();

  noteLoadedRevision(key: string, revision: number) {
    const normalized = normalizeRevision(revision);
    this.revisions.set(key, Math.max(this.revisions.get(key) ?? 0, normalized));
  }

  enqueue<T>(
    key: string,
    baseRevision: number,
    operation: (revision: number) => Promise<T>,
  ): Promise<CoordinatedSaveResult<T>> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    const task = previous.then(async () => {
      const revision =
        Math.max(
          this.revisions.get(key) ?? 0,
          normalizeRevision(baseRevision),
        ) + 1;
      const value = await operation(revision);
      this.revisions.set(key, revision);
      return { value, revision };
    });
    const tail = task.then(
      () => undefined,
      () => undefined,
    );
    this.tails.set(key, tail);
    tail.then(() => {
      if (this.tails.get(key) === tail) this.tails.delete(key);
    });
    return task;
  }

  forget(key: string) {
    this.revisions.delete(key);
  }
}

function normalizeRevision(value: number) {
  return Number.isSafeInteger(value) && value >= 0 ? value : 0;
}
