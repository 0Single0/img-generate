import type { ProviderGenerateInput, ProviderImageResult } from "@/types/provider";

type SeedreamImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

export const generateWithSeedream = async (
  input: ProviderGenerateInput,
): Promise<ProviderImageResult[]> => {
  const body = {
    model: input.modelId,
    prompt: input.prompt,
    size: input.params.size ?? "2K",
    n: input.params.n ?? 1,
    watermark: input.params.watermark ?? false,
    seed: input.params.seed,
    response_format: "b64_json",
    image: input.referenceImageUrls,
  };

  console.info("[image-provider] upstream request", {
    requestId: input.requestId,
    provider: input.provider,
    endpoint: "/images/generations",
    model: input.modelId,
    n: body.n,
    size: body.size,
  });

  const response = await fetch(`${input.baseUrl}/images/generations`, {
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

  const payload = (await response.json()) as SeedreamImageResponse;
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
    mimeType: "image/png",
  }));
};
