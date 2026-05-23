"use client";

import { EyeOff, Info } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import type { ImageProvider, ModelConfig, ModelConfigInput, ModelOption } from "@/types/provider";

type ModelConfigDialogProps = {
  open: boolean;
  options: ModelOption[];
  model?: ModelConfig | null;
  onOpenChange: (open: boolean) => void;
  onSave: (input: ModelConfigInput & { id?: string }) => Promise<unknown>;
};

type ModelConfigFormProps = Omit<ModelConfigDialogProps, "open"> & {
  initialOption?: ModelOption;
};

type ProviderItem = {
  value: ImageProvider;
  label: string;
};

const text = {
  addTitle: "新增模型",
  apiKeyHelp: "用于身份验证的密钥，不会被存储为明文",
  apiKeyPlaceholder: "请输入 API Key",
  baseUrl: "生图 Base URL",
  baseUrlPlaceholder: "https://api.example.com/v1",
  cancel: "取消",
  displayName: "模型展示名称",
  displayNamePlaceholder: "请输入模型展示名称（如：ChatGPT Image2）",
  editTitle: "编辑模型",
  enabled: "是否启用",
  enabledHelp: "停用后将无法使用该模型生成图像",
  info: "配置模型信息以启用图像生成服务",
  modelType: "模型类型",
  notes: "备注",
  notesPlaceholder: "请输入备注信息（可选）",
  save: "保存",
  selectModel: "选择模型 ID",
  selectProvider: "选择模型类型",
} as const;

const getProviders = (options: ModelOption[]): ProviderItem[] => {
  const entries = new Map<ImageProvider, string>();
  options.forEach((option) => entries.set(option.provider_key, option.provider_label));
  return Array.from(entries, ([value, label]) => ({ value, label }));
};

