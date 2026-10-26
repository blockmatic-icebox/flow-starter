/** Deterministic PRNG (mulberry32-style) for reproducible demo seed. */
export const createRng = (seed: string) => {
  let state = 0;
  for (const char of seed) {
    state = (state * 31 + (char.codePointAt(0) ?? 0)) % 2_147_483_647;
  }
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
};

export const pick = <T>(rng: () => number, items: readonly T[]) =>
  items[Math.floor(rng() * items.length)] as T;

export const bulkId = (index: number) =>
  `00000000-0000-5000-8000-${String(index).padStart(12, "0")}`;
