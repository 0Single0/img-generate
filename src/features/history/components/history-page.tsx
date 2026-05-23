import { HistoryList } from "./history-list";

type HistoryPageProps = {
  title: string;
  subtitle: string;
  emptyLabel: string;
};

export const HistoryPage = ({ emptyLabel }: HistoryPageProps) => (
  <div className="flex min-h-0 w-full flex-1 flex-col">
    <HistoryList emptyLabel={emptyLabel} />
  </div>
);
