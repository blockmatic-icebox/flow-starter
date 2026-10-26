export const isIfEmptySeedMode = (env: NodeJS.ProcessEnv = process.env) =>
  env.FI_SEED_IF_EMPTY === "1" || env.FI_SEED_MODE === "if-empty";

export const isDestructiveSeedMode = (env: NodeJS.ProcessEnv = process.env) =>
  !isIfEmptySeedMode(env);
