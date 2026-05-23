"use client";

import { create } from "zustand";

type GenerationState = {
  selectedModelId?: string;
  reusePrompt?: string;
  isGenerating: boolean;
  setSelectedModelId: (modelId?: string) => void;
  setReusePrompt: (prompt?: string) => void;
  setIsGenerating: (isGenerating: boolean) => void;
};

export const useGenerationStore = create<GenerationState>((set) => ({
  selectedModelId: undefined,
  reusePrompt: undefined,
  isGenerating: false,
  setSelectedModelId: (selectedModelId) => set({ selectedModelId }),
  setReusePrompt: (reusePrompt) => set({ reusePrompt }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
}));

