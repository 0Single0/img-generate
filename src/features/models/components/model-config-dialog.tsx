"use client";

import { ChevronRight } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const getProviders = (options: ModelOption[]) => {
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
    initialOption?.provider_key ?? "chatgpt",
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
      <div className="space-y-2">
        <Label>Model display name *</Label>
        <Input
          value={displayName}
          required
          placeholder="Enter model display name"
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Model *</Label>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <select
            className="h-10 w-full rounded-md border bg-card px-3 text-sm"
            value={provider}
            onChange={(event) => handleProviderChange(event.target.value as ImageProvider)}
          >
            {providers.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <ChevronRight className="size-4 text-muted-foreground" />
          <select
            className="h-10 w-full rounded-md border bg-card px-3 text-sm"
            value={modelOptionId}
            required
            onChange={(event) => handleModelOptionChange(event.target.value)}
          >
            {filteredOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.model_id}
              </option>
            ))}
          </select>
        </div>
        {selectedOption ? (
          <p className="text-xs text-muted-foreground">{selectedOption.model_label}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label>Image BaseURL *</Label>
        <Input
          value={baseUrl}
          required
          placeholder="Enter BaseURL, for example: https://api.example.com/v1"
          onChange={(event) => setBaseUrl(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>API Key {model ? "" : "*"}</Label>
        <Input
          type="password"
          value={apiKey}
          required={!model}
          placeholder={model ? "Leave blank to keep the existing API Key" : "Enter API Key"}
          onChange={(event) => setApiKey(event.target.value)}
        />
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Enabled
      </label>
      <div className="space-y-2">
        <Label>Notes</Label>
        <div className="relative">
          <Textarea
            value={notes}
            maxLength={200}
            placeholder="Optional notes"
            onChange={(event) => setNotes(event.target.value)}
          />
          <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {notes.length}/200
          </span>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit">Save</Button>
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {model ? "Edit model" : "Add model"}
          </DialogTitle>
        </DialogHeader>
        <ModelConfigDialogForm
          key={formKey}
          options={options}
          model={model}
          initialOption={initialOption}
          onOpenChange={onOpenChange}
          onSave={onSave}
        />
      </DialogContent>
    </Dialog>
  );
};
