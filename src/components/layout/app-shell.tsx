import Link from "next/link";
import { Bell, ChevronDown, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AppNav } from "./app-nav";
import type { Locale } from "@/lib/i18n/routing";

type AppShellProps = {
  children: React.ReactNode;
  locale: Locale;
};

export const AppShell = async ({ children, locale }: AppShellProps) => {
  const t = await getTranslations("App");

  return (
    <div className="min-h-screen bg-[#f7f8ff] text-[#0b153a] [--shell-header:clamp(62px,4vw,82px)] [--shell-sidebar:clamp(176px,11.5vw,228px)]">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[var(--shell-header)] items-center justify-between border-b border-[#e6eaf2] bg-white/93 px-[clamp(18px,2.35vw,44px)] shadow-[0_10px_28px_rgba(49,58,112,0.08)] backdrop-blur-xl">
        <Link href={`/${locale}/generate`} className="flex items-center gap-3">
          <span className="flex size-[clamp(34px,2vw,42px)] items-center justify-center rounded-lg bg-[linear-gradient(135deg,#6a79ff_0%,#6b43e6_100%)] text-white shadow-[0_12px_30px_rgba(93,74,232,0.22)]">
            <Sparkles className="size-[clamp(18px,1.1vw,23px)] fill-white" strokeWidth={1.8} />
          </span>
          <span className="leading-tight">
            <span className="block text-[clamp(18px,1.08vw,23px)] font-bold tracking-normal text-[#091235]">
              Image2Gen
            </span>
            <span className="mt-0.5 block text-[clamp(11px,0.66vw,13px)] font-medium text-[#7b84a6]">
              AI Image Generator
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-[clamp(12px,1.25vw,24px)] text-[#495579]">
          <button
            aria-label="通知"
            className="relative hidden size-9 items-center justify-center rounded-full transition-colors hover:bg-[#f2f0ff] sm:flex"
            type="button"
          >
            <Bell className="size-5" strokeWidth={1.9} />
            <span className="absolute right-0 top-0 flex size-4 items-center justify-center rounded-full bg-[#5c49f5] text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <button
            className="flex items-center gap-2 rounded-full px-2 py-1 text-[clamp(14px,0.78vw,16px)] font-medium transition-colors hover:bg-[#f2f0ff]"
            type="button"
          >
            <span className="flex size-[clamp(34px,2vw,42px)] items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_28%,#dcd7ff_0_23%,#a493ef_24%_100%)]">
              <span className="mt-5 size-8 rounded-full bg-[#f4efff]/85" />
            </span>
            <span className="hidden sm:block">Admin</span>
            <ChevronDown className="hidden size-5 sm:block" strokeWidth={2} />
          </button>
        </div>
      </header>
      <aside className="fixed bottom-0 left-0 top-[var(--shell-header)] z-20 hidden w-[var(--shell-sidebar)] border-r border-[#e6eaf2] bg-white/74 shadow-[12px_0_35px_rgba(52,67,125,0.04)] backdrop-blur-xl md:block">
        <AppNav
          locale={locale}
          labels={{
            generate: t("generate"),
            history: t("history"),
            models: t("models"),
          }}
        />
      </aside>
      <div className="min-h-screen pt-[var(--shell-header)] md:pl-[var(--shell-sidebar)]">
        <main className="min-h-[calc(100vh-var(--shell-header))] overflow-hidden bg-[radial-gradient(circle_at_98%_96%,rgba(115,82,255,0.32)_0,rgba(115,82,255,0.14)_22%,transparent_42%),linear-gradient(180deg,#fbfcff_0%,#f8f9ff_58%,#f1edff_100%)] px-[clamp(16px,2.15vw,40px)] py-[clamp(20px,2.35vw,48px)]">
          {children}
        </main>
      </div>
    </div>
  );
};
