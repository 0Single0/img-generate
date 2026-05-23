"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LanguageSwitcher = () => {
  const pathname = usePathname();
  const nextLocale = pathname.startsWith("/en") ? "zh" : "en";
  const nextPath = pathname.replace(/^\/(zh|en)/, `/${nextLocale}`);

  return (
    <Button asChild variant="ghost" className="px-3">
      <Link href={nextPath || `/${nextLocale}/generate`} aria-label="Switch language">
        <Languages className="size-4" />
        {nextLocale.toUpperCase()}
      </Link>
    </Button>
  );
};

