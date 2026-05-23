import { getTranslations } from "next-intl/server";
import { GenerationPage } from "@/features/generation/components/generation-page";

export default async function GeneratePage() {
  const t = await getTranslations("Generate");

  return <GenerationPage title={t("title")} subtitle={t("subtitle")} />;
}

