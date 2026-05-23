import type { ProviderGenerateInput, ProviderImageResult } from "@/types/provider";

type OpenAIImageResponse = {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
};

type OpenAIImageRequestBody = {
  model: string;
  prompt: string;
  n: number;
  size?: string;
  quality?: string;
  output_format?: string;
  output_compression?: number;
  background?: string;
  response_format?: "b64_json";
};

const getImageExtension = (contentType: string) => {
  if (contentType.includes("jpeg")) {
    return "jpg";
  }

  if (contentType.includes("webp")) {
    return "webp";
  }

  return "png";
};

const appendIfPresent = (
  formData: FormData,
  key: string,
  value: number | string | undefined,
) => {
  if (value !== undefined && value !== "auto") {
    formData.append(key, String(value));
  }
};

const appendReferenceImage = async (
  formData: FormData,
  url: string,
  index: number,
) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to read reference image: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "image/png";
  const blob = await response.blob();
  const file = new File(
    [blob],
    `reference-${index + 1}.${getImageExtension(contentType)}`,
    { type: contentType },
  );

  formData.append("image[]", file);
};

const createEditBody = async (input: ProviderGenerateInput) => {
  const formData = new FormData();

  formData.append("model", input.modelId);
  formData.append("prompt", input.prompt);
  formData.append("n", String(input.params.n ?? 1));
  appendIfPresent(formData, "size", input.params.size);
  appendIfPresent(formData, "quality", input.params.quality);
  appendIfPresent(formData, "output_format", input.params.outputFormat);
  appendIfPresent(formData, "output_compression", input.params.outputCompression);
  appendIfPresent(formData, "background", input.params.background);

  await Promise.all(
    (input.referenceImageUrls ?? []).map((url, index) =>
      appendReferenceImage(formData, url, index),
    ),
  );

  return formData;
};

const createGenerationBody = (input: ProviderGenerateInput) => {
  const isDalleModel = input.modelId.startsWith("dall-e-");
  const body: OpenAIImageRequestBody = {
    model: input.modelId,
    prompt: input.prompt,
    n: input.params.n ?? 1,
  };

  if (input.params.size && input.params.size !== "auto") {
    body.size = input.params.size;
  }

  if (input.params.quality && input.params.quality !== "auto") {
    body.quality = input.params.quality;
  }

  if (input.params.outputFormat && input.params.outputFormat !== "png") {
    body.output_format = input.params.outputFormat;
  }

  if (input.params.outputCompression !== undefined) {
    body.output_compression = input.params.outputCompression;
  }

  if (input.params.background && input.params.background !== "auto") {
    body.background = input.params.background;
  }

  if (isDalleModel) {
    body.response_format = "b64_json";
  }

  return body;
};

const requestOpenAIImages = async (
  input: ProviderGenerateInput,
  endpoint: "/images/edits" | "/images/generations",
) => {
  if (endpoint === "/images/edits") {
    const body = await createEditBody(input);

    return fetch(`${input.baseUrl}${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${input.apiKey}` },
      body,
    });
  }

  const body = createGenerationBody(input);

  return fetch(`${input.baseUrl}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
};

const parseOpenAIResponse = async (
  response: Response,
  input: ProviderGenerateInput,
  endpoint: "/images/edits" | "/images/generations",
) => {
  if (!response.ok) {
    const errorText = await response.text();

    console.warn("[image-provider] upstream error", {
      requestId: input.requestId,
      provider: input.provider,
      endpoint,
      status: response.status,
      body: errorText,
    });

    throw new Error(`Upstream HTTP ${response.status}: ${errorText}`);
  }

  const payload = (await response.json()) as OpenAIImageResponse;

  return payload.data ?? [];
};

export const generateWithOpenAI = async (
  input: ProviderGenerateInput,
): Promise<ProviderImageResult[]> => {
  const hasReferenceImages = Boolean(input.referenceImageUrls?.length);
  const endpoint =
    input.operation === "edit" || hasReferenceImages
      ? "/images/edits"
      : "/images/generations";
  const requestedCount = input.params.n ?? 1;

  console.info("[image-provider] upstream request", {
    requestId: input.requestId,
    provider: input.provider,
    endpoint,
    model: input.modelId,
    n: requestedCount,
    size: input.params.size,
    quality: input.params.quality,
    referenceImages: input.referenceImageUrls?.length ?? 0,
  });

  const response = await requestOpenAIImages(input, endpoint);
  const results = await parseOpenAIResponse(response, input, endpoint);

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
