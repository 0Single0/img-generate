import type { ImageProvider } from "@/types/provider";
import type { ModelOption } from "@/types/provider";

export const defaultOpenAIIcon = "https://openai.com/favicon.ico";

export const providerDefaults: Record<
  ImageProvider,
  { label: string; baseUrl: string; modelId: string; icon?: string }
> = {
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    modelId: "gpt-image-2",
    icon: defaultOpenAIIcon,
  },
};

export const sizeOptions = ["1024x1024", "1024x1536", "1536x1024", "2K"] as const;

export const defaultModelOptions: ModelOption[] = [
  {
    id: "default-openai-gpt-image-2",
    provider_key: "openai",
    provider_label: "OpenAI",
    icon: defaultOpenAIIcon,
    model_id: "gpt-image-2",
    model_label: "GPT Image 2",
    default_base_url: "https://api.openai.com/v1",
    enabled: true,
    sort_order: 20,
  },
];
