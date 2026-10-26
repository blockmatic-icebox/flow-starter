export const assertSeedAllowed = (env: NodeJS.ProcessEnv = process.env) => {
  if (env.NODE_ENV !== "production") return;

  if (env.FI_SEED_ALLOW_DESTRUCTIVE === "1") return;

  throw new Error(
    "Refusing destructive FI seed in production. Set FI_SEED_ALLOW_DESTRUCTIVE=1 only when you intend to wipe FI tables."
  );
};
