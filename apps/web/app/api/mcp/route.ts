import { NextResponse } from "next/server";

import { handleConsultantMcpRequest } from "@/lib/consultant/mcp-handler";
import type { CreateCapStoreResult } from "@/lib/genui/create-cap-store";
import { enforceDailyCap } from "@/lib/genui/enforce-daily-cap";
import { authorizeMcpAccess, withMcpCors } from "@/lib/security/mcp-access";

export const runtime = "nodejs";

const jsonError = ({
  message,
  origin,
  status,
}: {
  message: string;
  origin: string | null;
  status: number;
}) =>
  withMcpCors({
    origin,
    response: NextResponse.json({ message }, { status }),
  });

export const handleMcpRequest = async ({
  createStore,
  env = process.env,
  now = new Date(),
  request,
}: {
  createStore?: (input: { env: NodeJS.ProcessEnv }) => CreateCapStoreResult;
  env?: NodeJS.ProcessEnv;
  now?: Date;
  request: Request;
}) => {
  const access = authorizeMcpAccess({ env, request });
  if (!access.ok)
    return jsonError({
      message: access.message,
      origin: null,
      status: access.status,
    });

  if (request.method === "OPTIONS")
    return withMcpCors({
      origin: access.corsOrigin,
      response: new Response(null, { status: 204 }),
    });

  const admitted = await enforceDailyCap({
    createStore,
    env,
    kind: "chat",
    now,
    request,
  });
  if (!admitted.ok)
    return jsonError({
      message: admitted.message,
      origin: access.corsOrigin,
      status: admitted.status,
    });

  const response = await handleConsultantMcpRequest(request);
  return withMcpCors({ origin: access.corsOrigin, response });
};

const handle = (request: Request) => handleMcpRequest({ request });

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
export const OPTIONS = handle;
