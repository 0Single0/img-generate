import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { HistoryPage } from "@/features/history/components/history-page";

type HistoryRoutePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HistoryRoutePage({ params }: HistoryRoutePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "History" });

  return (
    <HistoryPage
      title={t("title")}
      subtitle={t("subtitle")}
      emptyLabel={t("empty")}
    />
  );
}

