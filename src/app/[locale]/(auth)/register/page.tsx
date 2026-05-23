import { AuthForm } from "@/features/auth/components/auth-form";
import type { Locale } from "@/lib/i18n/routing";
type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  return <AuthForm mode="register" locale={locale as Locale} />;
}
