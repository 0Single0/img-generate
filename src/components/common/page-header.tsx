type PageHeaderProps = {
  title: string;
  subtitle?: string;
};

export const PageHeader = ({ title, subtitle }: PageHeaderProps) => (
  <div className="space-y-2">
    <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
    {subtitle ? <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
  </div>
);

