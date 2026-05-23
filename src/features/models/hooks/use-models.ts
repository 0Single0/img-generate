"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createModel,
  deleteModel,
  listModelOptions,
  listModels,
  testModel,
  updateModel,
} from "../api/model-api";
import type { ModelConfig, ModelConfigInput, ModelOption } from "@/types/provider";

export const useModels = () => {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [options, setOptions] = useState<ModelOption[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const [nextModels, nextOptions] = await Promise.all([
        listModels(),
        listModelOptions(),
      ]);
      setModels(nextModels);
      setOptions(nextOptions);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load models.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveModel = useCallback(
    async (input: ModelConfigInput & { id?: string }) => {
      if (input.id) {
        const updated = await updateModel({ ...input, id: input.id });
        setModels((current) =>
          current.map((model) => (model.id === updated.id ? updated : model)),
        );
        return updated;
      }

      const created = await createModel(input);
      setModels((current) => [created, ...current]);
      return created;
    },
    [],
  );

  const removeModel = useCallback(async (id: string) => {
    await deleteModel(id);
    setModels((current) => current.filter((model) => model.id !== id));
  }, []);

  const runTest = useCallback((id: string) => testModel(id), []);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [nextModels, nextOptions] = await Promise.all([
          listModels(),
          listModelOptions(),
        ]);

        if (isMounted) {
          setModels(nextModels);
          setOptions(nextOptions);
        }
      } catch (caught) {
        if (isMounted) {
          setError(caught instanceof Error ? caught.message : "Failed to load models.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return { models, options, error, isLoading, refresh, saveModel, removeModel, runTest };
};
