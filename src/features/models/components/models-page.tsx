"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ModelConfig } from "@/types/provider";
import { ModelConfigDialog } from "./model-config-dialog";
import { ModelList } from "./model-list";
import { useModels } from "../hooks/use-models";

type ModelsPageProps = {
  title: string;
  subtitle: string;
};

export const ModelsPage = (props: ModelsPageProps) => {
  void props;

  const t = useTranslations("Models");
  const { models, options, error, isLoading, saveModel, removeModel } = useModels();
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
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <section className="flex min-h-0 w-full flex-1 flex-col rounded-xl border border-[#e7ebf5] bg-white/86 p-4 shadow-[0_18px_48px_rgba(58,68,116,0.08)] backdrop-blur-xl sm:p-5 lg:p-7">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#17213f] sm:text-lg">{t("listTitle")}</h2>
            <p className="mt-1 text-xs font-medium text-[#8b95b1] sm:text-sm">
              {t("listCount", { count: models.length })}
            </p>
          </div>
          <Button
            className="h-9 rounded-lg bg-[#6b50f4] px-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(91,77,245,0.24)] hover:bg-[#5c45df] sm:h-10 sm:px-4"
            onClick={handleCreate}
          >
            <Plus className="size-3.5 sm:size-4" />
            {t("addModel")}
          </Button>
        </div>

        {error ? (
          <p className="mb-4 rounded-lg bg-[#fff4f4] px-3 py-2 text-sm text-[#d73737]">{error}</p>
        ) : null}
        {isLoading ? <p className="text-sm text-[#7a84a6]">Loading...</p> : null}

        <ModelList models={models} onDelete={removeModel} onEdit={handleEdit} />
      </section>

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
