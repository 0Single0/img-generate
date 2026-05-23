import type { ProviderGenerateInput, ProviderImageResult } from "@/types/provider";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

export const generateWithOpenAI = async (
  input: ProviderGenerateInput,
): Promise<ProviderImageResult[]> => {
  const endpoint =
    input.operation === "edit" ? "/images/edits" : "/images/generations";

  const body = {
    model: input.modelId,
    prompt: input.prompt,
    n: input.params.n ?? 1,
    size: input.params.size ?? "1024x1024",
    quality: input.params.quality,
    output_format: input.params.outputFormat,
    output_compression: input.params.outputCompression,
    background: input.params.background,
    response_format: "b64_json",
    image: input.referenceImageUrls,
  };

  console.info("[image-provider] upstream request", {
    requestId: input.requestId,
    provider: input.provider,
    endpoint,
    model: input.modelId,
    n: body.n,
    size: body.size,
  });

  const response = await fetch(`${input.baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as OpenAIImageResponse;
  const results = payload.data ?? [];

  console.info("[image-provider] upstream response", {
    requestId: input.requestId,
    provider: input.provider,
    status: response.status,
    returned: results.length,
  });

  return results.map((item) => ({
    base64: item.b64_json,
    url: item.url,
    mimeType: `image/${input.params.outputFormat ?? "png"}`,
  }));
};
