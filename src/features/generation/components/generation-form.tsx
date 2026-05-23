"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileImage,
  ImageIcon,
  Loader2,
  MoreHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { downloadImageFromUrl, getImageDownloadName } from "@/lib/download/image";
import { cn } from "@/lib/utils/cn";
import { createSignedUrl, deleteGenerationAsset, uploadGenerationAsset } from "../api/generation-api";
import { useGeneration } from "../hooks/use-generation";
import { useGenerationStore } from "@/store/generation-store";
import type { GenerationOperation, GenerationParams, ModelConfig } from "@/types/provider";

type GenerationFormProps = {
  models: ModelConfig[];
};

type ResultImage = {
  path: string;
  url: string;
};

type UploadField = "reference" | "mask";

type UploadAsset = {
  path: string;
  previewUrl: string;
  name: string;
};

const text = {
  clearResults: "\u6e05\u7a7a\u7ed3\u679c",
  configTitle: "\u751f\u6210\u914d\u7f6e",
  emptyDescription: "\u5b8c\u6210\u751f\u6210\u540e\uff0c\u8fd9\u91cc\u4f1a\u5c55\u793a\u5b9e\u9645\u8fd4\u56de\u7684\u56fe\u50cf\u3002",
  emptyTitle: "\u6682\u65e0\u751f\u6210\u7ed3\u679c",
  generate: "\u751f\u6210\u56fe\u50cf",
  generating: "\u751f\u6210\u4e2d...",
  mask: "\u906e\u7f69",
  maskOptional: "\u53ef\u9009",
  model: "\u6a21\u578b",
  prompt: "\u63d0\u793a\u8bcd",
  quality: "\u8d28\u91cf",
  quantity: "\u6570\u91cf",
  reference: "\u53c2\u8003\u56fe",
  referenceOptional: "\u53ef\u9009",
  resultHint: "\u63d0\u793a\uff1a\u5c1d\u8bd5\u8c03\u6574\u63d0\u793a\u8bcd\u3001\u53c2\u8003\u56fe\u6216\u53c2\u6570\uff0c\u83b7\u5f97\u66f4\u6ee1\u610f\u7684\u7ed3\u679c\u3002",
  resultTitle: "\u751f\u6210\u7ed3\u679c",
  size: "\u5c3a\u5bf8",
  uploadMask: "\u70b9\u51fb\u4e0a\u4f20\u906e\u7f69\u56fe",
  uploadReference: "\u70b9\u51fb\u4e0a\u4f20\u53c2\u8003\u56fe",
  uploadTip: "\u652f\u6301 JPG / PNG\uff0c\u6700\u5927 10MB",
} as const;

const qualityOptions = [
  { label: "\u6807\u51c6", value: "auto" },
  { label: "\u9ad8", value: "high" },
  { label: "\u8d85\u9ad8", value: "medium" },
];

const getSizeOptions = (provider?: ModelConfig["provider"]) =>
  provider === "seedream"
    ? ["1024x1024", "2K", "4K"]
    : [
        "auto",
        "1024x1024",
        "1536x1024",
        "1024x1536",
        "2048x2048",
        "2048x1152",
        "1152x2048",
        "3840x2160",
        "2160x3840",
      ];

const getSizeLabel = (size: string) => {
  const labels: Record<string, string> = {
    auto: "\u81ea\u52a8",
    "1024x1024": "1:1 (1024 \u00d7 1024)",
    "1024x1536": "2:3 (1024 \u00d7 1536)",
    "1536x1024": "3:2 (1536 \u00d7 1024)",
    "2048x2048": "2K 1:1 (2048 \u00d7 2048)",
    "2048x1152": "2K 16:9 (2048 \u00d7 1152)",
    "1152x2048": "2K 9:16 (1152 \u00d7 2048)",
    "3840x2160": "4K 16:9 (3840 \u00d7 2160)",
    "2160x3840": "4K 9:16 (2160 \u00d7 3840)",
    "2K": "2K",
    "4K": "4K",
  };

  return labels[size] ?? size;
};

const clampQuantity = (value: number) => Math.min(4, Math.max(1, value));

