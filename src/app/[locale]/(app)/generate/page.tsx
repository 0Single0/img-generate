import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { GenerationPage } from "@/features/generation/components/generation-page";

type GeneratePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function GeneratePage({ params }: GeneratePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "Generate" });

  return <GenerationPage title={t("title")} subtitle={t("subtitle")} />;
}

