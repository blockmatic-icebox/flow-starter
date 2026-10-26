export const jsonError = ({
  code,
  message,
  resolution,
  status,
}: {
  code: string;
  message: string;
  resolution: string;
  status: number;
}) =>
  Response.json(
    {
      code,
      error: message,
      resolution,
      type: "https://is-agentic.com/docs#errors",
    },
    {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      status,
    }
  );
