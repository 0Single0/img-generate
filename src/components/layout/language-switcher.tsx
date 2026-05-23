"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";

type LanguageSwitcherProps = {
  label: string;
};

export const LanguageSwitcher = ({ label }: LanguageSwitcherProps) => {
  const pathname = usePathname();
  const nextLocale = pathname.startsWith("/en") ? "zh" : "en";
  const nextPath = pathname.replace(/^\/(zh|en)/, `/${nextLocale}`);
  const currentLabel = pathname.startsWith("/en") ? "EN" : "中文";

  return (
    <Link
      href={nextPath || `/${nextLocale}/generate`}
      aria-label={label}
      className="inline-flex h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-[#51607f] transition-colors hover:bg-[#f2f0ff] hover:text-[#4b35ef] sm:px-3"
    >
      <Languages className="size-4 shrink-0" strokeWidth={2} />
      <span className="hidden sm:block">{currentLabel}</span>
      <span className="rounded-md bg-[#eef1f9] px-1.5 py-0.5 text-[11px] font-bold text-[#677293]">
        {nextLocale.toUpperCase()}
      </span>
    </Link>
  );
};
