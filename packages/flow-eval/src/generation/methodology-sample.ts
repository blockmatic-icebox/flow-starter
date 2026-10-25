import { listPublicScenarioIds } from "../scenarios.ts";
import type { SeededRng } from "./rng.ts";

type MethodologyMeta = {
  id: string;
  category: string;
  domain: string;
  complexity: number;
};

const methodologyMeta: MethodologyMeta[] = [
  { id: "S01", category: "ambiguous", domain: "startup", complexity: 1 },
  { id: "S02", category: "specify", domain: "startup", complexity: 1 },
  { id: "S03", category: "plan", domain: "product", complexity: 2 },
  { id: "S04", category: "plan", domain: "product", complexity: 2 },
  { id: "S05", category: "build-auth", domain: "engineering", complexity: 2 },
  { id: "S07", category: "security", domain: "engineering", complexity: 2 },
  { id: "S09", category: "build", domain: "engineering", complexity: 2 },
  { id: "S13", category: "defect", domain: "engineering", complexity: 2 },
  { id: "S16", category: "build", domain: "engineering", complexity: 2 },
  { id: "S17", category: "review", domain: "product", complexity: 2 },
  { id: "S18", category: "adversarial", domain: "security", complexity: 3 },
];

export const stratifiedMethodologySample = ({
  count,
  rng,
}: {
  count: number;
  rng: SeededRng;
}) => {
  const known = new Set(listPublicScenarioIds());
  const pool = methodologyMeta.filter((m) => known.has(m.id));
  const byCategory = new Map<string, MethodologyMeta[]>();
  for (const row of pool) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }
  const categories = rng.shuffle([...byCategory.keys()]);
  const picked: string[] = [];
  const used = new Set<string>();
  let guard = 0;
  while (picked.length < count && guard < count * 20) {
    guard += 1;
    const category = categories[picked.length % categories.length];
    if (!category) continue;
    const candidates = (byCategory.get(category) ?? []).filter(
      (c) => !used.has(c.id)
    );
    if (!candidates.length) continue;
    const choice = rng.pick(candidates);
    picked.push(choice.id);
    used.add(choice.id);
  }
  if (picked.length < count) {
    for (const id of pool.map((p) => p.id)) {
      if (picked.length >= count) break;
      if (!used.has(id)) {
        picked.push(id);
        used.add(id);
      }
    }
  }
  return picked.slice(0, count);
};
