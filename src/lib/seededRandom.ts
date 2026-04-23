export function createSeededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickUniqueItems<T>(items: readonly T[], count: number, seed: number): T[] {
  const random = createSeededRandom(seed);
  const pool = [...items];
  const output: T[] = [];

  while (pool.length > 0 && output.length < count) {
    const index = Math.floor(random() * pool.length);
    output.push(pool.splice(index, 1)[0]);
  }

  return output;
}