const ModelConfigDialogForm = ({
  options,
  model,
  initialOption,
  onOpenChange,
  onSave,
}: ModelConfigFormProps) => {
  const providers = useMemo(() => getProviders(options), [options]);
  const [provider, setProvider] = useState<ImageProvider>(
    initialOption?.provider_key ?? providers[0]?.value ?? "chatgpt",
  );
  const [modelOptionId, setModelOptionId] = useState(initialOption?.id ?? "");
  const [displayName, setDisplayName] = useState(model?.display_name ?? "");
  const [baseUrl, setBaseUrl] = useState(
    model?.base_url ?? initialOption?.default_base_url ?? "",
  );
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(model?.enabled ?? true);
  const [notes, setNotes] = useState(model?.notes ?? "");
  const [error, setError] = useState("");

  const filteredOptions = useMemo(
    () => options.filter((option) => option.provider_key === provider),
    [options, provider],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.id === modelOptionId),
    [modelOptionId, options],
  );

  const handleProviderChange = useCallback(
    (nextProvider: ImageProvider) => {
      const nextOption = options.find((option) => option.provider_key === nextProvider);
      setProvider(nextProvider);
      setModelOptionId(nextOption?.id ?? "");
      setBaseUrl(nextOption?.default_base_url ?? "");
    },
    [options],
  );

  const handleModelOptionChange = useCallback(
    (nextModelOptionId: string) => {
      const nextOption = options.find((option) => option.id === nextModelOptionId);
      setModelOptionId(nextModelOptionId);
      setBaseUrl(nextOption?.default_base_url ?? "");
    },
    [options],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");

      try {
        await onSave({
          id: model?.id,
          model_option_id: modelOptionId,
          display_name: displayName,
          base_url: baseUrl,
          api_key: apiKey || undefined,
          enabled,
          notes,
        });
        onOpenChange(false);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed.");
      }
    },
    [apiKey, baseUrl, displayName, enabled, model, modelOptionId, notes, onOpenChange, onSave],
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3 rounded-lg border border-[#e4e0ff] bg-[#f8f6ff] px-4 py-3 text-sm font-bold text-[#6b50f4]">
        <Info className="size-4 shrink-0 fill-[#6b50f4] text-white" />
        {text.info}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-[#202a50]">
          {text.displayName} <span className="text-[#df4d61]">*</span>
        </label>
        <Input
          className="h-11 rounded-lg border-[#dfe5f1] bg-white px-4 text-sm font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25"
          value={displayName}
          required
          placeholder={text.displayNamePlaceholder}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-[#202a50]">
          {text.modelType} <span className="text-[#df4d61]">*</span>
        </label>
        <div className="grid gap-3 md:grid-cols-[1fr_28px_1.2fr] md:items-center">
          <Select value={provider} onValueChange={(value) => handleProviderChange(value as ImageProvider)}>
            <SelectTrigger className="h-11 rounded-lg border-[#dfe5f1] bg-white px-4 text-sm font-semibold text-[#263153] shadow-none focus:ring-[#6f5cff]/25">
              <SelectValue placeholder={text.selectProvider} />
            </SelectTrigger>
            <SelectContent
              className="rounded-lg border-[#dfe5f1] bg-white p-1 shadow-[0_14px_32px_rgba(49,58,112,0.14)]"
              position="item-aligned"
            >
              {providers.map((item) => (
                <SelectItem
                  key={item.value}
                  className="rounded-md py-2 pl-8 text-sm font-semibold text-[#263153] data-[highlighted]:bg-[#f0edff]"
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="hidden text-center text-lg font-semibold text-[#a0abc4] md:block">→</span>

          <Select value={modelOptionId} onValueChange={handleModelOptionChange}>
            <SelectTrigger className="h-11 rounded-lg border-[#dfe5f1] bg-white px-4 text-sm font-semibold text-[#263153] shadow-none focus:ring-[#6f5cff]/25">
              <SelectValue placeholder={text.selectModel} />
            </SelectTrigger>
            <SelectContent
              className="rounded-lg border-[#dfe5f1] bg-white p-1 shadow-[0_14px_32px_rgba(49,58,112,0.14)]"
              position="item-aligned"
            >
              {filteredOptions.map((option) => (
                <SelectItem
                  key={option.id}
                  className="rounded-md py-2 pl-8 text-sm font-semibold text-[#263153] data-[highlighted]:bg-[#f0edff]"
                  value={option.id}
                >
                  {option.model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedOption ? (
          <p className="text-xs font-medium text-[#8b95b1]">{selectedOption.model_label}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-[#202a50]">
          {text.baseUrl} <span className="text-[#df4d61]">*</span>
        </label>
        <Input
          className="h-11 rounded-lg border-[#dfe5f1] bg-white px-4 text-sm font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25"
          value={baseUrl}
          required
          placeholder={text.baseUrlPlaceholder}
          onChange={(event) => setBaseUrl(event.target.value)}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[90px_1fr] md:items-center">
        <label className="text-sm font-bold text-[#202a50]">
          API Key <span className="text-[#df4d61]">{model ? "" : "*"}</span>
        </label>
        <div>
          <div className="relative">
            <Input
              className="h-11 rounded-lg border-[#dfe5f1] bg-white px-4 pr-11 text-sm font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25"
              type="password"
              value={apiKey}
              required={!model}
              placeholder={model ? "留空则保留当前 API Key" : text.apiKeyPlaceholder}
              onChange={(event) => setApiKey(event.target.value)}
            />
            <EyeOff className="absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#8791ad]" />
          </div>
          <p className="mt-1.5 text-xs font-medium text-[#8b95b1]">{text.apiKeyHelp}</p>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[90px_1fr] md:items-center">
        <label className="text-sm font-bold text-[#202a50]">{text.enabled}</label>
        <label className="flex items-center gap-3 text-sm font-medium text-[#697494]">
          <button
            aria-pressed={enabled}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              enabled ? "bg-[#6b50f4]" : "bg-[#dce2ef]",
            )}
            onClick={() => setEnabled((current) => !current)}
            type="button"
          >
            <span
              className={cn(
                "absolute top-1 size-4 rounded-full bg-white shadow-[0_2px_6px_rgba(28,36,74,0.18)] transition-all",
                enabled ? "left-[23px]" : "left-1",
              )}
            />
          </button>
          {text.enabledHelp}
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-[90px_1fr]">
        <label className="pt-2 text-sm font-bold text-[#202a50]">{text.notes}</label>
        <div className="relative">
          <Textarea
            className="min-h-[100px] resize-none rounded-lg border-[#dfe5f1] bg-white px-4 py-3 pr-16 text-sm font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25"
            value={notes}
            maxLength={200}
            placeholder={text.notesPlaceholder}
            onChange={(event) => setNotes(event.target.value)}
          />
          <span className="absolute bottom-3 right-4 text-xs font-semibold text-[#8b95b1]">
            {notes.length}/200
          </span>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-[#fff4f4] px-3 py-2 text-sm text-[#d73737]">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 pt-1 md:ml-[90px]">
        <DialogClose asChild>
          <Button
            className="h-11 rounded-lg border border-[#dfe5f1] bg-white text-sm font-bold text-[#4d5878] hover:bg-[#f8f9fe]"
            type="button"
            variant="secondary"
          >
            {text.cancel}
          </Button>
        </DialogClose>
        <Button
          className="h-11 rounded-lg bg-[#6b50f4] text-sm font-bold text-white shadow-[0_12px_24px_rgba(91,77,245,0.24)] hover:bg-[#5c45df]"
          type="submit"
        >
          {text.save}
        </Button>
      </div>
    </form>
  );
};

export const ModelConfigDialog = ({
  open,
  options,
  model,
  onOpenChange,
  onSave,
}: ModelConfigDialogProps) => {
  const initialOption = useMemo(
    () =>
      options.find((option) => option.id === model?.model_option_id) ??
      options[0],
    [model?.model_option_id, options],
  );
  const formKey = `${model?.id ?? "new"}-${initialOption?.id ?? "empty"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[790px] rounded-xl border-[#dfe5f1] bg-white p-0 shadow-[0_28px_80px_rgba(39,48,91,0.2)]">
        <DialogHeader className="mb-0 border-b border-transparent px-8 pb-4 pt-8">
          <DialogTitle className="text-2xl font-bold text-[#101a40]">
            {model ? text.editTitle : text.addTitle}
          </DialogTitle>
        </DialogHeader>
        <div className="px-8 pb-8">
          <ModelConfigDialogForm
            key={formKey}
            options={options}
            model={model}
            initialOption={initialOption}
            onOpenChange={onOpenChange}
            onSave={onSave}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
