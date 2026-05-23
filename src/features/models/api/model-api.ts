import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/http/client";
import type { ModelConfig, ModelConfigInput, ModelOption } from "@/types/provider";

export const listModels = () => apiGet<ModelConfig[]>("/models");

export const listModelOptions = () => apiGet<ModelOption[]>("/model-options");

export const createModel = (body: ModelConfigInput) =>
  apiPost<ModelConfig, ModelConfigInput>("/models", body);

export const updateModel = (body: ModelConfigInput & { id: string }) =>
  apiPatch<ModelConfig, ModelConfigInput & { id: string }>("/models", body);

export const deleteModel = (id: string) =>
  apiDelete<{ ok: true }>(`/models?id=${encodeURIComponent(id)}`);

export const testModel = (modelId: string, prompt?: string) =>
  apiPost<{ ok: true }, { modelId: string; prompt?: string }>("/models/test", {
    modelId,
    prompt,
  });
