import { apiDelete, apiPost } from "@/lib/http/client";
import { listGenerations } from "@/features/generation/api/generation-api";

export { listGenerations };

export const deleteGeneration = (id: string) =>
  apiDelete<{ ok: true }>(`/generations?id=${encodeURIComponent(id)}`);

export const createSignedUrl = (path: string) =>
  apiPost<{ signedUrl: string }, { path: string }>("/storage/signed-url", { path });
