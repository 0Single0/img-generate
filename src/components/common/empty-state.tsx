import { ImageOff } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export const EmptyState = ({ title, description }: EmptyStateProps) => (
  <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center">
    <ImageOff className="mb-3 size-8 text-muted-foreground" />
    <p className="font-medium">{title}</p>
    {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
  </div>
);

