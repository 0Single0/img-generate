import { getTranslations } from "next-intl/server";
import { ModelsPage } from "@/features/models/components/models-page";

export default async function ModelsRoutePage() {
  const t = await getTranslations("Models");

  return <ModelsPage title={t("title")} subtitle={t("subtitle")} />;
}
