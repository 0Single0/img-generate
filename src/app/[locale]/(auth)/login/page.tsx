import { AuthForm } from "@/features/auth/components/auth-form";
import type { Locale } from "@/lib/i18n/routing";
type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  return <AuthForm mode="login" locale={locale as Locale} />;
}
