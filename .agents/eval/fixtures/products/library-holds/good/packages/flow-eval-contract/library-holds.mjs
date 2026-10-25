export function runAcceptance() {
  const catalog = [
    { id: "b1", title: "Dune" },
    { id: "b2", title: "Foundation" },
  ];
  const holds = [];
  const search = ({ q }) =>
    catalog.filter((b) => b.title.toLowerCase().includes(q.toLowerCase()));
  const placeHold = ({ bibId, patron }) => {
    if (holds.some((h) => h.bibId === bibId && h.patron === patron))
      throw new Error("duplicate hold");
    holds.push({ bibId, patron, status: "active" });
  };
  const cancelHold = ({ bibId, patron }) => {
    const idx = holds.findIndex(
      (h) => h.bibId === bibId && h.patron === patron && h.status === "active"
    );
    if (idx === -1) throw new Error("missing hold");
    holds[idx].status = "cancelled";
  };
  const pickup = ({ bibId, patron }) => {
    const row = holds.find(
      (h) => h.bibId === bibId && h.patron === patron && h.status === "active"
    );
    if (!row) throw new Error("missing hold");
    row.status = "picked_up";
  };
  if (search({ q: "dune" }).length !== 1) throw new Error("search");
  placeHold({ bibId: "b1", patron: "p1" });
  pickup({ bibId: "b1", patron: "p1" });
  placeHold({ bibId: "b2", patron: "p1" });
  cancelHold({ bibId: "b2", patron: "p1" });
}
