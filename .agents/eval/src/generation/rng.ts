export type SeededRng = {
  next: () => number;
  pick: <T>(items: readonly T[]) => T;
  shuffle: <T>(items: readonly T[]) => T[];
};

function pickItem<T>(items: readonly T[], roll: () => number): T {
  if (items.length === 0) {
    throw new Error("rng pick from empty list");
  }
  const index = Math.min(items.length - 1, Math.trunc(roll() * items.length));
  const item = items[index];
  if (item === undefined) {
    throw new Error("rng pick index out of range");
  }
  return item;
}

function shuffleItems<T>(items: readonly T[], roll: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.trunc(roll() * (i + 1));
    const left = copy[i];
    const right = copy[j];
    if (left === undefined || right === undefined) {
      continue;
    }
    copy[i] = right;
    copy[j] = left;
  }
  return copy;
}

export const createSeededRng = ({ seed }: { seed: string }): SeededRng => {
  let state = hashSeed(seed);
  const next = () => {
    state = Math.imul(state, 1_664_525) + 1_013_904_223;
    const normalized = state % 4_294_967_296;
    state = normalized < 0 ? normalized + 4_294_967_296 : normalized;
    return state / 4_294_967_296;
  };
  const roll = () => next();
  return {
    next,
    pick: (items) => pickItem(items, roll),
    shuffle: (items) => shuffleItems(items, roll),
  };
};

const hashSeed = (seed: string) => {
  let h = 2_166_136_261;
  for (let i = 0; i < seed.length; i += 1) {
    const cp = seed.codePointAt(i) ?? 0;
    h = Math.imul(31, h) + cp;
    h %= 2_147_483_647;
  }
  return h;
};

export const randomSeed = () =>
  `seed-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
