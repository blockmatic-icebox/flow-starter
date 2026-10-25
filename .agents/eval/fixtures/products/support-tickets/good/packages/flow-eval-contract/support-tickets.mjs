export function runAcceptance() {
  const tickets = [];
  const createTicket = ({ title }) => {
    const id = String(tickets.length + 1);
    tickets.push({ id, owner: null, status: "open", title });
    return id;
  };
  const assignOwner = ({ id, owner }) => {
    const row = tickets.find((t) => t.id === id);
    if (!row) throw new Error("missing ticket");
    row.owner = owner;
  };
  const transition = ({ id, status }) => {
    const row = tickets.find((t) => t.id === id);
    if (!row) throw new Error("missing ticket");
    row.status = status;
  };
  const search = ({ q }) =>
    tickets.filter((t) => t.title.toLowerCase().includes(q.toLowerCase()));

  const id = createTicket({ title: "VPN down" });
  assignOwner({ id, owner: "alex" });
  transition({ id, status: "in_progress" });
  transition({ id, status: "resolved" });
  if (search({ q: "vpn" }).length !== 1) throw new Error("search failed");
}
