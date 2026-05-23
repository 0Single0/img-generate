import { apiGet, apiPost } from "@/lib/http/client";
import type {
  GenerationListParams,
  GenerationListResponse,
  GenerationOperation,
  GenerationParams,
  GenerationRecord,
} from "@/types/provider";

export type CreateGenerationBody = {
  requestId: string;
  modelConfigId: string;
  operation: GenerationOperation;
  prompt: string;
  params: GenerationParams;
  referenceImagePaths?: string[];
};

export const createGeneration = (body: CreateGenerationBody) =>
  apiPost<GenerationRecord, CreateGenerationBody>("/generations", body);

export const listGenerations = (params?: GenerationListParams) =>
  apiGet<GenerationListResponse>("/generations", { params });

export const createSignedUrl = (path: string) =>
  apiPost<{ signedUrl: string }, { path: string }>("/storage/signed-url", { path });

export const uploadGenerationAsset = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Failed to upload image.");
  }

  return (await response.json()) as { path: string };
};

export const deleteGenerationAsset = async (path: string) => {
  const response = await fetch("/api/storage/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? "Failed to delete image.");
  }

  return (await response.json()) as { ok: true };
};
