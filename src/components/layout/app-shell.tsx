import Link from "next/link";
import { Image, Images, Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutButton } from "./logout-button";
import type { Locale } from "@/lib/i18n/routing";

type AppShellProps = {
  children: React.ReactNode;
  locale: Locale;
};

export const AppShell = async ({ children, locale }: AppShellProps) => {
  const t = await getTranslations("App");
  const navItems = [
    { href: `/${locale}/generate`, label: t("generate"), icon: Image },
    { href: `/${locale}/history`, label: t("history"), icon: Images },
    { href: `/${locale}/settings/models`, label: t("models"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card p-4 md:flex md:flex-col">
        <Link href={`/${locale}/generate`} className="mb-8 flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            IC
          </span>
          {t("name")}
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2">
          <LanguageSwitcher />
          <LogoutButton label={t("logout")} />
        </div>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <Link href={`/${locale}/generate`} className="font-semibold">
            {t("name")}
          </Link>
          <LanguageSwitcher />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
};
