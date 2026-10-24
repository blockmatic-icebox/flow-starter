"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  addSupport,
  applyTriageSuggestion,
  confirmTriage,
  createRequest,
} from "./repository";
import type { FeatureTriage } from "./types";

const visitorCookie = "fi_visitor_id";

const ensureVisitorId = async () => {
  const jar = await cookies();
  const existing = jar.get(visitorCookie)?.value;
  if (existing) return existing;
  const id = `vis_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
  jar.set(visitorCookie, id, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
  return id;
};

export const submitFeatureRequest = async (formData: FormData) => {
  const title = String(formData.get("title") ?? "");
  const description = String(formData.get("description") ?? "");
  if (!title.trim() || !description.trim()) return;

  const request = await createRequest({ description, title });
  redirect(`/features/${request.id}`);
};

export const supportFeatureRequest = async (formData: FormData) => {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const visitorId = await ensureVisitorId();
  await addSupport({ id, visitorId });
  revalidatePath(`/features/${id}`);
  revalidatePath("/features");
};

export const saveTriageSuggestion = async ({
  id,
  triage,
}: {
  id: string;
  triage: FeatureTriage;
}) => {
  await applyTriageSuggestion({ id, triage });
  revalidatePath(`/features/${id}`);
};

export const confirmFeatureTriage = async (formData: FormData) => {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await confirmTriage({ id });
  revalidatePath(`/features/${id}`);
  revalidatePath("/features");
};
