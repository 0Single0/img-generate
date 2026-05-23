"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isOpenAICompatibleProvider } from "@/lib/providers/kind";
import type { GenerationParams, ImageProvider } from "@/types/provider";

type DynamicParamsProps = {
  provider?: ImageProvider;
  params: GenerationParams;
  onChange: (params: GenerationParams) => void;
};

export const DynamicParams = ({ provider, params, onChange }: DynamicParamsProps) => {
  const sizeOptions = useMemo(
    () => (provider === "seedream" ? ["2K", "4K", "1024x1024"] : ["1024x1024", "1024x1536", "1536x1024"]),
    [provider],
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="space-y-2">
        <Label>Size</Label>
        <select
          className="h-10 w-full rounded-md border bg-card px-3 text-sm"
          value={params.size ?? sizeOptions[0]}
          onChange={(event) => onChange({ ...params, size: event.target.value })}
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Images</Label>
        <Input
          type="number"
          min={1}
          max={4}
          value={params.n ?? 1}
          onChange={(event) => onChange({ ...params, n: Number(event.target.value) })}
        />
      </div>
      {isOpenAICompatibleProvider(provider) ? (
        <div className="space-y-2">
          <Label>Quality</Label>
          <select
            className="h-10 w-full rounded-md border bg-card px-3 text-sm"
            value={params.quality ?? "auto"}
            onChange={(event) => onChange({ ...params, quality: event.target.value })}
          >
            <option value="auto">auto</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Seed</Label>
          <Input
            type="number"
            value={params.seed ?? ""}
            onChange={(event) =>
              onChange({
                ...params,
                seed: event.target.value ? Number(event.target.value) : undefined,
              })
            }
          />
        </div>
      )}
    </div>
  );
};
