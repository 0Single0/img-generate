"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

export const LocaleHtmlSync = () => {
  const locale = useLocale();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
};
