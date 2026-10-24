/** Server-only. Do not import this module from Client Components. */

export type JsonRequestError =
  | "unsupported_media_type"
  | "payload_too_large"
  | "invalid_json"
  | "aborted";

export type ReadJsonRequestResult =
  | { ok: true; value: unknown }
  | { ok: false; error: JsonRequestError };

const jsonRequestStatuses = {
  aborted: 400,
  invalid_json: 400,
  payload_too_large: 413,
  unsupported_media_type: 415,
} as const;

const jsonRequestMessages = {
  aborted: "Request was aborted.",
  invalid_json: "Request body must be valid JSON.",
  payload_too_large: "Request body is too large.",
  unsupported_media_type: "Content-Type must be application/json.",
} as const;

export const jsonRequestStatus = (error: JsonRequestError) =>
  jsonRequestStatuses[error];

export const jsonRequestMessage = (error: JsonRequestError) =>
  jsonRequestMessages[error];

const charsetOk = (parameter: string) =>
  /^charset\s*=\s*"?utf-?8"?$/iu.test(parameter);

export const acceptsJsonContentType = (header: string | null) => {
  if (!header) return false;
  const parts = header
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const [mediaType, ...parameters] = parts;
  if (!mediaType || mediaType.toLowerCase() !== "application/json")
    return false;
  if (parameters.length > 1) return false;
  const [charset] = parameters;
  if (!charset) return true;
  return charsetOk(charset);
};

const contentLengthTooLarge = ({
  header,
  maxBytes,
}: {
  header: string | null;
  maxBytes: number;
}) => {
  if (header === null) return false;
  if (!/^\d+$/u.test(header.trim())) return true;
  const length = Number(header);
  return !Number.isSafeInteger(length) || length > maxBytes;
};

const concatBytes = (chunks: Uint8Array[]) => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
};

const aborted = (error: unknown, signal: AbortSignal) =>
  signal.aborted || (error instanceof Error && error.name === "AbortError");

export const readJsonRequest = async ({
  maxBytes,
  request,
}: {
  maxBytes: number;
  request: Request;
}): Promise<ReadJsonRequestResult> => {
  if (request.signal.aborted) return { error: "aborted", ok: false };
  if (!acceptsJsonContentType(request.headers.get("content-type")))
    return { error: "unsupported_media_type", ok: false };
  if (
    contentLengthTooLarge({
      header: request.headers.get("content-length"),
      maxBytes,
    })
  )
    return { error: "payload_too_large", ok: false };

  if (!request.body) return { error: "invalid_json", ok: false };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (true) {
      if (request.signal.aborted) {
        await reader.cancel();
        return { error: "aborted", ok: false };
      }
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return { error: "payload_too_large", ok: false };
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => null);
    if (aborted(error, request.signal)) return { error: "aborted", ok: false };
    return { error: "invalid_json", ok: false };
  }

  if (received === 0) return { error: "invalid_json", ok: false };

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(
      concatBytes(chunks)
    );
  } catch {
    return { error: "invalid_json", ok: false };
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { error: "invalid_json", ok: false };
  }
};
