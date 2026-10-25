export const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
