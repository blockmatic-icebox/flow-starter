export function runAcceptance() {
  const shifts = [];
  const requests = [];
  const publish = ({ employee, start, end }) => {
    if (end <= start) throw new Error("invalid shift");
    const overlap = shifts.some(
      (s) => s.employee === employee && start < s.end && end > s.start
    );
    if (overlap) throw new Error("conflict");
    shifts.push({ employee, end, start });
  };
  const requestTimeOff = ({ employee, day }) => {
    requests.push({ day, employee, status: "pending" });
  };
  const approve = ({ employee, day }) => {
    const row = requests.find(
      (r) => r.employee === employee && r.day === day && r.status === "pending"
    );
    if (!row) throw new Error("missing request");
    row.status = "approved";
  };
  publish({ employee: "sam", end: 17, start: 9 });
  requestTimeOff({ day: "2026-11-01", employee: "sam" });
  approve({ day: "2026-11-01", employee: "sam" });
  if (requests[0].status !== "approved") throw new Error("approval failed");
}
