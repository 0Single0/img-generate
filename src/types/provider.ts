export type ImageProvider = "openai";

export type GenerationOperation = "generation" | "edit";

export type ModelConfig = {
  id: string;
  user_id: string;
  model_option_id: string;
  provider: ImageProvider;
  provider_label?: string;
  provider_icon?: string | null;
  display_name: string;
  model_id: string;
  model_label?: string;
  base_url: string;
  api_key_encrypted?: string | null;
  enabled: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ModelConfigInput = {
  model_option_id: string;
  display_name: string;
  base_url: string;
  api_key?: string;
  enabled: boolean;
  notes?: string;
};

export type ModelOption = {
  id: string;
  provider_key: ImageProvider;
  provider_label: string;
  icon?: string | null;
  model_id: string;
  model_label: string;
  default_base_url: string;
  enabled: boolean;
  sort_order: number;
  created_at?: string;
};

export type GenerationParams = {
  size?: string;
  n?: number;
  quality?: string;
  outputFormat?: string;
  outputCompression?: number;
  background?: string;
  watermark?: boolean;
  seed?: number;
};

export type GenerationRecord = {
  id: string;
  request_id?: string | null;
  user_id: string;
  model_config_id: string;
  provider: ImageProvider;
  model_id: string;
  operation: GenerationOperation;
  prompt: string;
  params: GenerationParams;
  reference_image_paths: string[];
  output_image_paths: string[];
  status: "pending" | "succeeded" | "failed";
  error_message?: string | null;
  created_at?: string;
  completed_at?: string | null;
  duration_ms?: number | null;
};

export type GenerationListParams = {
  q?: string;
  status?: GenerationRecord["status"] | "all";
  model?: string;
  start?: string;
  end?: string;
  page?: number;
  pageSize?: number;
};

export type GenerationListResponse = {
  items: GenerationRecord[];
  total: number;
  page: number;
  pageSize: number;
  models: ImageProvider[];
};

export type ProviderImageResult = {
  base64?: string;
  url?: string;
  mimeType: string;
};

export type ProviderGenerateInput = {
  provider: ImageProvider;
  requestId?: string;
  apiKey: string;
  baseUrl: string;
  modelId: string;
  operation: GenerationOperation;
  prompt: string;
  params: GenerationParams;
  referenceImageUrls?: string[];
};
