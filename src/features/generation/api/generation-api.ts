import { apiGet, apiPost } from "@/lib/http/client";
import type {
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

export const listGenerations = () => apiGet<GenerationRecord[]>("/generations");
