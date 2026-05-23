"use client";

import { useCallback, useState } from "react";
import { createGeneration, type CreateGenerationBody } from "../api/generation-api";
import { useGenerationStore } from "@/store/generation-store";
import type { GenerationRecord } from "@/types/provider";

export const useGeneration = () => {
  const [result, setResult] = useState<GenerationRecord | null>(null);
  const [error, setError] = useState("");
  const setIsGenerating = useGenerationStore((state) => state.setIsGenerating);

  const generate = useCallback(
    async (body: CreateGenerationBody) => {
      setError("");
      setIsGenerating(true);

      try {
        const record = await createGeneration(body);
        setResult(record);
        return record;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Generation failed.";
        setError(message);
        throw caught;
      } finally {
        setIsGenerating(false);
      }
    },
    [setIsGenerating],
  );

  return { result, error, generate };
};

