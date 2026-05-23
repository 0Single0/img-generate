import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { ModelsPage } from "@/features/models/components/models-page";

type ModelsRoutePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ModelsRoutePage({ params }: ModelsRoutePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Models" });

  return <ModelsPage title={t("title")} subtitle={t("subtitle")} />;
}
