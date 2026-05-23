"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DynamicParams } from "./dynamic-params";
import { useGeneration } from "../hooks/use-generation";
import { useGenerationStore } from "@/store/generation-store";
import type { GenerationOperation, GenerationParams, ModelConfig } from "@/types/provider";

type GenerationFormProps = {
  models: ModelConfig[];
};

export const GenerationForm = ({ models }: GenerationFormProps) => {
  const reusePrompt = useGenerationStore((state) => state.reusePrompt);
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const selectedModelId = useGenerationStore((state) => state.selectedModelId);
  const setSelectedModelId = useGenerationStore((state) => state.setSelectedModelId);
  const [prompt, setPrompt] = useState(reusePrompt ?? "");
  const [operation, setOperation] = useState<GenerationOperation>("generation");
  const [params, setParams] = useState<GenerationParams>({ n: 1 });
  const isSubmittingRef = useRef(false);
  const { result, error, generate } = useGeneration();

  const enabledModels = useMemo(
    () => models.filter((model) => model.enabled),
    [models],
  );

  const selectedModel = useMemo(
    () =>
      enabledModels.find((model) => model.id === selectedModelId) ??
      enabledModels[0],
    [enabledModels, selectedModelId],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedModel || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;

      try {
        await generate({
          requestId: crypto.randomUUID(),
          modelConfigId: selectedModel.id,
          operation,
          prompt,
          params,
          referenceImagePaths: [],
        });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [generate, operation, params, prompt, selectedModel],
  );

  if (enabledModels.length === 0) {
    return (
      <Card>
        <CardContent className="pt-5 text-sm text-muted-foreground">
          Add and enable a model before generating images.
        </CardContent>
      </Card>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-5 pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Model</Label>
              <select
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={selectedModel?.id}
                onChange={(event) => setSelectedModelId(event.target.value)}
              >
                {enabledModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.display_name} · {model.model_id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Mode</Label>
              <select
                className="h-10 w-full rounded-md border bg-card px-3 text-sm"
                value={operation}
                onChange={(event) => setOperation(event.target.value as GenerationOperation)}
              >
                <option value="generation">Generation</option>
                <option value="edit">Reference/Edit</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea value={prompt} required onChange={(event) => setPrompt(event.target.value)} />
          </div>
          <DynamicParams
            provider={selectedModel?.provider}
            params={params}
            onChange={setParams}
          />
          {operation === "edit" ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Reference image upload is reserved in the API boundary and storage structure. The visual uploader can be added here without changing generation routes.
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button disabled={isGenerating}>{isGenerating ? "Generating..." : "Generate"}</Button>
        </CardContent>
      </Card>
      {result ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm font-medium">Generation saved</p>
            <p className="mt-1 text-xs text-muted-foreground">{result.id}</p>
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
};
