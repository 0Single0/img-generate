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
