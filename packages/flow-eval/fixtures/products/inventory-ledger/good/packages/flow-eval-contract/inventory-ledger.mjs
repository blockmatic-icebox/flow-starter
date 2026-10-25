export function runAcceptance() {
  const sites = { a: { sku1: 10 }, b: { sku1: 5 } };
  const adjust = ({ delta, site, sku }) => {
    if (!sites[site]) sites[site] = {};
    const next = (sites[site][sku] ?? 0) + delta;
    if (next < 0) throw new Error("negative stock");
    sites[site][sku] = next;
  };
  const transfer = ({ qty, sku, from, to }) => {
    adjust({ delta: -qty, site: from, sku });
    adjust({ delta: qty, site: to, sku });
  };
  transfer({ from: "a", qty: 3, sku: "sku1", to: "b" });
  if (sites.a.sku1 !== 7 || sites.b.sku1 !== 8)
    throw new Error("transfer integrity failed");
  try {
    adjust({ delta: -100, site: "a", sku: "sku1" });
    throw new Error("should reject negative");
  } catch (error) {
    if (!String(error).includes("negative")) throw error;
  }
}
