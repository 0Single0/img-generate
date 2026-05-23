import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { LocaleHtmlSync } from "@/components/layout/locale-html-sync";
import { routing, type Locale } from "@/lib/i18n/routing";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages({ locale: locale as Locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlSync />
      {children}
    </NextIntlClientProvider>
  );
}