const resolveSelectedSize = (size: string | undefined, options: string[]) => {
  if (!size || options.includes(size)) {
    return size ?? options[0];
  }

  const [width, height] = size.split("x").map(Number);

  if (Number.isFinite(width) && Number.isFinite(height)) {
    if (size === "1920x1080" && options.includes("2048x1152")) {
      return "2048x1152";
    }

    if (width > height && options.includes("1536x1024")) {
      return "1536x1024";
    }

    if (height > width && options.includes("1024x1536")) {
      return "1024x1536";
    }
  }

  return options[0];
};

const UploadBox = ({
  icon,
  label,
  assets,
  deletingPaths,
  disabled,
  isUploading,
  onDelete,
  onFiles,
}: {
  icon: "image" | "file";
  label: string;
  assets: UploadAsset[];
  deletingPaths?: Set<string>;
  disabled?: boolean;
  isUploading?: boolean;
  onDelete: (asset: UploadAsset) => void;
  onFiles: (files: FileList | File[]) => void;
}) => {
  const Icon = icon === "image" ? ImageIcon : FileImage;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleActivate = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        onFiles(event.target.files);
      }

      event.target.value = "";
    },
    [onFiles],
  );

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const files = Array.from(event.clipboardData.items)
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((file): file is File => Boolean(file));

      if (files.length) {
        event.preventDefault();
        onFiles(files);
      }
    },
    [onFiles],
  );
  const hasAssets = assets.length > 0;

  return (
    <div
      className={cn(
        "relative flex min-h-[96px] flex-col items-center justify-center rounded-md border border-dashed border-[#d8cdfb] bg-white/70 px-3 text-center transition-colors hover:bg-[#fbfaff] focus:outline-none focus:ring-2 focus:ring-[#6f5cff]/25",
        disabled && "pointer-events-none opacity-60",
      )}
      onClick={(event) => event.currentTarget.focus()}
      onPaste={handlePaste}
      tabIndex={0}
    >
      <input
        ref={inputRef}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={disabled}
        onChange={handleFileChange}
        type="file"
      />
      {hasAssets ? (
        <div className="absolute inset-2 grid grid-cols-3 gap-1.5 overflow-hidden rounded">
          {assets.map((asset) => {
            const isDeleting = deletingPaths?.has(asset.path);

            return (
              <div key={asset.path} className="group relative overflow-hidden rounded bg-[#eef1f7]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="h-full min-h-[36px] w-full object-cover" src={asset.previewUrl} />
                <button
                  aria-label="Delete image"
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/55 text-white opacity-100 transition-colors hover:bg-black/75"
                  disabled={disabled || isDeleting}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(asset);
                  }}
                  type="button"
                >
                  {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
      <button
        aria-label={label}
        className={cn(
          "relative z-10 flex size-8 items-center justify-center rounded-full border border-[#e2dcff] bg-white/92 text-[#7057f4] shadow-[0_8px_18px_rgba(74,58,156,0.12)] transition-colors hover:bg-[#f4f1ff]",
          hasAssets && "border-white/55 bg-white/86 text-[#5d45e3]",
        )}
        disabled={disabled}
        onClick={handleActivate}
        type="button"
      >
        {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </button>
      {!hasAssets ? (
        <span className="relative z-10 mt-1.5 max-w-full truncate text-xs font-semibold text-[#5b6380]">
          {label}
        </span>
      ) : null}
      {!hasAssets ? (
        <span className="relative z-10 mt-1 text-[11px] text-[#98a1bc]">{text.uploadTip}</span>
      ) : null}
    </div>
  );
};

export const GenerationForm = ({ models }: GenerationFormProps) => {
  const reusePrompt = useGenerationStore((state) => state.reusePrompt);
  const isGenerating = useGenerationStore((state) => state.isGenerating);
  const selectedModelId = useGenerationStore((state) => state.selectedModelId);
  const setSelectedModelId = useGenerationStore((state) => state.setSelectedModelId);
  const [prompt, setPrompt] = useState(reusePrompt ?? "");
  const [operation] = useState<GenerationOperation>("generation");
  const [params, setParams] = useState<GenerationParams>({ n: 1, quality: "high" });
  const [resultImages, setResultImages] = useState<ResultImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [uploadAssets, setUploadAssets] = useState<Record<UploadField, UploadAsset[]>>({
    reference: [],
    mask: [],
  });
  const [uploadingFields, setUploadingFields] = useState<Partial<Record<UploadField, boolean>>>({});
  const [deletingAssetPaths, setDeletingAssetPaths] = useState<Set<string>>(() => new Set());
  const [uploadError, setUploadError] = useState("");
  const uploadAssetsRef = useRef<Record<UploadField, UploadAsset[]>>({
    reference: [],
    mask: [],
  });
  const isSubmittingRef = useRef(false);
  const { result, error, generate } = useGeneration();

  const enabledModels = useMemo(() => models.filter((model) => model.enabled), [models]);

  const selectedModel = useMemo(
    () => enabledModels.find((model) => model.id === selectedModelId) ?? enabledModels[0],
    [enabledModels, selectedModelId],
  );

  const sizeOptions = useMemo(() => getSizeOptions(selectedModel?.provider), [selectedModel?.provider]);
  const selectedSize = resolveSelectedSize(params.size, sizeOptions);
  const quantity = params.n ?? 1;
  const promptLength = prompt.length;
  const isUploadingAsset = Boolean(uploadingFields.reference || uploadingFields.mask);
  const isDeletingAsset = deletingAssetPaths.size > 0;

  const handleParamsChange = useCallback((nextParams: GenerationParams) => {
    setParams(nextParams);
  }, []);

  const handleQuantityChange = useCallback(
    (nextQuantity: number) => {
      handleParamsChange({ ...params, n: clampQuantity(nextQuantity) });
    },
    [handleParamsChange, params],
  );

  const handleUploadFiles = useCallback(async (field: UploadField, files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((item) => item.type.startsWith("image/"));

    if (!imageFiles.length) {
      return;
    }

    setUploadingFields((current) => ({ ...current, [field]: true }));
    setUploadError("");

    try {
      const nextAssets = await Promise.all(
        imageFiles.map(async (file) => {
          const { path } = await uploadGenerationAsset(file);

          return {
            path,
            previewUrl: URL.createObjectURL(file),
            name: file.name || (field === "reference" ? text.reference : text.mask),
          };
        }),
      );

      setUploadAssets((current) => ({
        ...current,
        [field]: [...current[field], ...nextAssets],
      }));
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Failed to upload image.");
    } finally {
      setUploadingFields((current) => ({ ...current, [field]: false }));
    }
  }, []);

  const handleDeleteUploadAsset = useCallback(async (field: UploadField, asset: UploadAsset) => {
    setDeletingAssetPaths((current) => new Set(current).add(asset.path));
    setUploadError("");

    try {
      await deleteGenerationAsset(asset.path);

      setUploadAssets((current) => ({
        ...current,
        [field]: current[field].filter((item) => item.path !== asset.path),
      }));
      URL.revokeObjectURL(asset.previewUrl);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Failed to delete image.");
    } finally {
      setDeletingAssetPaths((current) => {
        const next = new Set(current);
        next.delete(asset.path);
        return next;
      });
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!selectedModel || isSubmittingRef.current) {
        return;
      }

      isSubmittingRef.current = true;
      setResultImages([]);

      try {
        await generate({
          requestId: crypto.randomUUID(),
          modelConfigId: selectedModel.id,
          operation,
          prompt,
          params: {
            ...params,
            size: selectedSize,
            n: quantity,
          },
          referenceImagePaths: uploadAssets.reference.map((asset) => asset.path),
        });
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [generate, operation, params, prompt, quantity, selectedModel, selectedSize, uploadAssets.reference],
  );

  const handleClearResults = useCallback(() => {
    setResultImages([]);
  }, []);

  const handleDownloadResult = useCallback(async (image: ResultImage, index: number) => {
    await downloadImageFromUrl(
      image.url,
      getImageDownloadName(image.path, `generation-${index + 1}.png`),
    );
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadImages = async () => {
      if (!result?.output_image_paths.length) {
        return;
      }

      setIsLoadingImages(true);

      try {
        const images = await Promise.all(
          result.output_image_paths.map(async (path) => {
            const { signedUrl } = await createSignedUrl(path);
            return { path, url: signedUrl };
          }),
        );

        if (isMounted) {
          setResultImages(images);
        }
      } finally {
        if (isMounted) {
          setIsLoadingImages(false);
        }
      }
    };

    void loadImages();

    return () => {
      isMounted = false;
    };
  }, [result]);

  useEffect(() => {
    uploadAssetsRef.current = uploadAssets;
  }, [uploadAssets]);

  useEffect(
    () => () => {
      Object.values(uploadAssetsRef.current).forEach((assets) => {
        assets.forEach((asset) => {
          URL.revokeObjectURL(asset.previewUrl);
        });
      });
    },
    [],
  );

  if (enabledModels.length === 0) {
    return (
      <Card className="border-[#edf1f7] bg-white/95 p-5 text-sm text-[#697494]">
        Add and enable a model before generating images.
      </Card>
    );
  }

  return (
    <form
      className="grid w-full flex-1 overflow-hidden rounded-lg border border-[#edf1f7] bg-white/90 shadow-[0_12px_34px_rgba(68,78,122,0.07)] lg:h-full lg:min-h-0 lg:grid-cols-[minmax(300px,0.76fr)_minmax(500px,1.74fr)]"
      onSubmit={handleSubmit}
    >
      <section className="border-b border-[#edf1f7] p-4 sm:p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-5">
        <div className="mb-3 flex items-center gap-2 text-[#17213f] sm:mb-4">
          <FileImage className="size-4 text-[#6c55f5]" />
          <h2 className="text-[15px] font-bold">{text.configTitle}</h2>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#273457]">{text.model}</div>
            <Select
              onValueChange={setSelectedModelId}
              value={selectedModel?.id}
            >
              <SelectTrigger className="h-9 border-[#e8edf5] bg-white px-3 text-xs font-semibold text-[#253053] shadow-none focus:ring-[#6f5cff]/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {enabledModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.display_name || model.model_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-[#273457]">
                {text.prompt} <span className="text-[#8a94b1]">Prompt</span>
              </div>
              <div className="text-xs font-semibold text-[#a2aac0]">{promptLength}/1000</div>
            </div>
            <div className="relative">
              <Textarea
                className="min-h-[82px] resize-none rounded-md border-[#e8edf5] bg-white px-3 py-2.5 pr-10 text-xs leading-5 text-[#273457] shadow-none focus:ring-[#6f5cff]/25 sm:min-h-[92px]"
                maxLength={1000}
                onChange={(event) => setPrompt(event.target.value)}
                required
                value={prompt}
              />
              <Sparkles className="absolute bottom-3 right-3 size-4 text-[#7558f6]" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#273457]">
              {text.size} <span className="text-[#8a94b1]">Size</span>
            </div>
            <Select
              onValueChange={(value) => handleParamsChange({ ...params, size: value })}
              value={selectedSize}
            >
              <SelectTrigger className="h-9 border-[#e8edf5] bg-white px-3 text-xs font-semibold text-[#253053] shadow-none focus:ring-[#6f5cff]/25">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sizeOptions.map((size) => (
                  <SelectItem key={size} value={size}>
                    {getSizeLabel(size)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-cols-2">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#273457]">{text.quantity}</div>
              <div className="grid h-8 grid-cols-3 overflow-hidden rounded-md border border-[#e8edf5] bg-white">
                <button
                  className="text-sm font-semibold text-[#475275] hover:bg-[#f7f7ff]"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  type="button"
                >
                  -
                </button>
                <div className="flex items-center justify-center border-x border-[#e8edf5] text-sm font-bold text-[#253053]">
                  {quantity}
                </div>
                <button
                  className="text-sm font-semibold text-[#475275] hover:bg-[#f7f7ff]"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#273457]">{text.quality}</div>
              <div className="grid h-8 grid-cols-3 rounded-md border border-[#e8edf5] bg-white p-1">
                {qualityOptions.map((option) => {
                  const isActive = (params.quality ?? "high") === option.value;

                  return (
                    <button
                      key={option.value}
                      className={cn(
                        "rounded text-[11px] font-semibold text-[#59627f] transition-colors",
                        isActive && "bg-[#6b50f4] text-white shadow-[0_8px_20px_rgba(91,77,245,0.2)]",
                      )}
                      onClick={() => handleParamsChange({ ...params, quality: option.value })}
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#273457]">
                {text.reference} <span className="text-[#8a94b1]">({text.referenceOptional})</span>
              </div>
              <UploadBox
                assets={uploadAssets.reference}
                deletingPaths={deletingAssetPaths}
                disabled={isGenerating}
                icon="image"
                isUploading={uploadingFields.reference}
                label={text.uploadReference}
                onDelete={(asset) => void handleDeleteUploadAsset("reference", asset)}
                onFiles={(files) => void handleUploadFiles("reference", files)}
              />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-semibold text-[#273457]">
                {text.mask} <span className="text-[#8a94b1]">({text.maskOptional})</span>
              </div>
              <UploadBox
                assets={uploadAssets.mask}
                deletingPaths={deletingAssetPaths}
                disabled={isGenerating}
                icon="file"
                isUploading={uploadingFields.mask}
                label={text.uploadMask}
                onDelete={(asset) => void handleDeleteUploadAsset("mask", asset)}
                onFiles={(files) => void handleUploadFiles("mask", files)}
              />
            </div>
          </div>

          {uploadError ? <p className="rounded-lg bg-[#fff4f4] px-3 py-2 text-xs text-[#d73737]">{uploadError}</p> : null}
          {error ? <p className="rounded-lg bg-[#fff4f4] px-3 py-2 text-sm text-[#d73737]">{error}</p> : null}

          <div>
            <Button
              className="h-10 w-full rounded-md bg-[#6b50f4] text-sm font-bold text-white shadow-[0_10px_22px_rgba(91,77,245,0.2)] hover:bg-[#5d45e3]"
              disabled={isGenerating || isUploadingAsset || isDeletingAsset}
              type="submit"
            >
              {isGenerating || isUploadingAsset || isDeletingAsset ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {isGenerating ? text.generating : text.generate}
            </Button>
          </div>
        </div>
      </section>

      <section className="flex min-h-[360px] flex-col p-4 sm:min-h-[440px] sm:p-5 lg:min-h-0 lg:overflow-hidden lg:p-5">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="size-4 text-[#6c55f5]" />
            <h2 className="text-[15px] font-bold text-[#17213f]">{text.resultTitle}</h2>
          </div>
          <div className="text-xs font-semibold text-[#8b95b1]">
            {resultImages.length ? `\u5171 ${resultImages.length} \u5f20` : ""}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          {isGenerating || isLoadingImages ? (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-[#e3e8f2] bg-[#fbfcff] text-sm text-[#7a84a6] sm:rounded-xl">
              <Loader2 className="mr-2 size-4 animate-spin text-[#6b50f4] sm:size-5" />
              {text.generating}
            </div>
          ) : resultImages.length > 0 ? (
            <div
              className={cn(
                "grid gap-4",
                resultImages.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
              )}
            >
              {resultImages.map((image, index) => (
                <figure
                  key={image.path}
                  className="group relative overflow-hidden rounded-lg bg-[#eef1f7] shadow-[0_10px_24px_rgba(35,44,80,0.08)] sm:rounded-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={prompt || text.resultTitle}
                    className={cn(
                      "w-full object-cover",
                      resultImages.length === 1 ? "max-h-[68vh]" : "aspect-[16/9]",
                    )}
                    src={image.url}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                    <button
                      aria-label="Download image"
                      className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-black/30 text-white backdrop-blur hover:bg-black/45 sm:size-10"
                      onClick={() => void handleDownloadResult(image, index)}
                      type="button"
                    >
                      <Download className="size-4 sm:size-5" />
                    </button>
                    <button
                      className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-black/30 text-white backdrop-blur hover:bg-black/45 sm:size-10"
                      type="button"
                    >
                      <MoreHorizontal className="size-4 sm:size-5" />
                    </button>
                  </div>
                </figure>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[#e3e8f2] bg-[#fbfcff] px-4 text-center sm:rounded-xl sm:px-6">
              <ImageIcon className="mb-3 size-8 text-[#a7b0c9] sm:mb-4 sm:size-10" />
              <p className="text-sm font-bold text-[#455071]">{text.emptyTitle}</p>
              <p className="mt-1.5 max-w-sm text-xs leading-5 text-[#8a94b1] sm:mt-2 sm:text-sm sm:leading-6">{text.emptyDescription}</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-lg border border-[#edf1f7] bg-white/85 px-3 py-2.5 text-xs leading-5 text-[#697494] sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3 sm:text-sm">
          <div className="flex items-start gap-2 sm:items-center">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#6b50f4] sm:mt-0 sm:size-4" />
            {text.resultHint}
          </div>
          {resultImages.length ? (
            <button
              className="flex h-8 w-fit items-center gap-2 rounded-md bg-[#f7f8fc] px-2.5 font-semibold text-[#65708e] hover:bg-[#eef1f7] sm:h-9 sm:px-3"
              onClick={handleClearResults}
              type="button"
            >
              <Trash2 className="size-3.5 sm:size-4" />
              {text.clearResults}
            </button>
          ) : null}
        </div>
      </section>
    </form>
  );
};
