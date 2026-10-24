import type { CapStore } from "./cap-store";
import { CapStoreUnavailableError } from "./cap-store";

export const dailyIncrementScript = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
end
return count
`;

export interface RedisEvalClient {
  eval: (script: string, keys: string[], args: string[]) => Promise<unknown>;
}

const asCount = (value: unknown) => {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/u.test(value)) return Number(value);
  return null;
};

export const redisCapStore = ({
  redis,
}: {
  redis: RedisEvalClient;
}): CapStore => ({
  increment: async ({ key, ttlSeconds }) => {
    try {
      const value = await redis.eval(
        dailyIncrementScript,
        [key],
        [String(ttlSeconds)]
      );
      const count = asCount(value);
      if (count === null) throw new CapStoreUnavailableError();
      return count;
    } catch (error) {
      if (error instanceof CapStoreUnavailableError) throw error;
      throw new CapStoreUnavailableError();
    }
  },
});
