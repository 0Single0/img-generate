import { HistoryList } from "./history-list";

type HistoryPageProps = {
  title: string;
  subtitle: string;
  emptyLabel: string;
};

export const HistoryPage = ({ emptyLabel }: HistoryPageProps) => (
  <div>
    <HistoryList emptyLabel={emptyLabel} />
  </div>
);
