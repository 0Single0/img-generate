"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { ProviderIcon } from "@/components/provider-icon";
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
  icon?: string | null;
};

const getProviders = (options: ModelOption[]): ProviderItem[] => {
  const entries = new Map<ImageProvider, ProviderItem>();
  options.forEach((option) => {
    entries.set(option.provider_key, {
      value: option.provider_key,
      label: option.provider_label,
      icon: option.icon,
    });
  });
  return Array.from(entries.values());
};

const ModelConfigDialogForm = ({
  options,
  model,
  initialOption,
  onOpenChange,
  onSave,
}: ModelConfigFormProps) => {
  const t = useTranslations("Models");
  const providers = useMemo(() => getProviders(options), [options]);
  const [provider, setProvider] = useState<ImageProvider>(
    initialOption?.provider_key ?? providers[0]?.value ?? "openai",
  );
  const [modelOptionId, setModelOptionId] = useState(initialOption?.id ?? "");
  const [displayName, setDisplayName] = useState(model?.display_name ?? "");
  const [baseUrl, setBaseUrl] = useState(model?.base_url ?? initialOption?.default_base_url ?? "");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [enabled, setEnabled] = useState(model?.enabled ?? true);
  const [notes, setNotes] = useState(model?.notes ?? "");
  const [error, setError] = useState("");

  const filteredOptions = useMemo(
    () => options.filter((option) => option.provider_key === provider),
    [options, provider],
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

  const handleToggleApiKeyVisibility = useCallback(() => {
    setShowApiKey((current) => !current);
  }, []);

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
    <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
      <div className="mt-2 space-y-2">
        <label className="text-xs font-bold text-[#202a50] sm:text-sm">
          {t("displayName")} <span className="text-[#df4d61]">*</span>
        </label>
        <Input
          className="h-9 rounded-lg border-[#dfe5f1] bg-white px-3 text-xs font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25 sm:h-10 sm:px-4 sm:text-sm"
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={t("displayNamePlaceholder")}
          required
          value={displayName}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-[#202a50] sm:text-sm">
          {t("modelType")} <span className="text-[#df4d61]">*</span>
        </label>
        <div className="grid gap-2.5 sm:gap-3 md:grid-cols-[1fr_28px_1.2fr] md:items-center">
          <Select value={provider} onValueChange={(value) => handleProviderChange(value as ImageProvider)}>
            <SelectTrigger className="h-9 rounded-lg border-[#dfe5f1] bg-white px-3 text-xs font-semibold text-[#263153] shadow-none focus:ring-[#6f5cff]/25 sm:h-10 sm:px-4 sm:text-sm">
              <SelectValue placeholder={t("selectProvider")} />
            </SelectTrigger>
            <SelectContent
              className="rounded-lg border-[#dfe5f1] bg-white p-1 shadow-[0_14px_32px_rgba(49,58,112,0.14)]"
              position="item-aligned"
            >
              {providers.map((item) => (
                <SelectItem
                  key={item.value}
                  className="rounded-md py-1.5 pl-8 text-xs font-semibold text-[#263153] data-[highlighted]:bg-[#f0edff] sm:py-2 sm:text-sm"
                  value={item.value}
                >
                  <div className="flex items-center gap-2">
                    <ProviderIcon
                      alt={item.label}
                      className="size-5 rounded-sm bg-white sm:size-5"
                      fallbackClassName="text-[9px]"
                      label={item.label}
                      src={item.icon}
                    />
                    <span>{item.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="hidden text-center text-lg font-semibold text-[#a0abc4] md:block">-&gt;</span>

          <Select value={modelOptionId} onValueChange={handleModelOptionChange}>
            <SelectTrigger className="h-9 rounded-lg border-[#dfe5f1] bg-white px-3 text-xs font-semibold text-[#263153] shadow-none focus:ring-[#6f5cff]/25 sm:h-10 sm:px-4 sm:text-sm">
              <SelectValue placeholder={t("selectModel")} />
            </SelectTrigger>
            <SelectContent
              className="rounded-lg border-[#dfe5f1] bg-white p-1 shadow-[0_14px_32px_rgba(49,58,112,0.14)]"
              position="item-aligned"
            >
              {filteredOptions.map((option) => (
                <SelectItem
                  key={option.id}
                  className="rounded-md py-1.5 pl-8 text-xs font-semibold text-[#263153] data-[highlighted]:bg-[#f0edff] sm:py-2 sm:text-sm"
                  value={option.id}
                >
                  {option.model_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-[#202a50] sm:text-sm">
          {t("baseUrl")} <span className="text-[#df4d61]">*</span>
        </label>
        <Input
          className="h-9 rounded-lg border-[#dfe5f1] bg-white px-3 text-xs font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25 sm:h-10 sm:px-4 sm:text-sm"
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder="https://api.example.com/v1"
          required
          value={baseUrl}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-[90px_1fr] md:items-center">
        <label className="text-xs font-bold text-[#202a50] sm:text-sm">
          API Key <span className="text-[#df4d61]">{model ? "" : "*"}</span>
        </label>
        <div>
          <div className="relative">
            <Input
              className="h-9 rounded-lg border-[#dfe5f1] bg-white px-3 pr-10 text-xs font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25 sm:h-10 sm:px-4 sm:pr-11 sm:text-sm"
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={model ? t("keepApiKeyPlaceholder") : t("apiKeyPlaceholder")}
              required={!model}
              type={showApiKey ? "text" : "password"}
              value={apiKey}
            />
            <button
              aria-label={showApiKey ? "Hide API key" : "Show API key"}
              className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-[#8791ad] transition-colors hover:bg-[#f3f5fb] hover:text-[#5c6787] sm:right-3"
              onClick={handleToggleApiKeyVisibility}
              type="button"
            >
              {showApiKey ? (
                <Eye className="size-3.5 sm:size-4" />
              ) : (
                <EyeOff className="size-3.5 sm:size-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-[90px_1fr] md:items-center">
        <label className="text-xs font-bold text-[#202a50] sm:text-sm">{t("enabled")}</label>
        <label className="flex items-center gap-2.5 text-xs font-medium leading-5 text-[#697494] sm:gap-3 sm:text-sm">
          <button
            aria-pressed={enabled}
            className={cn(
              "relative h-5 w-9 shrink-0 rounded-full transition-colors sm:h-6 sm:w-11",
              enabled ? "bg-[#6b50f4]" : "bg-[#dce2ef]",
            )}
            onClick={() => setEnabled((current) => !current)}
            type="button"
          >
            <span
              className={cn(
                "absolute top-0.5 size-4 rounded-full bg-white shadow-[0_2px_6px_rgba(28,36,74,0.18)] transition-all sm:top-1",
                enabled ? "left-[17px] sm:left-[23px]" : "left-0.5 sm:left-1",
              )}
            />
          </button>
          {t("enabledHelp")}
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-[90px_1fr]">
        <label className="pt-1 text-xs font-bold text-[#202a50] sm:pt-2 sm:text-sm">{t("notes")}</label>
        <div className="relative">
          <Textarea
            className="min-h-[88px] resize-none rounded-lg border-[#dfe5f1] bg-white px-3 py-2.5 pr-14 text-xs font-medium text-[#24304f] placeholder:text-[#a5afc8] focus:ring-[#6f5cff]/25 sm:min-h-[100px] sm:px-4 sm:py-3 sm:pr-16 sm:text-sm"
            maxLength={200}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("notesPlaceholder")}
            value={notes}
          />
          <span className="absolute bottom-2.5 right-3 text-[11px] font-semibold text-[#8b95b1] sm:bottom-3 sm:right-4 sm:text-xs">
            {notes.length}/200
          </span>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-[#fff4f4] px-3 py-2 text-sm text-[#d73737]">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2.5 pt-1 md:ml-[90px] md:gap-3">
        <DialogClose asChild>
          <Button
            className="h-9 rounded-lg border border-[#dfe5f1] bg-white text-xs font-bold text-[#4d5878] hover:bg-[#f8f9fe] sm:h-10 sm:text-sm"
            type="button"
            variant="secondary"
          >
            {t("cancel")}
          </Button>
        </DialogClose>
        <Button
          className="h-9 rounded-lg bg-[#6b50f4] text-xs font-bold text-white shadow-[0_12px_24px_rgba(91,77,245,0.24)] hover:bg-[#5c45df] sm:h-10 sm:text-sm"
          type="submit"
        >
          {t("save")}
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
  const t = useTranslations("Models");
  const initialOption = useMemo(
    () => options.find((option) => option.id === model?.model_option_id) ?? options[0],
    [model?.model_option_id, options],
  );
  const formKey = `${model?.id ?? "new"}-${initialOption?.id ?? "empty"}-${open ? "open" : "closed"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1.5rem)] w-[calc(100vw-1rem)] max-w-[790px] rounded-xl border-[#dfe5f1] bg-white p-0 shadow-[0_28px_80px_rgba(39,48,91,0.2)] sm:max-h-[90vh] sm:w-[calc(100vw-2rem)]">
        <DialogHeader className="mb-0 border-b border-transparent px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6 lg:px-8 lg:pt-8">
          <DialogTitle className="text-lg font-bold text-[#101a40] sm:text-xl lg:text-2xl">
            {model ? t("editTitle") : t("addTitle")}
          </DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
          <ModelConfigDialogForm
            key={formKey}
            initialOption={initialOption}
            model={model}
            onOpenChange={onOpenChange}
            onSave={onSave}
            options={options}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
