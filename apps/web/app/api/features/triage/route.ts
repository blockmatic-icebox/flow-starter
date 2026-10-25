import { asSchema, generateText, Output } from "ai";
import { z } from "zod";

import { getRequest, listRequests } from "@/app/_lib/features/repository";
import { fixtureTriage } from "@/app/_lib/features/triage";

export const runtime = "nodejs";
export const maxDuration = 30;

const triageSchema = z.object({
  priority: z.enum(["low", "medium", "high"]),
  rationale: z.string().min(20).max(1200),
  relatedIds: z.array(z.string()).max(5),
  suggestedTheme: z.string().min(2).max(80),
});

const DEFAULT_MODEL = "anthropic/claude-sonnet-4.6";
const publicFailure = "Triage could not be completed.";

export const handleTriagePost = async ({
  env = process.env,
  request,
}: {
  env?: NodeJS.ProcessEnv;
  request: Request;
}) => {
  let body: { id?: string };
  try {
    body = (await request.json()) as { id?: string };
  } catch {
    return Response.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const id = body.id?.trim();
  if (!id)
    return Response.json({ message: "Missing request id." }, { status: 400 });

  const feature = await getRequest({ env, id });
  if (!feature)
    return Response.json({ message: "Request not found." }, { status: 404 });

  const catalog = await listRequests({ env });
  const apiKey = env.AI_GATEWAY_API_KEY?.trim();

  if (!apiKey) {
    const suggestion = fixtureTriage({ request: feature, requests: catalog });
    return Response.json({ ok: true, triage: suggestion });
  }

  const model =
    env.FEATURE_TRIAGE_MODEL?.trim() ||
    env.GENUI_MODEL?.trim() ||
    DEFAULT_MODEL;

  const catalogSummary = catalog
    .filter((item) => item.id !== id)
    .map(
      (item) =>
        `- ${item.id}: ${item.title} (theme=${item.theme}, support=${item.supportCount})`
    )
    .join("\n");

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: asSchema(triageSchema) }),
      prompt: `You triage product feature requests for prioritization.
Request:
Title: ${feature.title}
Description: ${feature.description}
Support count: ${feature.supportCount}

Existing catalog (id, title, theme, support):
${catalogSummary || "(empty)"}

Return JSON with suggestedTheme (short slug), priority, relatedIds from the catalog (may be empty), and a concise rationale for a human reviewer.`,
    });

    if (!result.output)
      return Response.json({ message: publicFailure }, { status: 500 });

    return Response.json({
      ok: true,
      triage: { ...result.output, mode: "ai" as const },
    });
  } catch {
    return Response.json({ message: publicFailure }, { status: 500 });
  }
};

export const POST = (request: Request) => handleTriagePost({ request });
