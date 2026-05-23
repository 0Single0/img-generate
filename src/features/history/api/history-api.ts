import { apiDelete } from "@/lib/http/client";
import { createSignedUrl, listGenerations } from "@/features/generation/api/generation-api";

export { createSignedUrl, listGenerations };

export const deleteGeneration = (id: string) =>
  apiDelete<{ ok: true }>(`/generations?id=${encodeURIComponent(id)}`);
