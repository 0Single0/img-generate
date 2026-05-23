"use client";

import { Box, Edit, FlaskConical, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { ImageProvider, ModelConfig } from "@/types/provider";

type ModelListProps = {
  models: ModelConfig[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (model: ModelConfig) => void;
  onTest: (id: string) => Promise<unknown>;
};

const providerStyles: Record<ImageProvider, string> = {
  chatgpt: "bg-[#e6f9f0] text-[#18a567]",
  openai: "bg-[#e6f9f0] text-[#18a567]",
  seedream: "bg-[#f0ecff] text-[#6b50f4]",
};

const getProviderLabel = (model: ModelConfig) =>
  model.provider_label ?? (model.provider === "seedream" ? "Seedance" : "OpenAI");

const getStatusClassName = (enabled: boolean) =>
  enabled
    ? "bg-[#dff8ec] text-[#16a269] border-[#c9f1df]"
    : "bg-[#fff0e8] text-[#e26b33] border-[#ffdcca]";

export const ModelList = ({ models, onDelete, onEdit, onTest }: ModelListProps) => {
  const [message, setMessage] = useState("");

  const sortedModels = useMemo(
    () => [...models].sort((left, right) => Number(right.enabled) - Number(left.enabled)),
    [models],
  );

  const handleTest = useCallback(
    async (id: string) => {
      setMessage("");
      await onTest(id);
      setMessage("测试通过");
    },
    [onTest],
  );

  if (models.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-1 items-center justify-center rounded-lg border border-dashed border-[#e2e7f2] bg-[#fbfcff] px-4 text-center">
        <div>
          <Box className="mx-auto mb-3 size-9 text-[#a5afca]" />
          <p className="text-sm font-semibold text-[#66708f]">暂无模型，请点击右上角新增模型。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#e4e9f4] bg-white">
      {message ? <p className="px-5 pt-4 text-sm font-semibold text-[#16a269]">{message}</p> : null}

      <div className="hidden grid-cols-[1.2fr_1.05fr_1.2fr_0.6fr_1fr] border-b border-[#e8edf5] bg-[#f8f9fe] px-5 py-4 text-sm font-bold text-[#697494] lg:grid">
        <span>模型展示名称</span>
        <span>模型类型/ID</span>
        <span>Base URL</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      <div className="min-h-0 flex-1 divide-y divide-[#e8edf5] overflow-auto">
        {sortedModels.map((model) => (
          <div
            key={model.id}
            className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_1.05fr_1.2fr_0.6fr_1fr] lg:items-center lg:px-5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg",
                  providerStyles[model.provider],
                )}
              >
                <Box className="size-5" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#18223f] sm:text-base">
                  {model.display_name}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-[#8791ad]">
                  {getProviderLabel(model)}
                </p>
              </div>
            </div>

            <div className="min-w-0 text-sm font-medium text-[#5d6887]">
              <p className="truncate font-semibold text-[#2e385a]">{model.model_id}</p>
              <p className="mt-1 truncate text-xs text-[#8b95b1]">{model.model_label}</p>
            </div>

            <p className="break-all text-sm font-medium text-[#697494]">{model.base_url}</p>

            <div>
              <span
                className={cn(
                  "inline-flex h-8 items-center rounded-md border px-3 text-xs font-bold",
                  getStatusClassName(model.enabled),
                )}
              >
                {model.enabled ? "启用" : "停用"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#dcd6ff] px-3 text-sm font-bold text-[#6b50f4] transition-colors hover:bg-[#f3f0ff]"
                onClick={() => onEdit(model)}
                type="button"
              >
                <Edit className="size-4" />
                编辑
              </button>
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#dce8ff] px-3 text-sm font-bold text-[#426fd9] transition-colors hover:bg-[#f0f5ff]"
                onClick={() => handleTest(model.id)}
                type="button"
              >
                <FlaskConical className="size-4" />
                测试
              </button>
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#ffd5dc] px-3 text-sm font-bold text-[#df4d61] transition-colors hover:bg-[#fff1f3]"
                onClick={() => onDelete(model.id)}
                type="button"
              >
                <Trash2 className="size-4" />
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
