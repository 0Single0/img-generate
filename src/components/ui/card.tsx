import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export const Card = ({ className, ...props }: CardProps) => (
  <div
    className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: CardProps) => (
  <div className={cn("space-y-1.5 p-5", className)} {...props} />
);

export const CardTitle = ({ className, ...props }: CardProps) => (
  <div className={cn("text-lg font-semibold", className)} {...props} />
);

export const CardDescription = ({ className, ...props }: CardProps) => (
  <div className={cn("text-sm text-muted-foreground", className)} {...props} />
);

export const CardContent = ({ className, ...props }: CardProps) => (
  <div className={cn("p-5 pt-0", className)} {...props} />
);

