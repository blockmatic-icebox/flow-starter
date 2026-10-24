export interface CapStore {
  incr: (key: string) => Promise<number>;
}

const memoryCounts = new Map<string, number>();

export const memoryCapStore = (): CapStore => ({
  incr: (key) => {
    const next = (memoryCounts.get(key) ?? 0) + 1;
    memoryCounts.set(key, next);
    return Promise.resolve(next);
  },
});
