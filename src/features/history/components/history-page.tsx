import { PageHeader } from "@/components/common/page-header";
import { HistoryList } from "./history-list";

type HistoryPageProps = {
  title: string;
  subtitle: string;
  emptyLabel: string;
};

export const HistoryPage = ({ title, subtitle, emptyLabel }: HistoryPageProps) => (
  <div className="space-y-6">
    <PageHeader title={title} subtitle={subtitle} />
    <HistoryList emptyLabel={emptyLabel} />
  </div>
);
