import { generateWithOpenAI } from "./openai";
import { isOpenAICompatibleProvider } from "./kind";
import type { ProviderGenerateInput, ProviderImageResult } from "@/types/provider";

export const generateWithProvider = async (
  input: ProviderGenerateInput,
): Promise<ProviderImageResult[]> => {
  const normalizedInput = {
    ...input,
    baseUrl: input.baseUrl.endsWith("/")
      ? input.baseUrl.slice(0, -1)
      : input.baseUrl,
  };

  if (input.modelId.trim().length === 0) {
    throw new Error("Model ID is required.");
  }

  if (isOpenAICompatibleProvider(input.provider)) {
    return generateWithOpenAI(normalizedInput);
  }

  throw new Error(`Unsupported provider: ${input.provider}`);
};
