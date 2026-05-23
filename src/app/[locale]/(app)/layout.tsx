import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/routing";

type ProtectedLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedLayout({ children, params }: ProtectedLayoutProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  return (
    <AppShell
      locale={locale as Locale}
      user={{
        email: user.email ?? "",
        name:
          typeof user.user_metadata?.name === "string"
            ? user.user_metadata.name
            : typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null,
      }}
    >
      {children}
    </AppShell>
  );
}
