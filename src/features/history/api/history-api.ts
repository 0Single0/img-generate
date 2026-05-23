import { apiDelete } from "@/lib/http/client";
import { listGenerations } from "@/features/generation/api/generation-api";

export { listGenerations };

export const deleteGeneration = (id: string) =>
  apiDelete<{ ok: true }>(`/generations?id=${encodeURIComponent(id)}`);

