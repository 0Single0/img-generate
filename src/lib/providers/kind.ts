import type { ImageProvider } from "@/types/provider";

export const isOpenAICompatibleProvider = (provider?: ImageProvider | string) =>
  provider === "openai";

