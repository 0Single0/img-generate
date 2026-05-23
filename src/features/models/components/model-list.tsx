"use client";

import { Edit, FlaskConical, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ModelConfig } from "@/types/provider";

type ModelListProps = {
  models: ModelConfig[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (model: ModelConfig) => void;
  onTest: (id: string) => Promise<unknown>;
};

export const ModelList = ({ models, onDelete, onEdit, onTest }: ModelListProps) => {
  const [message, setMessage] = useState("");

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
      <Card>
        <CardContent className="flex min-h-48 items-center justify-center pt-5 text-sm text-muted-foreground">
          暂无模型，请点击右上角新增模型。
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold">模型列表</h2>
        <p className="mt-1 text-sm text-muted-foreground">共 {models.length} 个模型</p>
      </div>
      {message ? <p className="px-5 pt-4 text-sm text-primary">{message}</p> : null}
      <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_0.7fr_1fr] border-b bg-muted/50 px-5 py-3 text-sm font-medium text-muted-foreground md:grid">
        <span>名称</span>
        <span>模型</span>
        <span>BaseURL</span>
        <span>状态</span>
        <span>操作</span>
      </div>
      <div className="divide-y">
        {models.map((model) => (
          <div
            key={model.id}
            className="grid gap-4 px-5 py-4 md:grid-cols-[1.2fr_1fr_1.2fr_0.7fr_1fr] md:items-center"
          >
            <div>
              <p className="font-medium">{model.display_name}</p>
              <p className="text-sm text-muted-foreground">{model.model_label ?? model.model_id}</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{model.provider_label ?? model.provider}</p>
              <p>{model.model_id}</p>
            </div>
            <p className="break-all text-sm text-muted-foreground">{model.base_url}</p>
            <div>
              <span className={model.enabled ? "rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary" : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"}>
                {model.enabled ? "启用中" : "已禁用"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" className="px-2" onClick={() => onEdit(model)}>
                <Edit className="size-4" />
                编辑
              </Button>
              <Button variant="ghost" className="px-2" onClick={() => handleTest(model.id)}>
                <FlaskConical className="size-4" />
                测试
              </Button>
              <Button variant="ghost" className="px-2 text-destructive" onClick={() => onDelete(model.id)}>
                <Trash2 className="size-4" />
                删除
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
