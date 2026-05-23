"use client";

import { useEffect, useState } from "react";
import { listModels } from "@/features/models/api/model-api";
import { GenerationForm } from "./generation-form";
import type { ModelConfig } from "@/types/provider";

type GenerationPageProps = {
  title: string;
  subtitle: string;
};

export const GenerationPage = (props: GenerationPageProps) => {
  void props;

  const [models, setModels] = useState<ModelConfig[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setModels(await listModels());
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to load models.");
      }
    };

    void load();
  }, []);

  return (
    <div className="flex min-h-full w-full flex-1 flex-col">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <GenerationForm models={models} />
    </div>
  );
};
