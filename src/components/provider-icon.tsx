"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils/cn";

type ProviderIconProps = {
  alt: string;
  label: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

const getFallbackText = (label: string) => label.trim().slice(0, 2).toUpperCase() || "AI";

export const ProviderIcon = ({
  alt,
  label,
  src,
  className,
  imageClassName,
  fallbackClassName,
}: ProviderIconProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const hasError = !src || failedSrc === src;

  const handleError = useCallback(() => {
    setFailedSrc(src ?? null);
  }, [src]);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-lg text-[#1f2947]",
        className,
      )}
    >
      {!hasError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          className={cn("h-full w-full object-cover", imageClassName)}
          onError={handleError}
          src={src}
        />
      ) : (
        <span className={cn("text-xs font-bold tracking-[0.08em]", fallbackClassName)}>
          {getFallbackText(label)}
        </span>
      )}
    </div>
  );
};
