"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { ModelConfigDialog } from "./model-config-dialog";
import { ModelList } from "./model-list";
import { useModels } from "../hooks/use-models";
import type { ModelConfig } from "@/types/provider";

type ModelsPageProps = {
  title: string;
  subtitle: string;
};

export const ModelsPage = ({ title, subtitle }: ModelsPageProps) => {
  const { models, options, error, isLoading, saveModel, removeModel, runTest } = useModels();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);

  const handleCreate = useCallback(() => {
    setEditingModel(null);
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((model: ModelConfig) => {
    setEditingModel(model);
    setDialogOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <PageHeader title={title} subtitle={subtitle} />
        <Button onClick={handleCreate}>
          <Plus className="size-4" />
          新增模型
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : null}
      <ModelList models={models} onDelete={removeModel} onEdit={handleEdit} onTest={runTest} />
      <ModelConfigDialog
        open={dialogOpen}
        model={editingModel}
        options={options}
        onOpenChange={setDialogOpen}
        onSave={saveModel}
      />
    </div>
  );
};
