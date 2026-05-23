import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export const Label = ({ className, ...props }: LabelProps) => (
  <label className={cn("text-sm font-medium text-foreground", className)} {...props} />
);

