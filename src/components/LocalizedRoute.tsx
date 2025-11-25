import { useEffect } from "react";
import type { ReactNode } from "react";
import { useLanguage, type Language } from "@/contexts/LanguageContext";

interface LocalizedRouteProps {
  element: ReactNode;
  locale: Language;
}

export const LocalizedRoute = ({ element, locale }: LocalizedRouteProps) => {
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (language !== locale) {
      setLanguage(locale);
    }
  }, [language, locale, setLanguage]);

  return <>{element}</>;
};
