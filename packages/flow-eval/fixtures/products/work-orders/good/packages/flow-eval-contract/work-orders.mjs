export function runAcceptance() {
  const orders = [];
  const submit = ({ location, title }) => {
    if (!title?.trim()) throw new Error("validation");
    const id = String(orders.length + 1);
    orders.push({
      id,
      location,
      status: "requested",
      technician: null,
      title,
    });
    return id;
  };
  const schedule = ({ id, technician }) => {
    const row = orders.find((o) => o.id === id);
    if (!row) throw new Error("missing");
    row.status = "scheduled";
    row.technician = technician;
  };
  const complete = ({ id }) => {
    const row = orders.find((o) => o.id === id);
    if (!row) throw new Error("missing");
    row.status = "completed";
  };
  const id = submit({ location: "B2", title: "Leak" });
  schedule({ id, technician: "tech-1" });
  complete({ id });
  if (orders[0].status !== "completed") throw new Error("status drift");
}
