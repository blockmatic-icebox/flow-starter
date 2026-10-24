export interface CapIncrement {
  key: string;
  ttlSeconds: number;
}

export interface CapStore {
  increment: (input: CapIncrement) => Promise<number>;
}

export class CapStoreUnavailableError extends Error {
  constructor() {
    super("cap-store-unavailable");
    this.name = "CapStoreUnavailableError";
  }
}

interface MemoryEntry {
  count: number;
  expiresAt: number;
}

export const memoryCapStore = ({
  now = () => Date.now(),
}: {
  now?: () => number;
} = {}): CapStore => {
  const counts = new Map<string, MemoryEntry>();
  return {
    increment: ({ key, ttlSeconds }) => {
      const time = now();
      const current = counts.get(key);
      if (!current || current.expiresAt <= time) {
        counts.set(key, { count: 1, expiresAt: time + ttlSeconds * 1000 });
        return Promise.resolve(1);
      }
      current.count += 1;
      return Promise.resolve(current.count);
    },
  };
};

let sharedMemory: CapStore | undefined;

export const sharedMemoryCapStore = () => {
  sharedMemory ??= memoryCapStore();
  return sharedMemory;
};

export const resetSharedMemoryCapStore = () => {
  sharedMemory = memoryCapStore();
};
