import { getTranslations } from "next-intl/server";
import { HistoryPage } from "@/features/history/components/history-page";

export default async function HistoryRoutePage() {
  const t = await getTranslations("History");

  return (
    <HistoryPage
      title={t("title")}
      subtitle={t("subtitle")}
      emptyLabel={t("empty")}
    />
  );
}

