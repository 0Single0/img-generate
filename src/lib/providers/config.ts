import type { ImageProvider } from "@/types/provider";
import type { ModelOption } from "@/types/provider";

export const providerDefaults: Record<
  ImageProvider,
  { label: string; baseUrl: string; modelId: string }
> = {
  chatgpt: {
    label: "ChatGPT",
    baseUrl: "https://api.openai.com/v1",
    modelId: "image2",
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    modelId: "gpt-image-2",
  },
  seedream: {
    label: "Seedream",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    modelId: "doubao-seedream-5-0-260128",
  },
};

export const sizeOptions = ["1024x1024", "1024x1536", "1536x1024", "2K"] as const;

export const defaultModelOptions: ModelOption[] = [
  {
    id: "default-chatgpt-image2",
    provider_key: "chatgpt",
    provider_label: "ChatGPT",
    model_id: "image2",
    model_label: "image2",
    default_base_url: "https://api.openai.com/v1",
    enabled: true,
    sort_order: 10,
  },
  {
    id: "default-openai-gpt-image-2",
    provider_key: "openai",
    provider_label: "OpenAI",
    model_id: "gpt-image-2",
    model_label: "GPT Image 2",
    default_base_url: "https://api.openai.com/v1",
    enabled: true,
    sort_order: 20,
  },
  {
    id: "default-seedream-seedance-v1",
    provider_key: "seedream",
    provider_label: "Seedream",
    model_id: "seedance-v1",
    model_label: "Seedance V1",
    default_base_url: "https://ark.cn-beijing.volces.com/api/v3",
    enabled: true,
    sort_order: 30,
  },
  {
    id: "default-seedream-doubao",
    provider_key: "seedream",
    provider_label: "Seedream",
    model_id: "doubao-seedream-5-0-260128",
    model_label: "Doubao Seedream 5.0",
    default_base_url: "https://ark.cn-beijing.volces.com/api/v3",
    enabled: true,
    sort_order: 40,
  },
];
