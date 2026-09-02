"use client";

import { useTranslation } from "@/context/I18nContext";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="hidden border-t border-gray-200 px-6 py-6 text-center text-xs text-gray-400 md:block">
      {t("common.footerRights", { year: new Date().getFullYear() })}
    </footer>
  );
}
