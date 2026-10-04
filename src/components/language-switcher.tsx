"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { switchLocalePath, type Locale } from "@/lib/i18n";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams();
  const target = locale === "ar" ? "en" : "ar";
  // A document navigation refreshes the root layout's lang/dir attributes.
  return <a href={switchLocalePath(pathname, search.toString(), target)} lang={target} hrefLang={target}
    aria-label={target === "ar" ? "التبديل إلى العربية" : "Switch to English"}>
    {target === "ar" ? "العربية" : "EN"}
  </a>;
}
