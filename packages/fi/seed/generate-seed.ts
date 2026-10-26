import { assembleCrewdaySeed } from "./assemble-seed";
import type { GeneratedSeed } from "./types";

export const generateSeed = (): GeneratedSeed => assembleCrewdaySeed();
