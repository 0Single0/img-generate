"use client";

import { Box, Clock3, Image } from "lucide-react";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/lib/i18n/routing";

type AppNavProps = {
  locale: Locale;
  labels: {
    generate: string;
    history: string;
    models: string;
  };
};

const navItems = (locale: Locale, labels: AppNavProps["labels"]) => [
  { href: "/generate", label: labels.generate, icon: Image },
  { href: "/history", label: labels.history, icon: Clock3 },
  { href: "/settings/models", label: labels.models, icon: Box },
];

export const AppNav = ({ locale, labels }: AppNavProps) => {
  const pathname = usePathname();
  void locale;
  const items = navItems(locale, labels);

  return (
    <nav className="flex flex-col gap-[clamp(10px,0.9vw,18px)] px-[clamp(10px,0.8vw,16px)] pt-[clamp(18px,1.8vw,34px)]">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-[clamp(40px,2.2vw,46px)] items-center gap-3 rounded-lg px-[clamp(12px,1vw,20px)] text-[clamp(14px,0.78vw,16px)] font-medium text-[#526082] transition-all",
              "hover:bg-[#f1efff] hover:text-[#5b3ff2]",
              isActive && "bg-[#eeeaff] text-[#4b35ef]",
            )}
          >
            <Icon className="size-5 shrink-0" strokeWidth={2.1} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
